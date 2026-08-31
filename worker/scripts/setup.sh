#!/bin/bash
set -e

echo "=== VMS FFmpeg Worker Setup ==="

if [ "$EUID" -ne 0 ]; then
  echo "Please run as root or with sudo"
  exit 1
fi

echo "Updating system..."
apt-get update -y
apt-get upgrade -y

echo "Installing Docker..."
curl -fsSL https://get.docker.com | sh

echo "Adding current user to docker group..."
usermod -aG docker ubuntu

echo "Installing UFW..."
apt-get install -y ufw

echo "Configuring firewall..."
ufw allow 22/tcp
ufw allow 8080/tcp
ufw --force enable

echo "Creating worker directory..."
mkdir -p /opt/vms-worker
chown ubuntu:ubuntu /opt/vms-worker

echo "=== Setup complete ==="
echo "Next steps:"
echo "1. Log out and log back in (for docker group to take effect)"
echo "2. Copy worker code to /opt/vms-worker"
echo "3. Create .env file from .env.example"
echo "4. Run: cd /opt/vms-worker && docker build -t vms-worker ."
echo "5. Run: docker run -d --name vms-worker --env-file .env -p 8080:8080 --restart unless-stopped vms-worker"
