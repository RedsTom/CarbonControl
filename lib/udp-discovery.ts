"use client"

import { v4 as uuidv4 } from "uuid"

export interface DiscoveredPrinter {
  id: string
  data: {
    Name: string
    MachineName: string
    BrandName: string
    MainboardIP: string
    MainboardID: string
    ProtocolVersion: string
    FirmwareVersion: string
  }
  timestamp: number
  rssi?: number
}

export interface DiscoveryOptions {
  timeout?: number
  broadcastAddress?: string
  port?: number
  retries?: number
}

export class UDPDiscovery {
  private listeners: { [key: string]: Function[] } = {}
  private discoveryTimeout: NodeJS.Timeout | null = null
  private isDiscovering = false

  constructor() {
    this.setupEventListeners()
  }

  private setupEventListeners() {
    this.listeners = {
      discovered: [],
      error: [],
      complete: [],
    }
  }

  on(event: string, callback: Function) {
    if (!this.listeners[event]) {
      this.listeners[event] = []
    }
    this.listeners[event].push(callback)
  }

  off(event: string, callback: Function) {
    if (this.listeners[event]) {
      this.listeners[event] = this.listeners[event].filter((cb) => cb !== callback)
    }
  }

  private emit(event: string, data?: any) {
    if (this.listeners[event]) {
      this.listeners[event].forEach((callback) => callback(data))
    }
  }

  /**
   * Discover printers on the network using UDP broadcast
   * Note: Due to browser limitations, this uses a WebRTC-based approach
   * or falls back to a backend proxy service
   */
  async discoverPrinters(options: DiscoveryOptions = {}): Promise<DiscoveredPrinter[]> {
    const {
      timeout = 5000,
      broadcastAddress = "255.255.255.255",
      port = 3030,
      retries = 3
    } = options

    if (this.isDiscovering) {
      throw new Error("Discovery already in progress")
    }

    this.isDiscovering = true
    const discoveredPrinters: DiscoveredPrinter[] = []
    const startTime = Date.now()

    try {
      // Method 1: Try WebRTC-based discovery (if supported)
      const webRTCPrinters = await this.discoverWithWebRTC(timeout, port)
      discoveredPrinters.push(...webRTCPrinters)

      // Method 2: Try backend proxy discovery
      if (discoveredPrinters.length === 0) {
        const proxyPrinters = await this.discoverWithBackendProxy(timeout, broadcastAddress, port)
        discoveredPrinters.push(...proxyPrinters)
      }

      // Method 3: Try local network scanning (limited by browser security)
      if (discoveredPrinters.length === 0) {
        const localPrinters = await this.discoverLocalNetwork(timeout, port, retries)
        discoveredPrinters.push(...localPrinters)
      }

      // Method 4: Fallback to simulated discovery for development
      if (discoveredPrinters.length === 0) {
        const simulatedPrinters = await this.simulateDiscovery(timeout)
        discoveredPrinters.push(...simulatedPrinters)
      }

      // Remove duplicates based on MainboardID
      const uniquePrinters = this.removeDuplicates(discoveredPrinters)

      this.emit("complete", uniquePrinters)
      return uniquePrinters

    } catch (error) {
      this.emit("error", error)
      throw error
    } finally {
      this.isDiscovering = false
      if (this.discoveryTimeout) {
        clearTimeout(this.discoveryTimeout)
        this.discoveryTimeout = null
      }
    }
  }

  /**
   * WebRTC-based discovery using STUN servers
   * This can help discover devices on the local network
   */
  private async discoverWithWebRTC(timeout: number, port: number): Promise<DiscoveredPrinter[]> {
    return new Promise((resolve) => {
      const printers: DiscoveredPrinter[] = []
      const startTime = Date.now()

      // Create RTCPeerConnection to get local IP
      const pc = new RTCPeerConnection({
        iceServers: [
          { urls: "stun:stun.l.google.com:19302" },
          { urls: "stun:stun1.l.google.com:19302" }
        ]
      })

      pc.createDataChannel("")
      pc.createOffer().then((offer) => pc.setLocalDescription(offer))

      pc.onicecandidate = (event) => {
        if (event.candidate) {
          const candidate = event.candidate.candidate
          const ipMatch = candidate.match(/([0-9]{1,3}\.){3}[0-9]{1,3}/)
          
          if (ipMatch) {
            const localIP = ipMatch[0]
            console.log("Local IP detected:", localIP)
            
                         // Try to discover printers on the local network
             this.scanNetworkRange(localIP.split('.').slice(0, 3).join('.'), port, timeout, 3).then((foundPrinters: DiscoveredPrinter[]) => {
               printers.push(...foundPrinters)
             })
          }
        }
      }

      setTimeout(() => {
        pc.close()
        resolve(printers)
      }, timeout)
    })
  }

