#!/bin/bash

CKB_VERSION=$(cat .ckb-version)
ROOT_DIR=$(pwd) # Be sure to run this from root directory!
MERCURY_VERSION="v0.1.0-rc.3"

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
  CKB_FILENAME="ckb_${CKB_VERSION}_x86_64-apple-darwin"
  cd $ROOT_DIR/packages/neuron-wallet/bin/mac

  curl -O -L "https://github.com/nervosnetwork/ckb/releases/download/${CKB_VERSION}/${CKB_FILENAME}.zip"
  unzip ${CKB_FILENAME}.zip
  cp ${CKB_FILENAME}/ckb ./
  rm -rf $CKB_FILENAME
  rm ${CKB_FILENAME}.zip
  download_mercury_macos
  download_mercury_config "mac"
}

function download_linux() {
  # Linux
  CKB_FILENAME="ckb_${CKB_VERSION}_x86_64-unknown-linux-gnu"
  cd $ROOT_DIR/packages/neuron-wallet/bin/linux

  curl -O -L "https://github.com/nervosnetwork/ckb/releases/download/${CKB_VERSION}/${CKB_FILENAME}.tar.gz"
  tar xvzf ${CKB_FILENAME}.tar.gz
  cp ${CKB_FILENAME}/ckb ./
  rm -rf $CKB_FILENAME
  rm ${CKB_FILENAME}.tar.gz
  download_mercury_linux
  download_mercury_config "linux"
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
  download_mercury_windows
  download_mercury_config "win"
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
