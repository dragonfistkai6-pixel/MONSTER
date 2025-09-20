# HerbionYX Hyperledger Fabric Setup Guide

## Prerequisites Installation

### 1. Install Docker and Docker Compose
```bash
# Install Docker (Ubuntu/Debian)
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh
sudo usermod -aG docker $USER

# Install Docker Compose
sudo curl -L "https://github.com/docker/compose/releases/download/v2.21.0/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
sudo chmod +x /usr/local/bin/docker-compose

# Verify installation
docker --version
docker-compose --version
```

### 2. Install Node.js and npm
```bash
# Install Node.js 18.x
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs

# Verify installation
 
```

### 3. Install Hyperledger Fabric Binaries
```bash
# Create directory for Fabric binaries
mkdir -p ~/fabric-samples/bin
cd ~/fabric-samples

# Download Fabric binaries and Docker images
curl -sSL https://bit.ly/2ysbOFE | bash -s -- 2.5.4 1.5.7

# Add binaries to PATH
echo 'export PATH=$PATH:~/fabric-samples/bin' >> ~/.bashrc
source ~/.bashrc

# Verify installation
peer version
orderer version
cryptogen version
```

### 4. Install jq (JSON processor)
```bash
sudo apt-get install jq
```

## Network Setup Commands

### 1. Navigate to Project Directory
```bash
cd /path/to/your/herbionyx-project
```

### 2. Make Scripts Executable
```bash
chmod +x fabric-network/scripts/*.sh
```

### 3. Start the Fabric Network
```bash
cd fabric-network/scripts
./network.sh up
```

### 4. Create Channel
```bash
./network.sh createChannel
```

### 5. Deploy Chaincode
```bash
./network.sh deployCC
```

### 6. Install Backend Dependencies
```bash
cd ../../server
npm install
```

### 7. Start Backend Server
```bash
npm run dev
```

### 8. Install Frontend Dependencies (New Terminal)
```bash
cd ..
npm install
```

### 9. Start Frontend
```bash
npm run dev
```

## Verification Steps

### 1. Check Docker Containers
```bash
docker ps
```
You should see containers for:
- orderer.herbionyx.com
- peer0.org1.herbionyx.com
- ca.org1.herbionyx.com
- couchdb0

### 2. Test Chaincode
```bash
# Set environment variables
export CORE_PEER_TLS_ENABLED=true
export CORE_PEER_LOCALMSPID="Org1MSP"
export CORE_PEER_TLS_ROOTCERT_FILE=${PWD}/fabric-network/organizations/peerOrganizations/org1.herbionyx.com/peers/peer0.org1.herbionyx.com/tls/ca.crt
export CORE_PEER_MSPCONFIGPATH=${PWD}/fabric-network/organizations/peerOrganizations/org1.herbionyx.com/users/Admin@org1.herbionyx.com/msp
export CORE_PEER_ADDRESS=localhost:7051

# Test chaincode invocation
peer chaincode invoke -o localhost:7050 --ordererTLSHostnameOverride orderer.herbionyx.com --tls --cafile ${PWD}/fabric-network/organizations/ordererOrganizations/herbionyx.com/orderers/orderer.herbionyx.com/msp/tlscacerts/tlsca.herbionyx.com-cert.pem -C herbionyx-channel -n herbionyx-chaincode -c '{"function":"initLedger","Args":[]}'
```

### 3. Access Application
- Frontend: http://localhost:5173
- Backend API: http://localhost:5000
- CouchDB: http://localhost:5984/_utils

## Troubleshooting

### Common Issues:

1. **Port Conflicts**: Ensure ports 7050, 7051, 7054, 5984, 5000, 5173 are available
2. **Permission Denied**: Run `sudo chmod +x fabric-network/scripts/*.sh`
3. **Docker Issues**: Restart Docker service: `sudo systemctl restart docker`
4. **Network Already Exists**: Run `./network.sh down` then `./network.sh up`

### Clean Restart:
```bash
cd fabric-network/scripts
./network.sh down
docker system prune -f
./network.sh up
./network.sh createChannel
./network.sh deployCC
```

## Production Deployment

For production deployment on a server:

### 1. Server Requirements
- Ubuntu 20.04+ or CentOS 8+
- 4+ CPU cores
- 8+ GB RAM
- 50+ GB storage
- Docker and Docker Compose installed

### 2. Security Configuration
- Use TLS certificates for all communications
- Configure firewall rules
- Set up proper user permissions
- Use environment variables for sensitive data

### 3. Network Configuration
Update `fabric-network/docker-compose.yaml` for production:
- Change localhost to actual server IPs
- Configure proper domain names
- Set up load balancers if needed

### 4. Monitoring
- Set up logging aggregation
- Configure health checks
- Monitor container resources
- Set up alerts for failures

This completes the Hyperledger Fabric setup for the HerbionYX traceability system.