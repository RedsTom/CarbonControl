"use client"

import { v4 as uuidv4 } from "uuid"
import SparkMD5 from "spark-md5"

export interface PrinterStatus {
  CurrentStatus: number[]
  PreviousStatus: number
  TempOfNozzle: number
  TempTargetNozzle: number
  TempOfHotbed: number
  TempTargetHotbed: number
  TempOfBox: number
  TempTargetBox: number
  CurrenCoord: string // Note: misspelled in protocol
  CurrentFanSpeed: {
    ModelFan: number
    ModeFan: number
    AuxiliaryFan: number
    BoxFan: number
  }
  LightStatus: {
    SecondLight: number
  }
  RgbLight: [number, number, number]
  ZOffset: number
  PrintSpeed: number
  PrintInfo: {
    Status: number
    CurrentLayer: number
    TotalLayer: number
    CurrentTicks: number
    TotalTicks: number
    Filename: string
    ErrorNumber: number
    TaskId: string
    PrintSpeed: number
  }
}

export interface PrinterAttributes {
  Name: string
  MachineName: string
  BrandName: string
  ProtocolVersion: string
  FirmwareVersion: string
  XYZsize: string
  MainboardIP: string
  MainboardID: string
  NumberOfVideoStreamConnected: number
  MaximumVideoStreamAllowed: number
  NumberOfCloudSDCPServicesConnected: number
  MaximumCloudSDCPSercicesAllowed: number // Note: misspelled in protocol
  NetworkStatus: string
  MainboardMAC: string
  UsbDiskStatus: number
  Capabilities: string[]
  SupportFileType: string[]
  DevicesStatus: {
    ZMotorStatus: number
    YMotorStatus: number
    XMotorStatus: number
    ExtruderMotorStatus: number
    RelaseFilmState: number // Note: misspelled in protocol
  }
  CameraStatus: number
  RemainingMemory: number
  SDCPStatus: number
}

export interface PrintFile {
  name: string
  usedSize: number
  totalSize: number
  storageType: number
  type: number
}

export interface HistoryTask {
  Thumbnail: string
  TaskName: string
  BeginTime: number
  EndTime: number
  TaskStatus: number
  SliceInformation: any
  AlreadyPrintLayer: number
  TaskId: string
  MD5: string
  CurrentLayerTalVolume: number
  TimeLapseVideoStatus: number
  TimeLapseVideoUrl: string
  ErrorStatusReason: number
}

export class SDCPClient {
  private ws: WebSocket | null = null
  private mainboardID = ""
  private printerIP = ""
  private reconnectAttempts = 0
  private maxReconnectAttempts = 5
  private reconnectDelay = 3000
  private heartbeatInterval: NodeJS.Timeout | null = null
  private listeners: { [key: string]: Function[] } = {}

  constructor() {
    this.setupEventListeners()
  }

