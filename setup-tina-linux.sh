#!/bin/bash

# Logging configuration
LOG_FILE="carboncontrol-setup.log"
LOG_LEVEL="INFO"  # DEBUG, INFO, WARN, ERROR

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Logging function
log() {
    local level=$1
    shift
    local message="$*"
    local timestamp=$(date '+%Y-%m-%d %H:%M:%S')
    
    # Determine if we should log this level
    case $LOG_LEVEL in
        DEBUG) level_filter="DEBUG|INFO|WARN|ERROR" ;;
        INFO)  level_filter="INFO|WARN|ERROR" ;;
        WARN)  level_filter="WARN|ERROR" ;;
        ERROR) level_filter="ERROR" ;;
    esac
    
    if [[ $level =~ $level_filter ]]; then
        echo "[$timestamp] [$level] $message" | tee -a "$LOG_FILE"
    fi
}

# Function to log with color
log_color() {
    local level=$1
    local color=$2
    shift 2
    local message="$*"
    local timestamp=$(date '+%Y-%m-%d %H:%M:%S')
    
    case $LOG_LEVEL in
        DEBUG) level_filter="DEBUG|INFO|WARN|ERROR" ;;
        INFO)  level_filter="INFO|WARN|ERROR" ;;
        WARN)  level_filter="WARN|ERROR" ;;
        ERROR) level_filter="ERROR" ;;
    esac
    
    if [[ $level =~ $level_filter ]]; then
        echo -e "${color}[$timestamp] [$level]${NC} $message" | tee -a "$LOG_FILE"
    fi
}

# Initialize log file
log "INFO" "========================================"
log "INFO" "CarbonControl Setup Script for Tina Linux"
log "INFO" "========================================"
log "INFO" "Setup started at $(date)"
log "INFO" "Log file: $LOG_FILE"
log "INFO" "Log level: $LOG_LEVEL"
log "INFO" "Script arguments: $*"

# Configuration
CUSTOM_PORT=${1:-3001}  # Default to port 3001 if not specified
SERVICE_NAME="carboncontrol"
SERVICE_USER="root"

log "INFO" "Configuration loaded:"
log "INFO" "  - Custom Port: $CUSTOM_PORT"
log "INFO" "  - Service Name: $SERVICE_NAME"
log "INFO" "  - Service User: $SERVICE_USER"
log "INFO" "Setting up CarbonControl on port: $CUSTOM_PORT"

# Check if Node.js is installed
log "INFO" "[1/7] Checking Node.js installation..."
if ! command -v node &> /dev/null; then
    log "WARN" "Node.js not found, installing..."
    log "INFO" "Installing Node.js from NodeSource repository..."
    # For Tina Linux, you might need to install from source or use a package manager
    # This is a basic installation - adjust for your specific Tina Linux distribution
    if curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -; then
        log "INFO" "NodeSource repository setup completed"
    else
        log "ERROR" "Failed to setup NodeSource repository"
        exit 1
    fi
    
    if sudo apt-get install -y nodejs; then
        log "INFO" "Node.js installation completed"
    else
        log "ERROR" "Failed to install Node.js"
        exit 1
    fi
else
    log "INFO" "Node.js already installed"
fi

NODE_VERSION=$(node --version)
log_color "INFO" "$GREEN" "✓ Node.js is installed ($NODE_VERSION)"

# Check if we're in the right directory
log "INFO" "[2/7] Checking project structure..."
if [ ! -f "package.json" ]; then
    log "ERROR" "package.json not found!"
    log "ERROR" "Please run this script from the CarbonControl directory."
    exit 1
fi
log_color "INFO" "$GREEN" "✓ Project structure looks good"
log "DEBUG" "Current directory: $(pwd)"
log "DEBUG" "package.json found: $(ls -la package.json)"

# Install dependencies
log "INFO" "[3/7] Installing dependencies..."
log "INFO" "This may take a few minutes..."
log "DEBUG" "Running: npm install"

START_TIME=$(date +%s)
if npm install; then
    END_TIME=$(date +%s)
    DURATION=$((END_TIME - START_TIME))
    log_color "INFO" "$GREEN" "✓ Dependencies installed successfully"
    log "INFO" "Installation took ${DURATION} seconds"
    log "DEBUG" "node_modules directory size: $(du -sh node_modules 2>/dev/null || echo 'unknown')"
else
    log "ERROR" "Failed to install dependencies!"
    log "ERROR" "npm install command failed with exit code $?"
    exit 1
fi

# Build the project
log "INFO" "[4/7] Building the project..."
log "DEBUG" "Running: npm run build"

START_TIME=$(date +%s)
if npm run build; then
    END_TIME=$(date +%s)
    DURATION=$((END_TIME - START_TIME))
    log_color "INFO" "$GREEN" "✓ Project built successfully"
    log "INFO" "Build took ${DURATION} seconds"
    log "DEBUG" ".next directory size: $(du -sh .next 2>/dev/null || echo 'unknown')"
else
    log "ERROR" "Build failed!"
    log "ERROR" "npm run build command failed with exit code $?"
    exit 1
fi

# Create systemd service file
log "INFO" "[5/7] Creating systemd service..."
SERVICE_FILE="/etc/systemd/system/${SERVICE_NAME}.service"
CURRENT_DIR=$(pwd)

log "DEBUG" "Service file path: $SERVICE_FILE"
log "DEBUG" "Current directory: $CURRENT_DIR"
log "DEBUG" "Service user: $SERVICE_USER"
log "DEBUG" "Custom port: $CUSTOM_PORT"

