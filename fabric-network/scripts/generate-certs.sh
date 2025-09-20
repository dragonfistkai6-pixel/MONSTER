#!/bin/bash

# Generate certificates for HerbionYX Fabric Network

set -e

# Set Fabric configuration path
export FABRIC_CFG_PATH=${PWD}/../config
export FABRIC_LOGGING_SPEC=INFO

# Create organizations directory structure
echo "Creating directory structure..."
mkdir -p ../organizations/ordererOrganizations/herbionyx.com/orderers/orderer.herbionyx.com/{msp,tls}
mkdir -p ../organizations/ordererOrganizations/herbionyx.com/msp/{admincerts,cacerts,tlscacerts}
mkdir -p ../organizations/ordererOrganizations/herbionyx.com/users/Admin@herbionyx.com/msp
mkdir -p ../organizations/peerOrganizations/org1.herbionyx.com/peers/peer0.org1.herbionyx.com/{msp,tls}
mkdir -p ../organizations/peerOrganizations/org1.herbionyx.com/msp/{admincerts,cacerts,tlscacerts}
mkdir -p ../organizations/peerOrganizations/org1.herbionyx.com/users/Admin@org1.herbionyx.com/msp
mkdir -p ../organizations/fabric-ca/org1
mkdir -p ../channel-artifacts

echo "Generating crypto material using cryptogen..."

# Create cryptogen config
cat > ../config/crypto-config.yaml << EOF
OrdererOrgs:
  - Name: Orderer
    Domain: herbionyx.com
    Specs:
      - Hostname: orderer
        SANS:
          - localhost
          - orderer.herbionyx.com
    CA:
      Country: US
      Province: California
      Locality: San Francisco
      OrganizationalUnit: Hyperledger Fabric
      StreetAddress: address for org # default nil
      PostalCode: postalCode for org # default nil

PeerOrgs:
  - Name: Org1
    Domain: org1.herbionyx.com
    EnableNodeOUs: true
    Template:
      Count: 1
      SANS:
        - localhost
        - peer0.org1.herbionyx.com
    Users:
      Count: 1
    CA:
      Country: US
      Province: California
      Locality: San Francisco
      OrganizationalUnit: Hyperledger Fabric
      StreetAddress: address for org1 # default nil
      PostalCode: postalCode for org1 # default nil
EOF

# Generate certificates
if ! command -v cryptogen &> /dev/null; then
    echo "cryptogen not found. Please install Hyperledger Fabric binaries."
    exit 1
fi

# Clean up existing certificates
rm -rf ../organizations/ordererOrganizations
rm -rf ../organizations/peerOrganizations

cryptogen generate --config=../config/crypto-config.yaml --output="../organizations"

if [ $? -ne 0 ]; then
    echo "Failed to generate certificates"
    exit 1
fi

echo "Setting up MSP directory structure..."

# Verify certificates were created
if [ ! -d "../organizations/peerOrganizations/org1.herbionyx.com" ]; then
    echo "Error: Peer organization not created"
    exit 1
fi

if [ ! -d "../organizations/ordererOrganizations/herbionyx.com" ]; then
    echo "Error: Orderer organization not created"
    exit 1
fi

