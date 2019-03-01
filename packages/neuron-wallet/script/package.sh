function get_platform() {
    case $1 in
        mac|win)
        package $1        
        ;;
        *)
        check_rpm $1
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
        *)
        electron-builder -mwl
        ;;
        esac
}

function check_rpm() {
    echo "Check rpm ..."
    if ! [ -x "$(command -v rpm)" ] ; then 
        OS=`uname -s`
        if [ ${OS} == "Darwin"  ];then
            echo "Please run 'brew install rpm' to install rpm." 
        elif [ ${OS} == "Linux"  ];then
        source /etc/os-release
        case $ID in
            debian|ubuntu|devuan)
                echo "Please run 'apt-get install rpm' to install rpm."
                ;;
            centos|fedora|rhel)
                yumdnf="yum"
                if test "$(echo "$VERSION_ID >= 22" | bc)" -ne 0; then
                    yumdnf="dnf"
                fi
                echo "Please run '$yumdnf install -y rpm' to intall rpm."
                ;;
                *)
                echo "Please install 'rpm'."
                ;;
            esac
        else
            echo "Please install 'rpm'."
        fi
    else
        package $1
    fi
}

cd packages/neuron-wallet/
get_platform $1
