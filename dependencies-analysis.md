# CarbonControl Dependencies Analysis

## Overview
CarbonControl is a **self-contained web application** that communicates directly with the Elegoo Centauri Carbon 3D printer. It does **NOT** require any external services, backends, or additional software beyond the printer itself.

## Communication Architecture

### 1. **Direct WebSocket Communication** 🔌
- **Protocol**: SDCP (Smart Device Control Protocol) via WebSocket
- **Port**: 3030 (printer's built-in WebSocket server)
- **Connection**: Direct connection to printer IP address
- **No External Dependencies**: Uses browser's native WebSocket API

```typescript
// Multiple WebSocket endpoints tried automatically:
const wsUrls = [
  `ws://${printerIP}:3030/websocket`,
  `ws://${printerIP}:3030/ws`, 
  `ws://${printerIP}:3030/`,
  `ws://${printerIP}:3030/api/websocket`,
  `ws://${printerIP}:3030/sdcp`,
]
```

### 2. **File Upload via HTTP Proxy** 📁
- **Method**: Chunked file upload with MD5 verification
- **Proxy**: Next.js API route (`/api/proxy-upload`) forwards to printer
- **Printer Endpoint**: `http://${printerIP}:3030/uploadFile/upload`
- **No External Dependencies**: Uses Node.js built-in modules

## What CarbonControl Relies On

### ✅ **Self-Contained Components**

#### Frontend (Browser)
- **WebSocket Client**: Native browser WebSocket API
- **File Upload**: Browser's FormData and fetch APIs
- **UI Framework**: Next.js + React + TypeScript
- **Styling**: Tailwind CSS + Radix UI components

#### Backend (Next.js API Routes)
- **File Upload Proxy**: `formidable` + `node-fetch` + `form-data`
- **MD5 Hashing**: `spark-md5` for file integrity
- **UUID Generation**: `uuid` for request tracking

### ✅ **Printer Requirements**
- **Elegoo Centauri Carbon** with SDCP protocol support
- **Network Connectivity**: Printer must be on same network
- **WebSocket Server**: Running on port 3030
- **HTTP Upload Endpoint**: Available on port 3030
- **Camera Stream**: MJPEG stream on port 3031 (optional)

### ❌ **What It Does NOT Need**
- **No External Backend**: No separate server required
- **No Database**: All state managed in browser
- **No Cloud Services**: No external APIs or services
- **No Authentication**: Assumes trusted local network
- **No UDP Discovery**: Manual IP entry (limitation of browser security)

## Dependencies Breakdown

### Core Dependencies (for printer communication)
```json
{
  "uuid": "latest",           // Request tracking
  "spark-md5": "^3.0.2",      // File MD5 hashing
  "formidable": "^3.5.4",     // File upload parsing
  "node-fetch": "^3.3.2",     // HTTP requests to printer
  "form-data": "^4.0.4"       // Multipart form data
}
```

### UI Dependencies (not related to printer communication)
```json
{
  "next": "14.2.16",          // React framework
  "react": "^18",             // UI library
  "@radix-ui/*": "latest",    // UI components
  "tailwindcss": "^3.4.17",   // Styling
  "lucide-react": "^0.454.0"  // Icons
}
```

## Communication Flow

### 1. **Printer Commands** (WebSocket)
```
Browser → WebSocket → Printer (port 3030)
```
- Status requests
- Print control (start/pause/stop)
- Temperature/fan control
- Movement commands
- File operations

### 2. **File Upload** (HTTP via Proxy)
```
Browser → Next.js API → Printer (port 3030)
```
- Chunked file upload
- MD5 verification
- Progress tracking

### 3. **Camera Stream** (Direct HTTP)
```
Browser → Direct HTTP → Printer (port 3031)
```
- MJPEG video stream
- No proxy needed

## Security Model

### **Local Network Only**
- Designed for trusted local networks
- No authentication required
- No encryption (WebSocket over HTTP)
- Manual IP entry (no auto-discovery)

### **Browser Limitations**
- Cannot perform UDP broadcast (device discovery)
- Cannot access low-level networking
- CORS restrictions apply
- Same-origin policy enforced

## Deployment Options

### **Development**
```bash
npm run dev  # Local development server
```

### **Production**
```bash
npm run build  # Static export possible
npm start      # Node.js server
```

### **Standalone**
- Can be deployed as static files
- Requires Node.js for file upload proxy
- No external dependencies beyond printer

## Conclusion

**CarbonControl is completely self-contained** and only relies on:

1. **The Elegoo Centauri Carbon printer** (with SDCP protocol)
2. **A web browser** (for the UI)
3. **Node.js** (for file upload proxy)
4. **Network connectivity** (between browser and printer)

It does **NOT** require:
- ❌ External APIs
- ❌ Cloud services  
- ❌ Databases
- ❌ Authentication servers
- ❌ Additional hardware
- ❌ Third-party services

This makes it a **standalone, portable solution** that can work in any environment where the printer is accessible on the local network. 