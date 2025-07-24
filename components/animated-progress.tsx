"use client"

import { Progress } from "@/components/ui/progress"
import { useEffect, useState } from "react"

interface AnimatedProgressProps {
  value: number
  className?: string
  showPercentage?: boolean
}

export function AnimatedProgress({ value, className, showPercentage = false }: AnimatedProgressProps) {
  const [animatedValue, setAnimatedValue] = useState(0)

  useEffect(() => {
    const timer = setTimeout(() => {
      setAnimatedValue(value)
    }, 100)
    return () => clearTimeout(timer)
  }, [value])

  return (
    <div className="space-y-2">
      <Progress value={animatedValue} className={`transition-all duration-500 ease-out ${className}`} />
      {showPercentage && (
        <div className="text-right">
          <span className="text-sm font-medium text-primary animate-pulse-slow">{Math.round(animatedValue)}%</span>
        </div>
      )}
    </div>
  )
}
