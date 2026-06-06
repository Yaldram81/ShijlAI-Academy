#!/bin/bash
cd /home/z/my-project
while true; do
  rm -rf .next
  NODE_OPTIONS="--max-old-space-size=4096" timeout 300 node node_modules/.bin/next dev -p 3000 >> /home/z/my-project/dev.log 2>&1
  echo "=== Restart at $(date) ===" >> /home/z/my-project/dev.log
  sleep 2
done
