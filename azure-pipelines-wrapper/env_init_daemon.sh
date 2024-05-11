#!/bin/bash -ex

echo "$(date '+%FT%TZ') daemon script start!"
cd workspace
rm -rf $(find . -maxdepth 2 -name "tmp.*" -type d -ctime +30)

if (( "$(df -h | grep '% /home' | awk '{print$5}' | grep -Eo [0-9]*)" > "60"));then
    rm -rf $(find . -maxdepth 2 -name "tmp.*" -type d -ctime +20)
fi

cd conflict-sonic-buildimage
mkdir -p daemon
touch daemon/done.list

folders=$(find . -maxdepth 2 -name .bashenv -mtime -1 -mmin +120)
echo "$(date '+%FT%TZ') folders: $folders"
if [ -n "$folders" ]; then
    grep PR_NUMBER $folders | awk -F/.bashenv:PR_NUMBER= '{print$1,$2}' | sort -k 2 -u
    if ls daemon/done.list;then
        grep PR_NUMBER $folders | awk -F/.bashenv:PR_NUMBER= '{print$1,$2}' | sort -k 2 -u | awk '{print$1}' | grep -v -f daemon/done.list > daemon/todo.list
    else
        grep PR_NUMBER $folders | awk -F/.bashenv:PR_NUMBER= '{print$1,$2}' | sort -k 2 -u | awk '{print$1}' > daemon/todo.list
    fi
    cd daemon
    todolist=$(cat todo.list)
    if [ -n "$todolist" ]; then
        for i in $todolist; do
            echo "$(date '+%FT%TZ') FORCE_PUSH: $(grep -Eo FORCE_PUSH=.* ../$i/.bashenv)"
            grep FORCE_PUSH=true ../$i/.bashenv || continue
            mkdir $i || continue
            cp ../$i/.bashenv ../$i/script.sh $i/
            cd $i
            echo ACTION=ms_checker >> .bashenv
            . .bashenv
            ./script.sh | sed "s/ms_checker.result: /ms_checker.result: $PR_NUMBER=/"
            cd ..
            #rm $i -rf
            echo $i >> done.list
            sleep 2
        done
    fi
    rm todo.list -rf
    sleep 300
fi