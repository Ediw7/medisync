# =================================================================
# File: scripts/0_query_installed.sh
# Tujuan: Mencari tahu Package ID dari chaincode yang baru di-install.
# Cara Menjalankan: ./scripts/0_query_installed.sh
# =================================================================
#!/bin/bash
set -e

# Definisikan variabel yang relevan
export CC_NAME="medisync"
export CC_VERSION="1.0"
LOG_FILE="log.txt"

echo "Mencari Package ID untuk ${CC_NAME} versi ${CC_VERSION}..."
# Bertindak sebagai Admin Org1 untuk melakukan query
docker exec \
    -e CORE_PEER_ADDRESS=peer0.org1.medisync.com:7051 \
    -e CORE_PEER_MSPCONFIGPATH=/opt/gopath/src/github.com/hyperledger/fabric/peer/crypto/peerOrganizations/org1.medisync.com/users/Admin@org1.medisync.com/msp \
    cli peer lifecycle chaincode queryinstalled >& ${LOG_FILE}

PACKAGE_ID=$(sed -n "/Package ID: ${CC_NAME}_${CC_VERSION}:/,/Label: /p" ${LOG_FILE} | sed -n 's/Package ID: //; s/, Label:.*//p')

if [ -z "$PACKAGE_ID" ]; then
    echo "FATAL: Package ID tidak ditemukan. Pastikan chaincode sudah di-install melalui './network.sh restart'."
    exit 1
fi

echo "Package ID ditemukan: ${PACKAGE_ID}"
# Simpan Package ID ke sebuah file agar bisa dibaca skrip lain
echo ${PACKAGE_ID} > scripts/package.id
echo "Package ID telah disimpan ke file scripts/package.id"
echo ""