  private setupEventListeners() {
    this.listeners = {
      connected: [],
      disconnected: [],
      status: [],
      attributes: [],
      error: [],
      notice: [],
      response: [],
      videoUrl: [],
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

  async discoverPrinter(broadcastAddress = "255.255.255.255"): Promise<any> {
    return new Promise((resolve, reject) => {
      // Import UDP discovery dynamically to avoid SSR issues
      import('./udp-discovery').then(({ UDPDiscovery }) => {
        const discovery = new UDPDiscovery();
        
        discovery.on('discovered', (printer: any) => {
          console.log('Discovered printer:', printer);
          this.emit('printerDiscovered', printer);
        });

        discovery.on('complete', (printers: any[]) => {
          console.log('Discovery completed. Found printers:', printers);
          if (printers.length > 0) {
            resolve(printers[0]); // Return first discovered printer
          } else {
            // Fallback to simulated discovery
            setTimeout(() => {
              const mockDiscovery = {
                Id: uuidv4(),
                Data: {
                  Name: "Centauri Carbon",
                  MachineName: "Centauri Carbon",
                  BrandName: "Centauri",
                  MainboardIP: "192.168.1.100",
                  MainboardID: "000000000001d354",
                  ProtocolVersion: "V3.0.0",
                  FirmwareVersion: "V1.0.0",
                },
              }
              resolve(mockDiscovery)
            }, 1000)
          }
        });

        discovery.on('error', (error: any) => {
          console.error('Discovery error:', error);
          // Fallback to simulated discovery
          setTimeout(() => {
            const mockDiscovery = {
              Id: uuidv4(),
              Data: {
                Name: "Centauri Carbon",
                MachineName: "Centauri Carbon",
                BrandName: "Centauri",
                MainboardIP: "192.168.1.100",
                MainboardID: "000000000001d354",
                ProtocolVersion: "V3.0.0",
                FirmwareVersion: "V1.0.0",
              },
            }
            resolve(mockDiscovery)
          }, 1000)
        });

        // Start discovery
        discovery.discoverPrinters({
          timeout: 5000,
          broadcastAddress,
          port: 3030,
          retries: 3
        }).catch((error: any) => {
          console.error('Discovery failed:', error);
          reject(error);
        });
      }).catch((error: any) => {
        console.error('Failed to load UDP discovery:', error);
        // Fallback to simulated discovery
        setTimeout(() => {
          const mockDiscovery = {
            Id: uuidv4(),
            Data: {
              Name: "Centauri Carbon",
              MachineName: "Centauri Carbon",
              BrandName: "Centauri",
              MainboardIP: "192.168.1.100",
              MainboardID: "000000000001d354",
              ProtocolVersion: "V3.0.0",
              FirmwareVersion: "V1.0.0",
            },
          }
          resolve(mockDiscovery)
        }, 1000)
      });
    })
  }

  async connect(printerIP: string): Promise<void> {
    this.printerIP = printerIP

    return new Promise((resolve, reject) => {
      try {
        // Try multiple WebSocket paths as specified in the documentation
        const wsUrls = [
          `ws://${printerIP}:3030/websocket`,
          `ws://${printerIP}:3030/ws`,
          `ws://${printerIP}:3030/`,
          `ws://${printerIP}:3030/api/websocket`,
          `ws://${printerIP}:3030/sdcp`,
        ]

        this.connectWithUrls(wsUrls, 0, resolve, reject)
      } catch (error) {
        reject(error)
      }
    })
  }

  private connectWithUrls(urls: string[], index: number, resolve: Function, reject: Function) {
    if (index >= urls.length) {
      reject(new Error("Failed to connect to any WebSocket endpoint"))
      return
    }

    const url = urls[index]
    console.log(`Attempting to connect to: ${url}`)

    this.ws = new WebSocket(url)

    // Log all WebSocket events for debugging
    this.ws.addEventListener('open', (event) => {
      console.log('[WebSocket] onopen:', event)
    })
    this.ws.addEventListener('message', (event) => {
      console.log('[WebSocket] onmessage:', event.data)
    })
    this.ws.addEventListener('close', (event) => {
      console.log('[WebSocket] onclose:', event)
    })
    this.ws.addEventListener('error', (event) => {
      console.log('[WebSocket] onerror:', event)
    })

    const timeout = setTimeout(() => {
      if (this.ws) {
        this.ws.close()
        this.connectWithUrls(urls, index + 1, resolve, reject)
      }
    }, 3000)

    this.ws.onopen = () => {
      clearTimeout(timeout)
      console.log(`Connected to printer at ${url}`)
      this.reconnectAttempts = 0
      // Send initial ping as handshake
      try {
        this.ws?.send("ping")
        console.log("Sent initial 'ping' to printer after connection open.")
      } catch (err) {
        console.error("Failed to send initial 'ping':", err)
      }
      this.startHeartbeat()
      this.emit("connected")
      resolve(undefined)
    }

    this.ws.onmessage = (event) => {
      console.log('[WebSocket] Received message:', event.data)
      this.handleMessage(event.data)
    }

    this.ws.onclose = (event) => {
      clearTimeout(timeout)
      this.stopHeartbeat()
      this.emit("disconnected")
      console.log("WebSocket closed:", event, 'code:', event.code, 'reason:', event.reason)
      this.handleReconnect()
    }

    this.ws.onerror = (error) => {
      clearTimeout(timeout)
      console.error(`WebSocket error on ${url}:`, error)
      if (index === urls.length - 1) {
        reject(error)
      } else {
        this.connectWithUrls(urls, index + 1, resolve, reject)
      }
    }
  }

  private handleMessage(data: string) {
    try {
      if (data === "pong") {
        return // Heartbeat response
      }

      const message = JSON.parse(data)
      const topic = message.Topic || ""

      if (topic.includes("/status/")) {
        this.handleStatusMessage(message)
      } else if (topic.includes("/attributes/")) {
        this.handleAttributesMessage(message)
      } else if (topic.includes("/response/")) {
        this.handleResponseMessage(message)
      } else if (topic.includes("/error/")) {
        this.handleErrorMessage(message)
      } else if (topic.includes("/notice/")) {
        this.handleNoticeMessage(message)
      }
    } catch (error) {
      console.error("Error parsing WebSocket message:", error)
    }
  }

  private handleStatusMessage(message: any) {
    const status = message.Status || message.Data?.Status || message
    this.logApiConsole('status', status)
    this.emit("status", status)
  }

  private handleAttributesMessage(message: any) {
    const attributes = message.Attributes || message.Data?.Attributes || message
    if (attributes.MainboardID) {
      this.mainboardID = attributes.MainboardID
    }
    this.logApiConsole('attributes', attributes)
    this.emit("attributes", attributes)
  }

  private handleResponseMessage(message: any) {
    if (message.Data?.Cmd === 258 && message.Data?.Data?.FileList) {
      this.logApiConsole('filelist', message.Data.Data.FileList)
    }
    this.emit("response", message)
  }

  private handleErrorMessage(message: any) {
    this.emit("error", message.Data?.Data || message)
  }

  private handleNoticeMessage(message: any) {
    this.emit("notice", message.Data?.Data || message)
  }

  private handleReconnect() {
    if (this.reconnectAttempts < this.maxReconnectAttempts) {
      this.reconnectAttempts++
      console.log(`Attempting to reconnect (${this.reconnectAttempts}/${this.maxReconnectAttempts})...`)

      setTimeout(() => {
        this.connect(this.printerIP).catch(console.error)
      }, this.reconnectDelay)
    }
  }

  private startHeartbeat() {
    this.heartbeatInterval = setInterval(() => {
      if (this.ws?.readyState === WebSocket.OPEN) {
        this.ws.send("ping")
      }
    }, 30000) // Send heartbeat every 30 seconds
  }

  private stopHeartbeat() {
    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval)
      this.heartbeatInterval = null
    }
  }

