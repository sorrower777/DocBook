@echo off
echo Cleaning up existing processes...
npx kill-port 3000 >nul 2>&1
npx kill-port 5000 >nul 2>&1

echo Checking server dependencies...
cd server
if not exist "node_modules" (
    echo Installing server dependencies...
    npm install
)

echo Checking client dependencies...
cd ..\client
if not exist "node_modules" (
    echo Installing client dependencies...
    npm install
)

cd ..

echo Starting DocBook application...
echo Server will run on http://localhost:5000
echo Client will run on http://localhost:3000
echo Press Ctrl+C to stop both servers

npx concurrently --names "SERVER,CLIENT" --prefix-colors "red,blue" "cd server && npm start" "cd client && npm start"
