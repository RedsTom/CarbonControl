#!/bin/sh

LOG_FILE="carboncontrol-setup.log"
LOG_LEVEL="INFO"

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

log() {
    level=$1
    shift
    message="$*"
    timestamp=$(date '+%Y-%m-%d %H:%M:%S')
    case $LOG_LEVEL in
        DEBUG) level_filter="DEBUG|INFO|WARN|ERROR" ;;
        INFO)  level_filter="INFO|WARN|ERROR" ;;
        WARN)  level_filter="WARN|ERROR" ;;
        ERROR) level_filter="ERROR" ;;
    esac
    echo "[$timestamp] [$level] $message" | tee -a "$LOG_FILE"
}

log_color() {
    level=$1
    color=$2
    shift 2
    message="$*"
    timestamp=$(date '+%Y-%m-%d %H:%M:%S')
    case $LOG_LEVEL in
        DEBUG) level_filter="DEBUG|INFO|WARN|ERROR" ;;
        INFO)  level_filter="INFO|WARN|ERROR" ;;
        WARN)  level_filter="WARN|ERROR" ;;
        ERROR) level_filter="ERROR" ;;
    esac
    echo -e "${color}[$timestamp] [$level]${NC} $message" | tee -a "$LOG_FILE"
}

log "INFO" "========================================"
log "INFO" "CarbonControl Setup Script for Tina Linux"
log "INFO" "========================================"
log "INFO" "Setup started at $(date)"
log "INFO" "Log file: $LOG_FILE"
log "INFO" "Log level: $LOG_LEVEL"
log "INFO" "Script arguments: $*"

CUSTOM_PORT=${1:-3001}
SERVICE_NAME="carboncontrol"
SERVICE_USER="root"

log "INFO" "Configuration loaded:"
log "INFO" "  - Custom Port: $CUSTOM_PORT"
log "INFO" "  - Service Name: $SERVICE_NAME"
log "INFO" "  - Service User: $SERVICE_USER"
log "INFO" "Setting up CarbonControl on port: $CUSTOM_PORT"

log "INFO" "[1/7] Checking Node.js installation..."
if ! command -v node >/dev/null 2>&1; then
    log "ERROR" "Node.js not found. Please install Node.js manually for Tina Linux."
    exit 1
else
    NODE_VERSION=$(node --version)
    log_color "INFO" "$GREEN" "✓ Node.js is installed ($NODE_VERSION)"
fi

log "INFO" "[2/7] Checking project structure..."
if [ ! -f "package.json" ]; then
    log "ERROR" "package.json not found! Please run this script from the CarbonControl directory."
    exit 1
fi
log_color "INFO" "$GREEN" "✓ Project structure looks good"

log "INFO" "[3/7] Installing dependencies..."
START_TIME=$(date +%s)
if npm install; then
    END_TIME=$(date +%s)
    DURATION=$((END_TIME - START_TIME))
    log_color "INFO" "$GREEN" "✓ Dependencies installed successfully"
    log "INFO" "Installation took ${DURATION} seconds"
else
    log "ERROR" "npm install failed"
    exit 1
fi

log "INFO" "[4/7] Building the project..."
START_TIME=$(date +%s)
if npm run build; then
    END_TIME=$(date +%s)
    DURATION=$((END_TIME - START_TIME))
    log_color "INFO" "$GREEN" "✓ Project built successfully"
    log "INFO" "Build took ${DURATION} seconds"
else
    log "ERROR" "npm run build failed"
    exit 1
fi

log "INFO" "[5/7] Creating systemd service..."
SERVICE_FILE="/etc/systemd/system/${SERVICE_NAME}.service"
CURRENT_DIR=$(pwd)

cat > "$SERVICE_FILE" <<EOF
[Unit]
Description=CarbonControl Printer UI
After=network.target

[Service]
Type=simple
User=$SERVICE_USER
WorkingDirectory=$CURRENT_DIR
Environment=PORT=$CUSTOM_PORT
Environment=NODE_ENV=production
ExecStart=$(command -v node) server.js
Restart=always
RestartSec=10

[Install]
WantedBy=multi-user.target
EOF

log_color "INFO" "$GREEN" "✓ Systemd service created"

log "INFO" "[6/7] Creating production server..."
cat > server.js <<EOF
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

log_color "INFO" "$GREEN" "✓ Production server created"

log "INFO" "[7/7] Enabling and starting service..."
systemctl daemon-reexec
systemctl daemon-reload
systemctl enable "$SERVICE_NAME"
systemctl start "$SERVICE_NAME"

sleep 2
if systemctl is-active --quiet "$SERVICE_NAME"; then
    log_color "INFO" "$GREEN" "✓ Service is running"
else
    log "ERROR" "Service failed to start!"
    systemctl status "$SERVICE_NAME"
    journalctl -u "$SERVICE_NAME" --no-pager -n 10
    exit 1
fi

SYSTEM_IP=$(ip addr show | awk '/inet / && !/127.0.0.1/ {sub("/.*", "", $2); print $2; exit}')
log "INFO" "========================================"
log "INFO" "🎉 CarbonControl is ready!"
log "INFO" "========================================"
log "INFO" "Visit: http://$SYSTEM_IP:$CUSTOM_PORT"