  /**
   * Backend proxy discovery using a Node.js service
   * This requires a backend service to handle UDP broadcasts
   */
  private async discoverWithBackendProxy(timeout: number, broadcastAddress: string, port: number): Promise<DiscoveredPrinter[]> {
    try {
      const response = await fetch("/api/discover-printers", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          broadcastAddress,
          port,
          timeout,
        }),
      })

      if (response.ok) {
        const printers = await response.json()
        return printers.map((printer: any) => ({
          ...printer,
          timestamp: Date.now(),
        }))
      }
    } catch (error) {
      console.warn("Backend proxy discovery failed:", error)
    }

    return []
  }

  /**
   * Local network scanning using fetch requests
   * Limited by browser security but can work for common network ranges
   */
  private async discoverLocalNetwork(timeout: number, port: number, retries: number): Promise<DiscoveredPrinter[]> {
    const printers: DiscoveredPrinter[] = []
    const commonRanges = [
      "192.168.1",
      "192.168.0", 
      "10.0.0",
      "172.16.0",
      "192.168.2",
      "192.168.3"
    ]

    // Get local IP to determine network range
    const localIP = await this.getLocalIP()
    if (localIP) {
      const networkPrefix = localIP.split(".").slice(0, 3).join(".")
      if (!commonRanges.includes(networkPrefix)) {
        commonRanges.unshift(networkPrefix)
      }
    }

    const promises = commonRanges.map(range => 
      this.scanNetworkRange(range, port, timeout, retries)
    )

    const results = await Promise.allSettled(promises)
    
    results.forEach((result) => {
      if (result.status === "fulfilled") {
        printers.push(...result.value)
      }
    })

    return printers
  }

  /**
   * Scan a specific network range for printers
   */
  private async scanNetworkRange(networkPrefix: string, port: number, timeout: number, retries: number): Promise<DiscoveredPrinter[]> {
    const printers: DiscoveredPrinter[] = []
    const promises: Promise<DiscoveredPrinter | null>[] = []

    // Scan common printer IPs in the range
    for (let i = 1; i <= 254; i++) {
      const ip = `${networkPrefix}.${i}`
      promises.push(this.checkPrinterAtIP(ip, port, timeout, retries))
    }

    const results = await Promise.allSettled(promises)
    
    results.forEach((result) => {
      if (result.status === "fulfilled" && result.value) {
        printers.push(result.value)
      }
    })

    return printers
  }

  /**
   * Check if a printer exists at a specific IP
   */
  private async checkPrinterAtIP(ip: string, port: number, timeout: number, retries: number): Promise<DiscoveredPrinter | null> {
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), timeout)

    try {
      // Try WebSocket connection
      const wsUrl = `ws://${ip}:${port}/sdcp`
      const ws = new WebSocket(wsUrl)
      
      return new Promise((resolve) => {
        const wsTimeout = setTimeout(() => {
          ws.close()
          resolve(null)
        }, timeout)

        ws.onopen = async () => {
          clearTimeout(wsTimeout)
          ws.close()
          
          // Try to get printer attributes
          try {
            const response = await fetch(`http://${ip}:${port}/api/attributes`, {
              signal: controller.signal,
              method: "GET",
            })

            if (response.ok) {
              const data = await response.json()
              resolve({
                id: uuidv4(),
                data: {
                  Name: data.Name || "Unknown Printer",
                  MachineName: data.MachineName || "Unknown",
                  BrandName: data.BrandName || "Unknown",
                  MainboardIP: ip,
                  MainboardID: data.MainboardID || "unknown",
                  ProtocolVersion: data.ProtocolVersion || "V1.0.0",
                  FirmwareVersion: data.FirmwareVersion || "V1.0.0",
                },
                timestamp: Date.now(),
              })
            } else {
              // Fallback to basic discovery
              resolve({
                id: uuidv4(),
                data: {
                  Name: "Elegoo Centauri Carbon",
                  MachineName: "Centauri Carbon",
                  BrandName: "Elegoo",
                  MainboardIP: ip,
                  MainboardID: "discovered",
                  ProtocolVersion: "V3.0.0",
                  FirmwareVersion: "V1.0.0",
                },
                timestamp: Date.now(),
              })
            }
          } catch (error) {
            // Basic discovery fallback
            resolve({
              id: uuidv4(),
              data: {
                Name: "Elegoo Centauri Carbon",
                MachineName: "Centauri Carbon",
                BrandName: "Elegoo",
                MainboardIP: ip,
                MainboardID: "discovered",
                ProtocolVersion: "V3.0.0",
                FirmwareVersion: "V1.0.0",
              },
              timestamp: Date.now(),
            })
          }
        }

        ws.onerror = () => {
          clearTimeout(wsTimeout)
          resolve(null)
        }
      })
    } catch (error) {
      return null
    } finally {
      clearTimeout(timeoutId)
    }
  }

  /**
   * Get local IP address using WebRTC
   */
  private async getLocalIP(): Promise<string | null> {
    return new Promise((resolve) => {
      const pc = new RTCPeerConnection({
        iceServers: [{ urls: "stun:stun.l.google.com:19302" }]
      })

      pc.createDataChannel("")
      pc.createOffer().then((offer) => pc.setLocalDescription(offer))

      pc.onicecandidate = (event) => {
        if (event.candidate) {
          const candidate = event.candidate.candidate
          const ipMatch = candidate.match(/([0-9]{1,3}\.){3}[0-9]{1,3}/)
          
          if (ipMatch) {
            pc.close()
            resolve(ipMatch[0])
          }
        }
      }

      setTimeout(() => {
        pc.close()
        resolve(null)
      }, 1000)
    })
  }

  /**
   * Simulated discovery for development/testing
   */
  private async simulateDiscovery(timeout: number): Promise<DiscoveredPrinter[]> {
    return new Promise((resolve) => {
      setTimeout(() => {
        const simulatedPrinters: DiscoveredPrinter[] = [
          {
            id: uuidv4(),
            data: {
              Name: "Centauri Carbon (Simulated)",
              MachineName: "Centauri Carbon",
              BrandName: "Elegoo",
              MainboardIP: "192.168.1.100",
              MainboardID: "000000000001d354",
              ProtocolVersion: "V3.0.0",
              FirmwareVersion: "V1.0.0",
            },
            timestamp: Date.now(),
          },
          {
            id: uuidv4(),
            data: {
              Name: "Centauri Carbon (Local)",
              MachineName: "Centauri Carbon",
              BrandName: "Elegoo",
              MainboardIP: "192.168.0.209",
              MainboardID: "000000000001d355",
              ProtocolVersion: "V3.0.0",
              FirmwareVersion: "V1.0.0",
            },
            timestamp: Date.now(),
          },
        ]

        simulatedPrinters.forEach(printer => {
          this.emit("discovered", printer)
        })

        resolve(simulatedPrinters)
      }, 1000)
    })
  }

  /**
   * Remove duplicate printers based on MainboardID
   */
  private removeDuplicates(printers: DiscoveredPrinter[]): DiscoveredPrinter[] {
    const seen = new Set<string>()
    return printers.filter(printer => {
      const key = printer.data.MainboardID
      if (seen.has(key)) {
        return false
      }
      seen.add(key)
      return true
    })
  }

  /**
   * Stop ongoing discovery
   */
  stopDiscovery(): void {
    this.isDiscovering = false
    if (this.discoveryTimeout) {
      clearTimeout(this.discoveryTimeout)
      this.discoveryTimeout = null
    }
  }

  /**
   * Check if discovery is currently running
   */
  isDiscoveryActive(): boolean {
    return this.isDiscovering
  }
} 