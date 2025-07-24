"use client"

import type React from "react"

import { Slider } from "@/components/ui/slider"
import { Label } from "@/components/ui/label"
import { useState } from "react"

interface AnimatedSliderProps {
  label: string
  value: number[]
  onValueChange: (value: number[]) => void
  max: number
  min: number
  step: number
  unit?: string
  icon?: React.ReactNode
}

export function AnimatedSlider({ label, value, onValueChange, max, min, step, unit = "", icon }: AnimatedSliderProps) {
  const [isActive, setIsActive] = useState(false)

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <Label
          className={`text-sm font-medium flex items-center gap-2 transition-colors duration-200 ${
            isActive ? "text-primary" : "text-muted-foreground"
          }`}
        >
          {icon}
          {label}
        </Label>
        <span
          className={`text-sm font-bold transition-all duration-300 ${
            isActive ? "text-primary scale-110" : "text-foreground"
          }`}
        >
          {value[0]}
          {unit}
        </span>
      </div>
      <Slider
        value={value}
        onValueChange={onValueChange}
        max={max}
        min={min}
        step={step}
        className="transition-all duration-200 hover:scale-[1.02]"
        onPointerDown={() => setIsActive(true)}
        onPointerUp={() => setIsActive(false)}
      />
    </div>
  )
}
