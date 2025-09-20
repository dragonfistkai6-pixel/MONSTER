#!/bin/bash

# HerbionYX Fabric Network Management Script

CHANNEL_NAME="herbionyx-channel"
CHAINCODE_NAME="herbionyx-chaincode"
CHAINCODE_VERSION="1.0"
CHAINCODE_SEQUENCE="2"

# Set Fabric configuration paths
export FABRIC_CFG_PATH=${PWD}/../config
export CORE_PEER_TLS_ENABLED=true
export CORE_PEER_LOCALMSPID="Org1MSP"
export CORE_PEER_TLS_ROOTCERT_FILE=${PWD}/../organizations/peerOrganizations/org1.herbionyx.com/peers/peer0.org1.herbionyx.com/tls/ca.crt
export CORE_PEER_MSPCONFIGPATH=${PWD}/../organizations/peerOrganizations/org1.herbionyx.com/users/Admin@org1.herbionyx.com/msp
export CORE_PEER_ADDRESS=localhost:7051
export FABRIC_LOGGING_SPEC=INFO

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

function printHelp() {
  echo "Usage: "
  echo "  network.sh <Mode> [Flags]"
  echo "    <Mode>"
  echo "      - 'up' - Bring up the network"
  echo "      - 'down' - Clear the network"
  echo "      - 'restart' - Restart the network"
  echo "      - 'deployCC' - Deploy chaincode"
  echo "      - 'createChannel' - Create channel"
  echo "      - 'genesis' - Generate genesis block"
  echo
  echo "    Flags:"
  echo "    -c <channel name> - Channel name to use (default: \"herbionyx-channel\")"
  echo "    -ccn <name> - Chaincode name (default: \"herbionyx-chaincode\")"
  echo "    -ccv <version> - Chaincode version (default: \"1.0\")"
  echo
  echo " Examples:"
  echo "   network.sh up"
  echo "   network.sh down"
  echo "   network.sh deployCC"
}

function networkUp() {
  echo -e "${GREEN}Starting HerbionYX Fabric Network...${NC}"
  
  # Clean up any existing containers and networks
  echo -e "${YELLOW}Cleaning up existing containers...${NC}"
  cd ..
  docker-compose down --volumes --remove-orphans
  docker system prune -f
  cd scripts
  
  # Generate crypto material
  echo -e "${YELLOW}Generating certificates...${NC}"
  ./generate-certs.sh
  
  # Verify certificates exist
  echo -e "${YELLOW}Verifying certificate structure...${NC}"
  if [ ! -d "../organizations/peerOrganizations/org1.herbionyx.com" ]; then
    echo -e "${RED}Error: Peer organization not found${NC}"
    exit 1
  fi
  
  if [ ! -d "../organizations/ordererOrganizations/herbionyx.com" ]; then
    echo -e "${RED}Error: Orderer organization not found${NC}"
    exit 1
  fi
  
  # Generate genesis block BEFORE starting containers
  echo -e "${YELLOW}Generating genesis block...${NC}"
  generateGenesis
  
  # Start the network
  echo -e "${YELLOW}Starting Docker containers...${NC}"
  cd ..
  docker-compose up -d
  cd scripts
  
  # Wait for containers to start
  echo -e "${YELLOW}Waiting for containers to start...${NC}"
  sleep 30
  
  # Check container status
  echo -e "${YELLOW}Checking container status...${NC}"
  cd ..
  docker-compose ps
  cd scripts
  
  echo -e "${GREEN}✅ Network started successfully!${NC}"
}

function networkDown() {
  echo -e "${RED}Stopping HerbionYX Fabric Network...${NC}"
  
  # Stop containers
  cd ..
  docker-compose down --volumes --remove-orphans
  cd scripts
  
  # Remove chaincode images
  docker rmi $(docker images | grep herbionyx-chaincode | awk '{print $3}') 2>/dev/null || true
  
  # Clean up
  docker system prune -f
  
  echo -e "${GREEN}✅ Network stopped and cleaned up!${NC}"
}

function generateGenesis() {
  echo -e "${GREEN}Generating genesis block...${NC}"
  
  # Create channel-artifacts directory
  mkdir -p ../channel-artifacts
  
  # Generate genesis block for system channel
  configtxgen -profile HerbionYXSystemChannel -channelID system-channel -outputBlock ../channel-artifacts/genesis.block
  
  if [ $? -ne 0 ]; then
    echo -e "${RED}Failed to generate genesis block${NC}"
    exit 1
  fi
  
  echo -e "${GREEN}✅ Genesis block generated successfully!${NC}"
}