  private sendCommand(cmd: number, data: any = {}): Promise<any> {
    return new Promise((resolve, reject) => {
      if (!this.ws || this.ws.readyState !== WebSocket.OPEN) {
        reject(new Error("WebSocket not connected"))
        return
      }

      const requestId = uuidv4()
      const message = {
        Id: uuidv4(),
        Data: {
          Cmd: cmd,
          Data: data,
          RequestID: requestId,
          MainboardID: this.mainboardID,
          TimeStamp: Math.floor(Date.now() / 1000),
          From: 1, // SDCP_FROM_WEB_PC
        },
        Topic: `sdcp/request/${this.mainboardID}`,
      }

      // Set up response listener
      const responseHandler = (response: any) => {
        // Fix: match if response RequestID starts with our requestId
        const respId = response.Data?.RequestID || ""
        if (respId.startsWith(requestId)) {
          this.off("response", responseHandler)
          resolve(response)
        }
      }

      this.on("response", responseHandler)

      // Send the command
      try {
        const msgStr = JSON.stringify(message)
        console.log('[WebSocket] Sending message:', msgStr)
        this.ws.send(msgStr)
      } catch (err) {
        console.error('[WebSocket] Error sending message:', err)
        this.off("response", responseHandler)
        reject(err)
        return
      }

      // Timeout after 10 seconds
      setTimeout(() => {
        this.off("response", responseHandler)
        reject(new Error("Command timeout"))
      }, 10000)
    })
  }

