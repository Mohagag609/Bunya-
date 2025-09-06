#!/bin/bash

echo "=== WebSocket & API Sync Test Script ==="
echo

# Test WebSocket endpoint
echo "1. Testing WebSocket endpoint /ws..."
curl -i http://127.0.0.1:8000/ws

echo
echo "--- WebSocket endpoint test completed ---"
echo

# Test WebSocket test page
echo "2. Testing WebSocket test page /ws-test..."
curl -i http://127.0.0.1:8000/ws-test

echo
echo "--- WebSocket test page completed ---"
echo

# Test API Sync GET
echo "3. Testing GET /api/sync..."
curl -i http://127.0.0.1:8000/api/sync

echo
echo "--- API Sync GET test completed ---"
echo

# Test API Sync POST
echo "4. Testing POST /api/sync..."
curl -i -X POST \
  -H "Content-Type: application/json" \
  -d '{"type": "test", "data": {"message": "Hello from curl"}}' \
  http://127.0.0.1:8000/api/sync

echo
echo "--- API Sync POST test completed ---"
echo

# Test Health endpoint
echo "5. Testing /health endpoint..."
curl -i http://127.0.0.1:8000/health

echo
echo "--- Health check test completed ---"
echo

echo "=== All tests completed ==="