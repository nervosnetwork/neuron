#!/bin/bash

function package_for_test() {
    case $1 in
        mac)
        npx electron-builder --mac -p never
        ;;
        win)
        npx electron-builder --win --x64 -p never
        ;;
        linux)
        npx electron-builder --linux -p never
        ;;
        *)
        npx electron-builder -mwl -p never
        ;;
        esac
}

cd packages/neuron-wallet/
package_for_test $1