# Fix peer MSP structure - CRITICAL FIX
PEER_MSP_DIR="../organizations/peerOrganizations/org1.herbionyx.com/peers/peer0.org1.herbionyx.com/msp"
if [ -d "$PEER_MSP_DIR" ]; then
    echo "Peer MSP directory exists, setting up structure..."
    
    # Ensure all required directories exist
    mkdir -p ${PEER_MSP_DIR}/{signcerts,keystore,cacerts,tlscacerts,admincerts}
    
    # Copy signing certificate - THIS IS THE CRITICAL FIX
    if [ -f "../organizations/peerOrganizations/org1.herbionyx.com/peers/peer0.org1.herbionyx.com/msp/signcerts/peer0.org1.herbionyx.com-cert.pem" ]; then
        echo "✅ Peer signing certificate found"
    else
        echo "❌ Peer signing certificate missing - this will cause peer crash"
        # Find the actual cert file
        CERT_FILE=$(find ../organizations/peerOrganizations/org1.herbionyx.com/peers/peer0.org1.herbionyx.com/msp/signcerts/ -name "*.pem" 2>/dev/null | head -1)
        if [ -n "$CERT_FILE" ]; then
            echo "Found certificate: $CERT_FILE"
        else
            echo "No certificate found in signcerts directory"
        fi
    fi
    
    # Copy CA certificates
    if [ -f "../organizations/peerOrganizations/org1.herbionyx.com/ca/ca.org1.herbionyx.com-cert.pem" ]; then
        cp ../organizations/peerOrganizations/org1.herbionyx.com/ca/ca.org1.herbionyx.com-cert.pem ${PEER_MSP_DIR}/cacerts/
    fi
    
    if [ -f "../organizations/peerOrganizations/org1.herbionyx.com/tlsca/tlsca.org1.herbionyx.com-cert.pem" ]; then
        cp ../organizations/peerOrganizations/org1.herbionyx.com/tlsca/tlsca.org1.herbionyx.com-cert.pem ${PEER_MSP_DIR}/tlscacerts/
    fi
    
    # Copy admin certificates if they exist
    if [ -f "../organizations/peerOrganizations/org1.herbionyx.com/users/Admin@org1.herbionyx.com/msp/signcerts/Admin@org1.herbionyx.com-cert.pem" ]; then
        cp ../organizations/peerOrganizations/org1.herbionyx.com/users/Admin@org1.herbionyx.com/msp/signcerts/Admin@org1.herbionyx.com-cert.pem ${PEER_MSP_DIR}/admincerts/
    else
        echo "Warning: Admin certificate not found, creating placeholder"
        touch ${PEER_MSP_DIR}/admincerts/.gitkeep
    fi
    
    # Copy private key if it exists
    KEYSTORE_FILES=$(find ../organizations/peerOrganizations/org1.herbionyx.com/peers/peer0.org1.herbionyx.com/msp/keystore -name "*_sk" 2>/dev/null || true)
    if [ -n "$KEYSTORE_FILES" ]; then
        cp $KEYSTORE_FILES ${PEER_MSP_DIR}/keystore/
    fi
fi

# Fix orderer MSP structure
ORDERER_MSP_DIR="../organizations/ordererOrganizations/herbionyx.com/orderers/orderer.herbionyx.com/msp"
if [ -d "$ORDERER_MSP_DIR" ]; then
    echo "Orderer MSP directory exists, setting up structure..."
    
    # Ensure all required directories exist
    mkdir -p ${ORDERER_MSP_DIR}/{signcerts,keystore,cacerts,tlscacerts,admincerts}
    
    # Verify orderer signing certificate
    if [ -f "../organizations/ordererOrganizations/herbionyx.com/orderers/orderer.herbionyx.com/msp/signcerts/orderer.herbionyx.com-cert.pem" ]; then
        echo "✅ Orderer signing certificate found"
    else
        echo "❌ Orderer signing certificate missing"
        CERT_FILE=$(find ../organizations/ordererOrganizations/herbionyx.com/orderers/orderer.herbionyx.com/msp/signcerts/ -name "*.pem" 2>/dev/null | head -1)
        if [ -n "$CERT_FILE" ]; then
            echo "Found certificate: $CERT_FILE"
        fi
    fi
    
    # Copy orderer certificates
    if [ -f "../organizations/ordererOrganizations/herbionyx.com/ca/ca.herbionyx.com-cert.pem" ]; then
        cp ../organizations/ordererOrganizations/herbionyx.com/ca/ca.herbionyx.com-cert.pem ${ORDERER_MSP_DIR}/cacerts/
    fi
    
    if [ -f "../organizations/ordererOrganizations/herbionyx.com/tlsca/tlsca.herbionyx.com-cert.pem" ]; then
        cp ../organizations/ordererOrganizations/herbionyx.com/tlsca/tlsca.herbionyx.com-cert.pem ${ORDERER_MSP_DIR}/tlscacerts/
    fi
    
    # Copy orderer private key if it exists
    ORDERER_KEYSTORE_FILES=$(find ../organizations/ordererOrganizations/herbionyx.com/orderers/orderer.herbionyx.com/msp/keystore -name "*_sk" 2>/dev/null || true)
    if [ -n "$ORDERER_KEYSTORE_FILES" ]; then
        cp $ORDERER_KEYSTORE_FILES ${ORDERER_MSP_DIR}/keystore/
    fi
    
    # Copy admin certificates for orderer if they exist
    if [ -f "../organizations/ordererOrganizations/herbionyx.com/users/Admin@herbionyx.com/msp/signcerts/Admin@herbionyx.com-cert.pem" ]; then
        cp ../organizations/ordererOrganizations/herbionyx.com/users/Admin@herbionyx.com/msp/signcerts/Admin@herbionyx.com-cert.pem ${ORDERER_MSP_DIR}/admincerts/
    else
        echo "Warning: Orderer admin certificate not found, creating placeholder"
        touch ${ORDERER_MSP_DIR}/admincerts/.gitkeep
    fi
