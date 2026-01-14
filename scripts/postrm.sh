#!/bin/bash
set -e

# Post-removal script for electron-teams .deb package

# Only run on complete removal (not upgrade)
if [ "$1" = "remove" ] || [ "$1" = "purge" ]; then
    # Update desktop database
    if command -v update-desktop-database &> /dev/null; then
        update-desktop-database /usr/share/applications || true
    fi

    echo "Microsoft Teams for Linux has been removed."
fi
