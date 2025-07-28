#!/bin/bash

echo "Making CarbonControl scripts executable..."
chmod +x setup-linux.sh
chmod +x setup-tina-linux.sh
chmod +x make-executable.sh
chmod +x view-logs.sh
echo "✓ Scripts are now executable!"
echo
echo "You can now run:"
echo "  ./setup-linux.sh          # For regular Linux"
echo "  ./setup-tina-linux.sh     # For Tina Linux with custom port"
echo "  ./view-logs.sh            # View setup logs"
echo
echo "Or run with custom port:"
echo "  ./setup-tina-linux.sh 8080"
echo
echo "Log viewing options:"
echo "  ./view-logs.sh            # Show info level and above"
echo "  ./view-logs.sh -s         # Show setup summary"
echo "  ./view-logs.sh -e         # Show only errors"
echo "  ./view-logs.sh -d         # Show all debug info" 