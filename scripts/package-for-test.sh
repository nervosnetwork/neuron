#!/bin/bash

function package() {
    case $1 in
        mac)
        electron-builder --mac -p never
        ;;
        win)
        npm exec -- electron-builder --win --x64 -p never
        ;;
        linux)
        electron-builder --linux -p never
        ;;
        *)
        electron-builder -mwl -p never
        ;;
        esac
}

cd packages/neuron-wallet/
package $1
