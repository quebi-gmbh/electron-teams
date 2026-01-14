#!/bin/bash
set -e

# Post-installation script for electron-teams .deb package

# Update desktop database to register the application
if command -v update-desktop-database &> /dev/null; then
    update-desktop-database /usr/share/applications || true
fi

# Update icon caches
if command -v gtk-update-icon-cache &> /dev/null; then
    for dir in /usr/share/icons/*/; do
        if [ -d "$dir" ]; then
            gtk-update-icon-cache -f -t "$dir" 2>/dev/null || true
        fi
    done
fi

echo "Microsoft Teams for Linux has been installed successfully."
