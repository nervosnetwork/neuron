#!/bin/bash

CKB_VERSION=$(cat .ckb-version)
CKB_LIGHT_VERSION=$(cat .ckb-light-version)
ROOT_DIR=$(pwd) # Be sure to run this from root directory!

function download_macos() {
  # macOS
  CKB_FILENAME="ckb_${CKB_VERSION}_x86_64-apple-darwin-portable"
  cd $ROOT_DIR/packages/neuron-wallet/bin/mac

  curl -O -L "https://github.com/nervosnetwork/ckb/releases/download/${CKB_VERSION}/${CKB_FILENAME}.zip"
  unzip ${CKB_FILENAME}.zip
  cp ${CKB_FILENAME}/ckb ./
  rm -rf $CKB_FILENAME
  rm ${CKB_FILENAME}.zip
}

function download_macos_light() {
  # macOS
  CKB_FILENAME="ckb-light-client_${CKB_LIGHT_VERSION}-x86_64-darwin"
  cd $ROOT_DIR/packages/neuron-wallet/bin/mac

  curl -O -L "https://github.com/nervosnetwork/ckb-light-client/releases/download/${CKB_LIGHT_VERSION}/${CKB_FILENAME}.tar.gz"
  tar -xzvf ${CKB_FILENAME}.tar.gz
  cp ./config/testnet.toml ../../light/ckb_light.toml
  rm -rf ./config
  rm ${CKB_FILENAME}.tar.gz
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
}

function download_linux_light() {
  # macOS
  CKB_FILENAME="ckb-light-client_${CKB_LIGHT_VERSION}-x86_64-linux"
  cd $ROOT_DIR/packages/neuron-wallet/bin/linux

  curl -O -L "https://github.com/nervosnetwork/ckb-light-client/releases/download/${CKB_LIGHT_VERSION}/${CKB_FILENAME}.tar.gz"
  tar -xzvf ${CKB_FILENAME}.tar.gz
  cp ./config/testnet.toml ../../light/ckb_light.toml
  rm -rf ./config
  rm ${CKB_FILENAME}.tar.gz
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
}

function download_windows_light() {
  # macOS
  CKB_FILENAME="ckb-light-client_${CKB_LIGHT_VERSION}-x86_64-windows"
  cd $ROOT_DIR/packages/neuron-wallet/bin/win

  curl -O -L "https://github.com/nervosnetwork/ckb-light-client/releases/download/${CKB_LIGHT_VERSION}/${CKB_FILENAME}.tar.gz"
  tar -xzvf ${CKB_FILENAME}.tar.gz
  cp ./config/testnet.toml ../../light/ckb_light.toml
  rm -rf ./config
  rm ${CKB_FILENAME}.tar.gz
}

case $1 in
  mac)    download_macos; download_macos_light;;
  linux)  download_linux; download_linux_light;;
  win)    download_windows; download_windows_light;;
  *)
    if [[ "$OSTYPE" == "darwin"* ]]; then
      download_macos
      download_macos_light
    elif [[ "$OSTYPE" == "linux-gnu" ]]; then
      download_linux
      download_linux_light
    else
      download_windows
      download_windows_light
    fi
  ;;
esac
