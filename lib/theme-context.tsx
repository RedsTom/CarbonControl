"use client"

import type React from "react"
import { createContext, useContext, useEffect, useState } from "react"

interface ThemeContextType {
  accentColor: string
  setAccentColor: (color: string) => void
  presetColors: { name: string; value: string; class: string }[]
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined)

const presetColors = [
  { name: "Orange", value: "28 100% 60%", class: "bg-orange-500" },
  { name: "Green", value: "142 76% 36%", class: "bg-green-500" },
  { name: "Purple", value: "262 83% 58%", class: "bg-purple-500" },
  { name: "Blue", value: "217 91% 60%", class: "bg-blue-500" },
  { name: "Red", value: "0 84% 60%", class: "bg-red-500" },
  { name: "Pink", value: "330 81% 60%", class: "bg-pink-500" },
  { name: "Cyan", value: "189 94% 43%", class: "bg-cyan-500" },
  { name: "Yellow", value: "45 93% 58%", class: "bg-yellow-500" },
]

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [accentColor, setAccentColorState] = useState("28 100% 60%") // Default orange

  useEffect(() => {
    // Load saved color from localStorage
    const savedColor = localStorage.getItem("accent-color")
    if (savedColor) {
      setAccentColorState(savedColor)
    }
  }, [])

  useEffect(() => {
    // Update CSS custom properties
    document.documentElement.style.setProperty("--primary", accentColor)
    document.documentElement.style.setProperty("--accent", accentColor)
    document.documentElement.style.setProperty("--ring", accentColor)
  }, [accentColor])

  const setAccentColor = (color: string) => {
    setAccentColorState(color)
    localStorage.setItem("accent-color", color)
  }

  return <ThemeContext.Provider value={{ accentColor, setAccentColor, presetColors }}>{children}</ThemeContext.Provider>
}

export function useTheme() {
  const context = useContext(ThemeContext)
  if (context === undefined) {
    throw new Error("useTheme must be used within a ThemeProvider")
  }
  return context
}
