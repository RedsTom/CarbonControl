# CarbonControl Quick Start Guide

## 🚀 One-Liner Setup Scripts

I've created simple one-liner scripts that handle everything automatically. Just run one script and you're ready to go!

## 📋 Prerequisites

- **Node.js** (version 16 or higher)
- **Git** (to clone the repository)

## 🖥️ Windows Setup

### **Option 1: Double-click Setup**
1. Navigate to the `CarbonControl` folder
2. Double-click `setup-windows.bat`
3. Wait for the setup to complete
4. The UI will automatically open in your browser

### **Option 2: Command Line**
```cmd
cd CarbonControl
setup-windows.bat
```

## 🐧 Linux Setup

### **Option 1: Make Executable and Run**
```bash
cd CarbonControl
chmod +x setup-linux.sh
./setup-linux.sh
```

### **Option 2: Direct Execution**
```bash
cd CarbonControl
bash setup-linux.sh
```

## 🔧 Tina Linux Setup (Custom Port)

### **Default Port (3001)**
```bash
cd CarbonControl
chmod +x setup-tina-linux.sh
./setup-tina-linux.sh
```

### **Custom Port**
```bash
cd CarbonControl
chmod +x setup-tina-linux.sh
./setup-tina-linux.sh 8080  # Replace 8080 with your desired port
```

## 📱 What the Scripts Do

### **Windows Script (`setup-windows.bat`)**
1. ✅ Checks if Node.js is installed
2. ✅ Verifies project structure
3. ✅ Installs all dependencies (npm or pnpm)
4. ✅ Builds the project
5. ✅ Starts the development server
6. ✅ Opens browser automatically

### **Linux Script (`setup-linux.sh`)**
1. ✅ Checks if Node.js is installed
2. ✅ Verifies project structure
3. ✅ Installs all dependencies
4. ✅ Builds the project
5. ✅ Starts the development server

### **Tina Linux Script (`setup-tina-linux.sh`)**
1. ✅ Installs Node.js if needed
2. ✅ Verifies project structure
3. ✅ Installs all dependencies
4. ✅ Builds the project
5. ✅ Creates systemd service
6. ✅ Sets up production server
7. ✅ Enables and starts the service

## 🎯 After Setup

### **Development Mode (Windows/Linux)**
- **URL**: http://localhost:3000
- **Features**: Hot reload, development tools
- **Stop**: Press `Ctrl+C` in the terminal

### **Production Mode (Tina Linux)**
- **URL**: http://YOUR_IP:3001 (or custom port)
- **Features**: Production optimized, systemd service
- **Management**: Use systemctl commands

## 🔧 Manual Commands (If Needed)

### **Install Dependencies**
```bash
npm install
# or
pnpm install
```

### **Start Development Server**
```bash
npm run dev
```

### **Build for Production**
```bash
npm run build
```

### **Start Production Server**
```bash
npm start
```

## 🎉 Features Available

Once running, you'll have access to:

- **🔍 UDP Discovery** - Automatically find printers on your network
- **💾 IP Caching** - Remember printer IPs between sessions
- **🎮 Real-time Control** - Control printer temperature, fans, lights
- **📁 File Management** - Upload and manage print files
- **📹 Live Camera** - View printer camera feed
- **📊 Status Monitoring** - Real-time printer status
- **🎛️ Advanced Controls** - G-code, movement, homing

## 🚨 Troubleshooting

### **Node.js Not Found**
```bash
# Install Node.js from: https://nodejs.org/
# Or use package manager:
# Ubuntu/Debian: sudo apt install nodejs npm
# CentOS/RHEL: sudo yum install nodejs npm
```

### **Permission Denied (Linux)**
```bash
chmod +x setup-linux.sh
# or
sudo chmod +x setup-linux.sh
```

### **Port Already in Use**
```bash
# Kill process using port 3000
sudo lsof -ti:3000 | xargs kill -9
# Or use a different port in Tina Linux script
./setup-tina-linux.sh 3002
```

### **Build Errors**
```bash
# Clear cache and retry
rm -rf node_modules package-lock.json
npm install
npm run build
```

## 📞 Support

If you encounter issues:

1. **Check the console output** for error messages
2. **Verify Node.js version** (16+ required)
3. **Ensure you're in the CarbonControl directory**
4. **Check network connectivity** for dependency installation

## 🎯 Quick Commands Reference

| Action | Windows | Linux | Tina Linux |
|--------|---------|-------|------------|
| **Setup & Start** | `setup-windows.bat` | `./setup-linux.sh` | `./setup-tina-linux.sh` |
| **Custom Port** | N/A | N/A | `./setup-tina-linux.sh 8080` |
| **Stop Server** | `Ctrl+C` | `Ctrl+C` | `sudo systemctl stop carboncontrol` |
| **Restart** | Run script again | Run script again | `sudo systemctl restart carboncontrol` |
| **View Logs** | Console output | Console output | `sudo journalctl -u carboncontrol -f` |

That's it! Just run one script and you're ready to control your Elegoo Centauri Carbon printer! 🎯 