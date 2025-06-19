#!/bin/bash

# Pastikan eksekusi berhenti jika ada error
set -e

# Nama file konfigurasi
export COMPOSE_FILE=./docker-compose.yaml
export COMPOSE_PROJECT_NAME=medisync-project
export FABRIC_CFG_PATH=${PWD}

export CHANNEL_NAME="medisyncchannel"
export CC_NAME="medisync"
# --- PERBAIKAN PENTING: Path untuk `package` command di dalam kontainer ---
export CC_SRC_PATH_IN_CONTAINER="/opt/gopath/src/github.com/chaincode/medisync/javascript/"

# --- Variabel untuk Upgrade ---
export CC_VERSION="1.3"
export CC_SEQUENCE="1"


# Fungsi untuk membersihkan lingkungan
function clearContainers() {
  echo "========== Menghapus kontainer-kontainer lama... =========="
  docker-compose -f $COMPOSE_FILE -p $COMPOSE_PROJECT_NAME down --volumes --remove-orphans

  LINGERING_CONTAINERS=$(docker ps -aq --filter "name=${COMPOSE_PROJECT_NAME}")
  if [ -n "$LINGERING_CONTAINERS" ]; then
    echo "Membersihkan sisa kontainer yang mungkin masih ada..."
    docker rm -f $LINGERING_CONTAINERS >/dev/null 2>&1
  fi

  docker rm -f $(docker ps -a | grep "dev-peer" | awk '{print $1}') >/dev/null 2>&1 || true
  echo "========== Kontainer lama berhasil dihapus =========="
}

