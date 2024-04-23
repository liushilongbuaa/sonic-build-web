#!/bin/bash -ex

echo "daemon script start!"
cd workspace
find . -maxdepth 2 -name "tmp.*" -type d -ctime +30 -delete

if (( "$(df -h | grep '% /home' | awk '{print$5}' | grep -Eo [0-9]*)" > "60"));then
    find . -maxdepth 2 -name "tmp.*" -type d -ctime +20 -delete
fi