#!/bin/bash

# Test script for video generation integration
echo "Testing Video Generation Integration..."

# Check if video backend is running
echo "1. Checking video backend availability..."
if curl -f http://localhost:8000/ &> /dev/null; then
    echo "✅ Video backend is running"
else
    echo "❌ Video backend is not running on http://localhost:8000"
    echo "   Please start your FastAPI server first"
    exit 1
fi

# Test video generation endpoint
echo "2. Testing video generation endpoint..."
response=$(curl -s -X POST http://localhost:8000/generate_video \
  -H "Content-Type: application/json" \
  -d '{"topic": "Introduction to Mathematics", "style": "educational"}')

if echo "$response" | grep -q "task_id"; then
    echo "✅ Video generation endpoint is working"
    task_id=$(echo "$response" | grep -o '"task_id":"[^"]*"' | cut -d'"' -f4)
    echo "   Generated task_id: $task_id"
else
    echo "❌ Video generation endpoint failed"
    echo "   Response: $response"
    exit 1
fi

# Test WebSocket connection (basic check)
echo "3. Testing WebSocket endpoint..."
if command -v wscat &> /dev/null; then
    timeout 3s wscat -c ws://localhost:8000/ws/test-connection &> /dev/null
    if [ $? -eq 124 ]; then
        echo "✅ WebSocket endpoint is accessible"
    else
        echo "❌ WebSocket endpoint test failed"
    fi
else
    echo "⚠️  wscat not installed, skipping WebSocket test"
    echo "   Install with: npm install -g wscat"
fi

echo "4. Integration test complete!"
echo "   Your video generation backend is ready for integration."