# Fungsi untuk menghapus artefak lama
function removeOldArtifacts() {
    echo "========== Menghapus artefak lama... =========="
    rm -rf ./organizations ./system-genesis-block/* ./channel-artifacts/*
    rm -rf ./bin ./config ./install-fabric.sh ./scripts/package.id ./log.txt
    mkdir -p ./system-genesis-block ./channel-artifacts ./scripts
    echo "========== Artefak lama berhasil dihapus =========="
}

# Fungsi untuk mengunduh binary Fabric
function downloadFabricBinaries() {
    if [ ! -d "bin" ]; then
        echo "FABRIC BINARIES NOT FOUND"
        echo "====== Mengunduh Hyperledger Fabric Binaries v2.5.13 dan Fabric CA v1.5.15 ======"
        curl -sSLO https://raw.githubusercontent.com/hyperledger/fabric/main/scripts/install-fabric.sh && chmod +x install-fabric.sh
        ./install-fabric.sh binary --fabric-version 2.5.13 --ca-version 1.5.15
        echo "====== Unduhan Selesai ======"
    fi
}

# Fungsi untuk membangkitkan materi kripto
function generateCrypto() {
    echo "========== Membangkitkan materi kripto... =========="
    ./bin/cryptogen generate --config=./crypto-config.yaml --output="./organizations"
    echo "========== Materi kripto berhasil dibuat =========="
}

# Fungsi untuk membangkitkan genesis block
function createGenesisBlock() {
    echo "========== Membuat Genesis Block... =========="
    ./bin/configtxgen -profile MediSyncOrdererGenesis -channelID system-channel -outputBlock ./system-genesis-block/genesis.block -configPath .
    echo "========== Genesis Block berhasil dibuat =========="
}

# Fungsi untuk menjalankan jaringan
function networkUp() {
    downloadFabricBinaries
    generateCrypto
    createGenesisBlock
    echo "========== Menjalankan Jaringan Docker... =========="
    docker-compose -f $COMPOSE_FILE -p $COMPOSE_PROJECT_NAME up -d
    docker ps -a
    echo "========== Jaringan Docker berhasil berjalan =========="
}

# Fungsi untuk membuat channel
function createChannel() {
    echo "========== Membuat Channel... =========="
    ./bin/configtxgen -profile MediSyncChannel -outputCreateChannelTx ./channel-artifacts/${CHANNEL_NAME}.tx -channelID $CHANNEL_NAME -configPath .
    docker exec cli peer channel create -o orderer.medisync.com:7050 -c $CHANNEL_NAME --ordererTLSHostnameOverride orderer.medisync.com -f /opt/gopath/src/github.com/hyperledger/fabric/peer/crypto/channel-artifacts/${CHANNEL_NAME}.tx --outputBlock /opt/gopath/src/github.com/hyperledger/fabric/peer/crypto/channel-artifacts/${CHANNEL_NAME}.block --tls --cafile /opt/gopath/src/github.com/hyperledger/fabric/peer/crypto/ordererOrganizations/medisync.com/orderers/orderer.medisync.com/msp/tlscacerts/tlsca.medisync.com-cert.pem
    echo "========== Channel berhasil dibuat =========="
    joinChannel
}

# Fungsi untuk join peer ke channel
function joinChannel() {
    echo "========== Bergabung ke Channel... =========="
    for org in 1 2 3; do
        for peer in 0 1; do
            if [ $org -eq 1 ]; then MSP="ProdusenMSP"; if [ $peer -eq 0 ]; then PORT=7051; else PORT=8051; fi
            elif [ $org -eq 2 ]; then MSP="PBFMSP"; if [ $peer -eq 0 ]; then PORT=9051; else PORT=10051; fi
            elif [ $org -eq 3 ]; then MSP="ApotekMSP"; if [ $peer -eq 0 ]; then PORT=11051; else PORT=12051; fi
            fi
            echo "Bergabung ke channel untuk peer${peer}.org${org}.medisync.com..."
            docker exec -e CORE_PEER_LOCALMSPID=$MSP -e CORE_PEER_ADDRESS="peer${peer}.org${org}.medisync.com:${PORT}" -e CORE_PEER_MSPCONFIGPATH="/opt/gopath/src/github.com/hyperledger/fabric/peer/crypto/peerOrganizations/org${org}.medisync.com/users/Admin@org${org}.medisync.com/msp" -e CORE_PEER_TLS_ROOTCERT_FILE="/opt/gopath/src/github.com/hyperledger/fabric/peer/crypto/peerOrganizations/org${org}.medisync.com/peers/peer${peer}.org${org}.medisync.com/tls/ca.crt" cli peer channel join -b /opt/gopath/src/github.com/hyperledger/fabric/peer/crypto/channel-artifacts/${CHANNEL_NAME}.block
        done
    done
    echo "========== Semua 6 peer berhasil join channel =========="
    updateAnchorPeers
}

function updateAnchorPeers() {
    echo "========== Update Anchor Peers... =========="
    for org in 1 2 3; do
      if [ $org -eq 1 ]; then MSP="ProdusenMSP"; PORT=7051; elif [ $org -eq 2 ]; then MSP="PBFMSP"; PORT=9051; elif [ $org -eq 3 ]; then MSP="ApotekMSP"; PORT=11051; fi
      echo "Update Anchor Peer untuk ${MSP}..."
      ./bin/configtxgen -profile MediSyncChannel -outputAnchorPeersUpdate ./channel-artifacts/${MSP}anchors.tx -channelID $CHANNEL_NAME -asOrg $MSP -configPath .
      docker exec -e CORE_PEER_LOCALMSPID=$MSP -e CORE_PEER_ADDRESS="peer0.org${org}.medisync.com:${PORT}" -e CORE_PEER_MSPCONFIGPATH="/opt/gopath/src/github.com/hyperledger/fabric/peer/crypto/peerOrganizations/org${org}.medisync.com/users/Admin@org${org}.medisync.com/msp" cli peer channel update -o orderer.medisync.com:7050 --ordererTLSHostnameOverride orderer.medisync.com -c $CHANNEL_NAME -f /opt/gopath/src/github.com/hyperledger/fabric/peer/crypto/channel-artifacts/${MSP}anchors.tx --tls --cafile /opt/gopath/src/github.com/hyperledger/fabric/peer/crypto/ordererOrganizations/medisync.com/orderers/orderer.medisync.com/msp/tlscacerts/tlsca.medisync.com-cert.pem
    done
    echo "========== Semua Anchor Peer berhasil diupdate =========="
}

# Fungsi ini sekarang hanya melakukan package dan install
function deployCC() {
    echo "========== Deploy Chaincode Awal (v${CC_VERSION}, seq${CC_SEQUENCE}): Packaging & Installing... =========="
    packageAndInstall
    echo "========== Chaincode Awal berhasil di-install. =========="
    echo "Selanjutnya, jalankan skrip persetujuan manual dari folder 'scripts'."
}

# Fungsi baru untuk upgrade
function upgradeCC() {
    echo "========== Upgrade Chaincode ke (v${CC_VERSION}, seq${CC_SEQUENCE}): Packaging & Installing... =========="
    packageAndInstall
    echo "========== Chaincode v${CC_VERSION} berhasil di-install. =========="
    echo "Selanjutnya, jalankan skrip persetujuan manual untuk mengaktifkan versi baru."
}

# Fungsi helper untuk package & install
function packageAndInstall() {
    docker exec cli peer lifecycle chaincode package ${CC_NAME}_${CC_VERSION}.tar.gz --path ${CC_SRC_PATH_IN_CONTAINER} --lang node --label ${CC_NAME}_${CC_VERSION}
    echo "Chaincode berhasil di-package."
    
    for org in 1 2 3; do
        if [ $org -eq 1 ]; then MSP="ProdusenMSP"; elif [ $org -eq 2 ]; then MSP="PBFMSP"; elif [ $org -eq 3 ]; then MSP="ApotekMSP"; fi
        for peer in 0 1; do
            if [ $org -eq 1 ]; then if [ $peer -eq 0 ]; then PORT=7051; else PORT=8051; fi
            elif [ $org -eq 2 ]; then if [ $peer -eq 0 ]; then PORT=9051; else PORT=10051; fi
            elif [ $org -eq 3 ]; then if [ $peer -eq 0 ]; then PORT=11051; else PORT=12051; fi
            fi
            echo "--- Menginstall di peer${peer}.org${org}.medisync.com (sebagai admin Org${org}) ---"
            docker exec \
              -e CORE_PEER_LOCALMSPID=$MSP \
              -e CORE_PEER_TLS_ROOTCERT_FILE="/opt/gopath/src/github.com/hyperledger/fabric/peer/crypto/peerOrganizations/org${org}.medisync.com/peers/peer${peer}.org${org}.medisync.com/tls/ca.crt" \
              -e CORE_PEER_MSPCONFIGPATH="/opt/gopath/src/github.com/hyperledger/fabric/peer/crypto/peerOrganizations/org${org}.medisync.com/users/Admin@org${org}.medisync.com/msp" \
              -e CORE_PEER_ADDRESS="peer${peer}.org${org}.medisync.com:${PORT}" \
              cli peer lifecycle chaincode install ${CC_NAME}_${CC_VERSION}.tar.gz
        done
    done
}


# Parsing argumen dari command line
if [ "$1" == "restart" ]; then
  clearContainers
  removeOldArtifacts
  networkUp
  echo "Menunggu 10 detik agar orderer dan peer siap..."
  sleep 10
  createChannel
  deployCC
elif [ "$1" == "down" ]; then
  clearContainers
elif [ "$1" == "upgrade" ]; then
  upgradeCC
else
  echo "Penggunaan: ./network.sh [restart|down|upgrade]"
  exit 1
fi





# #!/bin/bash

# # Pastikan eksekusi berhenti jika ada error
# set -e

# # Nama file konfigurasi
# export COMPOSE_FILE_BASE=docker-compose.yaml
# export FABRIC_CFG_PATH=${PWD}
# export CHANNEL_NAME="medisyncchannel"
# export CC_NAME="medisync"
# export CC_SRC_PATH="./chaincode/medisync/javascript/"
# # Ubah baris ini
# export CC_VERSION="1.0"
# export CC_SEQUENCE="1"


# # Fungsi untuk membersihkan lingkungan
# function clearContainers() {
#   echo "========== Menghapus kontainer-kontainer lama... =========="
#   docker compose -f $COMPOSE_FILE_BASE down --volumes --remove-orphans

  
#   LINGERING_CONTAINERS=$(docker ps -aq --filter "name=medisync")
#   if [ -n "$LINGERING_CONTAINERS" ]; then
#     echo "Membersihkan sisa kontainer medisync yang mungkin masih ada..."
#     docker rm -f $LINGERING_CONTAINERS >/dev/null 2>&1
#   fi

  
#   docker rm -f $(docker ps -a | grep "dev-peer" | awk '{print $1}') >/dev/null 2>&1 || true
#   echo "========== Kontainer lama berhasil dihapus =========="
# }

# # Fungsi untuk menghapus artefak lama
# function removeOldArtifacts() {
#     echo "========== Menghapus artefak lama... =========="
#     rm -rf ./organizations
#     rm -rf ./system-genesis-block/*
#     rm -rf ./channel-artifacts/*
#     rm -rf ./bin ./config ./install-fabric.sh
#     echo "========== Artefak lama berhasil dihapus =========="
# }

# # Fungsi untuk mengunduh binary Fabric SESUAI DOKUMENTASI RESMI
# function downloadFabricBinaries() {
#     if [ ! -d "bin" ]; then
#         echo "FABRIC BINARIES NOT FOUND"
#         echo "====== Mengunduh Hyperledger Fabric Binaries v2.5.13 dan Fabric CA v1.5.15 ======"
#         # Mengunduh skrip install
#         curl -sSLO https://raw.githubusercontent.com/hyperledger/fabric/main/scripts/install-fabric.sh && chmod +x install-fabric.sh
#         # Menjalankan skrip dengan versi yang benar
#         ./install-fabric.sh binary --fabric-version 2.5.13 --ca-version 1.5.15
#         echo "====== Unduhan Selesai ======"
#     fi
# }

# # Fungsi untuk membangkitkan materi kripto
# function generateCrypto() {
#     echo "========== Membangkitkan materi kripto (untuk 2 peer per org)... =========="
#     ./bin/cryptogen generate --config=./crypto-config.yaml --output="organizations"
#     echo "========== Materi kripto berhasil dibuat =========="
# }

# # Fungsi untuk membangkitkan genesis block
# function createGenesisBlock() {
#     echo "========== Membuat Genesis Block... =========="
#     ./bin/configtxgen -profile MediSyncOrdererGenesis -channelID system-channel -outputBlock ./system-genesis-block/genesis.block
#     echo "========== Genesis Block berhasil dibuat =========="
# }

# # Fungsi untuk menjalankan jaringan
# function networkUp() {
    
#     downloadFabricBinaries
#     generateCrypto
#     createGenesisBlock
    
#     echo "========== Menjalankan Jaringan Docker (6 peer)... =========="
#     docker compose -f $COMPOSE_FILE_BASE up -d
#     docker ps -a
#     echo "========== Jaringan Docker berhasil berjalan =========="
# }

# # Fungsi untuk membuat channel
# function createChannel() {
#     echo "========== Membuat Channel... =========="
#     # Buat channel transaction
#     ./bin/configtxgen -profile MediSyncChannel -outputCreateChannelTx ./channel-artifacts/${CHANNEL_NAME}.tx -channelID $CHANNEL_NAME

#     # Jalankan perintah create channel dari dalam CLI container
#     docker exec cli peer channel create -o orderer.medisync.com:7050 -c $CHANNEL_NAME --ordererTLSHostnameOverride orderer.medisync.com -f /opt/gopath/src/github.com/hyperledger/fabric/peer/crypto/channel-artifacts/${CHANNEL_NAME}.tx --outputBlock /opt/gopath/src/github.com/hyperledger/fabric/peer/crypto/channel-artifacts/${CHANNEL_NAME}.block --tls --cafile /opt/gopath/src/github.com/hyperledger/fabric/peer/crypto/ordererOrganizations/medisync.com/orderers/orderer.medisync.com/msp/tlscacerts/tlsca.medisync.com-cert.pem

#     echo "========== Channel berhasil dibuat =========="
#     joinChannel
# }

# # Fungsi untuk join peer ke channel
# function joinChannel() {
#     echo "========== Bergabung ke Channel... =========="
#     # Loop untuk setiap org dan setiap peer
#     for org in 1 2 3; do
#         for peer in 0 1; do
#             if [ $org -eq 1 ]; then
#                 MSP="ProdusenMSP"
#                 if [ $peer -eq 0 ]; then PORT=7051; else PORT=8051; fi
#             elif [ $org -eq 2 ]; then
#                 MSP="PBFMSP"
#                 if [ $peer -eq 0 ]; then PORT=9051; else PORT=10051; fi
#             elif [ $org -eq 3 ]; then
#                 MSP="ApotekMSP"
#                 if [ $peer -eq 0 ]; then PORT=11051; else PORT=12051; fi
#             fi
#             echo "Bergabung ke channel untuk peer${peer}.org${org}.medisync.com..."
#             docker exec -e CORE_PEER_LOCALMSPID=$MSP \
#                 -e CORE_PEER_ADDRESS="peer${peer}.org${org}.medisync.com:${PORT}" \
#                 -e CORE_PEER_MSPCONFIGPATH="/opt/gopath/src/github.com/hyperledger/fabric/peer/crypto/peerOrganizations/org${org}.medisync.com/users/Admin@org${org}.medisync.com/msp" \
#                 -e CORE_PEER_TLS_ROOTCERT_FILE="/opt/gopath/src/github.com/hyperledger/fabric/peer/crypto/peerOrganizations/org${org}.medisync.com/peers/peer${peer}.org${org}.medisync.com/tls/ca.crt" \
#                 cli peer channel join -b /opt/gopath/src/github.com/hyperledger/fabric/peer/crypto/channel-artifacts/${CHANNEL_NAME}.block
#         done
#     done
#     echo "========== Semua 6 peer berhasil join channel =========="
    
#     updateAnchorPeers
# }

# function updateAnchorPeers() {
#     echo "========== Update Anchor Peers (hanya peer0)... =========="
#     # Produsen
#     ./bin/configtxgen -profile MediSyncChannel -outputAnchorPeersUpdate ./channel-artifacts/ProdusenMSPanchors.tx -channelID $CHANNEL_NAME -asOrg ProdusenMSP
#     docker exec cli peer channel update -o orderer.medisync.com:7050 --ordererTLSHostnameOverride orderer.medisync.com -c $CHANNEL_NAME -f /opt/gopath/src/github.com/hyperledger/fabric/peer/crypto/channel-artifacts/ProdusenMSPanchors.tx --tls --cafile /opt/gopath/src/github.com/hyperledger/fabric/peer/crypto/ordererOrganizations/medisync.com/orderers/orderer.medisync.com/msp/tlscacerts/tlsca.medisync.com-cert.pem
#     echo "Anchor Peer Produsen (org1) berhasil diupdate."

#     # PBF
#     ./bin/configtxgen -profile MediSyncChannel -outputAnchorPeersUpdate ./channel-artifacts/PBFMSPanchors.tx -channelID $CHANNEL_NAME -asOrg PBFMSP
#     docker exec -e CORE_PEER_LOCALMSPID="PBFMSP" -e CORE_PEER_ADDRESS="peer0.org2.medisync.com:9051" -e CORE_PEER_MSPCONFIGPATH="/opt/gopath/src/github.com/hyperledger/fabric/peer/crypto/peerOrganizations/org2.medisync.com/users/Admin@org2.medisync.com/msp" -e CORE_PEER_TLS_ROOTCERT_FILE="/opt/gopath/src/github.com/hyperledger/fabric/peer/crypto/peerOrganizations/org2.medisync.com/peers/peer0.org2.medisync.com/tls/ca.crt" cli peer channel update -o orderer.medisync.com:7050 --ordererTLSHostnameOverride orderer.medisync.com -c $CHANNEL_NAME -f /opt/gopath/src/github.com/hyperledger/fabric/peer/crypto/channel-artifacts/PBFMSPanchors.tx --tls --cafile /opt/gopath/src/github.com/hyperledger/fabric/peer/crypto/ordererOrganizations/medisync.com/orderers/orderer.medisync.com/msp/tlscacerts/tlsca.medisync.com-cert.pem
#     echo "Anchor Peer PBF (org2) berhasil diupdate."

#     # Apotek
#     ./bin/configtxgen -profile MediSyncChannel -outputAnchorPeersUpdate ./channel-artifacts/ApotekMSPanchors.tx -channelID $CHANNEL_NAME -asOrg ApotekMSP
#     docker exec -e CORE_PEER_LOCALMSPID="ApotekMSP" -e CORE_PEER_ADDRESS="peer0.org3.medisync.com:11051" -e CORE_PEER_MSPCONFIGPATH="/opt/gopath/src/github.com/hyperledger/fabric/peer/crypto/peerOrganizations/org3.medisync.com/users/Admin@org3.medisync.com/msp" -e CORE_PEER_TLS_ROOTCERT_FILE="/opt/gopath/src/github.com/hyperledger/fabric/peer/crypto/peerOrganizations/org3.medisync.com/peers/peer0.org3.medisync.com/tls/ca.crt" cli peer channel update -o orderer.medisync.com:7050 --ordererTLSHostnameOverride orderer.medisync.com -c $CHANNEL_NAME -f /opt/gopath/src/github.com/hyperledger/fabric/peer/crypto/channel-artifacts/ApotekMSPanchors.tx --tls --cafile /opt/gopath/src/github.com/hyperledger/fabric/peer/crypto/ordererOrganizations/medisync.com/orderers/orderer.medisync.com/msp/tlscacerts/tlsca.medisync.com-cert.pem
#     echo "Anchor Peer Apotek (org3) berhasil diupdate."
#     echo "========== Semua Anchor Peer berhasil diupdate =========="
# }

# # Fungsi untuk deploy chaincode
# function deployCC() {
#     echo "========== Deploy Chaincode... =========="
#     # Package
#     docker exec cli peer lifecycle chaincode package ${CC_NAME}.tar.gz --path /opt/gopath/src/github.com/chaincode/${CC_NAME}/javascript --lang node --label ${CC_NAME}_${CC_VERSION}
#     echo "Chaincode berhasil di-package."
    
#     # Install di semua 6 peer DENGAN IDENTITAS YANG BENAR
#     echo "Install chaincode di semua 6 peer..."
#     for org in 1 2 3; do
#         if [ $org -eq 1 ]; then
#             MSP="ProdusenMSP"
#         elif [ $org -eq 2 ]; then
#             MSP="PBFMSP"
#         elif [ $org -eq 3 ]; then
#             MSP="ApotekMSP"
#         fi
        
#         for peer in 0 1; do
#             if [ $org -eq 1 ]; then
#                 if [ $peer -eq 0 ]; then PORT=7051; else PORT=8051; fi
#             elif [ $org -eq 2 ]; then
#                 if [ $peer -eq 0 ]; then PORT=9051; else PORT=10051; fi
#             elif [ $org -eq 3 ]; then
#                 if [ $peer -eq 0 ]; then PORT=11051; else PORT=12051; fi
#             fi

#             echo "--- Menginstall di peer${peer}.org${org}.medisync.com (sebagai admin Org${org}) ---"
        
#             docker exec \
#               -e CORE_PEER_LOCALMSPID=$MSP \
#               -e CORE_PEER_TLS_ROOTCERT_FILE="/opt/gopath/src/github.com/hyperledger/fabric/peer/crypto/peerOrganizations/org${org}.medisync.com/peers/peer${peer}.org${org}.medisync.com/tls/ca.crt" \
#               -e CORE_PEER_MSPCONFIGPATH="/opt/gopath/src/github.com/hyperledger/fabric/peer/crypto/peerOrganizations/org${org}.medisync.com/users/Admin@org${org}.medisync.com/msp" \
#               -e CORE_PEER_ADDRESS="peer${peer}.org${org}.medisync.com:${PORT}" \
#               cli peer lifecycle chaincode install ${CC_NAME}.tar.gz
#         done
#     done
#     echo "Chaincode diinstall di semua 6 peer."

#     # Query installed dan set package ID (sebagai Admin Org1)
#     docker exec -e CORE_PEER_ADDRESS="peer0.org1.medisync.com:7051" \
#         -e CORE_PEER_MSPCONFIGPATH="/opt/gopath/src/github.com/hyperledger/fabric/peer/crypto/peerOrganizations/org1.medisync.com/users/Admin@org1.medisync.com/msp" \
#         cli peer lifecycle chaincode queryinstalled >&log.txt
    
#     PACKAGE_ID=$(sed -n "/Package ID: ${CC_NAME}_${CC_VERSION}:/,/Label: /p" log.txt | sed -n 's/Package ID: //; s/, Label:.*//p')
#     echo "Package ID adalah: ${PACKAGE_ID}"
    
#     # Approve oleh setiap org (cukup sekali per org, gunakan peer0)
#     echo "--- Menyetujui chaincode untuk setiap organisasi ---"
#     docker exec -e CORE_PEER_ADDRESS="peer0.org1.medisync.com:7051" \
#         -e CORE_PEER_MSPCONFIGPATH="/opt/gopath/src/github.com/hyperledger/fabric/peer/crypto/peerOrganizations/org1.medisync.com/users/Admin@org1.medisync.com/msp" \
#         cli peer lifecycle chaincode approveformyorg -o orderer.medisync.com:7050 --ordererTLSHostnameOverride orderer.medisync.com --channelID $CHANNEL_NAME --name ${CC_NAME} --version ${CC_VERSION} --package-id ${PACKAGE_ID} --sequence ${CC_SEQUENCE} --tls --cafile /opt/gopath/src/github.com/hyperledger/fabric/peer/crypto/ordererOrganizations/medisync.com/orderers/orderer.medisync.com/msp/tlscacerts/tlsca.medisync.com-cert.pem
#     echo "Chaincode disetujui oleh Produsen."
    
#     docker exec -e CORE_PEER_LOCALMSPID="PBFMSP" -e CORE_PEER_ADDRESS="peer0.org2.medisync.com:9051" \
#         -e CORE_PEER_MSPCONFIGPATH="/opt/gopath/src/github.com/hyperledger/fabric/peer/crypto/peerOrganizations/org2.medisync.com/users/Admin@org2.medisync.com/msp" \
#         -e CORE_PEER_TLS_ROOTCERT_FILE="/opt/gopath/src/github.com/hyperledger/fabric/peer/crypto/peerOrganizations/org2.medisync.com/peers/peer0.org2.medisync.com/tls/ca.crt" \
#         cli peer lifecycle chaincode approveformyorg -o orderer.medisync.com:7050 --ordererTLSHostnameOverride orderer.medisync.com --channelID $CHANNEL_NAME --name ${CC_NAME} --version ${CC_VERSION} --package-id ${PACKAGE_ID} --sequence ${CC_SEQUENCE} --tls --cafile /opt/gopath/src/github.com/hyperledger/fabric/peer/crypto/ordererOrganizations/medisync.com/orderers/orderer.medisync.com/msp/tlscacerts/tlsca.medisync.com-cert.pem
#     echo "Chaincode disetujui oleh PBF."
    
#     docker exec -e CORE_PEER_LOCALMSPID="ApotekMSP" -e CORE_PEER_ADDRESS="peer0.org3.medisync.com:11051" \
#         -e CORE_PEER_MSPCONFIGPATH="/opt/gopath/src/github.com/hyperledger/fabric/peer/crypto/peerOrganizations/org3.medisync.com/users/Admin@org3.medisync.com/msp" \
#         -e CORE_PEER_TLS_ROOTCERT_FILE="/opt/gopath/src/github.com/hyperledger/fabric/peer/crypto/peerOrganizations/org3.medisync.com/peers/peer0.org3.medisync.com/tls/ca.crt" \
#         cli peer lifecycle chaincode approveformyorg -o orderer.medisync.com:7050 --ordererTLSHostnameOverride orderer.medisync.com --channelID $CHANNEL_NAME --name ${CC_NAME} --version ${CC_VERSION} --package-id ${PACKAGE_ID} --sequence ${CC_SEQUENCE} --tls --cafile /opt/gopath/src/github.com/hyperledger/fabric/peer/crypto/ordererOrganizations/medisync.com/orderers/orderer.medisync.com/msp/tlscacerts/tlsca.medisync.com-cert.pem
#     echo "Chaincode disetujui oleh Apotek."
    
#     # Commit (sebagai Admin Org1)
#     echo "--- Melakukan commit chaincode ke channel ---"
#     docker exec -e CORE_PEER_ADDRESS="peer0.org1.medisync.com:7051" \
#         -e CORE_PEER_MSPCONFIGPATH="/opt/gopath/src/github.com/hyperledger/fabric/peer/crypto/peerOrganizations/org1.medisync.com/users/Admin@org1.medisync.com/msp" \
#         cli peer lifecycle chaincode commit -o orderer.medisync.com:7050 --ordererTLSHostnameOverride orderer.medisync.com --channelID $CHANNEL_NAME --name ${CC_NAME} --version ${CC_VERSION} --sequence ${CC_SEQUENCE} --tls --cafile /opt/gopath/src/github.com/hyperledger/fabric/peer/crypto/ordererOrganizations/medisync.com/orderers/orderer.medisync.com/msp/tlscacerts/tlsca.medisync.com-cert.pem \
#         --peerAddresses peer0.org1.medisync.com:7051 --tlsRootCertFiles /opt/gopath/src/github.com/hyperledger/fabric/peer/crypto/peerOrganizations/org1.medisync.com/peers/peer0.org1.medisync.com/tls/ca.crt \
#         --peerAddresses peer0.org2.medisync.com:9051 --tlsRootCertFiles /opt/gopath/src/github.com/hyperledger/fabric/peer/crypto/peerOrganizations/org2.medisync.com/peers/peer0.org2.medisync.com/tls/ca.crt \
#         --peerAddresses peer0.org3.medisync.com:11051 --tlsRootCertFiles /opt/gopath/src/github.com/hyperledger/fabric/peer/crypto/peerOrganizations/org3.medisync.com/peers/peer0.org3.medisync.com/tls/ca.crt
#     echo "========== Chaincode berhasil di-commit ke channel =========="
    
#     # Query committed (sebagai Admin Org1)
#     docker exec -e CORE_PEER_ADDRESS="peer0.org1.medisync.com:7051" \
#         -e CORE_PEER_MSPCONFIGPATH="/opt/gopath/src/github.com/hyperledger/fabric/peer/crypto/peerOrganizations/org1.medisync.com/users/Admin@org1.medisync.com/msp" \
#         cli peer lifecycle chaincode querycommitted --channelID $CHANNEL_NAME --name ${CC_NAME}
# }
# # Parsing argumen dari command line
# if [ "$1" == "up" ]; then
#   networkUp
# elif [ "$1" == "down" ]; then
#   clearContainers
# elif [ "$1" == "restart" ]; then
#   clearContainers
#   removeOldArtifacts
#   networkUp
#   echo "Menunggu 10 detik agar orderer siap..."
#   sleep 10 
#   createChannel
#   deployCC
# elif [ "$1" == "createChannel" ]; then
#   createChannel
# elif [ "$1" == "deployCC" ]; then
#   deployCC
# else
#   echo "Penggunaan: ./network.sh [up|down|restart|createChannel|deployCC]"
#   exit 1
# fi