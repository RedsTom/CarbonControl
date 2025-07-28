# Tina Linux Integration: CarbonControl as a Service

## 🎯 Overview
Run CarbonControl as a systemd service on Tina Linux, accessible on a custom port (e.g., 8080 instead of 3000).

## 📋 Prerequisites

### **Tina Linux Requirements**
- Node.js 18+ installed
- npm or pnpm available
- systemd support
- Network access to printer (ports 3030, 3031)

### **CarbonControl Requirements**
- All dependencies installed
- Build process working
- Custom port configuration

## 🔧 Setup Process

### **Step 1: Install Node.js on Tina Linux**

```bash
# Update package list
opkg update

# Install Node.js (if available in your Tina Linux repo)
opkg install nodejs npm

# Or install from NodeSource (recommended)
curl -fsSL https://deb.nodesource.com/setup_18.x | bash -
apt-get install -y nodejs

# Verify installation
node --version
npm --version
```

### **Step 2: Deploy CarbonControl**

```bash
# Create directory for CarbonControl
mkdir -p /opt/carboncontrol
cd /opt/carboncontrol

# Copy CarbonControl files to Tina Linux
# (You'll need to transfer the files from your development machine)

# Install dependencies
npm install

# Build for production
npm run build
```

### **Step 3: Configure Custom Port**

#### **Option A: Environment Variable**
```bash
# Set custom port
export PORT=8080
export PRINTER_IP=192.168.1.100  # Your printer IP
```

#### **Option B: Next.js Configuration**
```javascript
// next.config.mjs
const nextConfig = {
  // ... existing config
  env: {
    PORT: 8080,
    PRINTER_IP: '192.168.1.100'
  }
}
```

#### **Option C: Package.json Scripts**
```json
{
  "scripts": {
    "dev": "next dev -p 8080",
    "start": "next start -p 8080",
    "build": "next build"
  }
}
```

### **Step 4: Create systemd Service**

Create `/etc/systemd/system/carboncontrol.service`:

```ini
[Unit]
Description=CarbonControl 3D Printer UI
After=network.target
Wants=network.target

[Service]
Type=simple
User=root
WorkingDirectory=/opt/carboncontrol
Environment=NODE_ENV=production
Environment=PORT=8080
Environment=PRINTER_IP=192.168.1.100
ExecStart=/usr/bin/npm start
ExecReload=/bin/kill -HUP $MAINPID
Restart=always
RestartSec=10
StandardOutput=journal
StandardError=journal
SyslogIdentifier=carboncontrol

# Security settings
NoNewPrivileges=true
PrivateTmp=true
ProtectSystem=strict
ReadWritePaths=/opt/carboncontrol

[Install]
WantedBy=multi-user.target
```

### **Step 5: Enable and Start Service**

```bash
# Reload systemd
systemctl daemon-reload

# Enable service (start on boot)
systemctl enable carboncontrol

# Start service
systemctl start carboncontrol

# Check status
systemctl status carboncontrol

# View logs
journalctl -u carboncontrol -f
```

## 🔄 Alternative: Development Mode Service

If you want to run in development mode with auto-reload:

```ini
[Unit]
Description=CarbonControl 3D Printer UI (Development)
After=network.target
Wants=network.target

[Service]
Type=simple
User=root
WorkingDirectory=/opt/carboncontrol
Environment=NODE_ENV=development
Environment=PORT=8080
Environment=PRINTER_IP=192.168.1.100
ExecStart=/usr/bin/npm run dev
ExecReload=/bin/kill -HUP $MAINPID
Restart=always
RestartSec=10
StandardOutput=journal
StandardError=journal
SyslogIdentifier=carboncontrol-dev

[Install]
WantedBy=multi-user.target
```

## 🌐 Network Configuration

### **Firewall Setup**
```bash
# Allow port 8080
iptables -A INPUT -p tcp --dport 8080 -j ACCEPT

# Or if using ufw
ufw allow 8080
```

### **Nginx Reverse Proxy (Optional)**
If you want to serve on port 80/443:

```nginx
# /etc/nginx/sites-available/carboncontrol
server {
    listen 80;
    server_name your-printer.local;

    location / {
        proxy_pass http://localhost:8080;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
}
```

## 📊 Monitoring and Management

