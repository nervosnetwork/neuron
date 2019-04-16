#!/bin/bash

function package() {
    case $1 in
        mac)
        electron-builder --mac
        ;;
        win)
        electron-builder --win --x64
        ;;
        linux)
        electron-builder --linux
        ;;
        *)
        electron-builder -mwl
        ;;
        esac
}

cd packages/neuron-wallet/
package $1
