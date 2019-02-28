function getplatform() {
    case $1 in
        linux|mwl)
        checkandinstallrpm $1
        ;;
        *)
        package $1
        ;;
    esac
}

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
        mwl)
        electron-builder -mwl
        ;;
        *)
        echo "Please add platform parameters like 'mac' 'win' 'linux' 'mwl' ."
        ;;
        esac
}

function checkandinstallrpm() {
    echo "Check rpm..."
    if ! [ -x "$(command -v rpm)" ] ; then 
        OS=`uname -s`
        if [ ${OS} == "Darwin"  ];then
            echo "Please run 'brew install rpm' " 
        elif [ ${OS} == "Linux"  ];then
        source /etc/os-release
        case $ID in
            debian|ubuntu|devuan)
                echo "Please run 'apt-get install rpm' to install rpm"
                ;;
            centos|fedora|rhel)
                yumdnf="yum"
                if test "$(echo "$VERSION_ID >= 22" | bc)" -ne 0; then
                    yumdnf="dnf"
                fi
                echo "Please run '$yumdnf install -y rpm' to intall rpm"
                ;;
                *)
                exit 1
                ;;
            esac
        else
            echo "Other OS: ${OS}"
        fi
    else
        package $1
    fi
}

cd packages/neuron-wallet/
getplatform $1