### **Service Management Commands**
```bash
# Start service
systemctl start carboncontrol

# Stop service
systemctl stop carboncontrol

# Restart service
systemctl restart carboncontrol

# Check status
systemctl status carboncontrol

# View logs
journalctl -u carboncontrol -f

# View recent logs
journalctl -u carboncontrol -n 50
```

### **Health Check Script**
Create `/opt/carboncontrol/health-check.sh`:

```bash
#!/bin/bash
# Health check for CarbonControl service

PORT=8080
PRINTER_IP=192.168.1.100

# Check if service is running
if ! systemctl is-active --quiet carboncontrol; then
    echo "CarbonControl service is not running"
    systemctl restart carboncontrol
    exit 1
fi

# Check if web interface is accessible
if ! curl -f -s http://localhost:$PORT > /dev/null; then
    echo "CarbonControl web interface is not accessible"
    systemctl restart carboncontrol
    exit 1
fi

# Check printer connectivity
if ! ping -c 1 $PRINTER_IP > /dev/null; then
    echo "Printer is not reachable"
    exit 1
fi

echo "CarbonControl is healthy"
exit 0
```

Make it executable and add to crontab:
```bash
chmod +x /opt/carboncontrol/health-check.sh
echo "*/5 * * * * /opt/carboncontrol/health-check.sh" | crontab -
```

## 🔧 Troubleshooting

### **Common Issues**

#### **1. Port Already in Use**
```bash
# Check what's using the port
netstat -tulpn | grep :8080

# Kill process if needed
kill -9 <PID>
```

#### **2. Permission Issues**
```bash
# Fix permissions
chown -R root:root /opt/carboncontrol
chmod -R 755 /opt/carboncontrol
```

#### **3. Node.js Not Found**
```bash
# Check Node.js installation
which node
which npm

# Add to PATH if needed
export PATH=$PATH:/usr/bin
```

#### **4. Service Won't Start**
```bash
# Check service logs
journalctl -u carboncontrol -n 50

# Check if dependencies are installed
npm list

# Reinstall dependencies
rm -rf node_modules package-lock.json
npm install
```

### **Debug Mode**
Run manually to see errors:
```bash
cd /opt/carboncontrol
NODE_ENV=development npm run dev
```

## 📱 Accessing the UI

### **Local Access**
- **URL**: `http://localhost:8080`
- **Network Access**: `http://PRINTER_IP:8080`

### **Network Discovery**
You can also set up mDNS for easy discovery:
```bash
# Install avahi-daemon
opkg install avahi-daemon

# Configure service discovery
echo "carboncontrol.local" > /etc/avahi/services/carboncontrol.service
```

## 🔄 Auto-Update Script

Create `/opt/carboncontrol/update.sh`:

```bash
#!/bin/bash
# Auto-update script for CarbonControl

cd /opt/carboncontrol

# Stop service
systemctl stop carboncontrol

# Backup current version
cp -r . ../carboncontrol-backup-$(date +%Y%m%d-%H%M%S)

# Pull updates (if using git)
git pull origin main

# Install dependencies
npm install

# Build
npm run build

# Start service
systemctl start carboncontrol

echo "CarbonControl updated successfully"
```

## 🎯 Benefits of This Approach

### **✅ Advantages**
1. **Reliability**: Service auto-restarts on failure
2. **Boot Persistence**: Starts automatically on boot
3. **Easy Management**: Standard systemd commands
4. **Logging**: Centralized logging with journalctl
5. **Monitoring**: Health checks and monitoring
6. **Custom Port**: No conflicts with other services
7. **Production Ready**: Optimized for embedded systems

### **✅ Integration Benefits**
1. **No Old UI Dependencies**: Completely self-contained
2. **Custom Firmware Compatible**: Works with your firmware
3. **Network Accessible**: Available on local network
4. **Service Management**: Easy start/stop/restart
5. **Auto-Recovery**: Restarts on crashes

## 🚀 Deployment Checklist

- [ ] Node.js installed on Tina Linux
- [ ] CarbonControl deployed to `/opt/carboncontrol`
- [ ] Dependencies installed (`npm install`)
- [ ] Production build created (`npm run build`)
- [ ] Custom port configured (8080)
- [ ] systemd service created and enabled
- [ ] Firewall configured (port 8080 open)
- [ ] Service started and running
- [ ] Web interface accessible
- [ ] Printer connectivity verified
- [ ] Health check script configured
- [ ] Auto-update script ready (optional)

This approach gives you a robust, service-based deployment that's perfect for embedded systems like your custom firmware! 🎯 