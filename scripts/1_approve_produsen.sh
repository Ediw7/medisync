# =================================================================
# File: scripts/1_approve_produsen.sh
# (PERBAIKAN: Hapus peerAddresses yang tidak perlu)
# =================================================================
#!/bin/bash
set -e
export CHANNEL_NAME="medisyncchannel"
export CC_NAME="medisync"
export CC_VERSION="1.3"
export CC_SEQUENCE="1"
export PACKAGE_ID=$(cat scripts/package.id)
echo "Menyetujui chaincode sebagai PRODUSEN (Org1)..."
docker exec -e CORE_PEER_ADDRESS=peer0.org1.medisync.com:7051 -e CORE_PEER_MSPCONFIGPATH=/opt/gopath/src/github.com/hyperledger/fabric/peer/crypto/peerOrganizations/org1.medisync.com/users/Admin@org1.medisync.com/msp \
    cli peer lifecycle chaincode approveformyorg \
    -o orderer.medisync.com:7050 --ordererTLSHostnameOverride orderer.medisync.com \
    --channelID $CHANNEL_NAME --name ${CC_NAME} --version ${CC_VERSION} --package-id ${PACKAGE_ID} --sequence ${CC_SEQUENCE} \
    --tls --cafile /opt/gopath/src/github.com/hyperledger/fabric/peer/crypto/ordererOrganizations/medisync.com/orderers/orderer.medisync.com/msp/tlscacerts/tlsca.medisync.com-cert.pem
echo "Chaincode disetujui oleh Produsen."