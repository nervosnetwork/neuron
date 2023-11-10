#!/bin/bash

function package() {
    case $1 in
        mac)
        electron-builder --mac -c electron-builder.test.yml -p never
        ;;
        win)
        npm exec -- electron-builder --win --x64 -c electron-builder.test.yml -p never
        ;;
        linux)
        electron-builder --linux -c electron-builder.test.yml -p never
        ;;
        *)
        electron-builder -mwl -c electron-builder.test.yml -p never
        ;;
        esac
}

cd packages/neuron-wallet/
package $1
