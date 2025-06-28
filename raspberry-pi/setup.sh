#!/bin/bash

echo "Setting up Amplitude Noise Monitor on Raspberry Pi..."

# Update system
echo "Updating system packages..."
sudo apt-get update
sudo apt-get upgrade -y

# Install system dependencies
echo "Installing system dependencies..."
sudo apt-get install -y python3-pip python3-dev portaudio19-dev python3-pyaudio git

# Install Python dependencies
echo "Installing Python dependencies..."
pip3 install -r requirements.txt

# Create systemd service for auto-start
echo "Creating systemd service..."
sudo tee /etc/systemd/system/amplitude-noise-monitor.service > /dev/null <<EOF
[Unit]
Description=Amplitude Noise Monitor
After=network.target

[Service]
Type=simple
User=pi
WorkingDirectory=/home/pi/amplitude/raspberry-pi
ExecStart=/usr/bin/python3 noise_monitor.py
Restart=always
RestartSec=10

[Install]
WantedBy=multi-user.target
EOF

# Enable and start service
echo "Enabling and starting service..."
sudo systemctl daemon-reload
sudo systemctl enable amplitude-noise-monitor
sudo systemctl start amplitude-noise-monitor

echo "Setup complete!"
echo "To check status: sudo systemctl status amplitude-noise-monitor"
echo "To view logs: sudo journalctl -u amplitude-noise-monitor -f"
echo "To stop: sudo systemctl stop amplitude-noise-monitor" 