  // Information Commands
  async requestStatus(): Promise<any> {
    return this.sendCommand(0)
  }

  async requestAttributes(): Promise<any> {
    return this.sendCommand(1)
  }

  // Print Control Commands
  async startPrint(filename: string, startLayer: number = 0) {
    // Send all required fields for Cmd 128
    return this.sendCommand(128, {
      Filename: filename,
      StartLayer: startLayer,
      Calibration_switch: 0, // default: no bed leveling
      PrintPlatformType: 0,  // default: build plate type A
      Tlp_Switch: 0          // default: no time-lapse
    })
  }

  async pausePrint(): Promise<any> {
    return this.sendCommand(129)
  }

  async stopPrint(): Promise<any> {
    return this.sendCommand(130)
  }

  async continuePrint(): Promise<any> {
    return this.sendCommand(131)
  }

  async stopMaterialFeeding(): Promise<any> {
    return this.sendCommand(132)
  }

  async skipPreheating(): Promise<any> {
    return this.sendCommand(133)
  }

  // Configuration Commands
  async changePrinterName(name: string): Promise<any> {
    return this.sendCommand(192, { Name: name })
  }

  async setPrintSpeed(speedPct: number): Promise<any> {
    return this.sendCommand(403, { PrintSpeedPct: speedPct })
  }

  async setFanSpeeds(fanSpeeds: { ModelFan?: number; AuxiliaryFan?: number; BoxFan?: number }): Promise<any> {
    return this.sendCommand(403, { TargetFanSpeed: fanSpeeds })
  }

  async setTemperature(nozzleTemp?: number, bedTemp?: number): Promise<any> {
    const data: any = {}
    if (nozzleTemp !== undefined) data.TempTargetNozzle = nozzleTemp
    if (bedTemp !== undefined) data.TempTargetHotbed = bedTemp
    return this.sendCommand(403, data)
  }

  async setLighting(enabled: boolean, rgb?: [number, number, number]): Promise<any> {
    const data: any = {
      LightStatus: { SecondLight: enabled ? 1 : 0 },
    }
    if (rgb) {
      data.RgbLight = rgb
    }
    return this.sendCommand(403, data)
  }

  // File Management Commands
  async getFileList(path = "/local/"): Promise<any> {
    return this.sendCommand(258, { Url: path })
  }

  async deleteFiles(fileList: string[] = [], folderList: string[] = []): Promise<any> {
    return this.sendCommand(259, { FileList: fileList, FolderList: folderList })
  }

  // History Commands
  async getHistoryTasks(): Promise<any> {
    return this.sendCommand(320, {});
  }

  async getTaskDetails(taskIds: string[]): Promise<any> {
    return this.sendCommand(321, { Id: taskIds });
  }

  // Video Stream Commands
  async enableVideoStream(): Promise<any> {
    const response = await this.sendCommand(386, { Enable: 1 })
    if (response.Data?.Data?.VideoUrl) {
      this.emit("videoUrl", response.Data.Data.VideoUrl)
    }
    return response
  }

  async disableVideoStream(): Promise<any> {
    const response = await this.sendCommand(386, { Enable: 0 })
    this.emit("videoUrl", null)
    return response
  }

  async enableTimeLapse(): Promise<any> {
    return this.sendCommand(387, { Enable: 1 });
  }

  async disableTimeLapse(): Promise<any> {
    return this.sendCommand(387, { Enable: 0 });
  }



