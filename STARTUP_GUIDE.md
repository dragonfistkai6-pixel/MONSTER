# 🚀 HerbionYX Daily Startup Guide

Quick reference for starting the HerbionYX system after initial setup.

## ⚡ Quick Start (After Setup)

### Prerequisites Check
```bash
# Ensure Docker is running
docker --version
# Should show: Docker version 20.10.x

# Check if ports are free
netstat -tulpn | grep -E ':(5000|5173|7050|7051|7054|5984)'
# Should show no conflicts
```

## 🔄 Daily Startup Sequence

### Step 1: Start Hyperledger Fabric Network
```bash
# Navigate to fabric network scripts
cd fabric-network/scripts

# Start the network (this takes 30-60 seconds)
./network.sh up

# Verify containers are running
docker ps
# Should show: orderer.herbionyx.com, peer0.org1.herbionyx.com, cli, couchdb0
```

### Step 2: Start Backend Server
```bash
# Open new terminal
# Navigate to server directory
cd server

# Start backend in development mode
npm run dev

# You should see:
# 🌿 HerbionYX API Server running on port 5000
# 🔗 Health check: http://localhost:5000/health
# 🔗 Connected to Hyperledger Fabric network
```

### Step 3: Start Frontend
```bash
# Open new terminal
# Navigate to project root
cd /path/to/herbionyx-project

# Start frontend development server
npm run dev

# You should see:
# Local:   http://localhost:5173/
# Network: http://192.168.x.x:5173/
```

### Step 4: Verify Everything is Working
```bash
# Test backend health
curl http://localhost:5000/health

# Open frontend in browser
# http://localhost:5173
```

## 🛑 Shutdown Sequence

### Graceful Shutdown
```bash
# 1. Stop frontend (Ctrl+C in frontend terminal)

# 2. Stop backend (Ctrl+C in backend terminal)

# 3. Stop Fabric network
cd fabric-network/scripts
./network.sh down
```

## 🔧 Troubleshooting Common Issues

### Issue 1: Fabric Network Won't Start
```bash
# Check Docker status
sudo systemctl status docker

# If Docker is stopped
sudo systemctl start docker

# Clean up and restart
cd fabric-network/scripts
./network.sh down
docker system prune -f
./network.sh up
```

### Issue 2: Port Already in Use
```bash
# Find process using port
sudo lsof -i :5000  # For backend
sudo lsof -i :5173  # For frontend
sudo lsof -i :7050  # For orderer

# Kill process if needed
sudo kill -9 <PID>
```

### Issue 3: Backend Can't Connect to Fabric
```bash
# Check Fabric containers
docker ps

# Check orderer logs
docker logs orderer.herbionyx.com

# Check peer logs
docker logs peer0.org1.herbionyx.com

# Restart network if needed
cd fabric-network/scripts
./network.sh restart
```

### Issue 4: Frontend Build Errors
```bash
# Clear node modules and reinstall
rm -rf node_modules package-lock.json
npm install

# Clear Vite cache
rm -rf .vite
npm run dev
```

## 📁 Directory Navigation Quick Reference

```
herbionyx-project/
├── fabric-network/          # Hyperledger Fabric network
│   ├── scripts/            # Network management scripts
│   │   ├── network.sh      # Main network control
│   │   ├── generate-certs.sh # Certificate generation
│   │   └── test-connectivity.sh # Network testing
│   ├── docker-compose.yaml # Container configuration
│   └── organizations/      # Certificates and keys
├── server/                 # Backend API server
│   ├── routes/            # API route handlers
│   ├── services/          # Business logic services
│   ├── config/            # Configuration files
│   └── package.json       # Backend dependencies
├── chaincode/             # Smart contracts
│   └── index.js          # Main chaincode file
├── src/                  # Frontend source code
│   ├── components/       # React components
│   ├── services/         # Frontend services
│   ├── hooks/           # React hooks
│   └── config/          # Frontend configuration
└── package.json         # Frontend dependencies
```

## 🎯 Development Workflow

### Making Changes

1. **Frontend Changes**
```bash
# Edit files in src/
# Changes auto-reload at http://localhost:5173
```

