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
  } = usePrinter()

  const [ipAddress, setIpAddress] = useState("192.168.1.100")
  const [isConnecting, setIsConnecting] = useState(false)
  const [printSpeed, setPrintSpeedLocal] = useState("balanced")
  const [bedTemp, setBedTemp] = useState([60])
  const [nozzleTemp, setNozzleTemp] = useState([200])
  const [fanSpeed, setFanSpeed] = useState([75])
  const [lightBrightness, setLightBrightness] = useState([80])
  const [isLightsOn, setIsLightsOn] = useState(true)
  const [printFiles, setPrintFiles] = useState<any[]>([])
  const [selectedStepSize, setSelectedStepSize] = useState(1)

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

  // Load file list when connected
  useEffect(() => {
    if (isConnected) {
      loadFileList()
    }
  }, [isConnected])

  const handleConnect = async () => {
    setIsConnecting(true)
    try {
      await connect(ipAddress)
    } catch (error) {
      console.error("Connection failed:", error)
    } finally {
      setIsConnecting(false)
    }
  }

  const handleDisconnect = () => {
    disconnect()
  }

  const loadFileList = async () => {
    try {
      const response = await getFileList("/local/")
      if (response.Data?.Data?.FileList) {
        setPrintFiles(response.Data.Data.FileList.filter((file: any) => file.type === 1)) // Only files
      }
    } catch (error) {
      console.error("Failed to load file list:", error)
    }
  }

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    try {
      const arrayBuffer = await file.arrayBuffer()
      await uploadFile(file.name, arrayBuffer)
      loadFileList() // Refresh file list
    } catch (error) {
      console.error("File upload failed:", error)
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

  // Get current status information
  const currentStatus = status?.CurrentStatus?.[0] || 0
  const printerStatusText = SDCPClient.getStatusText(currentStatus)
  const printInfoStatus = status?.PrintInfo?.Status;
  const isPrintActive = printInfoStatus === 1; // Printing
  const isPrintPaused = printInfoStatus === 6; // Paused
  const isPrintPausing = printInfoStatus === 5; // Pausing
  const isPrintStopping = printInfoStatus === 7; // Stopping
  const isPrintStopped = printInfoStatus === 8; // Stopped
  const isPrintComplete = printInfoStatus === 9; // Complete
  const isPrintingOrPaused = isPrintActive || isPrintPaused;
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
  useEffect(() => {
    if (isConnected) setConnectedIp(ipAddress);
  }, [isConnected, ipAddress]);
  const debugVideoUrl = connectedIp ? `http://${connectedIp}:3031/video` : null;
  console.log('Camera debug:', connectedIp, debugVideoUrl);

  // Fan states for individual fans
  const modelFanSpeed = status?.CurrentFanSpeed?.ModelFan ?? 0;
  const auxFanSpeed = status?.CurrentFanSpeed?.AuxiliaryFan ?? 0;
  const boxFanSpeed = status?.CurrentFanSpeed?.BoxFan ?? 0;
  const isModelFanOn = modelFanSpeed > 0;
  const isAuxFanOn = auxFanSpeed > 0;

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
          <div className="flex items-center gap-4">
            <Label htmlFor="ip-address" className="text-sm font-medium text-muted-foreground">
              IP Address:
            </Label>
            <Input
              id="ip-address"
              value={ipAddress}
              onChange={(e) => setIpAddress(e.target.value)}
              className="w-48 bg-input border-border transition-all duration-200 focus:border-primary focus:ring-primary/20"
              disabled={isConnected}
            />
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
              <Button
                size="sm"
                onClick={handleConnect}
                disabled={isConnecting}
                className="bg-primary hover:bg-primary/90 transition-all duration-200 hover:scale-105 active:scale-95"
              >
                <Settings className="w-4 h-4 mr-2" />
                {isConnecting ? "Connecting..." : "Connect"}
              </Button>
            )}
          </div>
          <div className="flex items-center gap-3">
            <ColorPicker />
          </div>
        </div>
      </div>

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Print Files */}
        <StatusCard
          title="Print Files"
          icon={<FileText className="w-5 h-5" />}
          status={isConnected ? "online" : "offline"}
        >
          <div className="space-y-3 mb-4">
            {printFiles.length > 0 ? (
              printFiles.slice(0, 4).map((file, index) => (
                <div
                  key={index}
                  className="flex items-center justify-between p-3 bg-secondary/50 rounded-lg border border-border/30 transition-all duration-200 hover:bg-secondary/70 hover:border-primary/30 animate-scale-in"
                  style={{ animationDelay: `${index * 0.1}s` }}
                >
                  <div>
                    <p className="text-sm font-medium text-foreground">{file.name}</p>
                    <p className="text-xs text-muted-foreground">{(file.usedSize / 1024 / 1024).toFixed(1)} MB</p>
                  </div>
                  <Button
                    size="sm"
                    variant="ghost"
                    className="hover:bg-primary/20 hover:text-primary transition-all duration-200 hover:scale-110"
                    onClick={() => handlePrintControl("start", file.name)}
                    disabled={!isConnected || isPrintingOrPaused}
                  >
                    <Play className="w-4 h-4" />
                  </Button>
                </div>
              ))
            ) : (
              <div className="text-center text-muted-foreground py-4">
                {isConnected ? "No files found" : "Connect to view files"}
              </div>
            )}
          </div>
          <div className="flex gap-2">
            <Button
              size="sm"
              className="flex-1 bg-primary hover:bg-primary/90 transition-all duration-200 hover:scale-105 active:scale-95"
              disabled={!isConnected}
              onClick={() => fileInputRef.current?.click()}
            >
              <Upload className="w-4 h-4 mr-2" />
              Upload
              <input
                ref={fileInputRef}
                type="file"
                accept=".gcode"
                onChange={handleFileUpload}
                className="hidden"
              />
            </Button>
            <Button
              size="sm"
              variant="outline"
              className="flex-1 border-primary/30 hover:bg-primary/10 transition-all duration-200 hover:scale-105 active:scale-95 bg-transparent"
              onClick={loadFileList}
              disabled={!isConnected}
            >
              <Download className="w-4 h-4 mr-2" />
              Refresh
            </Button>
          </div>
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
          status={isPrintingOrPaused ? "online" : "offline"}
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
              {isPrintActive && (
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
              {isPrintPaused && (
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
                disabled={!isConnected || !isPrintingOrPaused}
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
      {/* Footer with protocol credit and quote */}
      <div className="mt-12 text-center text-xs text-muted-foreground opacity-80">
        <div>Protocol put together by <span className="font-semibold">voidsshadows</span> on Discord.</div>
        <div className="italic mt-2">“Life moves pretty fast. If you don't stop and look around once in a while, you could miss it.”<br />— Ferris Bueller's Day Off</div>
      </div>
    </div>
  )
}
