/**
 * Nft {
    version:        u8,
    characteristic: [u8; 8],
    configure:      u8,
    state:          u8,
    extinfo_data:   <size: u16> + <vartext>
  }
 */
class NFT {
  private configure = 0
  private state = 0

  constructor(configure: number, state: number) {
    this.configure = configure
    this.state = state
  }

  isLocked() {
    return (this.state & 0b0000_0010) === 0b0000_0010
  }

  isClaimed() {
    return (this.state & 0b0000_0001) === 0b0000_0001
  }

  allowTransferBeforeClaim() {
    return (this.configure & 0b0001_0000) == 0b0000_0000
  }

  allowTransferAfterClaim() {
    return (this.configure & 0b0010_0000) === 0b0000_0000
  }

  // https://github.com/nervina-labs/ckb-nft-scripts/blob/173669c84f72bfcf2a016c980f96cd192e7ca43d/contracts/nft-type/src/validator.rs#L55-L63
  isTransferable() {
    if (this.isLocked()) {
      return false
    }

    if (!this.isClaimed() && !this.allowTransferBeforeClaim()) {
      return false
    }

    if (this.isClaimed() && !this.allowTransferAfterClaim()) {
      return false
    }

    return true
  }

  static fromString(hex: string) {
    const data = this.remove0x(hex)
    const configure = parseInt(data.slice(18, 20), 16)
    const state = parseInt(data.slice(20, 22), 16)
    return new NFT(configure, state)
  }

  static remove0x = (hex: string) => {
    if (hex.startsWith('0x')) {
      return hex.substring(2)
    }
    return hex
  }
}

export default NFT
