#!/bin/bash -ex

mkdir -p /data/workspace/daemon
cd /data/workspace/daemon
rm -rf /data/workspace/daemon/* -rf
echo 'deb http://deb.debian.org/debian bullseye-backports main' >> /etc/apt/sources.list
apt-get update 2>&1 | while IFS= read -r line; do echo "[$(date '+%FT%TZ')] $line" >> env_init.log; done
apt-get install git jq gh parallel -y 2>&1 | while IFS= read -r line; do echo "[$(date '+%FT%TZ')] $line" >> env_init.log; done
git config --global --add safe.directory '*' | while IFS= read -r line; do echo "[$(date '+%FT%TZ')] $line" >> env_init.log; done