#!/bin/bash

echo "=== WebSocket & API Sync Test Script ==="
echo

# Test WebSocket connection
echo "1. Testing WebSocket connection..."
curl -i -N \
  -H "Connection: Upgrade" \
  -H "Upgrade: websocket" \
  -H "Sec-WebSocket-Key: dGhlIHNhbXBsZSBub25jZQ==" \
  -H "Sec-WebSocket-Version: 13" \
  http://127.0.0.1:8000/ws

echo
echo "--- WebSocket test completed ---"
echo

# Test API Sync endpoint
echo "2. Testing POST /api/sync..."
curl -i -X POST \
  -H "Content-Type: application/json" \
  -d '{"type": "test", "data": {"message": "Hello from curl"}}' \
  http://127.0.0.1:8000/api/sync

echo
echo "--- API Sync test completed ---"
echo

# Test Health endpoint
echo "3. Testing /health endpoint..."
curl -i http://127.0.0.1:8000/health

echo
echo "--- Health check test completed ---"
echo

echo "=== All tests completed ==="