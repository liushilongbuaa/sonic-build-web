set -ex

URL=$1
GH_TOKEN=$2
MSSONIC_TOKEN=$3
MSAZURE_TOKEN=$4
SCRIPT_URL=$5

mkdir -p workspace
cd workspace

rm -rf $(find . -name "tmp.*" -type d -cmin +30)
tmp=$(mktemp -p ./ -d)
cd $tmp

curl "https://mssonicbld:$GH_TOKEN@$SCRIPT_URL" -o ms_conflict_detect.sh
wc -l ms_conflict_detect.sh

bash ms_conflict_detect.sh $MSAZURE_TOKEN $MSSONIC_TOKEN $GH_TOKEN $URL
cd ..
rm -rf $tmp