function createChannel() {
  echo -e "${GREEN}Creating channel: ${CHANNEL_NAME}${NC}"
  
  # Generate channel configuration transaction
  echo -e "${YELLOW}Generating channel configuration transaction...${NC}"
  configtxgen -profile HerbionYXChannel -outputCreateChannelTx ../channel-artifacts/${CHANNEL_NAME}.tx -channelID $CHANNEL_NAME
  
  if [ $? -ne 0 ]; then
    echo -e "${RED}Failed to generate channel configuration transaction${NC}"
    exit 1
  fi
  
  # Create channel using CLI container with improved connectivity
  echo -e "${YELLOW}Creating channel using CLI container...${NC}"
  
  # First, test basic connectivity
  echo -e "${YELLOW}Testing container connectivity...${NC}"
  
  # Wait for CLI container to be ready with network utilities
  echo -e "${YELLOW}Waiting for CLI container to be ready...${NC}"
  for i in {1..30}; do
    if docker exec cli which ping > /dev/null 2>&1; then
      echo -e "${GREEN}CLI container is ready with network utilities${NC}"
      break
    fi
    echo "Waiting for CLI container setup... ($i/30)"
    sleep 2
  done
  
  # Test connectivity using netcat instead of ping
  echo -e "${YELLOW}Testing orderer connectivity...${NC}"
  if docker exec cli nc -z orderer.herbionyx.com 7050; then
    echo -e "${GREEN}✅ Orderer is reachable on port 7050${NC}"
  else
    echo -e "${RED}❌ Cannot reach orderer on port 7050${NC}"
    echo -e "${YELLOW}Checking if orderer container is running...${NC}"
    docker ps --filter name=orderer.herbionyx.com
    echo -e "${YELLOW}Checking orderer logs...${NC}"
    docker logs orderer.herbionyx.com --tail 20
    exit 1
  fi
  
  # Test peer connectivity
  echo -e "${YELLOW}Testing peer connectivity...${NC}"
  if docker exec cli nc -z peer0.org1.herbionyx.com 7051; then
    echo -e "${GREEN}✅ Peer is reachable on port 7051${NC}"
  else
    echo -e "${RED}❌ Cannot reach peer on port 7051${NC}"
    exit 1
  fi
  
  # Create the channel
  docker exec cli peer channel create \
    -o orderer.herbionyx.com:7050 \
    -c $CHANNEL_NAME \
    --ordererTLSHostnameOverride orderer.herbionyx.com \
    -f ./channel-artifacts/${CHANNEL_NAME}.tx \
    --outputBlock ./channel-artifacts/${CHANNEL_NAME}.block \
    --tls \
    --cafile /opt/gopath/src/github.com/hyperledger/fabric/peer/crypto/ordererOrganizations/herbionyx.com/orderers/orderer.herbionyx.com/msp/tlscacerts/tlsca.herbionyx.com-cert.pem
  
  if [ $? -ne 0 ]; then
    echo -e "${RED}Failed to create channel${NC}"
    echo -e "${YELLOW}Checking orderer logs...${NC}"
    docker logs orderer.herbionyx.com --tail 50
    exit 1
  fi
  
  # Join channel using CLI container
  echo -e "${YELLOW}Joining channel using CLI container...${NC}"
  docker exec cli peer channel join -b ./channel-artifacts/${CHANNEL_NAME}.block
  
  if [ $? -ne 0 ]; then
    echo -e "${RED}Failed to join channel${NC}"
    exit 1
  fi
  
  # Update anchor peers
  echo -e "${YELLOW}Updating anchor peers...${NC}"
  configtxgen -profile HerbionYXChannel -outputAnchorPeersUpdate ../channel-artifacts/Org1MSPanchors.tx -channelID $CHANNEL_NAME -asOrg Org1MSP
  
  docker exec cli peer channel update \
    -o orderer.herbionyx.com:7050 \
    -c $CHANNEL_NAME \
    -f ./channel-artifacts/Org1MSPanchors.tx \
    --tls \
    --cafile /opt/gopath/src/github.com/hyperledger/fabric/peer/crypto/ordererOrganizations/herbionyx.com/orderers/orderer.herbionyx.com/msp/tlscacerts/tlsca.herbionyx.com-cert.pem
  
  echo -e "${GREEN}✅ Channel created and joined successfully!${NC}"
}

