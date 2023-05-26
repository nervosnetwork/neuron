#!/bin/bash

CKB_VERSION=$(cat .ckb-version)
ROOT_DIR=$(pwd) # Be sure to run this from root directory!
GITHUB_RELEASE_URL="https://github.com/nervosnetwork/ckb/releases/download"

function download_macos() {
  download_macos_x86_64
  download_macos_aarch64
}

function download_macos_x86_64() {
  # for macOS x64
  CKB_FILENAME="ckb_${CKB_VERSION}_x86_64-apple-darwin-portable"
  cd $ROOT_DIR/packages/neuron-wallet/bin/mac

  curl -O -L "${GITHUB_RELEASE_URL}/${CKB_VERSION}/${CKB_FILENAME}.zip"
  unzip ${CKB_FILENAME}.zip
  cp ${CKB_FILENAME}/ckb ./ckb-x64
  rm -rf $CKB_FILENAME
  rm ${CKB_FILENAME}.zip
}

function download_macos_aarch64() {
  # for macOS arm64
  CKB_FILENAME="ckb_${CKB_VERSION}_aarch64-apple-darwin"
  cd $ROOT_DIR/packages/neuron-wallet/bin/mac

  curl -O -L "${GITHUB_RELEASE_URL}/${CKB_VERSION}/${CKB_FILENAME}.zip"
  unzip ${CKB_FILENAME}.zip
  cp ${CKB_FILENAME}/ckb ./ckb-arm64
  rm -rf $CKB_FILENAME
  rm ${CKB_FILENAME}.zip
}

function download_linux() {
  # Linux
  CKB_FILENAME="ckb_${CKB_VERSION}_x86_64-unknown-linux-gnu-portable"
  cd $ROOT_DIR/packages/neuron-wallet/bin/linux

  curl -O -L "${GITHUB_RELEASE_URL}/${CKB_VERSION}/${CKB_FILENAME}.tar.gz"
  tar xvzf ${CKB_FILENAME}.tar.gz
  cp ${CKB_FILENAME}/ckb ./
  rm -rf $CKB_FILENAME
  rm ${CKB_FILENAME}.tar.gz
}

function download_windows() {
  # Windows
  CKB_FILENAME="ckb_${CKB_VERSION}_x86_64-pc-windows-msvc"
  cd $ROOT_DIR/packages/neuron-wallet/bin/win

  curl -O -L "${GITHUB_RELEASE_URL}/${CKB_VERSION}/${CKB_FILENAME}.zip"
  unzip ${CKB_FILENAME}.zip
  cp ${CKB_FILENAME}/ckb.exe ./
  rm -rf $CKB_FILENAME
  rm ${CKB_FILENAME}.zip
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
