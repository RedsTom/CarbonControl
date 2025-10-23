"use client"

import React, { useState, useEffect, useRef } from "react"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { AnimatedProgress } from "@/components/animated-progress"
import { AnimatedSlider } from "@/components/animated-slider"
import { StatusCard } from "@/components/status-card"
import { ColorPicker } from "@/components/color-picker"
import { usePrinter } from "@/lib/printer-context"
import { SDCPClient } from "@/lib/sdcp-client"
import {
  Settings,
  Play,
  Pause,
  Square,
  Camera,
  Lightbulb,
  Fan,
  Cog,
  Thermometer,
  FileText,
  Upload,
  Download,
  ZoomIn,
  ZoomOut,
  Move,
  ArrowUp,
  ArrowDown,
  ArrowLeft,
  ArrowRight,
  Activity,
  HardDrive,
  Cpu,
  MemoryStick,
  Zap,
  Home,
  CheckCircle,
  XCircle,
} from "lucide-react"
import { Table } from "@/components/ui/table"
import { Checkbox } from "@/components/ui/checkbox"
import { Alert } from "@/components/ui/alert"
import { Collapsible } from "@/components/ui/collapsible"
import { ChevronDown, ChevronRight } from "lucide-react"
import { useToast } from "@/components/ui/use-toast"
import { PrinterDiscovery } from "@/components/printer-discovery"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Wifi } from "lucide-react"

function PrintFilesTab(props: any) {
  // All the Print Files tab logic and JSX here, using props as needed
  return (
    <>
      {props.uploadProgress !== null && (
        <div className="mb-2">
          <AnimatedProgress value={props.uploadProgress} showPercentage />
        </div>
      )}
      <div className="mb-2 flex gap-2">
        <Button size="sm" variant={props.filePath.startsWith("/local/") ? "default" : "outline"} onClick={() => props.handleSwitchStorage("/local/")} disabled={!props.isConnected}>Onboard</Button>
        {props.filePath !== "/local/" && (
          <Button size="sm" variant="outline" onClick={props.handleBack} disabled={!props.isConnected}>Back</Button>
        )}
        <Button size="sm" variant="destructive" onClick={props.handleDeleteSelected} disabled={!props.isConnected || (props.selectedFiles.size === 0 && props.selectedFolders.size === 0)}>Delete Selected</Button>
      </div>
      <div className="mb-2">
        <Table className="w-full table-fixed">
          <thead>
            <tr>
              <th className="w-8"></th>
              <th className="w-1/2 truncate">Name</th>
              <th className="w-20">Type</th>
              <th className="w-24">Size</th>
              <th className="w-32">Action</th>
            </tr>
          </thead>
          <tbody>
            {props.isLoadingFiles ? (
              <tr><td colSpan={5}>Loading...</td></tr>
            ) : props.fileEntries.length > 0 ? (
              props.fileEntries.map((entry: any, idx: number) => (
                <tr key={entry.name}>
                  <td>
                    {entry.type === 1 ? (
                      <Checkbox checked={props.selectedFiles.has(entry.name)} onCheckedChange={checked => props.handleSelectFile(entry.name, !!checked)} />
                    ) : (
                      <Checkbox checked={props.selectedFolders.has(entry.name)} onCheckedChange={checked => props.handleSelectFolder(entry.name, !!checked)} />
                    )}
                  </td>
                  <td className="truncate max-w-xs overflow-hidden whitespace-nowrap" title={entry.name.split("/").pop()}>
                    {entry.type === 0 ? (
                      <Button variant="link" onClick={() => props.handleEnterFolder(entry)}>{entry.name.split("/").pop()?.slice(0, 24)}{entry.name.split("/").pop()?.length > 24 ? '…' : ''}</Button>
                    ) : (
                      <span>{entry.name.split("/").pop()?.slice(0, 24)}{entry.name.split("/").pop()?.length > 24 ? '…' : ''}</span>
                    )}
                  </td>
                  <td>{entry.type === 0 ? "Folder" : "File"}</td>
                  <td>{entry.type === 1 ? (entry.usedSize / 1024 / 1024).toFixed(1) + " MB" : "-"}</td>
                  <td className="space-x-2">
                    {entry.type === 1 && (
                      <Button size="sm" variant="ghost" onClick={() => props.handlePrintControl("start", entry.name)} disabled={!props.isConnected || props.isPrintInProgress}><Play className="w-4 h-4" /></Button>
                    )}
                    <Button size="sm" variant="destructive" onClick={async () => { await props.deleteFiles(entry.type === 1 ? [entry.name] : [], entry.type === 0 ? [entry.name] : []); props.loadFileList(); }} disabled={!props.isConnected}>Delete</Button>
                  </td>
                </tr>
              ))
            ) : (
              <tr><td colSpan={5}>No files or folders found</td></tr>
            )}
          </tbody>
        </Table>
      </div>
      <div className="flex gap-2 mt-2">
        <Button size="sm" className="flex-1 bg-primary hover:bg-primary/90 transition-all duration-200 hover:scale-105 active:scale-95" disabled={!props.isConnected} onClick={() => props.fileInputRef.current?.click()}>
          <Upload className="w-4 h-4 mr-2" />Upload
          <input ref={props.fileInputRef} type="file" accept=".gcode" onChange={props.handleFileUpload} className="hidden" />
        </Button>
        <Button size="sm" variant="outline" className="flex-1 border-primary/30 hover:bg-primary/10 transition-all duration-200 hover:scale-105 active:scale-95 bg-transparent" onClick={() => props.loadFileList()} disabled={!props.isConnected}>
          <Download className="w-4 h-4 mr-2" />Refresh
        </Button>
      </div>
    </>
  );
}