2. **Backend Changes**
```bash
# Edit files in server/
# Server auto-restarts with nodemon
```

3. **Chaincode Changes**
```bash
# Edit chaincode/index.js
# Redeploy chaincode:
cd fabric-network/scripts
./network.sh deployCC
```

### Testing Changes

1. **Test Frontend**
```bash
npm run build
npm run preview
```

2. **Test Backend**
```bash
cd server
npm test
```

3. **Test Fabric Network**
```bash
cd fabric-network/scripts
./test-connectivity.sh
```

## 📊 Monitoring Commands

### Check System Status
```bash
# Check all containers
docker ps

# Check container resource usage
docker stats

# Check disk space
df -h

# Check memory usage
free -h
```

### View Logs
```bash
# Backend logs
cd server
npm run dev  # Shows live logs

# Fabric orderer logs
docker logs orderer.herbionyx.com

# Fabric peer logs
docker logs peer0.org1.herbionyx.com

# CouchDB logs
docker logs couchdb0
```

### Performance Monitoring
```bash
# Check API response time
curl -w "@curl-format.txt" -o /dev/null -s http://localhost:5000/health

# Check Fabric network performance
cd fabric-network/scripts
./network.sh deployCC  # Should complete in <2 minutes
```

## 🔄 Backup Procedures

### Daily Backup (Automated)
```bash
#!/bin/bash
# Create backup script: backup.sh

DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_DIR="./backups/$DATE"

mkdir -p $BACKUP_DIR

# Backup Fabric data
docker cp peer0.org1.herbionyx.com:/var/hyperledger/production $BACKUP_DIR/peer-data
docker cp orderer.herbionyx.com:/var/hyperledger/production $BACKUP_DIR/orderer-data

# Backup certificates
cp -r fabric-network/organizations $BACKUP_DIR/

# Backup configuration
cp -r server/config $BACKUP_DIR/
cp package.json $BACKUP_DIR/
cp server/package.json $BACKUP_DIR/server-package.json

echo "Backup completed: $BACKUP_DIR"
```

### Restore Procedures
```bash
# Stop network
cd fabric-network/scripts
./network.sh down

# Restore data
docker cp ./backups/latest/peer-data peer0.org1.herbionyx.com:/var/hyperledger/production
docker cp ./backups/latest/orderer-data orderer.herbionyx.com:/var/hyperledger/production

# Restart network
./network.sh up
```

## 🚨 Emergency Procedures

### Complete System Reset
```bash
# 1. Stop everything
cd fabric-network/scripts
./network.sh down

# 2. Clean Docker
docker system prune -f
docker volume prune -f

# 3. Regenerate certificates
./generate-certs.sh

# 4. Restart network
./network.sh up
./network.sh createChannel
./network.sh deployCC

# 5. Restart backend
cd ../../server
npm run dev

# 6. Restart frontend
cd ..
npm run dev
```

### Network Recovery
```bash
# If network is corrupted
cd fabric-network/scripts
./fix-network.sh  # Custom recovery script

# Or manual recovery
./network.sh down
rm -rf ../organizations
rm -rf ../channel-artifacts
./generate-certs.sh
./network.sh up
./network.sh createChannel
./network.sh deployCC
```

## 📞 Support Contacts

### Technical Issues
- **Fabric Network**: Check `fabric-network/scripts/test-connectivity.sh`
- **Backend API**: Check `http://localhost:5000/health`
- **Frontend**: Check browser console for errors

### Log Locations
- **Frontend**: Browser Developer Tools → Console
- **Backend**: Terminal output or `server/logs/`
- **Fabric**: `docker logs <container-name>`

## 🎯 Quick Commands Reference

```bash
# Start everything
cd fabric-network/scripts && ./network.sh up
cd ../../server && npm run dev &
cd .. && npm run dev

# Stop everything
pkill -f "npm run dev"
cd fabric-network/scripts && ./network.sh down

# Check status
docker ps
curl http://localhost:5000/health
curl http://localhost:5173

# View logs
docker logs orderer.herbionyx.com --tail 50
docker logs peer0.org1.herbionyx.com --tail 50
```

This guide ensures you can quickly start and manage your HerbionYX system for daily development and testing.