"use client"

import type React from "react"
import { createContext, useContext, useEffect, useState, useCallback } from "react"
import { SDCPClientProxy, type PrinterStatus, type PrinterAttributes } from "./sdcp-client-proxy"

interface PrinterContextType {
  client: SDCPClientProxy
  isConnected: boolean
  status: PrinterStatus | null
  attributes: PrinterAttributes | null
  videoUrl: string | null
  connect: (ip: string, wsPort?: number, videoPort?: number) => Promise<void>
  disconnect: () => void
  startPrint: (filename: string) => Promise<void>
  pausePrint: () => Promise<void>
  stopPrint: () => Promise<void>
  continuePrint: () => Promise<void>
  setPrintSpeed: (speed: number) => Promise<void>
  setTemperature: (nozzle?: number, bed?: number) => Promise<void>
  setFanSpeeds: (fans: { ModelFan?: number; AuxiliaryFan?: number; BoxFan?: number }) => Promise<void>
  setLighting: (enabled: boolean, rgb?: [number, number, number]) => Promise<void>
  enableVideoStream: () => Promise<void>
  disableVideoStream: () => Promise<void>
  getFileList: (path?: string) => Promise<any>
  uploadFile: (filename: string, fileData: ArrayBuffer, onProgress?: (progress: number) => void) => Promise<any>
  homeAxis: (axis?: "X" | "Y" | "Z") => Promise<void>
  moveAxis: (axis: "X" | "Y" | "Z", distance: number) => Promise<void>
  deleteFiles: (fileList: string[], folderList: string[]) => Promise<any>
  getHistoryTasks: () => Promise<any>
  getTaskDetails: (taskIds: string[]) => Promise<any>
  enableTimeLapse: () => Promise<any>;
  disableTimeLapse: () => Promise<any>;
  stopMaterialFeeding: () => Promise<any>;
  skipPreheating: () => Promise<any>;
  changePrinterName: (name: string) => Promise<any>;
  terminateFileTransfer: (uuid: string, filename: string) => Promise<any>;
}

const PrinterContext = createContext<PrinterContextType | undefined>(undefined)

