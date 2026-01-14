FROM mcr.microsoft.com/devcontainers/javascript-node:18-bookworm

# Install only Electron runtime dependencies + deb packaging tools
# Removed: snapcraft, rpm, squashfs-tools, build-essential, dev headers
# These are either pre-installed in base image or not needed for local dev
RUN apt-get update && apt-get install -y \
    # Electron runtime dependencies
    libgtk-3-0 \
    libnss3 \
    libnotify4 \
    libxss1 \
    libxtst6 \
    libatspi2.0-0 \
    libsecret-1-0 \
    xdg-utils \
    # Display support
    libx11-xcb1 \
    libxcb-dri3-0 \
    libdrm2 \
    libgbm1 \
    libasound2 \
    # Virtual display for headless Electron
    xvfb \
    # Deb packaging only
    fakeroot \
    dpkg \
    # noVNC stack for dev container web-based display access
    x11vnc \
    net-tools \
    python3-pip \
    git \
    && pip3 install websockify --break-system-packages \
    && git clone --depth 1 https://github.com/novnc/noVNC.git /opt/noVNC \
    && ln -s /opt/noVNC/vnc.html /opt/noVNC/index.html \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /workspace
