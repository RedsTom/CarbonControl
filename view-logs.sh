#!/bin/bash

# Log viewer for CarbonControl setup
LOG_FILE="carboncontrol-setup.log"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to show usage
show_usage() {
    echo "CarbonControl Setup Log Viewer"
    echo "Usage: $0 [OPTIONS]"
    echo
    echo "Options:"
    echo "  -f, --follow     Follow log in real-time"
    echo "  -e, --errors     Show only errors"
    echo "  -w, --warnings   Show warnings and errors"
    echo "  -i, --info       Show info, warnings, and errors (default)"
    echo "  -d, --debug      Show all log levels"
    echo "  -s, --summary    Show setup summary"
    echo "  -h, --help       Show this help message"
    echo
    echo "Examples:"
    echo "  $0                    # Show info level and above"
    echo "  $0 -f                 # Follow logs in real-time"
    echo "  $0 -e                 # Show only errors"
    echo "  $0 -d                 # Show all debug information"
    echo "  $0 -s                 # Show setup summary"
}

# Function to show setup summary
show_summary() {
    if [ ! -f "$LOG_FILE" ]; then
        echo -e "${RED}Error: Log file not found: $LOG_FILE${NC}"
        exit 1
    fi
    
    echo -e "${BLUE}=== CarbonControl Setup Summary ===${NC}"
    echo
    
    # Get setup start time
    START_TIME=$(head -n 1 "$LOG_FILE" | grep -o '\[.*\]' | head -1 | tr -d '[]')
    echo -e "${GREEN}Setup Started:${NC} $START_TIME"
    
    # Get setup end time
    END_TIME=$(grep "Setup completed successfully" "$LOG_FILE" | tail -1 | grep -o '\[.*\]' | head -1 | tr -d '[]')
    if [ -n "$END_TIME" ]; then
        echo -e "${GREEN}Setup Completed:${NC} $END_TIME"
    fi
    
    # Get total duration
    DURATION=$(grep "Total setup time:" "$LOG_FILE" | tail -1 | grep -o '[0-9]* seconds')
    if [ -n "$DURATION" ]; then
        echo -e "${GREEN}Total Duration:${NC} $DURATION"
    fi
    
    # Get configuration
    PORT=$(grep "Custom Port:" "$LOG_FILE" | tail -1 | grep -o '[0-9]*')
    SERVICE_NAME=$(grep "Service Name:" "$LOG_FILE" | tail -1 | grep -o 'carboncontrol')
    echo -e "${GREEN}Service Name:${NC} $SERVICE_NAME"
    echo -e "${GREEN}Port:${NC} $PORT"
    
    # Get Node.js version
    NODE_VERSION=$(grep "Node.js is installed" "$LOG_FILE" | tail -1 | grep -o 'v[0-9.]*')
    if [ -n "$NODE_VERSION" ]; then
        echo -e "${GREEN}Node.js Version:${NC} $NODE_VERSION"
    fi
    
    # Get installation times
    echo
    echo -e "${BLUE}Installation Times:${NC}"
    DEPENDENCIES_TIME=$(grep "Installation took" "$LOG_FILE" | tail -1 | grep -o '[0-9]* seconds')
    BUILD_TIME=$(grep "Build took" "$LOG_FILE" | tail -1 | grep -o '[0-9]* seconds')
    
    if [ -n "$DEPENDENCIES_TIME" ]; then
        echo -e "  Dependencies: $DEPENDENCIES_TIME"
    fi
    if [ -n "$BUILD_TIME" ]; then
        echo -e "  Build: $BUILD_TIME"
    fi
    
    # Get final status
    echo
    echo -e "${BLUE}Final Status:${NC}"
    if grep -q "Service is running" "$LOG_FILE"; then
        echo -e "${GREEN}✓ Service Status: Running${NC}"
    else
        echo -e "${RED}✗ Service Status: Failed${NC}"
    fi
    
    if grep -q "Setup completed successfully" "$LOG_FILE"; then
        echo -e "${GREEN}✓ Setup Status: Success${NC}"
    else
        echo -e "${RED}✗ Setup Status: Failed${NC}"
    fi
    
    # Get error count
    ERROR_COUNT=$(grep -c "ERROR" "$LOG_FILE")
    WARN_COUNT=$(grep -c "WARN" "$LOG_FILE")
    
    echo -e "${BLUE}Log Statistics:${NC}"
    echo -e "  Errors: $ERROR_COUNT"
    echo -e "  Warnings: $WARN_COUNT"
}

# Check if log file exists
if [ ! -f "$LOG_FILE" ]; then
    echo -e "${RED}Error: Log file not found: $LOG_FILE${NC}"
    echo "Run the setup script first to generate logs."
    exit 1
fi

# Parse command line arguments
FOLLOW=false
LEVEL="INFO"

while [[ $# -gt 0 ]]; do
    case $1 in
        -f|--follow)
            FOLLOW=true
            shift
            ;;
        -e|--errors)
            LEVEL="ERROR"
            shift
            ;;
        -w|--warnings)
            LEVEL="WARN"
            shift
            ;;
        -i|--info)
            LEVEL="INFO"
            shift
            ;;
        -d|--debug)
            LEVEL="DEBUG"
            shift
            ;;
        -s|--summary)
            show_summary
            exit 0
            ;;
        -h|--help)
            show_usage
            exit 0
            ;;
        *)
            echo -e "${RED}Unknown option: $1${NC}"
            show_usage
            exit 1
            ;;
    esac
done

# Function to filter logs by level
filter_logs() {
    case $LEVEL in
        DEBUG) grep -E "\[DEBUG\]|\[INFO\]|\[WARN\]|\[ERROR\]" ;;
        INFO)  grep -E "\[INFO\]|\[WARN\]|\[ERROR\]" ;;
        WARN)  grep -E "\[WARN\]|\[ERROR\]" ;;
        ERROR) grep -E "\[ERROR\]" ;;
    esac
}

# Display logs
echo -e "${BLUE}=== CarbonControl Setup Logs ===${NC}"
echo -e "${BLUE}Log Level: $LEVEL${NC}"
echo -e "${BLUE}Log File: $LOG_FILE${NC}"
echo

if [ "$FOLLOW" = true ]; then
    echo -e "${YELLOW}Following logs in real-time... (Press Ctrl+C to stop)${NC}"
    echo
    tail -f "$LOG_FILE" | filter_logs
else
    filter_logs < "$LOG_FILE"
fi 