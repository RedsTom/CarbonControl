"use client"

import React, { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Loader2, Search, Wifi, WifiOff, RefreshCw } from "lucide-react"
import { UDPDiscovery, type DiscoveredPrinter } from "@/lib/udp-discovery"

interface PrinterDiscoveryProps {
  onPrinterSelected: (printer: DiscoveredPrinter) => void
  onManualConnect: () => void
}

export function PrinterDiscovery({ onPrinterSelected, onManualConnect }: PrinterDiscoveryProps) {
  const [discoveredPrinters, setDiscoveredPrinters] = useState<DiscoveredPrinter[]>([])
  const [isDiscovering, setIsDiscovering] = useState(false)
  const [discoveryError, setDiscoveryError] = useState<string | null>(null)
  const [discovery, setDiscovery] = useState<UDPDiscovery | null>(null)

  useEffect(() => {
    const discoveryInstance = new UDPDiscovery()
    setDiscovery(discoveryInstance)

    return () => {
      discoveryInstance.stopDiscovery()
    }
  }, [])

  // Auto-start discovery when component mounts
  useEffect(() => {
    if (discovery && !isDiscovering) {
      startDiscovery()
    }
  }, [discovery])

  const startDiscovery = async () => {
    if (!discovery || isDiscovering) return

    setIsDiscovering(true)
    setDiscoveryError(null)
    setDiscoveredPrinters([])

    try {
      discovery.on('discovered', (printer: DiscoveredPrinter) => {
        setDiscoveredPrinters(prev => {
          // Check for duplicates
          const exists = prev.some(p => p.data.MainboardIP === printer.data.MainboardIP)
          if (!exists) {
            return [...prev, printer]
          }
          return prev
        })
      })

      discovery.on('complete', (printers: DiscoveredPrinter[]) => {
        console.log('Discovery completed:', printers)
        setIsDiscovering(false)
      })

      discovery.on('error', (error: any) => {
        console.error('Discovery error:', error)
        setDiscoveryError(error.message || 'Discovery failed')
        setIsDiscovering(false)
      })

      await discovery.discoverPrinters({
        timeout: 10000,
        broadcastAddress: "255.255.255.255",
        port: 3030,
        retries: 3
      })
    } catch (error: any) {
      console.error('Discovery failed:', error)
      setDiscoveryError(error.message || 'Discovery failed')
      setIsDiscovering(false)
    }
  }

  const stopDiscovery = () => {
    if (discovery) {
      discovery.stopDiscovery()
      setIsDiscovering(false)
    }
  }

  const handlePrinterSelect = (printer: DiscoveredPrinter) => {
    onPrinterSelected(printer)
  }

  const getStatusBadge = (printer: DiscoveredPrinter) => {
    const age = Date.now() - printer.timestamp
    if (age < 5000) {
      return <Badge variant="default" className="bg-green-500">Online</Badge>
    } else if (age < 30000) {
      return <Badge variant="secondary">Recent</Badge>
    } else {
      return <Badge variant="outline">Stale</Badge>
    }
  }

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Wifi className="w-5 h-5" />
          Printer Discovery
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Discovery Controls */}
        <div className="flex gap-2">
          <Button
            onClick={startDiscovery}
            disabled={isDiscovering}
            className="flex-1"
          >
            {isDiscovering ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Discovering...
              </>
            ) : (
              <>
                <Search className="w-4 h-4 mr-2" />
                Discover Printers
              </>
            )}
          </Button>
          
          {isDiscovering && (
            <Button
              onClick={stopDiscovery}
              variant="outline"
              size="sm"
            >
              Stop
            </Button>
          )}
          
          <Button
            onClick={onManualConnect}
            variant="outline"
            size="sm"
          >
            Manual Connect
          </Button>
        </div>

        {/* Error Display */}
        {discoveryError && (
          <div className="p-3 bg-red-50 border border-red-200 rounded-md">
            <p className="text-red-700 text-sm">{discoveryError}</p>
          </div>
        )}

        {/* Discovery Status */}
        {isDiscovering && (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Loader2 className="w-4 h-4 animate-spin" />
            Scanning network for printers...
          </div>
        )}

        {/* Discovered Printers */}
        {discoveredPrinters.length > 0 && (
          <div className="space-y-2">
            <h3 className="text-sm font-medium">Discovered Printers ({discoveredPrinters.length})</h3>
            <div className="space-y-2 max-h-64 overflow-y-auto">
              {discoveredPrinters.map((printer) => (
                <div
                  key={printer.id}
                  className="p-3 border rounded-lg hover:bg-secondary/50 cursor-pointer transition-colors"
                  onClick={() => handlePrinterSelect(printer)}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <h4 className="font-medium">{printer.data.Name}</h4>
                        {getStatusBadge(printer)}
                      </div>
                      <p className="text-sm text-muted-foreground">
                        {printer.data.MachineName} • {printer.data.BrandName}
                      </p>
                      <p className="text-xs text-muted-foreground font-mono">
                        {printer.data.MainboardIP} • ID: {printer.data.MainboardID}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        Protocol: {printer.data.ProtocolVersion} • Firmware: {printer.data.FirmwareVersion}
                      </p>
                    </div>
                    <Button size="sm" variant="outline">
                      Connect
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* No Printers Found */}
        {!isDiscovering && discoveredPrinters.length === 0 && !discoveryError && (
          <div className="text-center py-8 text-muted-foreground">
            <WifiOff className="w-12 h-12 mx-auto mb-4 opacity-50" />
            <p>No printers discovered</p>
            <p className="text-sm">Click "Discover Printers" to scan your network</p>
          </div>
        )}

        {/* Discovery Info */}
        <div className="text-xs text-muted-foreground bg-secondary/30 p-3 rounded-md">
          <p><strong>Discovery Methods:</strong></p>
          <ul className="list-disc list-inside space-y-1 mt-1">
            <li>WebRTC-based local network scanning</li>
            <li>Backend UDP broadcast (if available)</li>
            <li>Common network range scanning</li>
            <li>Simulated discovery (development)</li>
          </ul>
        </div>
      </CardContent>
    </Card>
  )
} 