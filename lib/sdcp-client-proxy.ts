"use client"

import { v4 as uuidv4 } from "uuid"

export interface PrinterStatus {
  CurrentStatus: number[]
  PreviousStatus: number
  TempOfNozzle: number
  TempTargetNozzle: number
  TempOfHotbed: number
  TempTargetHotbed: number
  TempOfBox: number
  TempTargetBox: number
  CurrenCoord: string
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
  MaximumCloudSDCPSercicesAllowed: number
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
    RelaseFilmState: number
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

/**
 * Client SDCP qui se connecte directement à l'imprimante via WebSocket
 * Les uploads et le streaming vidéo passent par les APIs Next.js pour éviter les problèmes CORS
 */
export class SDCPClientProxy {
  private ws: WebSocket | null = null
  private mainboardID = ""
  private printerIP = ""
  private wsPort = 3030
  private videoPort = 3031
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

  async connect(printerIP: string, wsPort: number = 3030, videoPort: number = 3031): Promise<void> {
    this.printerIP = printerIP
    this.wsPort = wsPort
    this.videoPort = videoPort

    return new Promise((resolve, reject) => {
      try {
        const wsUrls = [
          `ws://${printerIP}:${wsPort}/websocket`,
          `ws://${printerIP}:${wsPort}/ws`,
          `ws://${printerIP}:${wsPort}/`,
          `ws://${printerIP}:${wsPort}/api/websocket`,
          `ws://${printerIP}:${wsPort}/sdcp`,
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
      try {
        this.ws?.send("ping")
        console.log("Sent initial 'ping' to printer")
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
      console.log("WebSocket closed:", event.code, event.reason)
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

  disconnect() {
    this.stopHeartbeat()
    if (this.ws) {
      this.ws.close()
      this.ws = null
    }
    this.emit("disconnected")
  }

  private handleMessage(data: string) {
    try {
      if (data === "pong") {
        return
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
      console.error("Error parsing message:", error)
    }
  }

  private handleStatusMessage(message: any) {
    const status = message.Status || message.Data?.Status || message
    this.emit("status", status)
  }

  private handleAttributesMessage(message: any) {
    const attributes = message.Attributes || message.Data?.Attributes || message
    if (attributes.MainboardID) {
      this.mainboardID = attributes.MainboardID
    }
    this.emit("attributes", attributes)
  }

  private handleResponseMessage(message: any) {
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
        this.connect(this.printerIP, this.wsPort, this.videoPort).catch(console.error)
      }, this.reconnectDelay)
    }
  }

  private startHeartbeat() {
    this.heartbeatInterval = setInterval(() => {
      if (this.ws?.readyState === WebSocket.OPEN) {
        this.ws.send('ping')
      }
    }, 30000)
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
          From: 1,
        },
        Topic: `sdcp/request/${this.mainboardID}`,
      }

      const responseHandler = (response: any) => {
        const respId = response.Data?.RequestID || ""
        if (respId.startsWith(requestId)) {
          this.off("response", responseHandler)
          resolve(response)
        }
      }

      this.on("response", responseHandler)

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

      setTimeout(() => {
        this.off("response", responseHandler)
        reject(new Error("Command timeout"))
      }, 10000)
    })
  }

  // Commandes d'information
  async requestStatus(): Promise<any> {
    return this.sendCommand(0)
  }

  async requestAttributes(): Promise<any> {
    return this.sendCommand(1)
  }

  // Commandes de contrôle d'impression
  async startPrint(filename: string, startLayer: number = 0) {
    return this.sendCommand(128, {
      Filename: filename,
      StartLayer: startLayer,
      Calibration_switch: 0,
      PrintPlatformType: 0,
      Tlp_Switch: 0
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

  async changePrinterName(name: string): Promise<any> {
    return this.sendCommand(134, { Name: name })
  }

  // Commandes de configuration
  async setPrintSpeed(speed: number): Promise<any> {
    return this.sendCommand(256, { PrintSpeed: speed })
  }

  async setNozzleTemperature(temperature: number): Promise<any> {
    return this.sendCommand(257, { TempOfNozzle: temperature })
  }

  async setBedTemperature(temperature: number): Promise<any> {
    return this.sendCommand(258, { TempOfHotbed: temperature })
  }

  async setFanSpeed(modelFan: number, modeFan: number = 0, auxiliaryFan: number = 0, boxFan: number = 0): Promise<any> {
    return this.sendCommand(259, {
      ModelFan: modelFan,
      ModeFan: modeFan,
      AuxiliaryFan: auxiliaryFan,
      BoxFan: boxFan
    })
  }

  async setLighting(enabled: boolean, brightness: number = 100, r: number = 255, g: number = 255, b: number = 255): Promise<any> {
    return this.sendCommand(260, {
      SecondLight: enabled ? 1 : 0,
      RgbLight: [r, g, b],
      Brightness: brightness
    })
  }

  // Commandes de gestion des fichiers
  async getFileList(path: string = "/local/"): Promise<any> {
    return this.sendCommand(385, { Path: path })
  }

  async deleteFiles(files: string[]): Promise<any> {
    return this.sendCommand(386, { Files: files })
  }

  // Commandes de mouvement
  async homeAxis(axis: string): Promise<any> {
    return this.sendCommand(513, { Axis: axis })
  }

  async moveAxis(axis: string, distance: number): Promise<any> {
    return this.sendCommand(514, { Axis: axis, Distance: distance })
  }

  // Commandes vidéo
  async enableVideoStream(): Promise<any> {
    // Utilise le proxy vidéo côté serveur pour éviter les problèmes CORS
    const videoUrl = `/api/video-proxy?printerIP=${this.printerIP}&videoPort=${this.videoPort}&path=/video`
    this.emit("videoUrl", videoUrl)
    return this.sendCommand(768)
  }

  async disableVideoStream(): Promise<any> {
    this.emit("videoUrl", "")
    return this.sendCommand(769)
  }

  // Commandes d'historique
  async getHistoryTasks(): Promise<any> {
    return this.sendCommand(896)
  }

  async getTaskDetails(taskId: string): Promise<any> {
    return this.sendCommand(897, { TaskId: taskId })
  }

  // Commandes time-lapse
  async enableTimeLapse(): Promise<any> {
    return this.sendCommand(1024)
  }

  async disableTimeLapse(): Promise<any> {
    return this.sendCommand(1025)
  }

  // Commandes de transfert
  async terminateFileTransfer(uuid: string, filename: string): Promise<any> {
    return this.sendCommand(1280, { UUID: uuid, Filename: filename })
  }

  // Upload de fichier via l'API proxy
  async uploadFile(file: File, onProgress?: (progress: number) => void): Promise<any> {
    const formData = new FormData()
    formData.append('file', file)
    formData.append('printerIP', this.printerIP)
    formData.append('wsPort', this.wsPort.toString())

    try {
      const response = await fetch('/api/proxy-upload', {
        method: 'POST',
        body: formData,
      })

      if (!response.ok) {
        const errorText = await response.text()
        throw new Error(`Upload failed: ${errorText}`)
      }

      return await response.json()
    } catch (error) {
      console.error('Upload error:', error)
      throw error
    }
  }
}

