#!/bin/bash

{
  cd ${HOME}
  rm -rf './Library/Application Support/Electron/dev/wallets'
  rm -rf './Library/Application Support/Electron/dev/cells'
  rm -rf './Library/Application Support/Electron/dev/networks'
  rm -rf './Library/Application Support/Electron/dev/datastore'
  rm './Library/Application Support/Electron/dev/settings.json'
} || {
  echo "dir is not exist"
}
