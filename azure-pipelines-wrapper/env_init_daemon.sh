#!/bin/bash -ex

echo "$(date '+%FT%TZ'): daemon script start!" &>> env_init_daemon.log
cd workspace
find . -maxdepth 2 -name "tmp.*" -type d -ctime +30 -delete &>> env_init_daemon.log || true

if (( "$(df -h | grep '% /home' | awk '{print$5}' | grep -Eo [0-9]*)" > "60"));then
    find . -maxdepth 2 -name "tmp.*" -type d -ctime +20 -delete &>> env_init_daemon.log || true
fi

cd conflict-sonic-buildimage
mkdir -p daemon
touch daemon/done.list

grep PR_NUMBER $(find . -maxdepth 2 -name .bashenv -mtime -1 -mmin +120) | awk -F/.bashenv:PR_NUMBER= '{print$1,$2}' | sort -k 2 -u | awk '{print$1}' | grep -v -f daemon/done.list > daemon/todo.list
cd daemon
for i in $(cat todo.list); do
    grep FORCE_PUSH=true ../$i/.bashenv || continue
    mkdir $i || continue
    cp ../$i/.bashenv ../$i/script.sh $i/
    cd $i
    echo ACTION=ms_checker >> .bashenv
    ./script.sh | sed "s/ms_checker.result: /ms_checker.result: $PR_NUMBER=/" | while IFS= read -r line; do echo "[$(date '+%FT%TZ')] $line"; done > tmp
    cat tmp
    echo $i >> done.list
    sleep 2
done
sleep 60