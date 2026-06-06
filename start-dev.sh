#!/bin/bash
cd /home/z/my-project
while true; do
  NODE_OPTIONS="--max-old-space-size=4096" node node_modules/.bin/next dev -p 3000 >> /home/z/my-project/dev-server.log 2>&1
  EXIT_CODE=$?
  echo "=== Next.js exited with code $EXIT_CODE at $(date), restarting in 2s ===" >> /home/z/my-project/dev-server.log
  sleep 2
done
