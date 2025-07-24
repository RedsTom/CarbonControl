"use client"

import type React from "react"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"

interface StatusCardProps {
  title: string
  icon: React.ReactNode
  children: React.ReactNode
  status?: "online" | "offline" | "warning" | "error"
  className?: string
}

export function StatusCard({ title, icon, children, status, className }: StatusCardProps) {
  const getStatusColor = () => {
    switch (status) {
      case "online":
        return "bg-green-500/20 border-green-500/50"
      case "warning":
        return "bg-yellow-500/20 border-yellow-500/50"
      case "error":
        return "bg-red-500/20 border-red-500/50"
      default:
        return "bg-blue-500/20 border-blue-500/50"
    }
  }

  return (
    <Card
      className={cn(
        "gradient-bg border-border/50 transition-all duration-300 hover:border-primary/50 hover:shadow-lg hover:shadow-primary/10 animate-slide-up status-indicator",
        className,
      )}
    >
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-foreground">
            <span className="text-primary">{icon}</span>
            {title}
          </div>
          {status && <Badge className={cn("text-xs animate-pulse-slow", getStatusColor())}>{status}</Badge>}
        </CardTitle>
      </CardHeader>
      <CardContent>{children}</CardContent>
    </Card>
  )
}
