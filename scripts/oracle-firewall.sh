#!/bin/sh
# Open HTTP/HTTPS on Oracle Cloud Ubuntu images (iptables + persistence).
set -e

sudo iptables -I INPUT 6 -m state --state NEW -p tcp --dport 80 -j ACCEPT
sudo iptables -I INPUT 6 -m state --state NEW -p tcp --dport 443 -j ACCEPT

if command -v netfilter-persistent >/dev/null 2>&1; then
  sudo netfilter-persistent save
else
  sudo apt-get update
  sudo DEBIAN_FRONTEND=noninteractive apt-get install -y iptables-persistent
  sudo netfilter-persistent save
fi

echo "Ports 80 and 443 are open. Also allow them in the OCI VCN Security List."
