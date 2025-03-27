import type { ReactNode } from "react"

interface CardProps {
  title: string
  children: ReactNode
  className?: string
}

export default function Card({ title, children, className = "" }: CardProps) {
  return (
    <div className={`rounded-lg p-6 flex flex-col items-center ${className}`}>
      <h3 className="text-xl font-medium text-white mb-4">{title}</h3>
      <div className="w-full flex flex-col items-center">{children}</div>
    </div>
  )
}

