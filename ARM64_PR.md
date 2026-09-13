# Add Linux arm64 (aarch64) AppImage support

## Summary

This PR adds support for building Neuron as a Linux arm64 AppImage, targeting Raspberry Pi 4/5, Orange Pi, ROCK series boards and other aarch64 single-board computers running Linux — which are popular in the CKB node-running community.

A working `Neuron-v0.204.0-arm64.AppImage` (192 MB, verified ELF aarch64) was built successfully on an Orange Pi 5 (aarch64, Ubuntu 22.04) using the changes in this PR.

---

## Changes

### 1. `scripts/download-ckb.sh` — add `download_linux_aarch64()`

Added a new function that downloads the `aarch64-unknown-linux-gnu` CKB binary (which already exists in every CKB release) and saves it as `bin/linux/ckb-arm64`:

```bash
function download_linux_aarch64() {
  CKB_FILENAME="ckb_${CKB_VERSION}_aarch64-unknown-linux-gnu"
  cd $ROOT_DIR/packages/neuron-wallet/bin/linux
  curl -O -L "${GITHUB_RELEASE_URL}/${CKB_VERSION}/${CKB_FILENAME}.tar.gz"
  tar xvzf ${CKB_FILENAME}.tar.gz
  cp ${CKB_FILENAME}/ckb ./ckb-arm64
  rm -rf $CKB_FILENAME ${CKB_FILENAME}.tar.gz
}
```

Also added a `linux-arm64` case to the switch:
```bash
linux-arm64) download_linux_aarch64; download_linux_light;;
```

> **Note on `ckb-light-client`**: No arm64 Linux release exists in the `ckb-light-client` repo yet. The x86_64 binary is currently used for both architectures. A separate issue/PR to the `ckb-light-client` repo would complete that gap.

### 2. `packages/neuron-wallet/electron-builder.yml` — add arm64 target + extraFile

```yaml
linux:
  extraFiles:
    - from: "bin/linux/ckb"
      to: "bin/ckb"
    - from: "bin/linux/ckb-arm64"   # ← new
      to: "bin/ckb-arm64"
    # ... rest unchanged
  target:
    - target: AppImage
      arch:
        - x64
        - arm64    # ← new
```

### 3. `package.yml` (GitHub Actions) — add arm64 Linux runner

To build the arm64 AppImage in CI, add an `ubuntu-24.04-arm` runner to the matrix:

```yaml
jobs:
  default:
    strategy:
      matrix:
        node: [22]
        os:
          - macos-latest
          - ubuntu-latest
          - ubuntu-24.04-arm   # ← new: GitHub's hosted arm64 runner
          - windows-latest
```

And add a conditional upload step:
```yaml
- name: Upload Neuron Linux arm64
  if: runner.os == 'Linux' && runner.arch == 'ARM64'
  uses: actions/upload-artifact@v4
  with:
    name: Neuron-Linux-arm64
    path: release/Neuron-*-arm64.AppImage
```

---

## Build instructions (manual, on arm64 Linux)

```bash
# Prerequisites
sudo apt-get install -y libudev-dev libusb-1.0-0-dev fuse libfuse2 rpm python3-setuptools

# Clone and install
git clone https://github.com/nervosnetwork/neuron.git
cd neuron
yarn global add lerna
CI=false yarn
yarn build
./scripts/copy-ui-files.sh

# Download CKB binaries (both x64 and arm64)
./scripts/download-ckb.sh linux

# Build AppImage for arm64
cd packages/neuron-wallet
npx electron-builder --linux --arm64 --config.npmRebuild=false
```

Output: `release/Neuron-v{version}-arm64.AppImage`

**Flags explained:**
- `--linux --arm64`: target platform and architecture
- `--config.npmRebuild=false`: skip native module rebuild (avoids cross-compilation issues when building arm64 on an arm64 host where modules are already built for the right arch)

---

## Tested on

| Device | OS | Result |
|--------|-----|--------|
| Orange Pi 5 (RK3588S) | Ubuntu 22.04 arm64 | ✅ `Neuron-v0.204.0-arm64.AppImage` built, 192 MB |

The resulting AppImage is a valid ELF aarch64 executable:
```
ELF 64-bit LSB executable, ARM aarch64, version 1 (SYSV), dynamically linked,
interpreter /lib/ld-linux-aarch64.so.1, for GNU/Linux 3.7.0, stripped
```

---

## Why this matters

Single-board computers (Raspberry Pi 4/5, Orange Pi, Rock Pi, etc.) are widely used to run CKB full nodes — they're low-power, always-on, and affordable. Many CKB community members running nodes on these devices also want to use Neuron as their wallet but currently have no official binary. An arm64 AppImage closes that gap with a single self-contained download.
