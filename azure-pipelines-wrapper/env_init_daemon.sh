#!/bin/bash -e

LOG=$(pwd)/env_init_daemon.log
echo "daemon script start!" 2>&1 | while IFS= read -r line; do echo "[$(date '+%FT%TZ')] $line" >> $LOG; done
cd workspace
rm -rf $(find . -maxdepth 2 -name "tmp.*" -type d -ctime +30)  2>&1 | while IFS= read -r line; do echo "[$(date '+%FT%TZ')] $line" >> $LOG; done

if (( "$(df -h | grep '% /home' | awk '{print$5}' | grep -Eo [0-9]*)" > "60"));then
    rm -rf $(find . -maxdepth 2 -name "tmp.*" -type d -ctime +20)  2>&1 | while IFS= read -r line; do echo "[$(date '+%FT%TZ')] $line" >> $LOG; done
fi

cd conflict-sonic-buildimage 2>&1 | while IFS= read -r line; do echo "[$(date '+%FT%TZ')] $line" >> $LOG; done
mkdir -p daemon 2>&1 | while IFS= read -r line; do echo "[$(date '+%FT%TZ')] $line" >> $LOG; done
touch daemon/done.list 2>&1 | while IFS= read -r line; do echo "[$(date '+%FT%TZ')] $line" >> $LOG; done

grep PR_NUMBER $(find . -maxdepth 2 -name .bashenv -mtime -1 -mmin +120) | awk -F/.bashenv:PR_NUMBER= '{print$1,$2}' | sort -k 2 -u | awk '{print$1}' | grep -v -f daemon/done.list > daemon/todo.list
cd daemon 2>&1 | while IFS= read -r line; do echo "[$(date '+%FT%TZ')] $line" >> $LOG; done
for i in $(cat todo.list); do
    grep FORCE_PUSH=true ../$i/.bashenv &>> $LOG; done || continue
    mkdir $i || continue
    cp ../$i/.bashenv ../$i/script.sh $i/
    cd $i
    echo ACTION=ms_checker >> .bashenv
    . .bashenv
    ./script.sh | sed "s/ms_checker.result: /ms_checker.result: $PR_NUMBER=/" &>> $LOG
    cd ..
    #rm $i -rf
    echo $i >> done.list
    sleep 2
done &>> $LOG
rm todo.list -rf  &>> $LOG
sleep 300