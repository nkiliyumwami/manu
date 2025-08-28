import { useId } from 'react'
import { ZodError } from 'zod'

type InputProps = React.InputHTMLAttributes<HTMLInputElement> & {
  label: string
  error?: string
}

export function TextInput({ label, error, id, className = '', ...rest }: InputProps) {
  const autoId = useId()
  const inputId = id ?? autoId
  const descId = `${inputId}-desc`
  return (
    <div>
      <label htmlFor={inputId} className="block text-sm mb-1">{label}</label>
      <input id={inputId} aria-describedby={descId} className={`input ${error ? 'input-invalid' : ''} ${className}`} {...rest} />
      <div id={descId} className="input-help" role={error ? 'alert' : undefined}>
        {error || ' '}
      </div>
    </div>
  )
}

export function getZodFieldError(err: ZodError | null, path: string): string | undefined {
  if (!err) return undefined
  const issue = err.issues.find((i) => i.path.join('.') === path)
  return issue?.message
}