  async terminateFileTransfer(uuid: string, filename: string): Promise<any> {
    return this.sendCommand(255, { Uuid: uuid, FileName: filename });
  }

  // Movement Commands (for stepper control)
  async moveAxis(axis: "X" | "Y" | "Z", distance: number) {
    // Use SDCP Cmd 401 for movement
    return this.sendCommand(401, { Axis: axis, Step: distance })
  }

  async homeAxis(axis: "X" | "Y" | "Z" | "XYZ") {
    // Use SDCP Cmd 402 for homing
    return this.sendCommand(402, { Axis: axis })
  }

  private async sendGCode(gcode: string): Promise<any> {
    // Send G-code to printer using SDCP command 256
    return this.sendCommand(256, { Gcode: gcode })
  }

  // File Upload via HTTP (chunked, matching original UI)
  async uploadFile(filename: string, fileData: ArrayBuffer, onProgress?: (progress: number) => void): Promise<any> {
    const url = `/api/proxy-upload`;
    const chunkSize = 1024 * 1024 * 1; // 1MB per docs
    const totalSize = fileData.byteLength;
    const uuid = uuidv4();

    // Calculate MD5 hash of the whole file using spark-md5
    const hashHex = SparkMD5.ArrayBuffer.hash(fileData);

    let offset = 0;
    let lastResponse = null;
    while (offset < totalSize) {
      const end = Math.min(offset + chunkSize, totalSize);
      const chunk = fileData.slice(offset, end);
      const formData = new FormData();
      formData.append("TotalSize", totalSize.toString());
      formData.append("Uuid", uuid);
      formData.append("Offset", offset.toString());
      formData.append("Check", "1");
      formData.append("S-File-MD5", hashHex);
      formData.append("File", new Blob([chunk]), filename);

      // Call onProgress before sending the chunk
      if (onProgress) {
        onProgress(Math.round((offset / totalSize) * 100));
      }

      const response = await fetch(url, {
        method: "POST",
        body: formData,
      });
      lastResponse = await response.json();
      // Check for both code and Code fields
      if (!response.ok || lastResponse?.Code > 0 || (lastResponse?.code && lastResponse.code !== "000000")) {
        throw new Error(`Upload failed at offset ${offset}: ${JSON.stringify(lastResponse)}`);
      }
      offset = end;
    }
    // Ensure progress is 100% at the end
    if (onProgress) {
      onProgress(100);
    }
    return lastResponse;
  }

  disconnect() {
    this.stopHeartbeat()
    if (this.ws) {
      this.ws.close()
      this.ws = null
    }
  }

  isConnected(): boolean {
    return this.ws?.readyState === WebSocket.OPEN
  }

  // Utility methods for status interpretation
  static getStatusText(status: number): string {
    const statusMap: { [key: number]: string } = {
      0: "Idle",
      1: "Printing",
      2: "File Transferring",
      3: "Calibrating",
      4: "Device Testing",
    }
    return statusMap[status] || "Unknown"
  }

  static getPrintStatusText(status: number): string {
    const statusMap: { [key: number]: string } = {
      0: "Idle",
      1: "Homing",
      2: "Dropping",
      3: "Exposuring",
      4: "Lifting",
      5: "Pausing",
      6: "Paused",
      7: "Stopping",
      8: "Stopped",
      9: "Complete",
      10: "File Checking",
    }
    return statusMap[status] || "Unknown"
  }

  static getErrorText(errorCode: number): string {
    const errorMap: { [key: number]: string } = {
      0: "Normal",
      1: "File MD5 Check Failed",
      2: "File Read Failed",
      3: "Resolution Mismatch",
      4: "Format Mismatch",
      5: "Machine Model Mismatch",
    }
    return errorMap[errorCode] || "Unknown Error"
  }

  // Add a method to log API events to a global API Console
  private logApiConsole(type: string, data: any) {
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('api-console-log', { detail: { type, data, time: new Date() } }))
    }
  }
}