export function PrinterProvider({ children }: { children: React.ReactNode }) {
  const [client] = useState(() => new SDCPClientProxy())
  const [isConnected, setIsConnected] = useState(false)
  const [status, setStatus] = useState<PrinterStatus | null>(null)
  const [attributes, setAttributes] = useState<PrinterAttributes | null>(null)
  const [videoUrl, setVideoUrl] = useState<string | null>(null)

  useEffect(() => {
    // Set up event listeners
    const handleConnected = () => {
      setIsConnected(true)
      // Request initial status and attributes
      client.requestStatus().catch(console.error)
      client.requestAttributes().catch(console.error)
    }

    const handleDisconnected = () => {
      setIsConnected(false)
      setStatus(null)
      setAttributes(null)
      setVideoUrl(null)
    }

    const handleStatus = (newStatus: PrinterStatus) => {
      setStatus(newStatus)
    }

    const handleAttributes = (newAttributes: PrinterAttributes) => {
      setAttributes(newAttributes)
    }

    const handleVideoUrl = (url: string | null) => {
      setVideoUrl(url)
    }

    const handleError = (error: any) => {
      console.error("Printer error:", error)
    }

    const handleNotice = (notice: any) => {
      console.log("Printer notice:", notice)
    }

    client.on("connected", handleConnected)
    client.on("disconnected", handleDisconnected)
    client.on("status", handleStatus)
    client.on("attributes", handleAttributes)
    client.on("videoUrl", handleVideoUrl)
    client.on("error", handleError)
    client.on("notice", handleNotice)

    return () => {
      client.off("connected", handleConnected)
      client.off("disconnected", handleDisconnected)
      client.off("status", handleStatus)
      client.off("attributes", handleAttributes)
      client.off("videoUrl", handleVideoUrl)
      client.off("error", handleError)
      client.off("notice", handleNotice)
    }
  }, [client])

  useEffect(() => {
    let statusInterval: NodeJS.Timeout | null = null
    if (isConnected) {
      statusInterval = setInterval(() => {
        client.requestStatus().catch(console.error)
      }, 2000)
    }
    return () => {
      if (statusInterval) clearInterval(statusInterval)
    }
  }, [isConnected, client])

  const connect = useCallback(
    async (ip: string, wsPort?: number, videoPort?: number) => {
      try {
        await client.connect(ip, wsPort, videoPort)
      } catch (error) {
        console.error("Failed to connect to printer:", error)
        throw error
      }
    },
    [client],
  )

  const disconnect = useCallback(() => {
    client.disconnect()
  }, [client])

  const startPrint = useCallback(
    async (filename: string) => {
      await client.startPrint(filename)
    },
    [client],
  )

  const pausePrint = useCallback(async () => {
    await client.pausePrint()
  }, [client])

  const stopPrint = useCallback(async () => {
    await client.stopPrint()
  }, [client])

  const continuePrint = useCallback(async () => {
    await client.continuePrint()
  }, [client])

  const setPrintSpeed = useCallback(
    async (speed: number) => {
      await client.setPrintSpeed(speed)
    },
    [client],
  )

  const setTemperature = useCallback(
    async (nozzle?: number, bed?: number) => {
      await client.setTemperature(nozzle, bed)
    },
    [client],
  )

  const setFanSpeeds = useCallback(
    async (fans: { ModelFan?: number; AuxiliaryFan?: number; BoxFan?: number }) => {
      await client.setFanSpeeds(fans)
    },
    [client],
  )

  const setLighting = useCallback(
    async (enabled: boolean, rgb?: [number, number, number]) => {
      await client.setLighting(enabled, rgb)
    },
    [client],
  )

  const enableVideoStream = useCallback(async () => {
    await client.enableVideoStream()
  }, [client])

  const disableVideoStream = useCallback(async () => {
    await client.disableVideoStream()
  }, [client])

  const getFileList = useCallback(
    async (path?: string) => {
      return await client.getFileList(path)
    },
    [client],
  )

  const deleteFiles = useCallback(
    async (fileList: string[] = [], folderList: string[] = []) => {
      return await client.deleteFiles(fileList, folderList)
    },
    [client],
  )

  const uploadFile = useCallback(
    async (filename: string, fileData: ArrayBuffer, onProgress?: (progress: number) => void) => {
      return await client.uploadFile(filename, fileData, onProgress)
    },
    [client],
  )

  const homeAxis = useCallback(
    async (axis?: "X" | "Y" | "Z") => {
      // If no axis is provided, home all axes ("XYZ")
      await client.homeAxis(axis ?? "XYZ")
    },
    [client],
  )

  const moveAxis = useCallback(
    async (axis: "X" | "Y" | "Z", distance: number) => {
      await client.moveAxis(axis, distance)
    },
    [client],
  )

  const getHistoryTasks = useCallback(
    async () => {
      return await client.getHistoryTasks();
    },
    [client],
  );

  const getTaskDetails = useCallback(
    async (taskIds: string[]) => {
      return await client.getTaskDetails(taskIds);
    },
    [client],
  );

  const enableTimeLapse = useCallback(async () => {
    return await client.enableTimeLapse();
  }, [client]);

  const disableTimeLapse = useCallback(async () => {
    return await client.disableTimeLapse();
  }, [client]);

  const stopMaterialFeeding = useCallback(async () => {
    return await client.stopMaterialFeeding();
  }, [client]);

  const skipPreheating = useCallback(async () => {
    return await client.skipPreheating();
  }, [client]);

  const changePrinterName = useCallback(async (name: string) => {
    return await client.changePrinterName(name);
  }, [client]);

  const terminateFileTransfer = useCallback(async (uuid: string, filename: string) => {
    return await client.terminateFileTransfer(uuid, filename);
  }, [client]);

  return (
    <PrinterContext.Provider
      value={{
        client,
        isConnected,
        status,
        attributes,
        videoUrl,
        connect,
        disconnect,
        startPrint,
        pausePrint,
        stopPrint,
        continuePrint,
        setPrintSpeed,
        setTemperature,
        setFanSpeeds,
        setLighting,
        enableVideoStream,
        disableVideoStream,
        getFileList,
        uploadFile,
        homeAxis,
        moveAxis,
        deleteFiles,
        getHistoryTasks,
        getTaskDetails,
        enableTimeLapse,
        disableTimeLapse,
        stopMaterialFeeding,
        skipPreheating,
        changePrinterName,
        terminateFileTransfer,
      }}
    >
      {children}
    </PrinterContext.Provider>
  )
}

export function usePrinter() {
  const context = useContext(PrinterContext)
  if (context === undefined) {
    throw new Error("usePrinter must be used within a PrinterProvider")
  }
  return context
}
