#!/bin/bash

CKB_VERSION=$(cat .ckb-version)
ROOT_DIR=$(pwd) # Be sure to run this from root directory!
MERCURY_VERSION="v0.1.0-rc.3"
CKB_INDEXER_VERSION="0.3.2"

function download_ckb_indexer_macos() {
  FILENAME="ckb-indexer-${CKB_INDEXER_VERSION}-macos"
  INNER_ZIP_FILENAME="ckb-indexer-mac-x86_64.zip"
  cd $ROOT_DIR/packages/neuron-wallet/bin/mac

  curl -O -L "https://github.com/nervosnetwork/ckb-indexer/releases/download/v${CKB_INDEXER_VERSION}/${FILENAME}.zip"
  unzip -o ${FILENAME}.zip
  unzip -o ${INNER_ZIP_FILENAME} ckb-indexer
  chmod +x ./ckb-indexer
  rm ${FILENAME}.zip
  rm ${INNER_ZIP_FILENAME}
}

function download_ckb_indexer_linux() {
  FILENAME="ckb-indexer-${CKB_INDEXER_VERSION}-linux"
  TAR_FILENAME="ckb-indexer-linux-x86_64.tar.gz"
  cd $ROOT_DIR/packages/neuron-wallet/bin/linux


  curl -O -L "https://github.com/nervosnetwork/ckb-indexer/releases/download/v${CKB_INDEXER_VERSION}/${FILENAME}.zip"
  unzip -o ${FILENAME}.zip
  tar xvzf $TAR_FILENAME ckb-indexer
  chmod +x ./ckb-indexer
  rm -rf $TAR_FILENAME
  rm ${FILENAME}.zip
}

function download_ckb_indexer_windows() {
  FILENAME="ckb-indexer-${CKB_INDEXER_VERSION}-windows"
  INNER_ZIP_FILENAME="ckb-indexer-windows-x86_64.zip"
  cd $ROOT_DIR/packages/neuron-wallet/bin/win


  curl -O -L "https://github.com/nervosnetwork/ckb-indexer/releases/download/v${CKB_INDEXER_VERSION}/${FILENAME}.zip"
  unzip -o ${FILENAME}.zip
  unzip -o ${INNER_ZIP_FILENAME} ckb-indexer.exe
  rm ${FILENAME}.zip
  rm ${INNER_ZIP_FILENAME}
}


function download_mercury_macos() {
  MERCURY_FILENAME="mercury-x86_64-apple-darwin.tar.gz"
  cd $ROOT_DIR/packages/neuron-wallet/bin/mac

  curl -O -L "https://github.com/nervosnetwork/mercury/releases/download/${MERCURY_VERSION}/${MERCURY_FILENAME}"
  tar xvzf ${MERCURY_FILENAME} mercury
  chmod +x ./mercury
  rm $MERCURY_FILENAME
}

function download_mercury_linux() {
  MERCURY_FILENAME="mercury-x86_64-unknown-linux-gnu.tar.gz"
  cd $ROOT_DIR/packages/neuron-wallet/bin/linux

  curl -O -L "https://github.com/nervosnetwork/mercury/releases/download/${MERCURY_VERSION}/${MERCURY_FILENAME}"
  tar xvzf ${MERCURY_FILENAME} mercury
  chmod +x ./mercury
  rm $MERCURY_FILENAME
}

function download_mercury_config() {
  MERCURY_MAINNET_CONFIG="mainnet_config.toml"
  MERCURY_TESTNET_CONFIG="testnet_config.toml"
  cd $ROOT_DIR/packages/neuron-wallet/bin/$1

  curl -O -L "https://github.com/nervosnetwork/mercury/releases/download/${MERCURY_VERSION}/${MERCURY_MAINNET_CONFIG}"
  curl -O -L "https://github.com/nervosnetwork/mercury/releases/download/${MERCURY_VERSION}/${MERCURY_TESTNET_CONFIG}"
}

function download_mercury_windows() {
  MERCURY_FILENAME="mercury-x86_64-pc-windows-msvc.zip"
  cd $ROOT_DIR/packages/neuron-wallet/bin/win

  curl -O -L "https://github.com/nervosnetwork/mercury/releases/download/${MERCURY_VERSION}/${MERCURY_FILENAME}"
  unzip -o ${MERCURY_FILENAME} mercury.exe
  rm $MERCURY_FILENAME
}

function download_macos() {
  # macOS
  CKB_FILENAME="ckb_${CKB_VERSION}_x86_64-apple-darwin-portable"
  cd $ROOT_DIR/packages/neuron-wallet/bin/mac

  curl -O -L "https://github.com/nervosnetwork/ckb/releases/download/${CKB_VERSION}/${CKB_FILENAME}.zip"
  unzip ${CKB_FILENAME}.zip
  cp ${CKB_FILENAME}/ckb ./
  rm -rf $CKB_FILENAME
  rm ${CKB_FILENAME}.zip
  # download_mercury_macos
  # download_mercury_config "mac"
  download_ckb_indexer_macos
}

function download_linux() {
  # Linux
  CKB_FILENAME="ckb_${CKB_VERSION}_x86_64-unknown-linux-gnu-portable"
  cd $ROOT_DIR/packages/neuron-wallet/bin/linux

  curl -O -L "https://github.com/nervosnetwork/ckb/releases/download/${CKB_VERSION}/${CKB_FILENAME}.tar.gz"
  tar xvzf ${CKB_FILENAME}.tar.gz
  cp ${CKB_FILENAME}/ckb ./
  rm -rf $CKB_FILENAME
  rm ${CKB_FILENAME}.tar.gz
  # download_mercury_linux
  # download_mercury_config "linux"
  download_ckb_indexer_linux
}

function download_windows() {
  # Windows
  CKB_FILENAME="ckb_${CKB_VERSION}_x86_64-pc-windows-msvc"
  cd $ROOT_DIR/packages/neuron-wallet/bin/win

  curl -O -L "https://github.com/nervosnetwork/ckb/releases/download/${CKB_VERSION}/${CKB_FILENAME}.zip"
  unzip ${CKB_FILENAME}.zip
  cp ${CKB_FILENAME}/ckb.exe ./
  rm -rf $CKB_FILENAME
  rm ${CKB_FILENAME}.zip
  # download_mercury_windows
  # download_mercury_config "win"
  download_ckb_indexer_windows
}

case $1 in
  mac)    download_macos ;;
  linux)  download_linux ;;
  win)    download_windows ;;
  *)
    if [[ "$OSTYPE" == "darwin"* ]]; then
      download_macos
    elif [[ "$OSTYPE" == "linux-gnu" ]]; then
      download_linux
    else
      download_windows
    fi
  ;;
esac
