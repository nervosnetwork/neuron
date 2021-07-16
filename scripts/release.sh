#!/bin/bash

function release() {
    case $1 in
        mac)
        electron-builder --mac --publish=always
        ;;
        win)
        set DEBUG=electron-builder electron-builder --win --x64 --publish=always
        ;;
        linux)
        electron-builder --linux --publish=always
        ;;
        *)
        electron-builder -mwl --publish=always
        ;;
        esac
}

cd packages/neuron-wallet/
release $1
