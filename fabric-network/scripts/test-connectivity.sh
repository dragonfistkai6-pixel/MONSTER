#!/bin/bash

# Test connectivity script for HerbionYX Fabric Network

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${GREEN}🔍 Testing HerbionYX Fabric Network Connectivity${NC}"
echo "=================================================="

# Check if containers are running
echo -e "${YELLOW}1. Checking container status...${NC}"
CONTAINERS=("orderer.herbionyx.com" "peer0.org1.herbionyx.com" "cli" "couchdb0")

for container in "${CONTAINERS[@]}"; do
    if docker ps --format '{{.Names}}' | grep -q "^${container}$"; then
        echo -e "✅ ${container} is running"
    else
        echo -e "❌ ${container} is not running"
        exit 1
    fi
done

# Wait for CLI container to be ready
echo -e "\n${YELLOW}2. Waiting for CLI container to be ready...${NC}"
for i in {1..60}; do
    if docker exec cli which nc > /dev/null 2>&1; then
        echo -e "✅ CLI container is ready with network utilities"
        break
    fi
    if [ $i -eq 60 ]; then
        echo -e "❌ CLI container setup timeout"
        exit 1
    fi
    echo "Waiting for CLI container setup... ($i/60)"
    sleep 2
done

# Test network connectivity
echo -e "\n${YELLOW}3. Testing network connectivity...${NC}"

# Test orderer connectivity
if docker exec cli nc -z orderer.herbionyx.com 7050; then
    echo -e "✅ Orderer reachable on port 7050"
else
    echo -e "❌ Cannot reach orderer on port 7050"
    exit 1
fi

# Test peer connectivity
if docker exec cli nc -z peer0.org1.herbionyx.com 7051; then
    echo -e "✅ Peer reachable on port 7051"
else
    echo -e "❌ Cannot reach peer on port 7051"
    exit 1
fi

# Test CouchDB connectivity
if docker exec cli nc -z couchdb0 5984; then
    echo -e "✅ CouchDB reachable on port 5984"
else
    echo -e "❌ Cannot reach CouchDB on port 5984"
    exit 1
fi

# Test TLS certificates
echo -e "\n${YELLOW}4. Testing TLS certificates...${NC}"

# Check if orderer TLS cert exists
if docker exec cli test -f /opt/gopath/src/github.com/hyperledger/fabric/peer/crypto/ordererOrganizations/herbionyx.com/orderers/orderer.herbionyx.com/msp/tlscacerts/tlsca.herbionyx.com-cert.pem; then
    echo -e "✅ Orderer TLS certificate found"
else
    echo -e "❌ Orderer TLS certificate missing"
    exit 1
fi

# Check if peer TLS cert exists
if docker exec cli test -f /opt/gopath/src/github.com/hyperledger/fabric/peer/crypto/peerOrganizations/org1.herbionyx.com/peers/peer0.org1.herbionyx.com/tls/ca.crt; then
    echo -e "✅ Peer TLS certificate found"
else
    echo -e "❌ Peer TLS certificate missing"
    exit 1
fi

# Test peer CLI commands
echo -e "\n${YELLOW}5. Testing peer CLI commands...${NC}"

# Test peer version
if docker exec cli peer version > /dev/null 2>&1; then
    echo -e "✅ Peer CLI working"
else
    echo -e "❌ Peer CLI not working"
    exit 1
fi

# Test peer list channels (should fail before channel creation, but command should work)
docker exec cli peer channel list > /dev/null 2>&1
if [ $? -eq 0 ] || [ $? -eq 1 ]; then
    echo -e "✅ Peer channel commands working"
else
    echo -e "❌ Peer channel commands not working"
    exit 1
fi

echo -e "\n${GREEN}🎉 All connectivity tests passed!${NC}"
echo -e "${GREEN}Network is ready for channel creation and chaincode deployment.${NC}"