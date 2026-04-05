import { type InputHTMLAttributes, forwardRef } from 'react'

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string
  error?: string
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, className = '', ...props }, ref) => {
    return (
      <div className="flex flex-col gap-1">
        {label && <label className="text-sm font-medium text-[#4A4A4A]">{label}</label>}
        <input
          ref={ref}
          className={[
            'w-full px-4 py-2.5 rounded-2xl border bg-white text-[#4A4A4A]',
            'focus:outline-none focus:ring-2 focus:ring-[#F4A9C0] focus:border-transparent',
            'placeholder:text-[#4A4A4A]/40',
            error ? 'border-[#E57373]' : 'border-[#F4A9C0]/30',
            className,
          ].join(' ')}
          {...props}
        />
        {error && <p className="text-xs text-[#E57373]">{error}</p>}
      </div>
    )
  }
)
Input.displayName = 'Input'

interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string
  error?: string
}

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ label, error, className = '', ...props }, ref) => {
    return (
      <div className="flex flex-col gap-1">
        {label && <label className="text-sm font-medium text-[#4A4A4A]">{label}</label>}
        <textarea
          ref={ref}
          className={[
            'w-full px-4 py-2.5 rounded-2xl border bg-white text-[#4A4A4A] resize-none',
            'focus:outline-none focus:ring-2 focus:ring-[#F4A9C0] focus:border-transparent',
            'placeholder:text-[#4A4A4A]/40',
            error ? 'border-[#E57373]' : 'border-[#F4A9C0]/30',
            className,
          ].join(' ')}
          {...props}
        />
        {error && <p className="text-xs text-[#E57373]">{error}</p>}
      </div>
    )
  }
)
Textarea.displayName = 'Textarea'

interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label?: string
  error?: string
}

export const Select = forwardRef<HTMLSelectElement, SelectProps>(
  ({ label, error, className = '', children, ...props }, ref) => {
    return (
      <div className="flex flex-col gap-1">
        {label && <label className="text-sm font-medium text-[#4A4A4A]">{label}</label>}
        <select
          ref={ref}
          className={[
            'w-full px-4 py-2.5 rounded-2xl border bg-white text-[#4A4A4A]',
            'focus:outline-none focus:ring-2 focus:ring-[#F4A9C0] focus:border-transparent',
            error ? 'border-[#E57373]' : 'border-[#F4A9C0]/30',
            className,
          ].join(' ')}
          {...props}
        >
          {children}
        </select>
        {error && <p className="text-xs text-[#E57373]">{error}</p>}
      </div>
    )
  }
)
Select.displayName = 'Select'
