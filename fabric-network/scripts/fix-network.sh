#!/bin/bash

# Fix network issues script for HerbionYX Fabric Network

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${GREEN}🔧 Fixing HerbionYX Fabric Network Issues${NC}"
echo "=============================================="

# Stop and remove existing containers
echo -e "${YELLOW}1. Cleaning up existing containers...${NC}"
cd ..
docker-compose down --volumes --remove-orphans
docker system prune -f

# Remove old volumes
echo -e "${YELLOW}2. Removing old volumes...${NC}"
docker volume rm $(docker volume ls -q --filter name=fabric-network) 2>/dev/null || true

# Regenerate certificates
echo -e "${YELLOW}3. Regenerating certificates...${NC}"
cd scripts
./generate-certs.sh

# Generate genesis block
echo -e "${YELLOW}4. Generating genesis block...${NC}"
mkdir -p ../channel-artifacts
configtxgen -profile HerbionYXSystemChannel -channelID system-channel -outputBlock ../channel-artifacts/genesis.block

if [ $? -ne 0 ]; then
    echo -e "${RED}Failed to generate genesis block${NC}"
    exit 1
fi

# Start containers
echo -e "${YELLOW}5. Starting containers...${NC}"
cd ..
docker-compose up -d

# Wait for containers to be ready
echo -e "${YELLOW}6. Waiting for containers to be ready...${NC}"
sleep 30

# Check container status
echo -e "${YELLOW}7. Checking container status...${NC}"
docker-compose ps

# Test connectivity
echo -e "${YELLOW}8. Testing connectivity...${NC}"
cd scripts
./test-connectivity.sh

echo -e "\n${GREEN}🎉 Network fix completed successfully!${NC}"
echo -e "${GREEN}You can now run: ./network.sh createChannel${NC}"