if sudo tee "$SERVICE_FILE" > /dev/null <<EOF
[Unit]
Description=CarbonControl Printer UI
After=network.target

[Service]
Type=simple
User=$SERVICE_USER
WorkingDirectory=$CURRENT_DIR
Environment=PORT=$CUSTOM_PORT
Environment=NODE_ENV=production
ExecStart=/usr/bin/node server.js
Restart=always
RestartSec=10

[Install]
WantedBy=multi-user.target
EOF
then
    log_color "INFO" "$GREEN" "✓ Systemd service created"
    log "DEBUG" "Service file contents:"
    log "DEBUG" "$(cat $SERVICE_FILE)"
else
    log "ERROR" "Failed to create systemd service file"
    exit 1
fi

# Create a simple server.js file for production
log "INFO" "[6/7] Creating production server..."
log "DEBUG" "Creating server.js file for production deployment"

if cat > server.js <<EOF
const { createServer } = require('http');
const { parse } = require('url');
const next = require('next');

const dev = process.env.NODE_ENV !== 'production';
const hostname = '0.0.0.0';
const port = process.env.PORT || 3000;

const app = next({ dev, hostname, port });
const handle = app.getRequestHandler();

app.prepare().then(() => {
  createServer(async (req, res) => {
    try {
      const parsedUrl = parse(req.url, true);
      await handle(req, res, parsedUrl);
    } catch (err) {
      console.error('Error occurred handling', req.url, err);
      res.statusCode = 500;
      res.end('internal server error');
    }
  })
    .once('error', (err) => {
      console.error(err);
      process.exit(1);
    })
    .listen(port, hostname, () => {
      console.log(\`> Ready on http://\${hostname}:\${port}\`);
    });
});
EOF
then
    log_color "INFO" "$GREEN" "✓ Production server created"
    log "DEBUG" "server.js file size: $(wc -l < server.js) lines"
    log "DEBUG" "server.js file permissions: $(ls -la server.js)"
else
    log "ERROR" "Failed to create server.js file"
    exit 1
fi

# Enable and start the service
log "INFO" "[7/7] Enabling and starting service..."
log "DEBUG" "Reloading systemd daemon"
if sudo systemctl daemon-reload; then
    log "INFO" "Systemd daemon reloaded successfully"
else
    log "ERROR" "Failed to reload systemd daemon"
    exit 1
fi

log "DEBUG" "Enabling service: $SERVICE_NAME"
if sudo systemctl enable "$SERVICE_NAME"; then
    log "INFO" "Service enabled successfully"
else
    log "ERROR" "Failed to enable service"
    exit 1
fi

log "DEBUG" "Starting service: $SERVICE_NAME"
if sudo systemctl start "$SERVICE_NAME"; then
    log "INFO" "Service start command executed"
else
    log "ERROR" "Failed to start service"
    exit 1
fi

# Check service status
log "DEBUG" "Checking service status..."
sleep 2  # Give service time to start
if sudo systemctl is-active --quiet "$SERVICE_NAME"; then
    log_color "INFO" "$GREEN" "✓ Service is running"
    log "DEBUG" "Service status: $(sudo systemctl is-active $SERVICE_NAME)"
else
    log "ERROR" "Service failed to start!"
    log "ERROR" "Service status: $(sudo systemctl is-active $SERVICE_NAME)"
    log "ERROR" "Service logs:"
    sudo journalctl -u "$SERVICE_NAME" --no-pager -n 10 | while read line; do
        log "ERROR" "  $line"
    done
    log "ERROR" "Check status with: sudo systemctl status $SERVICE_NAME"
    exit 1
fi

# Get system information for final output
SYSTEM_IP=$(hostname -I | awk '{print $1}')
SETUP_END_TIME=$(date +%s)
TOTAL_DURATION=$((SETUP_END_TIME - $(date -d "$(head -n 1 $LOG_FILE | cut -d' ' -f1-2)" +%s)))

log "INFO" "========================================"
log "INFO" "🎉 CarbonControl is ready!"
log "INFO" "========================================"
log "INFO" "Setup completed successfully!"
log "INFO" "Total setup time: ${TOTAL_DURATION} seconds"
log "INFO" "Log file: $LOG_FILE"

echo
echo "========================================"
echo "🎉 CarbonControl is ready!"
echo "========================================"
echo
echo "Service Information:"
echo "✓ Service Name: $SERVICE_NAME"
echo "✓ Port: $CUSTOM_PORT"
echo "✓ URL: http://$SYSTEM_IP:$CUSTOM_PORT"
echo "✓ Log File: $LOG_FILE"
echo "✓ Setup Time: ${TOTAL_DURATION} seconds"
echo
echo "Management Commands:"
echo "  Check status:   sudo systemctl status $SERVICE_NAME"
echo "  Start service:  sudo systemctl start $SERVICE_NAME"
echo "  Stop service:   sudo systemctl stop $SERVICE_NAME"
echo "  Restart:        sudo systemctl restart $SERVICE_NAME"
echo "  View logs:      sudo journalctl -u $SERVICE_NAME -f"
echo "  View setup log: cat $LOG_FILE"
echo
echo "Features available:"
echo "✓ UDP Discovery for automatic printer finding"
echo "✓ IP Address caching between sessions"
echo "✓ Real-time printer control"
echo "✓ File upload and management"
echo "✓ Live camera feed"
echo "✓ Runs as systemd service"
echo "✓ Auto-restart on failure"
echo
echo "The UI is now accessible at: http://$SYSTEM_IP:$CUSTOM_PORT"
echo
echo "Setup log saved to: $LOG_FILE" 