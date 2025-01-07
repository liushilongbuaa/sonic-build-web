#!/bin/bash

set -ex
mkdir -p /data/workspace/daemon /workspace
rm -rf /data/workspace/daemon/* -rf
echo 'deb http://deb.debian.org/debian bullseye-backports main' >> /etc/apt/sources.list
apt-get update
apt-get install git jq gh parallel -y
git config --global --add safe.directory '*'