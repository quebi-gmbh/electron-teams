#!/bin/bash
# Start noVNC web-based display access for dev container
# This provides browser-based access to the Electron app at http://localhost:6080

set -e

echo "========================================"
echo "Starting noVNC Display Services"
echo "========================================"
echo ""

# 1. Ensure Xvfb is running
if ! pgrep -f "Xvfb :99" > /dev/null; then
    echo "Starting Xvfb virtual display on :99..."
    Xvfb :99 -screen 0 1280x720x24 > /tmp/xvfb.log 2>&1 &
    sleep 1
    echo "✓ Xvfb started"
else
    echo "✓ Xvfb already running"
fi

# 2. Start x11vnc VNC server
if ! pgrep -f "x11vnc.*:99" > /dev/null; then
    echo "Starting x11vnc VNC server on port 5900..."
    x11vnc -display :99 -forever -shared -nopw -quiet -bg -o /tmp/x11vnc.log
    sleep 1
    echo "✓ x11vnc started"
else
    echo "✓ x11vnc already running"
fi

# 3. Start websockify proxy
if ! pgrep -f "websockify.*6080" > /dev/null; then
    echo "Starting websockify on port 6080..."
    websockify --web /opt/noVNC --daemon 6080 localhost:5900 > /tmp/websockify.log 2>&1
    sleep 1
    echo "✓ websockify started"
else
    echo "✓ websockify already running"
fi

echo ""
echo "========================================"
echo "✓ All services running!"
echo "========================================"
echo ""
echo "Access the display in your browser:"
echo "  http://localhost:6080"
echo ""
echo "Then start the Electron app:"
echo "  npm run start:dev"
echo ""
echo "Logs available at:"
echo "  /tmp/xvfb.log"
echo "  /tmp/x11vnc.log"
echo "  /tmp/websockify.log"
echo ""