function PrintHistoryTab(props: any) {
  return (
    <Card className="p-4">
      <h2 className="text-lg font-bold mb-2">Print History</h2>
      {props.isLoadingHistory ? (
        <div>Loading...</div>
      ) : props.historyTasks.length === 0 ? (
        <div>No print history found.</div>
      ) : (
        <div className="flex flex-col gap-2">
          {props.historyTasks.map((taskId: string) => (
            <div key={taskId} className="border rounded p-2 flex items-center gap-4 cursor-pointer hover:bg-secondary/30" onClick={() => props.handleSelectTask(taskId)}>
              <span className="font-mono text-xs">{taskId}</span>
              {props.selectedTask === taskId && props.taskDetails && (
                <div className="ml-4 flex flex-col gap-1">
                  {props.taskDetails.Thumbnail && <img src={props.taskDetails.Thumbnail} alt="Thumbnail" className="w-24 h-24 object-cover rounded" />}
                  <div><b>Name:</b> {props.taskDetails.TaskName}</div>
                  <div><b>Status:</b> {props.taskDetails.TaskStatus}</div>
                  <div><b>Error Reason:</b> {props.taskDetails.ErrorStatusReason}</div>
                  <div><b>Start:</b> {new Date(props.taskDetails.BeginTime * 1000).toLocaleString()}</div>
                  <div><b>End:</b> {new Date(props.taskDetails.EndTime * 1000).toLocaleString()}</div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </Card>
  );
}

function AdvancedTab(props: any) {
  return (
    <Card className="p-4 flex flex-col gap-4">
      <h2 className="text-lg font-bold mb-2">Advanced Controls</h2>
      {props.advancedMessage && <Alert>{props.advancedMessage}</Alert>}
      <div className="flex items-center gap-4">
        <span>Time-lapse:</span>
        <Switch checked={props.isTimeLapseOn} onCheckedChange={props.handleTimeLapseToggle} />
        <span>{props.isTimeLapseOn ? "Enabled" : "Disabled"}</span>
      </div>
      <div className="flex items-center gap-4">
        <Button onClick={props.handleStopMaterialFeed}>Stop Material Feed</Button>
        <Button onClick={props.handleSkipPreheat}>Skip Preheat</Button>
      </div>
      <div className="flex items-center gap-4">
        <Input value={props.printerName} onChange={e => props.setPrinterName(e.target.value)} placeholder="New printer name" />
        <Button onClick={props.handleChangePrinterName}>Change Name</Button>
      </div>
      <div className="flex items-center gap-4">
        <Input value={props.terminateUuid} onChange={e => props.setTerminateUuid(e.target.value)} placeholder="Transfer UUID" />
        <Input value={props.terminateFile} onChange={e => props.setTerminateFile(e.target.value)} placeholder="File name" />
        <Button onClick={props.handleTerminateTransfer}>Terminate Transfer</Button>
      </div>
      <div className="mt-4">
        <h3 className="font-semibold mb-2">Extended Status/Attributes</h3>
        <pre className="bg-secondary/30 rounded p-2 text-xs overflow-x-auto">
{JSON.stringify(props.attributes, null, 2)}
        </pre>
      </div>
    </Card>
  );
}

const tabsConfig = [
  { id: 'files', label: 'Print Files', component: PrintFilesTab },
  { id: 'history', label: 'Print History', component: PrintHistoryTab },
  { id: 'advanced', label: 'Advanced', component: AdvancedTab },
];

export default function ElegooPrinterUI() {
  const {
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
  } = usePrinter()

  const { toast } = useToast()

  const [ipAddress, setIpAddress] = useState("192.168.1.100")
  const [wsPort, setWsPort] = useState("3030")
  const [videoPort, setVideoPort] = useState("3031")

  // Load saved IP address and ports from localStorage on mount
  useEffect(() => {
    const savedIP = localStorage.getItem('printerIP')
    const savedWsPort = localStorage.getItem('printerWsPort')
    const savedVideoPort = localStorage.getItem('printerVideoPort')

    if (savedIP) {
      setIpAddress(savedIP)
      setIpLoadedFromCache(true)
    }
    if (savedWsPort) {
      setWsPort(savedWsPort)
    }
    if (savedVideoPort) {
      setVideoPort(savedVideoPort)
    }

    if (savedIP) {
      // Show a brief toast notification that settings were loaded from cache
      setTimeout(() => {
        toast({
          title: "Settings Restored",
          description: `Loaded saved IP: ${savedIP}, WS Port: ${savedWsPort || '3030'}, Video Port: ${savedVideoPort || '3031'}`,
        })
      }, 500)
    }
  }, [])
  const [isConnecting, setIsConnecting] = useState(false)
  const [printSpeed, setPrintSpeedLocal] = useState("balanced")
  const [bedTemp, setBedTemp] = useState([60])
  const [nozzleTemp, setNozzleTemp] = useState([200])
  const [fanSpeed, setFanSpeed] = useState([75])
  const [lightBrightness, setLightBrightness] = useState([80])
  const [isLightsOn, setIsLightsOn] = useState(true)
  const [printFiles, setPrintFiles] = useState<any[]>([])
  const [selectedStepSize, setSelectedStepSize] = useState(1)
  const [filePath, setFilePath] = useState("/local/");
  const [fileEntries, setFileEntries] = useState<any[]>([]);
  const [selectedFiles, setSelectedFiles] = useState<Set<string>>(new Set());
  const [selectedFolders, setSelectedFolders] = useState<Set<string>>(new Set());
  const [isLoadingFiles, setIsLoadingFiles] = useState(false);
  const [historyTasks, setHistoryTasks] = useState<any[]>([]);
  const [selectedTask, setSelectedTask] = useState<any | null>(null);
  const [taskDetails, setTaskDetails] = useState<any | null>(null);
  const [isLoadingHistory, setIsLoadingHistory] = useState(false);
  const [isTimeLapseOn, setIsTimeLapseOn] = useState(false);
  const [printerName, setPrinterName] = useState("");
  const [terminateUuid, setTerminateUuid] = useState("");
  const [terminateFile, setTerminateFile] = useState("");
  const [advancedMessage, setAdvancedMessage] = useState("");
  const [uploadProgress, setUploadProgress] = useState<number | null>(null);
  const [showDiscoveryDialog, setShowDiscoveryDialog] = useState(false);
  const [discoveredPrinters, setDiscoveredPrinters] = useState<any[]>([]);
  const [ipLoadedFromCache, setIpLoadedFromCache] = useState(false);

  // Load discovered printers from localStorage on mount
  useEffect(() => {
    const saved = localStorage.getItem('discoveredPrinters')
    if (saved) {
      try {
        const printers = JSON.parse(saved)
        setDiscoveredPrinters(printers)
      } catch (error) {
        console.error('Failed to load discovered printers:', error)
      }
    }
  }, [])

  // Add a ref for the file input
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Remove AnimatedSlider for temperature, add plus/minus and number input for nozzle and bed
  // Add local state for nozzle and bed input
  const [nozzleInput, setNozzleInput] = useState(nozzleTemp[0]);
  const [bedInput, setBedInput] = useState(bedTemp[0]);

  // When status changes, only update the displayed current temp, not the input
  useEffect(() => {
    if (status) {
      setFanSpeed([status.CurrentFanSpeed?.ModelFan ?? 0]);
      setIsLightsOn(status.LightStatus?.SecondLight === 1);
    }
  }, [status]);

  useEffect(() => {
    if (isConnected) {
      loadFileList(filePath);
    }
  }, [isConnected, filePath]);

  const handleConnect = async () => {
    setIsConnecting(true)
    try {
      await connect(ipAddress)
      // Clear discovered printers when successfully connected
      setDiscoveredPrinters([])
      localStorage.removeItem('discoveredPrinters')
    } catch (error) {
      console.error("Connection failed:", error)
    } finally {
      setIsConnecting(false)
    }
  }

  const handleDisconnect = () => {
    disconnect()
    // Optionally clear saved IP on disconnect
    // Uncomment the line below if you want to clear the IP when disconnecting
    // localStorage.removeItem('printerIP')
  }

  const handlePrinterDiscovered = (printer: any) => {
    const newIP = printer.data.MainboardIP
    setIpAddress(newIP)
    // Save IP to localStorage
    localStorage.setItem('printerIP', newIP)
    setShowDiscoveryDialog(false)
    
    // Add to discovered printers list
    setDiscoveredPrinters(prev => {
      const exists = prev.some(p => p.data.MainboardIP === printer.data.MainboardIP)
      if (!exists) {
        const newList = [...prev, printer]
        // Save to localStorage
        localStorage.setItem('discoveredPrinters', JSON.stringify(newList))
        return newList
      }
      return prev
    localStorage.removeItem('printerWsPort')
    localStorage.removeItem('printerVideoPort')
    })
    setWsPort("3030")
    setVideoPort("3031")

    toast({
      title: "Printer Discovered!",
      description: "Saved IP address and ports have been cleared",
    })
  }

  const handleManualConnect = () => {
    setShowDiscoveryDialog(false)
  }

  const clearCachedIP = () => {
    localStorage.removeItem('printerIP')
    setIpAddress("192.168.1.100")
    setIpLoadedFromCache(false)
    toast({
      title: "Cache Cleared",
      description: "Saved IP address has been cleared",
    })
  }

  const loadFileList = async (path = filePath) => {
    setIsLoadingFiles(true);
    try {
      const response = await getFileList(path);
      if (response.Data?.Data?.FileList) {
        setFileEntries(response.Data.Data.FileList);
      }
    } catch (error) {
      console.error("Failed to load file list:", error);
    } finally {
      setIsLoadingFiles(false);
    }
  };

  const handleEnterFolder = (folder: any) => {
    setFilePath(folder.name);
    setSelectedFiles(new Set());
    setSelectedFolders(new Set());
  };

  const handleBack = () => {
    if (filePath === "/local/" || filePath === "/usb/") return;
    const parts = filePath.split("/").filter(Boolean);
    parts.pop();
    setFilePath("/" + parts.join("/") + (parts.length ? "/" : ""));
    setSelectedFiles(new Set());
    setSelectedFolders(new Set());
  };

  const handleSelectFile = (name: string, checked: boolean) => {
    setSelectedFiles(prev => {
      const next = new Set(prev);
      if (checked) next.add(name); else next.delete(name);
      return next;
    });
  };
  const handleSelectFolder = (name: string, checked: boolean) => {
    setSelectedFolders(prev => {
      const next = new Set(prev);
      if (checked) next.add(name); else next.delete(name);
      return next;
    });
  };

  const handleDeleteSelected = async () => {
    if (!isConnected) return;
    try {
      await deleteFiles(Array.from(selectedFiles), Array.from(selectedFolders));
      setSelectedFiles(new Set());
      setSelectedFolders(new Set());
      loadFileList();
    } catch (error) {
      console.error("Delete failed:", error);
    }
  };

  const handleSwitchStorage = (storage: "/local/" | "/usb/") => {
    setFilePath(storage);
    setSelectedFiles(new Set());
    setSelectedFolders(new Set());
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return
    try {
      setUploadProgress(0);
      const arrayBuffer = await file.arrayBuffer()
      await uploadFile(file.name, arrayBuffer, (progress: number) => setUploadProgress(progress));
    } catch (error) {
      console.error("File upload failed:", error)
    } finally {
      setTimeout(() => {
        setUploadProgress(null);
        loadFileList(); // Refresh file list after progress bar disappears
      }, 1000);
    }
  }

  const handlePrintControl = async (action: "start" | "pause" | "stop" | "continue", filename?: string) => {
    try {
      switch (action) {
        case "start":
          if (filename) await startPrint(filename)
          break
        case "pause":
          await pausePrint()
          break
        case "stop":
          await stopPrint()
          break
        case "continue":
          await continuePrint()
          break
      }
    } catch (error) {
      console.error(`Print ${action} failed:`, error)
    }
  }

  const handleTemperatureChange = async (type: "nozzle" | "bed", value: number[]) => {
    try {
      if (type === "nozzle") {
        setNozzleTemp(value)
        await setTemperature(value[0], undefined)
      } else {
        setBedTemp(value)
        await setTemperature(undefined, value[0])
      }
    } catch (error) {
      console.error("Temperature change failed:", error)
    }
  }

  const handleFanSpeedChange = async (value: number[]) => {
    setFanSpeed(value)
    try {
      await setFanSpeeds({ ModelFan: value[0] })
    } catch (error) {
      console.error("Fan speed change failed:", error)
    }
  }

  const handleLightingToggle = async (enabled: boolean) => {
    setIsLightsOn(enabled)
    try {
      await setLighting(enabled)
    } catch (error) {
      console.error("Lighting toggle failed:", error)
    }
  }

  const handleSpeedProfileChange = async (profileId: string) => {
    setPrintSpeedLocal(profileId)
    const speedMap: { [key: string]: number } = {
      silent: 50,
      balanced: 80,
      sport: 120,
      ludicrous: 200,
    }
    try {
      await setPrintSpeed(speedMap[profileId])
    } catch (error) {
      console.error("Speed profile change failed:", error)
    }
  }

  const handleAxisMovement = async (axis: "X" | "Y" | "Z", direction: number) => {
    try {
      await moveAxis(axis, direction * selectedStepSize)
    } catch (error) {
      console.error("Axis movement failed:", error)
    }
  }

  const handleHoming = async (axis?: "X" | "Y" | "Z") => {
    try {
      await homeAxis(axis)
    } catch (error) {
      console.error("Homing failed:", error)
    }
  }

  const handleVideoStream = async (enable: boolean) => {
    try {
      if (enable) {
        await enableVideoStream()
      } else {
        await disableVideoStream()
      }
    } catch (error) {
      console.error("Video stream toggle failed:", error)
    }
  }

  const handleTimeLapseToggle = async (checked: boolean) => {
    try {
      if (checked) {
        await enableTimeLapse();
        setIsTimeLapseOn(true);
        setAdvancedMessage("Time-lapse enabled.");
      } else {
        await disableTimeLapse();
        setIsTimeLapseOn(false);
        setAdvancedMessage("Time-lapse disabled.");
      }
    } catch (e) {
      setAdvancedMessage("Failed to toggle time-lapse.");
    }
  };

  const handleChangePrinterName = async () => {
    try {
      await changePrinterName(printerName);
      setAdvancedMessage("Printer name changed.");
    } catch (e) {
      setAdvancedMessage("Failed to change printer name.");
    }
  };

  const handleStopMaterialFeed = async () => {
    try {
      await stopMaterialFeeding();
      setAdvancedMessage("Material feeding stopped.");
    } catch (e) {
      setAdvancedMessage("Failed to stop material feeding.");
    }
  };

  const handleSkipPreheat = async () => {
    try {
      await skipPreheating();
      setAdvancedMessage("Preheating skipped.");
    } catch (e) {
      setAdvancedMessage("Failed to skip preheating.");
    }
  };

  const handleTerminateTransfer = async () => {
    try {
      await terminateFileTransfer(terminateUuid, terminateFile);
      setAdvancedMessage("File transfer terminated.");
    } catch (e) {
      setAdvancedMessage("Failed to terminate file transfer.");
    }
  };

  // Get current status information
  const currentStatus = status?.CurrentStatus?.[0] || 0
  const printerStatusText = SDCPClient.getStatusText(currentStatus)
  const printInfoStatus = status?.PrintInfo?.Status;
  // Print status helpers
  const isPrintActive = printInfoStatus === 1; // Printing
  const isPrintPausing = printInfoStatus === 5; // Pausing
  const isPrintPaused = printInfoStatus === 6; // Paused
  const isPrintStopping = printInfoStatus === 7; // Stopping
  const isPrintStopped = printInfoStatus === 8; // Stopped
  const isPrintComplete = printInfoStatus === 9; // Complete
  const isPrintInProgress = isPrintActive || isPrintPausing || isPrintPaused || isPrintStopping;
  const printProgress = status?.PrintInfo
    ? Math.round((status.PrintInfo.CurrentLayer / status.PrintInfo.TotalLayer) * 100)
    : 0
  const currentPrintFile = status?.PrintInfo?.Filename || "No active print"

  const speedProfiles = [
    { id: "silent", name: "Silent", speed: "50mm/s", color: "bg-blue-500" },
    { id: "balanced", name: "Balanced", speed: "80mm/s", color: "bg-green-500" },
    { id: "sport", name: "Sport", speed: "120mm/s", color: "bg-yellow-500" },
    { id: "ludicrous", name: "Ludicrous", speed: "200mm/s", color: "bg-red-500" },
  ]

  const getConnectionStatus = () => {
    if (isConnecting) return { text: "Connecting...", variant: "secondary" as const, icon: Activity }
    if (isConnected) return { text: "Connected", variant: "default" as const, icon: CheckCircle }
    return { text: "Disconnected", variant: "destructive" as const, icon: XCircle }
  }

  const connectionStatus = getConnectionStatus()

  const [cameraError, setCameraError] = useState(false);

  // Only set the camera video URL after connection
  const [connectedIp, setConnectedIp] = useState<string | null>(null);
  const [connectedVideoPort, setConnectedVideoPort] = useState<string | null>(null);
  useEffect(() => {
    if (isConnected) {
      setConnectedIp(ipAddress);
      setConnectedVideoPort(videoPort);
    }
  }, [isConnected, ipAddress, videoPort]);
  const debugVideoUrl = connectedIp && connectedVideoPort ? `http://${connectedIp}:${connectedVideoPort}/video` : null;

  // Fan states for individual fans
  const modelFanSpeed = status?.CurrentFanSpeed?.ModelFan ?? 0;
  const auxFanSpeed = status?.CurrentFanSpeed?.AuxiliaryFan ?? 0;
  const boxFanSpeed = status?.CurrentFanSpeed?.BoxFan ?? 0;
  const isModelFanOn = modelFanSpeed > 0;
  const isAuxFanOn = auxFanSpeed > 0;

  const loadHistory = async () => {
    setIsLoadingHistory(true);
    try {
      const resp = await getHistoryTasks();
      const ids = resp.Data?.Data?.HistoryData || [];
      setHistoryTasks(ids);
    } catch (e) {
      setHistoryTasks([]);
    } finally {
      setIsLoadingHistory(false);
    }
  };

  const handleSelectTask = async (taskId: string) => {
    setSelectedTask(taskId);
    setTaskDetails(null);
    try {
      const resp = await getTaskDetails([taskId]);
      setTaskDetails(resp.Data?.Data?.HistoryDetailList?.[0] || null);
    } catch (e) {
      setTaskDetails(null);
    }
  };

  // Add state for collapsible
  const [isAdvancedOpen, setIsAdvancedOpen] = useState(false);

  return (
    <div className="min-h-screen bg-background text-foreground p-4 transition-all duration-300 theme-transition">
      {/* Header */}
      <div className="mb-6 gradient-bg rounded-xl p-6 border border-border/50 animate-slide-up">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-3xl font-bold bg-gradient-to-r from-primary to-orange-400 bg-clip-text text-transparent">
            Elegoo Centauri Carbon
          </h1>
          <div className="flex items-center gap-4">
            <Badge
              variant={connectionStatus.variant}
              className={`flex items-center gap-2 transition-all duration-300 ${
                isConnected ? "animate-glow" : "animate-pulse"
              }`}
            >
              <connectionStatus.icon className="w-4 h-4" />
              {connectionStatus.text}
            </Badge>
            <Badge variant="secondary" className="bg-primary/20 text-primary border-primary/30 animate-pulse-slow">
              <Activity className="w-4 h-4 mr-1" />
              {printerStatusText}
            </Badge>
          </div>
        </div>

        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4 flex-wrap">
            <div className="flex items-center gap-2">
              <Label htmlFor="ip-address" className="text-sm font-medium text-muted-foreground">
                IP:
              </Label>
              <div className="relative">
                <Input
                  id="ip-address"
                  value={ipAddress}
                  onChange={(e) => {
                    const newIP = e.target.value
                    setIpAddress(newIP)
                    localStorage.setItem('printerIP', newIP)
                  }}
                  className="w-40 bg-input border-border transition-all duration-200 focus:border-primary focus:ring-primary/20"
                  disabled={isConnected}
                />
                {ipLoadedFromCache && !isConnected && (
                  <div className="absolute -top-2 -right-2 flex items-center gap-1">
                    <Badge
                      variant="outline"
                      className="text-xs bg-green-500/10 border-green-500/30 text-green-600"
                    >
                      Cached
                    </Badge>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={clearCachedIP}
                      className="h-4 w-4 p-0 text-red-500 hover:text-red-700 hover:bg-red-50"
                      title="Clear cached settings"
                    >
                      ×
                    </Button>
                  </div>
                )}
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Label htmlFor="ws-port" className="text-sm font-medium text-muted-foreground">
                WS Port:
              </Label>
              <Input
                id="ws-port"
                type="number"
                value={wsPort}
                onChange={(e) => {
                  const newPort = e.target.value
                  setWsPort(newPort)
                  localStorage.setItem('printerWsPort', newPort)
                }}
                className="w-20 bg-input border-border transition-all duration-200 focus:border-primary focus:ring-primary/20"
                disabled={isConnected}
              />
            </div>
            <div className="flex items-center gap-2">
              <Label htmlFor="video-port" className="text-sm font-medium text-muted-foreground">
                Video Port:
              </Label>
              <Input
                id="video-port"
                type="number"
                value={videoPort}
                onChange={(e) => {
                  const newPort = e.target.value
                  setVideoPort(newPort)
                  localStorage.setItem('printerVideoPort', newPort)
                }}
                className="w-20 bg-input border-border transition-all duration-200 focus:border-primary focus:ring-primary/20"
                disabled={isConnected}
              />
            </div>
            {isConnected ? (
              <Button
                size="sm"
                variant="outline"
                onClick={handleDisconnect}
                className="border-red-500/30 hover:bg-red-500/10 transition-all duration-200 hover:scale-105 active:scale-95 bg-transparent"
              >
                <XCircle className="w-4 h-4 mr-2" />
                Disconnect
              </Button>
            ) : (
              <div className="flex items-center gap-2">
                <Button
                  size="sm"
                  onClick={handleConnect}
                  disabled={isConnecting}
                  className="bg-primary hover:bg-primary/90 transition-all duration-200 hover:scale-105 active:scale-95"
                >
                  <Settings className="w-4 h-4 mr-2" />
                  {isConnecting ? "Connecting..." : "Connect"}
                </Button>
                <Dialog open={showDiscoveryDialog} onOpenChange={setShowDiscoveryDialog}>
                  <DialogTrigger asChild>
                    <Button
                      size="sm"
                      variant="outline"
                      className="border-blue-500/30 hover:bg-blue-500/10 transition-all duration-200 hover:scale-105 active:scale-95"
                    >
                      <Wifi className="w-4 h-4 mr-2" />
                      Discover
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-2xl">
                    <DialogHeader>
                      <DialogTitle className="flex items-center gap-2">
                        <Wifi className="w-5 h-5" />
                        Printer Discovery
                      </DialogTitle>
                    </DialogHeader>
                    <PrinterDiscovery
                      onPrinterSelected={handlePrinterDiscovered}
                      onManualConnect={handleManualConnect}
                    />
                  </DialogContent>
                </Dialog>
              </div>
            )}
          </div>
          <div className="flex items-center gap-3">
            {!isConnected && (
              <Badge variant="outline" className="text-xs">
                <Wifi className="w-3 h-3 mr-1" />
                Click "Discover" to find printers
              </Badge>
            )}
            <ColorPicker />
          </div>
        </div>
      </div>

      {/* Recently Discovered Printers */}
      {!isConnected && discoveredPrinters.length > 0 && (
        <div className="mb-6 p-4 bg-secondary/20 rounded-lg border border-border/50">
          <h3 className="text-sm font-medium mb-3 flex items-center gap-2">
            <Wifi className="w-4 h-4" />
            Recently Discovered Printers
          </h3>
          <div className="flex flex-wrap gap-2">
            {discoveredPrinters.map((printer, index) => (
              <Button
                key={printer.id || index}
                size="sm"
                variant="outline"
                              onClick={() => {
                const newIP = printer.data.MainboardIP
                setIpAddress(newIP)
                // Save IP to localStorage
                localStorage.setItem('printerIP', newIP)
                toast({
                  title: "Printer Selected",
                  description: `Ready to connect to ${printer.data.Name}`,
                })
              }}
                className="text-xs"
              >
                <Wifi className="w-3 h-3 mr-1" />
                {printer.data.Name} ({printer.data.MainboardIP})
              </Button>
            ))}
          </div>
        </div>
      )}

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Print Files */}
        <StatusCard
          title="Print Files"
          icon={<FileText className="w-5 h-5" />}
          status={isConnected ? "online" : "offline"}
        >
          <PrintFilesTab
            {...{
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
              loadFileList,
              filePath,
              setFilePath,
              fileEntries,
              setFileEntries,
              selectedFiles,
              setSelectedFiles,
              selectedFolders,
              setSelectedFolders,
              isLoadingFiles,
              setIsLoadingFiles,
              historyTasks,
              setHistoryTasks,
              selectedTask,
              setSelectedTask,
              taskDetails,
              setTaskDetails,
              isLoadingHistory,
              setIsLoadingHistory,
              isTimeLapseOn,
              setIsTimeLapseOn,
              printerName,
              setPrinterName,
              terminateUuid,
              setTerminateUuid,
              terminateFile,
              setTerminateFile,
              advancedMessage,
              setAdvancedMessage,
              uploadProgress,
              setUploadProgress,
              fileInputRef,
              handlePrintControl,
              handleTemperatureChange,
              handleFanSpeedChange,
              handleLightingToggle,
              handleSpeedProfileChange,
              handleAxisMovement,
              handleHoming,
              handleVideoStream,
              handleTimeLapseToggle,
              handleChangePrinterName,
              handleStopMaterialFeed,
              handleSkipPreheat,
              handleTerminateTransfer,
              selectedStepSize,
              setSelectedStepSize,
              nozzleInput,
              setNozzleInput,
              bedInput,
              setBedInput,
              modelFanSpeed,
              auxFanSpeed,
              boxFanSpeed,
              isModelFanOn,
              isAuxFanOn,
              loadHistory,
              handleSelectTask,
              handleSelectFile,
              handleSelectFolder,
              handleDeleteSelected,
              handleSwitchStorage,
              handleFileUpload,
              handleEnterFolder,
              handleBack,
              isAdvancedOpen,
              setIsAdvancedOpen,
              isPrintInProgress,
            }}
          />
        </StatusCard>

        {/* Camera Control */}
        <StatusCard
          title="Camera Feed"
          icon={<Camera className="w-5 h-5" />}
          status={isConnected ? "online" : "offline"}
        >
          <div className="aspect-video bg-secondary/30 rounded-lg mb-4 flex items-center justify-center border border-border/30 relative overflow-hidden">
            {debugVideoUrl && !cameraError && (
              <img
                src={debugVideoUrl}
                alt="Debug Camera Feed"
                className="w-full h-full object-cover rounded-lg"
                onError={(e) => { e.currentTarget.style.display = 'none'; setCameraError(true); }}
              />
            )}
            {cameraError && (
              <div className="flex flex-col items-center justify-center w-full h-full">
                <Camera className="w-12 h-12 text-primary/50 animate-pulse-slow" />
                <span className="text-xs text-muted-foreground mt-2">Camera unavailable.</span>
                <div className="text-xs text-red-500 text-center mt-2">
                  Could not load camera feed.<br />
                  Make sure the printer is on, the camera is connected, and the stream is available at:<br />
                  <span className="font-mono break-all">{debugVideoUrl || 'Not connected'}</span>
                </div>
              </div>
            )}
          </div>
          <div className="text-xs text-muted-foreground text-center break-all">
            Camera URL: <span className="font-mono">{debugVideoUrl || 'Not connected'}</span>
          </div>
        </StatusCard>

        {/* Current Print Status */}
        <StatusCard
          title="Current Print"
          icon={<Activity className="w-5 h-5" />}
          status={isPrintInProgress ? "online" : "offline"}
        >
          <div className="space-y-4">
            <div>
              <p className="text-sm font-medium text-foreground">{currentPrintFile}</p>
              {status?.PrintInfo && (
                <p className="text-xs text-muted-foreground">
                  Layer {status.PrintInfo.CurrentLayer} of {status.PrintInfo.TotalLayer}
                </p>
              )}
            </div>
            <AnimatedProgress value={printProgress} showPercentage />
            <div className="flex gap-2">
              {/* Show Pause only when progress bar is updating and not paused */}
              {(printProgress > 0 && printProgress < 100 && !isPrintPaused) && (
                <Button
                  size="sm"
                  className="flex-1 bg-primary hover:bg-primary/90 transition-all duration-200 hover:scale-105 active:scale-95"
                  onClick={() => handlePrintControl("pause")}
                  disabled={!isConnected}
                >
                  <Pause className="w-4 h-4 mr-2" />
                  Pause
                </Button>
              )}
              {/* Show Resume only when progress bar is updating and paused */}
              {(printProgress > 0 && printProgress < 100 && isPrintPaused) && (
                <Button
                  size="sm"
                  className="flex-1 bg-primary hover:bg-primary/90 transition-all duration-200 hover:scale-105 active:scale-95"
                  onClick={() => handlePrintControl("continue")}
                  disabled={!isConnected}
                >
                  <Play className="w-4 h-4 mr-2" />
                  Resume
                </Button>
              )}
              {/* Always show Stop when a print is in progress */}
              {isPrintInProgress && (
                <Button
                  size="sm"
                  variant="destructive"
                  className="flex-1 transition-all duration-200 hover:scale-105 active:scale-95"
                  onClick={() => handlePrintControl("stop")}
                  disabled={!isConnected}
                >
                  <Square className="w-4 h-4 mr-2" />
                  Stop
                </Button>
              )}
            </div>
          </div>
        </StatusCard>

        {/* Print Speed Control */}
        <StatusCard title="Print Speed" icon={<Zap className="w-5 h-5" />}>
          <div className="grid grid-cols-2 gap-3">
            {speedProfiles.map((profile) => (
              <Button
                key={profile.id}
                variant={printSpeed === profile.id ? "default" : "outline"}
                size="sm"
                onClick={() => handleSpeedProfileChange(profile.id)}
                disabled={!isConnected || !(printProgress > 0 && printProgress < 100)}
                className={`flex flex-col h-auto p-4 transition-all duration-300 hover:scale-105 active:scale-95 ${
                  printSpeed === profile.id
                    ? "bg-primary hover:bg-primary/90 animate-glow"
                    : "border-primary/30 hover:bg-primary/10"
                }`}
              >
                <span className="font-medium">{profile.name}</span>
                <span className="text-xs opacity-70">{profile.speed}</span>
                <div className={`w-full h-1 rounded-full mt-2 ${profile.color} opacity-60`}></div>
              </Button>
            ))}
          </div>
        </StatusCard>

        {/* Temperature Control */}
        <StatusCard
          title="Temperature"
          icon={<Thermometer className="w-5 h-5" />}
          status={isConnected ? "online" : "offline"}
        >
          <div className="space-y-6">
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Nozzle: {nozzleInput}°C</span>
                <span className="text-muted-foreground">Current: {status?.TempOfNozzle || 0}°C</span>
              </div>
              <div className="flex items-center gap-2">
                <Button size="sm" onClick={() => setNozzleInput(Math.max(0, nozzleInput - 5))} disabled={!isConnected}>-</Button>
                <input
                  type="number"
                  value={nozzleInput}
                  min={0}
                  max={300}
                  step={1}
                  onChange={e => setNozzleInput(Number(e.target.value))}
                  className="w-16 px-2 py-1 border rounded text-center text-black"
                  disabled={!isConnected}
                />
                <Button size="sm" onClick={() => setNozzleInput(Math.min(300, nozzleInput + 5))} disabled={!isConnected}>+</Button>
                <Button size="sm" onClick={() => handleTemperatureChange("nozzle", [nozzleInput])} disabled={!isConnected}>Set</Button>
              </div>
            </div>
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Bed: {bedInput}°C</span>
                <span className="text-muted-foreground">Current: {status?.TempOfHotbed || 0}°C</span>
              </div>
              <div className="flex items-center gap-2">
                <Button size="sm" onClick={() => setBedInput(Math.max(0, bedInput - 5))} disabled={!isConnected}>-</Button>
                <input
                  type="number"
                  value={bedInput}
                  min={0}
                  max={120}
                  step={1}
                  onChange={e => setBedInput(Number(e.target.value))}
                  className="w-16 px-2 py-1 border rounded text-center text-black"
                  disabled={!isConnected}
                />
                <Button size="sm" onClick={() => setBedInput(Math.min(120, bedInput + 5))} disabled={!isConnected}>+</Button>
                <Button size="sm" onClick={() => handleTemperatureChange("bed", [bedInput])} disabled={!isConnected}>Set</Button>
              </div>
            </div>
          </div>
        </StatusCard>

        {/* Fan & Light Control */}
        <StatusCard title="Fan & Lights" icon={<Fan className="w-5 h-5" />}>
          <div className="space-y-6">
            {/* Part Cooling Fan (ModelFan) */}
            <div className="flex items-center justify-between p-3 bg-secondary/30 rounded-lg border border-border/30">
              <Label className="flex items-center gap-2 text-foreground">
                <Fan className={`w-4 h-4 transition-all duration-300 ${isModelFanOn ? "text-primary animate-spin" : "text-muted-foreground"}`} />
                Part Cooling Fan
              </Label>
              <Switch
                checked={isModelFanOn}
                onCheckedChange={async (checked) => {
                  try {
                    await setFanSpeeds({ ModelFan: checked ? 100 : 0, AuxiliaryFan: auxFanSpeed });
                  } catch (error) {
                    console.error("ModelFan switch failed:", error);
                  }
                }}
                className="data-[state=checked]:bg-primary"
                disabled={!isConnected}
              />
            </div>
            {isModelFanOn && (
              <AnimatedSlider
                label="Part Cooling Fan Speed"
                value={[modelFanSpeed]}
                onValueChange={async (value) => {
                  try {
                    await setFanSpeeds({ ModelFan: value[0], AuxiliaryFan: auxFanSpeed });
                  } catch (error) {
                    console.error("ModelFan speed change failed:", error);
                  }
                }}
                max={100}
                min={0}
                step={5}
                unit="%"
                icon={<Fan className="w-4 h-4 text-primary animate-spin" />}
              />
            )}
            {/* Exhaust Fan (AuxiliaryFan) */}
            <div className="flex items-center justify-between p-3 bg-secondary/30 rounded-lg border border-border/30">
              <Label className="flex items-center gap-2 text-foreground">
                <Fan className={`w-4 h-4 transition-all duration-300 ${isAuxFanOn ? "text-primary animate-spin" : "text-muted-foreground"}`} />
                Exhaust Fan
              </Label>
              <Switch
                checked={isAuxFanOn}
                onCheckedChange={async (checked) => {
                  try {
                    await setFanSpeeds({ ModelFan: modelFanSpeed, AuxiliaryFan: checked ? 100 : 0 });
                  } catch (error) {
                    console.error("AuxFan switch failed:", error);
                  }
                }}
                className="data-[state=checked]:bg-primary"
                disabled={!isConnected}
              />
            </div>
            {isAuxFanOn && (
              <AnimatedSlider
                label="Exhaust Fan Speed"
                value={[auxFanSpeed]}
                onValueChange={async (value) => {
                  try {
                    await setFanSpeeds({ ModelFan: modelFanSpeed, AuxiliaryFan: value[0] });
                  } catch (error) {
                    console.error("AuxFan speed change failed:", error);
                  }
                }}
                max={100}
                min={0}
                step={5}
                unit="%"
                icon={<Fan className="w-4 h-4 text-primary animate-spin" />}
              />
            )}
            {/* LED Lights */}
            <div className="flex items-center justify-between p-3 bg-secondary/30 rounded-lg border border-border/30">
              <Label className="flex items-center gap-2 text-foreground">
                <Lightbulb
                  className={`w-4 h-4 transition-all duration-300 ${isLightsOn ? "text-yellow-400 animate-pulse" : "text-muted-foreground"}`}
                />
                LED Lights
              </Label>
              <Switch
                checked={isLightsOn}
                onCheckedChange={handleLightingToggle}
                className="data-[state=checked]:bg-primary"
                disabled={!isConnected}
              />
            </div>
            {/* Remove light brightness slider */}
          </div>
        </StatusCard>

        {/* Stepper Control */}
        <Card className="lg:col-span-2 gradient-bg border-border/50 transition-all duration-300 hover:border-primary/50 hover:shadow-lg hover:shadow-primary/10 animate-slide-up status-indicator">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-foreground">
              <Cog className="w-5 h-5 text-primary" />
              Stepper Control
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="movement" className="w-full">
              <TabsList className="grid w-full grid-cols-3 bg-secondary/50">
                <TabsTrigger
                  value="movement"
                  className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
                >
                  Movement
                </TabsTrigger>
                <TabsTrigger
                  value="homing"
                  className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
                >
                  Homing
                </TabsTrigger>
              </TabsList>

              <TabsContent value="movement" className="space-y-6 mt-6">
                <div className="grid grid-cols-3 gap-6">
                  <div className="space-y-3">
                    <Label className="text-sm font-medium text-muted-foreground">X/Y Movement</Label>
                    <div className="grid grid-cols-3 gap-2">
                      <div></div>
                      <Button
                        size="sm"
                        variant="outline"
                        className="border-primary/30 hover:bg-primary/10 transition-all duration-200 hover:scale-110 active:scale-95 bg-transparent"
                        onClick={() => handleAxisMovement("Y", 1)}
                        disabled={!isConnected}
                      >
                        <ArrowUp className="w-4 h-4" />
                      </Button>
                      <div></div>
                      <Button
                        size="sm"
                        variant="outline"
                        className="border-primary/30 hover:bg-primary/10 transition-all duration-200 hover:scale-110 active:scale-95 bg-transparent"
                        onClick={() => handleAxisMovement("X", -1)}
                        disabled={!isConnected}
                      >
                        <ArrowLeft className="w-4 h-4" />
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        className="border-primary/30 hover:bg-primary/10 transition-all duration-200 hover:scale-110 active:scale-95 bg-transparent"
                        disabled={!isConnected}
                      >
                        <Move className="w-4 h-4" />
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        className="border-primary/30 hover:bg-primary/10 transition-all duration-200 hover:scale-110 active:scale-95 bg-transparent"
                        onClick={() => handleAxisMovement("X", 1)}
                        disabled={!isConnected}
                      >
                        <ArrowRight className="w-4 h-4" />
                      </Button>
                      <div></div>
                      <Button
                        size="sm"
                        variant="outline"
                        className="border-primary/30 hover:bg-primary/10 transition-all duration-200 hover:scale-110 active:scale-95 bg-transparent"
                        onClick={() => handleAxisMovement("Y", -1)}
                        disabled={!isConnected}
                      >
                        <ArrowDown className="w-4 h-4" />
                      </Button>
                      <div></div>
                    </div>
                  </div>

                  <div className="space-y-3">
                    <Label className="text-sm font-medium text-muted-foreground">Z Movement</Label>
                    <div className="flex flex-col gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        className="border-primary/30 hover:bg-primary/10 transition-all duration-200 hover:scale-110 active:scale-95 bg-transparent"
                        onClick={() => handleAxisMovement("Z", 1)}
                        disabled={!isConnected}
                      >
                        Z+
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        className="border-primary/30 hover:bg-primary/10 transition-all duration-200 hover:scale-110 active:scale-95 bg-transparent"
                        onClick={() => handleAxisMovement("Z", -1)}
                        disabled={!isConnected}
                      >
                        Z-
                      </Button>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-4 p-4 bg-secondary/30 rounded-lg border border-border/30">
                  <Label className="text-sm font-medium text-muted-foreground">Step Size:</Label>
                  <div className="flex gap-2">
                    {[0.1, 1, 10, 100].map((step) => (
                      <Button
                        key={step}
                        size="sm"
                        variant={selectedStepSize === step ? "default" : "outline"}
                        className={`transition-all duration-200 hover:scale-110 active:scale-95 ${
                          selectedStepSize === step
                            ? "bg-primary hover:bg-primary/90"
                            : "border-primary/30 hover:bg-primary/10 bg-transparent"
                        }`}
                        onClick={() => setSelectedStepSize(step)}
                      >
                        {step}mm
                      </Button>
                    ))}
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="homing" className="space-y-4 mt-6">
                <div className="grid grid-cols-2 gap-4">
                  <Button
                    variant="outline"
                    className="border-primary/30 hover:bg-primary/10 transition-all duration-200 hover:scale-105 active:scale-95 bg-transparent"
                    onClick={() => handleHoming("X")}
                    disabled={!isConnected}
                  >
                    <Home className="w-4 h-4 mr-2" />
                    Home X
                  </Button>
                  <Button
                    variant="outline"
                    className="border-primary/30 hover:bg-primary/10 transition-all duration-200 hover:scale-105 active:scale-95 bg-transparent"
                    onClick={() => handleHoming("Y")}
                    disabled={!isConnected}
                  >
                    <Home className="w-4 h-4 mr-2" />
                    Home Y
                  </Button>
                  <Button
                    variant="outline"
                    className="border-primary/30 hover:bg-primary/10 transition-all duration-200 hover:scale-105 active:scale-95 bg-transparent"
                    onClick={() => handleHoming("Z")}
                    disabled={!isConnected}
                  >
                    <Home className="w-4 h-4 mr-2" />
                    Home Z
                  </Button>
                  <Button
                    className="bg-primary hover:bg-primary/90 transition-all duration-200 hover:scale-105 active:scale-95"
                    onClick={() => handleHoming()}
                    disabled={!isConnected}
                  >
                    <Home className="w-4 h-4 mr-2" />
                    Home All
                  </Button>
                </div>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>

        {/* System Status */}
        <StatusCard
          title="System Status"
          icon={<Activity className="w-5 h-5" />}
          status={isConnected ? "online" : "offline"}
        >
          <div className="space-y-4">
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-sm flex items-center gap-2">
                  <Cpu className="w-4 h-4 text-primary" />
                  Nozzle Temp:
                </span>
                <span className="text-sm font-medium text-primary">{status?.TempOfNozzle || 0}°C</span>
              </div>
              <AnimatedProgress value={Math.min(((status?.TempOfNozzle || 0) / 250) * 100, 100)} />
            </div>

            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-sm flex items-center gap-2">
                  <MemoryStick className="w-4 h-4 text-blue-400" />
                  Bed Temp:
                </span>
                <span className="text-sm font-medium text-blue-400">{status?.TempOfHotbed || 0}°C</span>
              </div>
              <AnimatedProgress value={Math.min(((status?.TempOfHotbed || 0) / 100) * 100, 100)} />
            </div>

            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-sm flex items-center gap-2">
                  <HardDrive className="w-4 h-4 text-green-400" />
                  Storage:
                </span>
                <span className="text-sm font-medium text-green-400">
                  {attributes?.RemainingMemory
                    ? `${(attributes.RemainingMemory / 1024 / 1024 / 1024).toFixed(1)}GB`
                    : "Unknown"}
                </span>
              </div>
              <AnimatedProgress
                value={
                  attributes?.RemainingMemory
                    ? Math.max(0, 100 - (attributes.RemainingMemory / 1024 / 1024 / 1024 / 32) * 100)
                    : 0
                }
              />
            </div>

            <div className="pt-4 border-t border-border/30 space-y-1">
              <p className="text-xs text-muted-foreground">Firmware: {attributes?.FirmwareVersion || "Unknown"}</p>
              <p className="text-xs text-muted-foreground">Protocol: {attributes?.ProtocolVersion || "Unknown"}</p>
              <p className="text-xs text-primary animate-pulse-slow">{isConnected ? "Connected" : "Disconnected"}</p>
            </div>
          </div>
        </StatusCard>
      </div>
      {/* Advanced (Dev Only) */}
      <Collapsible open={isAdvancedOpen} onOpenChange={setIsAdvancedOpen} className="mt-12">
        <div className="flex items-center cursor-pointer select-none mb-2" onClick={() => setIsAdvancedOpen(v => !v)}>
          {isAdvancedOpen ? <ChevronDown className="w-5 h-5 mr-2 text-red-500" /> : <ChevronRight className="w-5 h-5 mr-2 text-red-500" />}
          <h2 className="text-lg font-bold text-red-500">Advanced (Dev Only)</h2>
        </div>
        {isAdvancedOpen && (
          <Card className="p-4 border-2 border-dashed border-red-500 bg-background/80">
            <Tabs defaultValue="files" className="w-full">
              <TabsList className="mb-4">
                {tabsConfig.map(tab => (
                  <TabsTrigger key={tab.id} value={tab.id}>{tab.label}</TabsTrigger>
                ))}
              </TabsList>
              {tabsConfig.map(tab => (
                <TabsContent key={tab.id} value={tab.id}>
                  <tab.component
                    {...{
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
                      loadFileList,
                      filePath,
                      setFilePath,
                      fileEntries,
                      setFileEntries,
                      selectedFiles,
                      setSelectedFiles,
                      selectedFolders,
                      setSelectedFolders,
                      isLoadingFiles,
                      setIsLoadingFiles,
                      historyTasks,
                      setHistoryTasks,
                      selectedTask,
                      setSelectedTask,
                      taskDetails,
                      setTaskDetails,
                      isLoadingHistory,
                      setIsLoadingHistory,
                      isTimeLapseOn,
                      setIsTimeLapseOn,
                      printerName,
                      setPrinterName,
                      terminateUuid,
                      setTerminateUuid,
                      terminateFile,
                      setTerminateFile,
                      advancedMessage,
                      setAdvancedMessage,
                      uploadProgress,
                      setUploadProgress,
                      fileInputRef,
                      handlePrintControl,
                      handleTemperatureChange,
                      handleFanSpeedChange,
                      handleLightingToggle,
                      handleSpeedProfileChange,
                      handleAxisMovement,
                      handleHoming,
                      handleVideoStream,
                      handleTimeLapseToggle,
                      handleChangePrinterName,
                      handleStopMaterialFeed,
                      handleSkipPreheat,
                      handleTerminateTransfer,
                      selectedStepSize,
                      setSelectedStepSize,
                      nozzleInput,
                      setNozzleInput,
                      bedInput,
                      setBedInput,
                      modelFanSpeed,
                      auxFanSpeed,
                      boxFanSpeed,
                      isModelFanOn,
                      isAuxFanOn,
                      loadHistory,
                      handleSelectTask,
                      handleSelectFile,
                      handleSelectFolder,
                      handleDeleteSelected,
                      handleSwitchStorage,
                      handleFileUpload,
                      handleEnterFolder,
                      handleBack,
                      isAdvancedOpen,
                      setIsAdvancedOpen,
                      isPrintInProgress,
                    }}
                  />
                </TabsContent>
              ))}
            </Tabs>
          </Card>
        )}
      </Collapsible>
      {/* Footer with protocol credit and quote */}
      <div className="mt-12 text-center text-xs text-muted-foreground opacity-80">
        <div>Protocol put together by <span className="font-semibold">voidsshadows</span> on Discord.</div>
        <div className="italic mt-2">“Life moves pretty fast. If you don't stop and look around once in a while, you could miss it.”<br />— Ferris Bueller's Day Off</div>
      </div>
    </div>
  )
}