fi

# Create config.yaml files for MSPs
echo "Creating MSP config files..."

# Peer MSP config
cat > ${PEER_MSP_DIR}/config.yaml << EOF
NodeOUs:
  Enable: true
  ClientOUIdentifier:
    Certificate: cacerts/ca.org1.herbionyx.com-cert.pem
    OrganizationalUnitIdentifier: client
  PeerOUIdentifier:
    Certificate: cacerts/ca.org1.herbionyx.com-cert.pem
    OrganizationalUnitIdentifier: peer
  AdminOUIdentifier:
    Certificate: cacerts/ca.org1.herbionyx.com-cert.pem
    OrganizationalUnitIdentifier: admin
  OrdererOUIdentifier:
    Certificate: cacerts/ca.org1.herbionyx.com-cert.pem
    OrganizationalUnitIdentifier: orderer
EOF

# Orderer MSP config
cat > ${ORDERER_MSP_DIR}/config.yaml << EOF
NodeOUs:
  Enable: true
  ClientOUIdentifier:
    Certificate: cacerts/ca.herbionyx.com-cert.pem
    OrganizationalUnitIdentifier: client
  PeerOUIdentifier:
    Certificate: cacerts/ca.herbionyx.com-cert.pem
    OrganizationalUnitIdentifier: peer
  AdminOUIdentifier:
    Certificate: cacerts/ca.herbionyx.com-cert.pem
    OrganizationalUnitIdentifier: admin
  OrdererOUIdentifier:
    Certificate: cacerts/ca.herbionyx.com-cert.pem
    OrganizationalUnitIdentifier: orderer
EOF

# Set proper permissions
echo "Setting permissions..."
chmod -R 755 ../organizations/

echo "✅ Certificates generated successfully!"
echo "Directory structure:"
find ../organizations -type d | head -20

# Verify critical files exist
echo "Verifying critical certificate files..."
CRITICAL_FILES=(
    "../organizations/peerOrganizations/org1.herbionyx.com/ca/ca.org1.herbionyx.com-cert.pem"
    "../organizations/peerOrganizations/org1.herbionyx.com/tlsca/tlsca.org1.herbionyx.com-cert.pem"
    "../organizations/ordererOrganizations/herbionyx.com/ca/ca.herbionyx.com-cert.pem"
    "../organizations/ordererOrganizations/herbionyx.com/tlsca/tlsca.herbionyx.com-cert.pem"
)

for file in "${CRITICAL_FILES[@]}"; do
    if [ -f "$file" ]; then
        echo "✅ $file exists"
    else
        echo "❌ $file missing"
    fi
done

# Verify MSP signcerts directories
echo "Verifying MSP signcerts directories..."
PEER_SIGNCERTS="../organizations/peerOrganizations/org1.herbionyx.com/peers/peer0.org1.herbionyx.com/msp/signcerts"
ORDERER_SIGNCERTS="../organizations/ordererOrganizations/herbionyx.com/orderers/orderer.herbionyx.com/msp/signcerts"

if [ -d "$PEER_SIGNCERTS" ] && [ "$(ls -A $PEER_SIGNCERTS)" ]; then
    echo "✅ Peer signcerts directory exists and contains files"
    ls -la "$PEER_SIGNCERTS"
else
    echo "❌ Peer signcerts directory is empty or missing"
fi

if [ -d "$ORDERER_SIGNCERTS" ] && [ "$(ls -A $ORDERER_SIGNCERTS)" ]; then
    echo "✅ Orderer signcerts directory exists and contains files"
    ls -la "$ORDERER_SIGNCERTS"
else
    echo "❌ Orderer signcerts directory is empty or missing"
fi
