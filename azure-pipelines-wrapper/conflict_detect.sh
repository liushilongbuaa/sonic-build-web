#!/bin/bash

REPO=$1
mkdir -p workspace
cd workspace
rm -rf $(find . -name "tmp.*" -type d -cmin +10)

apt-get update
apt-get install git -y
git config --global --add safe.directory '*'

mkdir $REPO -p
cd $REPO
tmp=$(mktemp -p ./ -d)
cd $tmp

echo "tmp dir: $tmp"

cat > .bashenv << EOF
URL=$2
GH_TOKEN=$3
MSAZURE_TOKEN=$4
SCRIPT_URL=$5
PR_OWNER=$6
PR_ID=$7
BASE_BRANCH=$8
EOF

. .bashenv

curl "https://mssonicbld:$GH_TOKEN@$SCRIPT_URL/ms_conflict_detect.sh" -o ms_conflict_detect.sh -L
curl "https://mssonicbld:$GH_TOKEN@$SCRIPT_URL/azdevops_git_api.sh" -o azdevops_git_api.sh -L
bash ms_conflict_detect.sh
rc=$?
exit

cd ../
rm -rf $tmp
exit $rc
