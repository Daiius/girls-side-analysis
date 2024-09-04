#!/bin/bash

set -e

echo 
echo Make sure port fowarding PRODUCTION database into localhost...
echo

# 読み込む.envファイルを指定
# #から始まるコメント行は無視
# 行中に #から始まるコメントがあればそれも無視
export $(cat .env.production .env.local | grep -v '^#' | sed 's/#.*//' | xargs)
docker build \
  --network host \
  -t girls-side-analysis-nextjs \
  -f Dockerfile.nextjs.prod .

echo Build done!

exit $result

