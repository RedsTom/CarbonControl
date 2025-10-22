# 🚀 CarbonControl

A modern, React + Next.js-based web interface for the **Elegoo Centauri Carbon** 3D printer.  
Built to replace or enhance the default WebUI using the SDCP WebSocket API — no firmware modification required.

---

## ✅ Features

- 🔌 Connect to the printer via manual IP entry (WebSocket)
- 📊 Real-time status display: temperatures, fan speeds, lighting, print progress, etc.
- 📁 Chunked G-code file upload with MD5, UUID, offset, and progress
- 📂 Retrieve and display onboard file list
- 🖨️ Full print control: start, pause, stop, continue
- 🚀 Set print speed percentage
- 🌬️ Control individual fan speeds (Model, Auxiliary, Box)
- 🎯 Move axes and perform homing
- 🎥 Display live camera stream via MJPEG URL
- 🛠️ Built-in handling of SDCP protocol quirks (e.g., `CurrenCoord`, `RelaseFilmState`)
- ⚠️ Basic console-based error handling
- 🔍 **Device discovery** via UDP broadcast (requires backend or native app)

---

## 🧪 Planned Features (TODO)


- 🗑️ File deletion (single + batch)
- 🕓 View **print history** and detailed task info (errors, thumbnails, timelapse links)
- 🎞️ Enable/disable **time-lapse recording**
- 💬 Display user-facing error and notification messages
- 💾 USB/external storage support + file browsing
- 📁 Folder navigation in file list
- 🖊️ Rename printer
- ❌ Cancel/terminate file transfers
- 📦 Material feeding and preheat skip controls
- 🧩 Full display of all extended SDCP fields (e.g. `CameraStatus`, `SupportFileType`, `Capabilities`)

---

## ⚠️ Limitations

Some functionality — such as **device discovery** — requires access to low-level networking (e.g., UDP broadcast), which is **not possible in browser-based JavaScript**. These features may require a companion backend or native app.

---

## 🐳 Docker Deployment

CarbonControl can be easily deployed using Docker for production environments.

### Quick Start with Docker

```bash
# Build the image
docker build -t carboncontrol:latest .

# Run the container
docker run -p 3000:3000 carboncontrol:latest
```

### Using Docker Compose

```bash
# Start the application
docker-compose up -d

# Stop the application
docker-compose down
```

For detailed Docker deployment instructions, configuration options, and troubleshooting, see **[DOCKER.md](DOCKER.md)**.

---

## 📄 License

MIT — free to use, modify, and contribute.  
**Not affiliated with Elegoo.**
