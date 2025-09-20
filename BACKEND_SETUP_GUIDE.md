# 🚀 HerbionYX Backend Setup Guide

Complete guide for setting up the Hyperledger Fabric backend locally for HerbionYX.

## 📋 Prerequisites

### System Requirements
- **OS**: Ubuntu 20.04+, macOS 10.15+, or Windows 10+ (with WSL2)
- **CPU**: 4+ cores (Intel/AMD)
- **RAM**: 8+ GB
- **Storage**: 20+ GB free space
- **Network**: Stable internet connection

### Required Software Installation

#### 1. Install Docker & Docker Compose
```bash
# Ubuntu/Debian
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh
sudo usermod -aG docker $USER

# macOS (using Homebrew)
brew install docker docker-compose

# Windows - Download Docker Desktop from docker.com

# Verify installation
docker --version
docker-compose --version
```

#### 2. Install Node.js 18+
```bash
# Using Node Version Manager (recommended)
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.0/install.sh | bash
source ~/.bashrc
nvm install 18
nvm use 18

# Verify installation
node --version  # Should show v18.x.x
npm --version
```

#### 3. Install Hyperledger Fabric Binaries
```bash
# Create workspace directory
mkdir -p ~/fabric-workspace
cd ~/fabric-workspace

# Download Fabric binaries and Docker images
curl -sSL https://bit.ly/2ysbOFE | bash -s -- 2.5.4 1.5.7

# Add binaries to PATH
echo 'export PATH=$PATH:~/fabric-workspace/fabric-samples/bin' >> ~/.bashrc
source ~/.bashrc

# Verify installation
peer version
orderer version
configtxgen --version
```

#### 4. Install Additional Tools
```bash
# Install jq (JSON processor)
sudo apt-get install jq  # Ubuntu/Debian
brew install jq          # macOS

# Install Git (if not already installed)
sudo apt-get install git  # Ubuntu/Debian
brew install git          # macOS
```

## 🏗️ Project Setup

### 1. Clone HerbionYX Repository
```bash
cd ~/fabric-workspace
git clone <your-herbionyx-repository-url>
cd herbionyx-project

# Or if you have the project files locally
cp -r /path/to/herbionyx-project ~/fabric-workspace/
cd ~/fabric-workspace/herbionyx-project
```

### 2. Install Backend Dependencies
```bash
cd server
npm install

# Install additional Fabric dependencies if needed
npm install fabric-network@2.2.19 fabric-ca-client@2.2.19
```

### 3. Set Up Environment Variables
```bash
# Copy environment template
cp .env.example .env

# Edit .env file with your configuration
nano .env
```

**Required Environment Variables:**
```bash
# Fabric Network Configuration
NODE_ENV=development
PORT=5000
DEMO_MODE=false

# JWT Configuration
JWT_SECRET=herbionyx_production_secret_2024

# IPFS/Pinata Configuration (Get from pinata.cloud)
PINATA_API_KEY=your_pinata_api_key_here
PINATA_SECRET_KEY=your_pinata_secret_key_here

# SMS Configuration (Get from fast2sms.com)
FAST2SMS_API_KEY=your_fast2sms_api_key_here

# Frontend URL
FRONTEND_URL=http://localhost:5173

# Logging
LOG_LEVEL=info
```

## 🔗 Hyperledger Fabric Network Setup

### 1. Prepare Fabric Network
```bash
# Navigate to fabric network directory
cd fabric-network/scripts

# Make scripts executable
chmod +x *.sh

# Clean any existing network
./network.sh down
docker system prune -f
```

### 2. Start Fabric Network
```bash
# Start the network (this will take 2-3 minutes)
./network.sh up

# Verify containers are running
docker ps

# You should see these containers:
# - orderer.herbionyx.com
# - peer0.org1.herbionyx.com
# - ca.org1.herbionyx.com
# - couchdb0
# - cli
```

### 3. Create Channel
```bash
# Create the application channel
./network.sh createChannel

# Verify channel creation
docker exec cli peer channel list
```

### 4. Deploy Chaincode
```bash
# Deploy the HerbionYX chaincode
./network.sh deployCC

# Verify chaincode deployment
docker exec cli peer lifecycle chaincode querycommitted --channelID herbionyx-channel
```

### 5. Test Network Connectivity
```bash
# Run connectivity tests
./test-connectivity.sh

# Test chaincode invocation
docker exec cli peer chaincode invoke \
  -o orderer.herbionyx.com:7050 \
  --ordererTLSHostnameOverride orderer.herbionyx.com \
  --tls \
  --cafile /opt/gopath/src/github.com/hyperledger/fabric/peer/crypto/ordererOrganizations/herbionyx.com/orderers/orderer.herbionyx.com/msp/tlscacerts/tlsca.herbionyx.com-cert.pem \
  -C herbionyx-channel \
  -n herbionyx-chaincode \
  -c '{"function":"initLedger","Args":[]}'
```

