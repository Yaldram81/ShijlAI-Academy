#!/bin/bash
cd /home/z/my-project
while true; do
  if ! curl -s -o /dev/null --max-time 5 http://localhost:3000/ 2>/dev/null; then
    NODE_OPTIONS="--max-old-space-size=4096" node node_modules/.bin/next dev -p 3000 >> /home/z/my-project/dev.log 2>&1 &
    NEXT_PID=$!
    # Wait for it to start
    sleep 15
    # Trigger first compile
    curl -s -o /dev/null --max-time 60 http://localhost:3000/ 2>/dev/null
  fi
  sleep 10
done
