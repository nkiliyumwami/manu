// deno-lint-ignore-file no-explicit-any
// Deno Deploy HTTP function: CSV-backed stock data API with KV persistence
// Response model: { ok: true, data } | { ok: false, status, error }
// Actions: uploadCSV, getHistoricalData, getCurrentPrice, searchSymbols, getStats

import { serve } from "https://deno.land/std@0.224.0/http/server.ts";

// KV keys
const KV_NAMESPACE = "stocks";
const KV_KEY_ORIGINAL_CSV = `${KV_NAMESPACE}:original_csv`;
const KV_KEY_TICKER_SET = `${KV_NAMESPACE}:tickers`;
const KV_KEY_RECORD_COUNT = `${KV_NAMESPACE}:record_count`;
const KV_KEY_DATE_MIN = `${KV_NAMESPACE}:date_min`;
const KV_KEY_DATE_MAX = `${KV_NAMESPACE}:date_max`;
const KV_KEY_SOURCE = `${KV_NAMESPACE}:source`;
// Per-ticker time series is stored under stocks:series:<TICKER>
const seriesKey = (ticker: string) => `${KV_NAMESPACE}:series:${ticker.toUpperCase()}`;

// Types mirrored from shared contract (kept local to avoid import from Next side)
export type PricePoint = { date: string; close: number };

// In-memory cache to avoid KV round-trips
const memory = {
  tickers: new Set<string>(),
  seriesByTicker: new Map<string, PricePoint[]>(),
  recordCount: 0,
  dateMin: undefined as string | undefined,
  dateMax: undefined as string | undefined,
  source: undefined as 'uploaded' | 'sample' | undefined,
};

const kv = await Deno.openKv();

function ok(data: any, init?: ResponseInit) {
  return new Response(JSON.stringify({ ok: true, data }), {
    headers: { "content-type": "application/json" },
    ...init,
  });
}

function err(status: number, message: string) {
  return new Response(JSON.stringify({ ok: false, status, error: message }), {
    status,
    headers: { "content-type": "application/json" },
  });
}

function isISODate(date: string): boolean {
  return /^\d{4}-\d{2}-\d{2}$/.test(date);
}

function parseNumber(value: string): number | undefined {
  const n = Number(value);
  return Number.isFinite(n) ? n : undefined;
}

function compareISODate(a: string, b: string): number {
  if (a < b) return -1;
  if (a > b) return 1;
  return 0;
}