function deployChaincode() {
  echo -e "${GREEN}Deploying chaincode: ${CHAINCODE_NAME}${NC}"
  
  # Package chaincode using CLI container
  echo -e "${YELLOW}Packaging chaincode...${NC}"
  docker exec cli peer lifecycle chaincode package ${CHAINCODE_NAME}.tar.gz \
    --path /opt/gopath/src/github.com/chaincode \
    --lang node \
    --label ${CHAINCODE_NAME}_${CHAINCODE_VERSION}
  
  if [ $? -ne 0 ]; then
    echo -e "${RED}Failed to package chaincode${NC}"
    exit 1
  fi
  
  # Install chaincode using CLI container
  echo -e "${YELLOW}Installing chaincode...${NC}"
  docker exec cli peer lifecycle chaincode install ${CHAINCODE_NAME}.tar.gz
  
  if [ $? -ne 0 ]; then
    echo -e "${RED}Failed to install chaincode${NC}"
    exit 1
  fi
  
  # Get package ID using CLI container
  echo -e "${YELLOW}Getting package ID...${NC}"
  PACKAGE_ID=$(docker exec cli peer lifecycle chaincode queryinstalled --output json | jq -r '.installed_chaincodes[0].package_id')
  echo "Package ID: $PACKAGE_ID"
  
  if [ -z "$PACKAGE_ID" ]; then
    echo -e "${RED}Failed to get package ID${NC}"
    exit 1
  fi
  
  # Approve chaincode using CLI container
  echo -e "${YELLOW}Approving chaincode...${NC}"
  docker exec cli peer lifecycle chaincode approveformyorg \
    -o orderer.herbionyx.com:7050 \
    --ordererTLSHostnameOverride orderer.herbionyx.com \
    --channelID $CHANNEL_NAME \
    --name $CHAINCODE_NAME \
    --version $CHAINCODE_VERSION \
    --package-id $PACKAGE_ID \
    --sequence $CHAINCODE_SEQUENCE \
    --tls \
    --cafile /opt/gopath/src/github.com/hyperledger/fabric/peer/crypto/ordererOrganizations/herbionyx.com/orderers/orderer.herbionyx.com/msp/tlscacerts/tlsca.herbionyx.com-cert.pem
  
  if [ $? -ne 0 ]; then
    echo -e "${RED}Failed to approve chaincode${NC}"
    exit 1
  fi
  
  # Check commit readiness using CLI container
  echo -e "${YELLOW}Checking commit readiness...${NC}"
  docker exec cli peer lifecycle chaincode checkcommitreadiness \
    --channelID $CHANNEL_NAME \
    --name $CHAINCODE_NAME \
    --version $CHAINCODE_VERSION \
    --sequence $CHAINCODE_SEQUENCE \
    --tls \
    --cafile /opt/gopath/src/github.com/hyperledger/fabric/peer/crypto/ordererOrganizations/herbionyx.com/orderers/orderer.herbionyx.com/msp/tlscacerts/tlsca.herbionyx.com-cert.pem \
    --output json
  
  # Commit chaincode using CLI container
  echo -e "${YELLOW}Committing chaincode...${NC}"
  docker exec cli peer lifecycle chaincode commit \
    -o orderer.herbionyx.com:7050 \
    --ordererTLSHostnameOverride orderer.herbionyx.com \
    --channelID $CHANNEL_NAME \
    --name $CHAINCODE_NAME \
    --version $CHAINCODE_VERSION \
    --sequence $CHAINCODE_SEQUENCE \
    --tls \
    --cafile /opt/gopath/src/github.com/hyperledger/fabric/peer/crypto/ordererOrganizations/herbionyx.com/orderers/orderer.herbionyx.com/msp/tlscacerts/tlsca.herbionyx.com-cert.pem \
    --peerAddresses peer0.org1.herbionyx.com:7051 \
    --tlsRootCertFiles /opt/gopath/src/github.com/hyperledger/fabric/peer/crypto/peerOrganizations/org1.herbionyx.com/peers/peer0.org1.herbionyx.com/tls/ca.crt
  
  if [ $? -ne 0 ]; then
    echo -e "${RED}Failed to commit chaincode${NC}"
    exit 1
  fi
  
  # Initialize chaincode using CLI container
  echo -e "${YELLOW}Initializing chaincode...${NC}"
  docker exec cli peer chaincode invoke \
    -o orderer.herbionyx.com:7050 \
    --ordererTLSHostnameOverride orderer.herbionyx.com \
    --tls \
    --cafile /opt/gopath/src/github.com/hyperledger/fabric/peer/crypto/ordererOrganizations/herbionyx.com/orderers/orderer.herbionyx.com/msp/tlscacerts/tlsca.herbionyx.com-cert.pem \
    -C $CHANNEL_NAME \
    -n $CHAINCODE_NAME \
    -c '{"function":"initLedger","Args":[]}'
  
  if [ $? -ne 0 ]; then
    echo -e "${RED}Failed to initialize chaincode${NC}"
    exit 1
  fi
  
  echo -e "${GREEN}✅ Chaincode deployed successfully!${NC}"
}

# Parse command line arguments
if [[ $# -lt 1 ]] ; then
  printHelp
  exit 0
else
  MODE=$1
  shift
fi

# Parse flags
while [[ $# -ge 1 ]] ; do
  key="$1"
  case $key in
  -c )
    CHANNEL_NAME="$2"
    shift
    ;;
  -ccn )
    CHAINCODE_NAME="$2"
    shift
    ;;
  -ccv )
    CHAINCODE_VERSION="$2"
    shift
    ;;
  * )
    echo "Unknown flag: $key"
    printHelp
    exit 1
    ;;
  esac
  shift
done

# Execute based on mode
case $MODE in
  up )
    networkUp
    ;;
  genesis )
    generateGenesis
    ;;
  down )
    networkDown
    ;;
  restart )
    networkDown
    sleep 2
    networkUp
    ;;
  createChannel )
    createChannel
    ;;
  deployCC )
    deployChaincode
    ;;
  * )
    printHelp
    exit 1
esac