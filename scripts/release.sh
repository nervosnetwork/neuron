#!/bin/bash

function release() {
    case $1 in
        mac)
        npx electron-builder --mac -p always
        ;;
        win)
        npx electron-builder --win --x64 -p always
        ;;
        linux)
        npx electron-builder --linux -p always
        ;;
        *)
        npx electron-builder -mwl -p always
        ;;
        esac
}

cd packages/neuron-wallet/
release $1
