#!/bin/bash
if ! curl -s -o /dev/null --max-time 5 http://localhost:3000/ 2>/dev/null; then
  cd /home/z/my-project
  NODE_OPTIONS="--max-old-space-size=4096" nohup node node_modules/.bin/next dev -p 3000 >> /home/z/my-project/dev.log 2>&1 &
fi
