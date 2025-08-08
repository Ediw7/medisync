
# =================================================================
# File: scripts/4_commit.sh
# Tujuan: Melakukan commit setelah persetujuan terkumpul.
# Cara Menjalankan: ./scripts/4_commit.sh
# =================================================================
#!/bin/bash
set -e

export CHANNEL_NAME="medisyncchannel"
export CC_NAME="medisync"
export CC_VERSION="1.0"
export CC_SEQUENCE="1"
echo "Mencoba melakukan commit chaincode ke channel..."
# Cek dulu apakah semua sudah setuju
echo "Memeriksa kesiapan commit..."
docker exec cli peer lifecycle chaincode checkcommitreadiness --channelID $CHANNEL_NAME --name ${CC_NAME} --version ${CC_VERSION} --sequence ${CC_SEQUENCE} --tls --cafile /opt/gopath/src/github.com/hyperledger/fabric/peer/crypto/ordererOrganizations/medisync.com/orderers/orderer.medisync.com/msp/tlscacerts/tlsca.medisync.com-cert.pem --output json

# Lakukan commit
echo "Melakukan commit..."
docker exec -e CORE_PEER_ADDRESS=peer0.org1.medisync.com:7051 \
    -e CORE_PEER_MSPCONFIGPATH=/opt/gopath/src/github.com/hyperledger/fabric/peer/crypto/peerOrganizations/org1.medisync.com/users/Admin@org1.medisync.com/msp \
    cli peer lifecycle chaincode commit -o orderer.medisync.com:7050 --ordererTLSHostnameOverride orderer.medisync.com --channelID $CHANNEL_NAME --name ${CC_NAME} --version ${CC_VERSION} --sequence ${CC_SEQUENCE} --tls --cafile /opt/gopath/src/github.com/hyperledger/fabric/peer/crypto/ordererOrganizations/medisync.com/orderers/orderer.medisync.com/msp/tlscacerts/tlsca.medisync.com-cert.pem \
    --peerAddresses peer0.org1.medisync.com:7051 --tlsRootCertFiles /opt/gopath/src/github.com/hyperledger/fabric/peer/crypto/peerOrganizations/org1.medisync.com/peers/peer0.org1.medisync.com/tls/ca.crt \
    --peerAddresses peer0.org2.medisync.com:9051 --tlsRootCertFiles /opt/gopath/src/github.com/hyperledger/fabric/peer/crypto/peerOrganizations/org2.medisync.com/peers/peer0.org2.medisync.com/tls/ca.crt \
    --peerAddresses peer0.org3.medisync.com:11051 --tlsRootCertFiles /opt/gopath/src/github.com/hyperledger/fabric/peer/crypto/peerOrganizations/org3.medisync.com/peers/peer0.org3.medisync.com/tls/ca.crt

echo "========== Chaincode berhasil di-commit ke channel =========="

# Verifikasi commit
echo "Memverifikasi chaincode yang sudah di-commit..."
docker exec cli peer lifecycle chaincode querycommitted --channelID ${CHANNEL_NAME} --name ${CC_NAME}
