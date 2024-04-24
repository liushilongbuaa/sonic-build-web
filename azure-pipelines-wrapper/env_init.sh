#!/bin/bash -ex

mkdir -p workspace

apt-get update 2>&1 | while IFS= read -r line; do echo "[$(date '+%FT%TZ')] $line" >> env_init.log; done
apt-get install git jq -y 2>&1 | while IFS= read -r line; do echo "[$(date '+%FT%TZ')] $line" >> env_init.log; done
git config --global --add safe.directory '*' | while IFS= read -r line; do echo "[$(date '+%FT%TZ')] $line" >> env_init.log; done