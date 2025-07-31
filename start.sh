#!/bin/bash

# Kill any existing processes on the ports
echo "Cleaning up existing processes..."
npx kill-port 3000 2>/dev/null || true
npx kill-port 5000 2>/dev/null || true

# Install dependencies if needed
echo "Checking server dependencies..."
cd server
if [ ! -d "node_modules" ]; then
    echo "Installing server dependencies..."
    npm install
fi

echo "Checking client dependencies..."
cd ../client
if [ ! -d "node_modules" ]; then
    echo "Installing client dependencies..."
    npm install
fi

# Go back to root
cd ..

echo "Starting DocBook application..."
echo "Server will run on http://localhost:5000"
echo "Client will run on http://localhost:3000"
echo "Press Ctrl+C to stop both servers"

# Start both servers concurrently
npx concurrently \
  --names "SERVER,CLIENT" \
  --prefix-colors "red,blue" \
  "cd server && npm start" \
  "cd client && npm start"