function toUTCDateString(d: Date): string {
  const y = d.getUTCFullYear();
  const m = String(d.getUTCMonth() + 1).padStart(2, '0');
  const day = String(d.getUTCDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

function clampSeriesToRange(points: PricePoint[], start?: string, end?: string): PricePoint[] {
  if (!start && !end) return points;
  return points.filter((p) => (!start || p.date >= start) && (!end || p.date <= end));
}

function buildSearchIndexKeySet(tickers: Set<string>): string[] {
  return Array.from(tickers).sort((a, b) => a.localeCompare(b));
}

async function loadStateFromKvIfAny(): Promise<void> {
  const [csv, tickers, recordCount, dateMin, dateMax, source] = await Promise.all([
    kv.get<string>(KV_KEY_ORIGINAL_CSV),
    kv.get<string[]>(KV_KEY_TICKER_SET),
    kv.get<number>(KV_KEY_RECORD_COUNT),
    kv.get<string>(KV_KEY_DATE_MIN),
    kv.get<string>(KV_KEY_DATE_MAX),
    kv.get<'uploaded' | 'sample'>(KV_KEY_SOURCE),
  ]);

  if (tickers.value && Array.isArray(tickers.value)) {
    memory.tickers = new Set(tickers.value);
  }
  if (recordCount.value) memory.recordCount = recordCount.value;
  if (dateMin.value) memory.dateMin = dateMin.value;
  if (dateMax.value) memory.dateMax = dateMax.value;
  if (source.value) memory.source = source.value;

  // Warm series cache for small datasets (sample). For large datasets do lazy load per ticker.
  if (memory.tickers.size > 0 && memory.recordCount <= 200_000) {
    const tasks: Promise<void>[] = [];
    for (const t of memory.tickers) {
      tasks.push(
        (async () => {
          const res = await kv.get<PricePoint[]>(seriesKey(t));
          if (res.value) memory.seriesByTicker.set(t, res.value);
        })(),
      );
    }
    await Promise.all(tasks);
  }
}

async function ensureSampleIfEmpty(): Promise<void> {
  await loadStateFromKvIfAny();
  if (memory.tickers.size > 0) return;

  // Load embedded sample CSV from file system (on Deploy you can bundle). Fallback to inline.
  let csvText: string | undefined;
  try {
    csvText = await Deno.readTextFile("./sample-data/stocks-sample.csv");
  } catch {
    csvText = `date,ticker,close\n2024-10-01,SAMP,10\n2024-10-02,SAMP,10.1\n2024-10-03,SAMP,9.9`;
  }
  const result = await ingestCsv(csvText!, 'sample');
  if (!result) return;
}

type IngestResult = {
  skipped: number;
  tickerCount: number;
  recordCount: number;
  dateMin: string | undefined;
  dateMax: string | undefined;
  source: 'uploaded' | 'sample';
};

// Efficient CSV parser: chunk/line split; supports header case variations.
async function ingestCsv(csvText: string, source: 'uploaded' | 'sample'): Promise<IngestResult> {
  // Normalize newlines to \n
  const text = csvText.replace(/\r\n?/g, '\n');
  const lines = text.split('\n').filter((l) => l.length > 0);
  if (lines.length === 0) {
    throw new Error('Empty CSV');
  }

  const header = lines[0].split(',').map((h) => h.trim().toLowerCase());
  const dateIdx = header.indexOf('date');
  const tickerIdx = header.indexOf('ticker');
  const closeIdx = header.indexOf('close');
  if (dateIdx === -1 || tickerIdx === -1 || closeIdx === -1) {
    throw new Error('CSV must include headers: date,ticker,close');
  }

  const dedupe = new Set<string>(); // key: date|ticker upper
  const seriesMap = new Map<string, PricePoint[]>();
  let skipped = 0;
  let minDate: string | undefined;
  let maxDate: string | undefined;
  let totalRecords = 0;

  for (let i = 1; i < lines.length; i++) {
    const raw = lines[i].trim();
    if (raw === '') continue;
    const cols = raw.split(',');
    if (cols.length < 3) {
      skipped++;
      continue;
    }
    const date = cols[dateIdx]?.trim();
    const ticker = cols[tickerIdx]?.trim();
    const closeStr = cols[closeIdx]?.trim();

    if (!date || !ticker || !closeStr || !isISODate(date)) {
      skipped++;
      continue;
    }
    const price = parseNumber(closeStr);
    if (price === undefined || price < 0) {
      skipped++;
      continue;
    }
    const key = `${date}|${ticker.toUpperCase()}`;
    if (dedupe.has(key)) {
      skipped++;
      continue;
    }
    dedupe.add(key);

    const point: PricePoint = { date, close: price };
    const t = ticker.toUpperCase();
    if (!seriesMap.has(t)) seriesMap.set(t, []);
    seriesMap.get(t)!.push(point);
    totalRecords++;

    if (!minDate || compareISODate(date, minDate) < 0) minDate = date;
    if (!maxDate || compareISODate(date, maxDate) > 0) maxDate = date;
  }

  // Sort each series and persist
  const tickerList = Array.from(seriesMap.keys()).sort((a, b) => a.localeCompare(b));
  const atomic = kv.atomic();
  for (const t of tickerList) {
    const sorted = seriesMap.get(t)!.sort((a, b) => compareISODate(a.date, b.date));
    atomic.set(seriesKey(t), sorted);
  }
  atomic.set(KV_KEY_ORIGINAL_CSV, csvText);
  atomic.set(KV_KEY_TICKER_SET, tickerList);
  atomic.set(KV_KEY_RECORD_COUNT, totalRecords);
  if (minDate) atomic.set(KV_KEY_DATE_MIN, minDate);
  if (maxDate) atomic.set(KV_KEY_DATE_MAX, maxDate);
  atomic.set(KV_KEY_SOURCE, source);
  const commit = await atomic.commit();
  if (!commit.ok) throw new Error('Failed to persist CSV to KV');

  // Update memory caches
  memory.tickers = new Set(tickerList);
  memory.seriesByTicker.clear();
  for (const t of tickerList) memory.seriesByTicker.set(t, (await kv.get<PricePoint[]>(seriesKey(t))).value ?? []);
  memory.recordCount = totalRecords;
  memory.dateMin = minDate;
  memory.dateMax = maxDate;
  memory.source = source;

  return {
    skipped,
    tickerCount: memory.tickers.size,
    recordCount: memory.recordCount,
    dateMin: memory.dateMin,
    dateMax: memory.dateMax,
    source,
  };
}

function findOnOrAfter(points: PricePoint[], targetDate: string): PricePoint | undefined {
  // binary search for first point.date >= targetDate
  let lo = 0;
  let hi = points.length - 1;
  let ans: PricePoint | undefined;
  while (lo <= hi) {
    const mid = (lo + hi) >> 1;
    const d = points[mid].date;
    if (d >= targetDate) {
      ans = points[mid];
      hi = mid - 1;
    } else {
      lo = mid + 1;
    }
  }
  return ans;
}

async function handleUploadCSV(payload: any) {
  const csvText = String(payload?.csvText ?? '');
  if (!csvText) return err(400, 'csvText is required');
  try {
    const result = await ingestCsv(csvText, 'uploaded');
    return ok(result);
  } catch (e) {
    return err(400, e instanceof Error ? e.message : 'Failed to parse CSV');
  }
}

async function handleGetHistoricalData(payload: any) {
  const ticker = String(payload?.ticker ?? '').toUpperCase();
  const start = payload?.start ? String(payload.start) : undefined;
  const end = payload?.end ? String(payload.end) : undefined;
  if (!ticker) return err(400, 'ticker is required');
  if (start && !isISODate(start)) return err(400, 'start must be YYYY-MM-DD');
  if (end && !isISODate(end)) return err(400, 'end must be YYYY-MM-DD');

  let series = memory.seriesByTicker.get(ticker);
  if (!series) {
    const res = await kv.get<PricePoint[]>(seriesKey(ticker));
    series = res.value ?? undefined;
    if (series) memory.seriesByTicker.set(ticker, series);
  }
  if (!series || series.length === 0) return err(404, `No data for ticker ${ticker}.`);
  const clamped = clampSeriesToRange(series, start, end);
  if (clamped.length === 0) return ok({ points: [] });
  return ok({ points: clamped });
}

async function handleGetCurrentPrice(payload: any) {
  const ticker = String(payload?.ticker ?? '').toUpperCase();
  if (!ticker) return err(400, 'ticker is required');
  let series = memory.seriesByTicker.get(ticker);
  if (!series) {
    const res = await kv.get<PricePoint[]>(seriesKey(ticker));
    series = res.value ?? undefined;
    if (series) memory.seriesByTicker.set(ticker, series);
  }
  if (!series || series.length === 0) return err(404, `No data for ticker ${ticker}.`);
  const last = series[series.length - 1];
  return ok({ price: last.close, asOf: last.date });
}

async function handleSearchSymbols(payload: any) {
  const query = String(payload?.query ?? '').toUpperCase();
  const limit = Math.max(1, Math.min(100, Number(payload?.limit ?? 10)));
  if (!query) return ok({ results: [] });
  const all = buildSearchIndexKeySet(memory.tickers);
  const results = all.filter((t) => t.includes(query) || t.startsWith(query)).slice(0, limit);
  return ok({ results });
}

async function handleGetStats() {
  return ok({
    tickerCount: memory.tickers.size,
    recordCount: memory.recordCount,
    dateMin: memory.dateMin,
    dateMax: memory.dateMax,
    source: memory.source ?? 'sample',
  });
}

await ensureSampleIfEmpty();

serve(async (req: Request) => {
  if (req.method !== 'POST') return err(405, 'Only POST is supported');
  const url = new URL(req.url);
  if (url.pathname !== '/' && url.pathname !== '/api' && url.pathname !== '/csvStockData') {
    return err(404, 'Not Found');
  }
  let body: any;
  try {
    body = await req.json();
  } catch {
    return err(400, 'Invalid JSON body');
  }
  const action = String(body?.action ?? '');
  const payload = body?.payload ?? {};

  try {
    switch (action) {
      case 'uploadCSV':
        return await handleUploadCSV(payload);
      case 'getHistoricalData':
        return await handleGetHistoricalData(payload);
      case 'getCurrentPrice':
        return await handleGetCurrentPrice(payload);
      case 'searchSymbols':
        return await handleSearchSymbols(payload);
      case 'getStats':
        return await handleGetStats();
      default:
        return err(400, 'Unknown action');
    }
  } catch (e) {
    return err(500, e instanceof Error ? e.message : 'Internal Server Error');
  }
});