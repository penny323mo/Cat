import { type HTMLAttributes } from 'react'

interface CardProps extends HTMLAttributes<HTMLDivElement> {
  padding?: boolean
}

export function Card({ padding = true, className = '', children, ...props }: CardProps) {
  return (
    <div
      className={[
        'bg-white rounded-3xl shadow-sm border border-[#F4A9C0]/20',
        padding ? 'p-4' : '',
        className,
      ].join(' ')}
      {...props}
    >
      {children}
    </div>
  )
}
