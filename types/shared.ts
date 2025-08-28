export type PricePoint = { date: string; close: number };

export type SimulationInput = {
  startDate: string; // inclusive
  endDate: string;   // inclusive
  dcaAmount: number; // per interval
  frequency: 'daily' | 'weekly' | 'monthly';
  assetId?: string;  // CoinGecko id (crypto)
  ticker?: string;   // stock ticker
};

export type SimulationSummary = {
  totalInvested: number;
  portfolioValue: number;
  profitLoss: number;
  roiPct: number;
  finalShares: number;
  lastPrice: number;
};

export type Transaction = {
  date: string;
  price: number;
  amountInvested: number;
  sharesBought: number;
  cumulativeShares: number;
  cumulativeInvested: number;
};

export type SimulationResult = {
  summary: SimulationSummary;
  chartData: Array<{ date: string; portfolioValue: number; totalInvested: number }>;
  transactions: Transaction[];
};