## 🖥️ Backend Server Setup

### 1. Configure Fabric Connection
```bash
cd ../../server

# Create Fabric wallet directory
mkdir -p wallet

# The server will automatically create wallet identities on first run
```

### 2. Start Backend Server
```bash
# Development mode with auto-restart
npm run dev

# Or production mode
npm start
```

### 3. Verify Backend is Running
```bash
# Test health endpoint
curl http://localhost:5000/health

# Expected response:
# {
#   "status": "OK",
#   "message": "🌿 HerbionYX API Server is running",
#   "timestamp": "2024-01-15T10:30:00.000Z",
#   "port": 5000
# }
```

### 4. Test Fabric Integration
```bash
# Test blockchain initialization
curl -X POST http://localhost:5000/api/blockchain/initialize

# Test batch ID generation
curl http://localhost:5000/api/blockchain/generate-batch-id
```

## 🌐 External Services Setup

### 1. IPFS/Pinata Setup
1. **Create Pinata Account**
   - Go to [pinata.cloud](https://pinata.cloud)
   - Sign up for free account
   - Navigate to API Keys section
   - Generate new API key with admin permissions

2. **Configure Pinata**
   ```bash
   # Add to .env file
   PINATA_API_KEY=your_actual_api_key
   PINATA_SECRET_KEY=your_actual_secret_key
   ```

3. **Test IPFS Upload**
   ```bash
   curl -X POST http://localhost:5000/api/ipfs/upload-json \
     -H "Content-Type: application/json" \
     -H "Authorization: Bearer your_jwt_token" \
     -d '{"jsonData": {"test": "data"}, "name": "test-upload"}'
   ```

### 2. SMS Service Setup (Optional)
1. **Create Fast2SMS Account**
   - Go to [fast2sms.com](https://fast2sms.com)
   - Sign up and verify phone number
   - Get API key from dashboard

2. **Configure SMS**
   ```bash
   # Add to .env file
   FAST2SMS_API_KEY=your_fast2sms_api_key
   ```

## 🔄 Daily Operations

### Starting the Complete System

**Terminal 1: Start Fabric Network**
```bash
cd fabric-network/scripts
./network.sh up
# Wait for "Network started successfully" message
```

**Terminal 2: Start Backend Server**
```bash
cd server
npm run dev
# Wait for "HerbionYX API Server running on port 5000"
```

**Terminal 3: Start Frontend (if needed)**
```bash
cd ..  # Back to project root
npm run dev
# Frontend will be available at http://localhost:5173
```

### Stopping the System
```bash
# Stop backend (Ctrl+C in Terminal 2)
# Stop frontend (Ctrl+C in Terminal 3)

# Stop Fabric network
cd fabric-network/scripts
./network.sh down
```

## 🛠️ Troubleshooting

### Common Issues & Solutions

#### 1. Port Conflicts
```bash
# Check if ports are in use
netstat -tulpn | grep -E ':(5000|5173|7050|7051|7054|5984)'

# Kill processes if needed
sudo lsof -ti:5000 | xargs kill -9  # Backend port
sudo lsof -ti:7050 | xargs kill -9  # Orderer port
```

#### 2. Docker Issues
```bash
# Restart Docker service
sudo systemctl restart docker  # Linux
# Or restart Docker Desktop on macOS/Windows

# Clean Docker system
docker system prune -f
docker volume prune -f
```

#### 3. Fabric Network Issues
```bash
# Complete network reset
cd fabric-network/scripts
./network.sh down
docker system prune -f
./network.sh up
./network.sh createChannel
./network.sh deployCC
```

#### 4. Certificate Issues
```bash
# Regenerate certificates
cd fabric-network/scripts
./generate-certs.sh
./network.sh up
```

#### 5. Backend Connection Issues
```bash
# Check if Fabric containers are running
docker ps

# Check backend logs
cd server
npm run dev  # Look for connection errors

# Test Fabric connectivity
cd ../fabric-network/scripts
./test-connectivity.sh
```

### Log Locations
- **Backend Logs**: Terminal output or `server/logs/` (if configured)
- **Fabric Orderer**: `docker logs orderer.herbionyx.com`
- **Fabric Peer**: `docker logs peer0.org1.herbionyx.com`
- **CouchDB**: `docker logs couchdb0`

## 🔧 Development Workflow

### Making Changes to Chaincode
```bash
# Edit chaincode
nano chaincode/index.js

# Redeploy chaincode
cd fabric-network/scripts
./network.sh deployCC
```

### Testing API Endpoints
```bash
# Test collection endpoint
curl -X POST http://localhost:5000/api/collection/create \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer your_jwt_token" \
  -d '{
    "herbSpecies": "Ashwagandha",
    "weight": "500",
    "harvestDate": "2024-01-15",
    "latitude": "28.6139",
    "longitude": "77.2090",
    "zone": "Central India - Madhya Pradesh"
  }'
```

### Monitoring Network Health
```bash
# Check container resource usage
docker stats

# Monitor chaincode logs
docker logs peer0.org1.herbionyx.com --follow

# Check CouchDB status
curl http://localhost:5984/_utils
```

## 📊 Performance Optimization

### Fabric Network Optimization
```bash
# Optimize peer configuration
# Edit fabric-network/docker-compose.yaml
# Increase memory limits for containers:
# - CORE_VM_DOCKER_HOSTCONFIG_MEMORY=2147483648  # 2GB
```

### Backend Optimization
```bash
# Use PM2 for production
npm install -g pm2
pm2 start server.js --name herbionyx-backend
pm2 startup
pm2 save
```

## 🔐 Security Configuration

### Production Security Checklist
- [ ] Change default JWT secret
- [ ] Configure TLS certificates for Fabric network
- [ ] Set up firewall rules (ports 5000, 7050, 7051, 7054, 5984)
- [ ] Enable HTTPS for backend API
- [ ] Configure proper CORS settings
- [ ] Set up rate limiting
- [ ] Enable audit logging

### Network Security
```bash
# Configure TLS for production
# Update fabric-network/docker-compose.yaml with real certificates
# Set proper domain names instead of localhost
```

## 📞 Support & Maintenance

### Backup Procedures
```bash
# Backup Fabric ledger data
docker cp peer0.org1.herbionyx.com:/var/hyperledger/production ./backup/peer-data
docker cp orderer.herbionyx.com:/var/hyperledger/production ./backup/orderer-data

# Backup certificates
tar -czf fabric-backup-$(date +%Y%m%d).tar.gz fabric-network/organizations/
```

### Regular Maintenance
- **Daily**: Check container status, monitor logs
- **Weekly**: Update dependencies, security patches
- **Monthly**: Performance analysis, backup verification

## 🎯 Quick Commands Reference

```bash
# Complete system startup
cd fabric-network/scripts && ./network.sh up
cd ../../server && npm run dev

# System health check
docker ps
curl http://localhost:5000/health
curl http://localhost:5173  # If frontend is running

# Complete system shutdown
cd fabric-network/scripts && ./network.sh down
# Stop backend with Ctrl+C

# Emergency reset
cd fabric-network/scripts
./network.sh down
docker system prune -f
./network.sh up
./network.sh createChannel
./network.sh deployCC
```

## 🔗 Integration with Frontend

Once your backend is running:

1. **Update Frontend Environment**
   ```bash
   # In project root, create .env.local
   echo "VITE_API_URL=http://localhost:5000" > .env.local
   ```

2. **Test Integration**
   - Start frontend: `npm run dev`
   - Login with demo credentials
   - Create a collection record
   - Verify data appears in Fabric network

3. **Monitor Integration**
   - Check browser network tab for API calls
   - Monitor backend logs for Fabric transactions
   - Verify data in CouchDB: http://localhost:5984/_utils

## 📱 API Testing

Use these curl commands to test your backend:

```bash
# Register user
curl -X POST http://localhost:5000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "address": "test_address",
    "privateKey": "test_private_key",
    "role": 1,
    "name": "Test User",
    "organization": "Test Org",
    "phone": "+1234567890",
    "email": "test@example.com",
    "password": "password123"
  }'

# Login
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "address": "test_address",
    "password": "password123"
  }'

# Create collection (use token from login response)
curl -X POST http://localhost:5000/api/collection/create \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -F "herbSpecies=Ashwagandha" \
  -F "weight=500" \
  -F "harvestDate=2024-01-15" \
  -F "latitude=28.6139" \
  -F "longitude=77.2090" \
  -F "zone=Central India - Madhya Pradesh"
```

This setup guide will get your Hyperledger Fabric backend running locally. The frontend is now optimized to automatically detect and connect to your backend when it's available, falling back to demo mode when it's not.

**Next Steps:**
1. Follow this guide to set up your backend
2. Start the Fabric network
3. Start the backend server
4. The frontend will automatically connect and show "Fabric Connected" status
5. You'll have full blockchain functionality with real Hyperledger Fabric transactions

Let me know if you need help with any specific step in the setup process!