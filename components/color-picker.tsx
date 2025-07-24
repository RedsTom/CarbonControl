"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useTheme } from "@/lib/theme-context"
import { Palette, Check } from "lucide-react"

export function ColorPicker() {
  const { accentColor, setAccentColor, presetColors } = useTheme()
  const [customColor, setCustomColor] = useState("#FF9500")
  const [isOpen, setIsOpen] = useState(false)

  const hexToHsl = (hex: string) => {
    const r = Number.parseInt(hex.slice(1, 3), 16) / 255
    const g = Number.parseInt(hex.slice(3, 5), 16) / 255
    const b = Number.parseInt(hex.slice(5, 7), 16) / 255

    const max = Math.max(r, g, b)
    const min = Math.min(r, g, b)
    let h = 0
    let s = 0
    const l = (max + min) / 2

    if (max !== min) {
      const d = max - min
      s = l > 0.5 ? d / (2 - max - min) : d / (max + min)
      switch (max) {
        case r:
          h = (g - b) / d + (g < b ? 6 : 0)
          break
        case g:
          h = (b - r) / d + 2
          break
        case b:
          h = (r - g) / d + 4
          break
      }
      h /= 6
    }

    return `${Math.round(h * 360)} ${Math.round(s * 100)}% ${Math.round(l * 100)}%`
  }

  const handleCustomColorChange = (hex: string) => {
    setCustomColor(hex)
    const hsl = hexToHsl(hex)
    setAccentColor(hsl)
  }

  const currentColorName = presetColors.find((color) => color.value === accentColor)?.name || "Custom"

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          className="flex items-center gap-2 border-primary/30 hover:bg-primary/10 transition-all duration-200 hover:scale-105 bg-transparent"
        >
          <Palette className="w-4 h-4" />
          <div
            className="w-4 h-4 rounded-full border border-border"
            style={{ backgroundColor: `hsl(${accentColor})` }}
          />
          {currentColorName}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80 p-0 bg-card border-border" align="end">
        <Tabs defaultValue="presets" className="w-full">
          <TabsList className="grid w-full grid-cols-2 bg-secondary/50">
            <TabsTrigger
              value="presets"
              className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
            >
              Presets
            </TabsTrigger>
            <TabsTrigger
              value="custom"
              className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
            >
              Custom
            </TabsTrigger>
          </TabsList>

          <TabsContent value="presets" className="p-4 space-y-4">
            <div className="grid grid-cols-4 gap-3">
              {presetColors.map((color) => (
                <button
                  key={color.name}
                  onClick={() => {
                    setAccentColor(color.value)
                    setIsOpen(false)
                  }}
                  className="group relative flex flex-col items-center gap-2 p-3 rounded-lg border border-border/30 hover:border-primary/50 transition-all duration-200 hover:scale-105 bg-secondary/20 hover:bg-secondary/40"
                >
                  <div
                    className={`w-8 h-8 rounded-full ${color.class} shadow-lg transition-all duration-200 group-hover:scale-110`}
                  />
                  <span className="text-xs font-medium text-muted-foreground group-hover:text-foreground">
                    {color.name}
                  </span>
                  {accentColor === color.value && (
                    <div className="absolute -top-1 -right-1 w-5 h-5 bg-primary rounded-full flex items-center justify-center animate-scale-in">
                      <Check className="w-3 h-3 text-primary-foreground" />
                    </div>
                  )}
                </button>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="custom" className="p-4 space-y-4">
            <div className="space-y-3">
              <Label htmlFor="color-picker" className="text-sm font-medium">
                Choose Custom Color
              </Label>
              <div className="flex items-center gap-3">
                <input
                  id="color-picker"
                  type="color"
                  value={customColor}
                  onChange={(e) => handleCustomColorChange(e.target.value)}
                  className="w-12 h-12 rounded-lg border border-border cursor-pointer bg-transparent"
                />
                <Input
                  value={customColor}
                  onChange={(e) => handleCustomColorChange(e.target.value)}
                  placeholder="#FF9500"
                  className="flex-1 bg-input border-border"
                />
              </div>
              <div className="flex items-center gap-2 p-3 bg-secondary/30 rounded-lg border border-border/30">
                <div className="w-6 h-6 rounded-full border border-border" style={{ backgroundColor: customColor }} />
                <span className="text-sm text-muted-foreground">Preview</span>
              </div>
            </div>

            <div className="space-y-3">
              <Label className="text-sm font-medium">Popular Custom Colors</Label>
              <div className="grid grid-cols-6 gap-2">
                {[
                  "#FF6B6B", // Coral
                  "#4ECDC4", // Turquoise
                  "#45B7D1", // Sky Blue
                  "#96CEB4", // Mint
                  "#FFEAA7", // Warm Yellow
                  "#DDA0DD", // Plum
                  "#98D8C8", // Seafoam
                  "#F7DC6F", // Light Gold
                  "#BB8FCE", // Lavender
                  "#85C1E9", // Light Blue
                  "#F8C471", // Peach
                  "#82E0AA", // Light Green
                ].map((color) => (
                  <button
                    key={color}
                    onClick={() => handleCustomColorChange(color)}
                    className="w-8 h-8 rounded-full border border-border/50 hover:border-primary/50 transition-all duration-200 hover:scale-110 shadow-sm"
                    style={{ backgroundColor: color }}
                  />
                ))}
              </div>
            </div>

            <Button
              onClick={() => setIsOpen(false)}
              className="w-full bg-primary hover:bg-primary/90 transition-all duration-200"
            >
              Apply Color
            </Button>
          </TabsContent>
        </Tabs>
      </PopoverContent>
    </Popover>
  )
}
