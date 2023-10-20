set -ex

URL=$1
GH_TOKEN=$2
MSSONIC_TOKEN=$3
MSAZURE_TOKEN=$4
BRANCH=$5

mkdir -p workspace
cd workspace

rm -rf $(find . -name "tmp.*" -type d -cmin +30)
cd $(mktemp -p ./ -d)

curl "https://mssonicbld:$GH_TOKEN@raw.githubusercontent.com/Azure/sonic-pipelines-internal/$BRANCH/azure-pipelines/ms_conflict_detect.sh" -o ms_conflict_detect.sh
wc -l ms_conflict_detect.sh

bash ms_conflict_detect.sh $MSAZURE_TOKEN $MSSONIC_TOKEN $GH_TOKEN $URL
