# Electron Teams

A native desktop client for Microsoft Teams on Linux, wrapping the Teams web application in Electron for a seamless desktop experience.

## Features

- **Native Desktop Experience** - Runs as a standalone application with system tray integration
- **Persistent Sessions** - Stay logged in between restarts
- **Desktop Notifications** - Receive native Linux notifications for messages and calls
- **Video Calls & Screen Sharing** - Full support for Teams meetings
- **System Tray** - Minimize to tray, quick access menu
- **Single Instance** - Prevents multiple windows from opening
- **Crash Recovery** - Automatic reload on renderer crashes

## Requirements

- Node.js 18+ (for development)
- npm or yarn
- Linux (Ubuntu 20.04+, Debian 11+, or compatible distribution)

## Quick Start

### Development

```bash
# Install dependencies
npm install

# Run the application
npm start
```

### Dev Container (VS Code)

If using VS Code with the Dev Containers extension:

1. Open the project in VS Code
2. Click "Reopen in Container" when prompted
3. Start the app with VNC:
   ```bash
   pnpm dev
   ```
4. Open http://localhost:6080 in your browser to see the app

See [DISPLAY-ACCESS.md](DISPLAY-ACCESS.md) for detailed dev container instructions.

## Building Packages

### Debian Package (.deb)

```bash
npm run dist:deb
```

Install with:
```bash
sudo dpkg -i dist/electron-teams_*.deb
```

### AppImage

```bash
npm run dist:appimage
```

Run directly:
```bash
chmod +x dist/electron-teams-*.AppImage
./dist/electron-teams-*.AppImage
```

### Snap Package

```bash
npm run dist:snap
```

Install with:
```bash
sudo snap install dist/electron-teams_*.snap --dangerous
```

## Project Structure

```
electron-teams/
├── src/
│   ├── main.js          # Main Electron process
│   └── preload.js       # Preload script for security
├── assets/
│   └── icon*.png        # Application icons (various sizes)
├── scripts/
│   ├── postinstall.sh   # Debian post-install script
│   ├── postrm.sh        # Debian post-removal script
│   └── start-novnc.sh   # Dev container display setup
├── snap/
│   └── snapcraft.yaml   # Snap package configuration
├── .devcontainer/
│   └── Dockerfile       # Dev container configuration
├── package.json         # NPM configuration & build settings
└── DISPLAY-ACCESS.md    # Dev container display documentation
```

## Available Scripts

| Command | Description |
|---------|-------------|
| `pnpm dev` | Start VNC + app together (dev container) |
| `pnpm start` | Run the application (native display) |
| `pnpm start:dev` | Run in dev container (headless mode) |
| `pnpm start:vnc` | Start VNC/noVNC services only |
| `pnpm stop:vnc` | Stop VNC services |
| `pnpm dist` | Build all Linux packages |
| `pnpm dist:deb` | Build Debian package |
| `pnpm dist:snap` | Build Snap package |
| `pnpm dist:appimage` | Build AppImage |

## Configuration

### Whitelisted Domains

The application allows navigation to these Microsoft domains:

- `teams.microsoft.com` - Main Teams web app
- `teams.cloud.microsoft` - New consolidated domain
- `teams.events.data.microsoft.com` - Teams events
- `teams.cdn.office.net` - CDN resources
- `teams.office.com` - Teams services
- `teams.live.com` - Live services
- `cosmic.office.net` - Infrastructure
- `login.microsoftonline.com` - Microsoft Entra ID login
- `login.live.com` - Microsoft account login
- `account.live.com` - Account management
- `graph.microsoft.com` - Microsoft Graph API

External links open in your default browser.

### Permissions

The app requests these permissions:
- **Notifications** - Desktop notifications for messages/calls
- **Media** - Camera and microphone for video calls
- **Clipboard** - Copy/paste functionality

## Security

- **Context Isolation** - Enabled for security
- **Node Integration** - Disabled in renderer
- **Preload Script** - Secure bridge between contexts
- **Domain Whitelist** - Only Microsoft domains allowed

## Troubleshooting

### App won't start
```bash
# Try running without sandbox (may be needed on some systems)
npm run start:sandbox
```

### No audio in calls
Ensure PulseAudio/PipeWire is running and the snap has audio permissions:
```bash
snap connect electron-teams:audio-playback
snap connect electron-teams:audio-record
```

### Camera/Microphone not working
Check that the app has media permissions. The app should prompt on first use.

### Login issues
Clear the session data:
```bash
rm -rf ~/.config/electron-teams
```

## Building from Source

### Prerequisites

```bash
# Ubuntu/Debian
sudo apt-get install -y \
  libgtk-3-0 libnss3 libnotify4 libxss1 libxtst6 \
  libatspi2.0-0 libsecret-1-0 xdg-utils

# Install Node.js 18+
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs
```

### Build

```bash
git clone https://github.com/yourusername/electron-teams.git
cd electron-teams
npm install
npm run dist
```

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## License

MIT License - see [LICENSE](LICENSE) for details.

## Disclaimer

This is an unofficial client. Microsoft Teams is a trademark of Microsoft Corporation. This project is not affiliated with or endorsed by Microsoft.

## Acknowledgments

- [Electron](https://electronjs.org/) - Cross-platform desktop apps
- [electron-builder](https://electron.build/) - Package building
- Microsoft Teams Web - The web application this wraps
