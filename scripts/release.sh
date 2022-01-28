#!/bin/bash

function release() {
    case $1 in
        mac)
        electron-builder --mac -p always
        ;;
        win)
        electron-builder --win --x64 -p always
        ;;
        linux)
        electron-builder --linux -p always
        ;;
        *)
        electron-builder -mwl -p always
        ;;
        esac
}

cd packages/neuron-wallet/
release $1
