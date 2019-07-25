export enum LocalCacheKey {
  AddressBookVisibility = 'address-book-visibility',
  Addresses = 'addresses',
  Networks = 'networks',
  Wallets = 'wallets',
  CurrentWallet = 'currentWallet',
  CurrentNetworkID = 'currentNetworkID',
  SystemScript = 'systemScript',
  Language = 'lng',
}
enum AddressBookVisibility {
  Invisible = '0',
  Visible = '1',
}

export const addressBook = {
  isVisible: () => {
    const isVisible = window.localStorage.getItem(LocalCacheKey.AddressBookVisibility)
    return AddressBookVisibility.Visible === isVisible
  },

  toggleVisibility: () => {
    window.localStorage.setItem(
      LocalCacheKey.AddressBookVisibility,
      addressBook.isVisible() ? AddressBookVisibility.Invisible : AddressBookVisibility.Visible
    )
  },
}

export const addresses = {
  save: (addressList: State.Address[]) => {
    if (!Array.isArray(addressList)) {
      return false
    }
    const addressesStr = JSON.stringify(addressList)
    window.localStorage.setItem(LocalCacheKey.Addresses, addressesStr)
    return true
  },
  load: () => {
    const addressesStr = window.localStorage.getItem(LocalCacheKey.Addresses) || `[]`
    try {
      const addressList = JSON.parse(addressesStr)
      if (!Array.isArray(addressList)) {
        throw new TypeError(`Addresses should be type fo Address[]`)
      }
      return addressList
    } catch (err) {
      console.error(err)
      return []
    }
  },
}

export const networks = {
  save: (networkList: State.Network[]) => {
    if (!Array.isArray(networkList)) {
      return false
    }
    const networksStr = JSON.stringify(networkList)
    window.localStorage.setItem(LocalCacheKey.Networks, networksStr)
    return true
  },
  load: () => {
    const networksStr = window.localStorage.getItem(LocalCacheKey.Networks) || `[]`
    try {
      const networkList = JSON.parse(networksStr)
      if (!Array.isArray(networkList)) {
        throw new TypeError(`Networks should be type of Network[]`)
      }
      return networkList
    } catch (err) {
      console.error(err)
      return []
    }
  },
}

export const wallets = {
  save: (walletList: State.WalletIdentity[]) => {
    if (!Array.isArray(walletList)) {
      return false
    }
    const walletsStr = JSON.stringify(walletList)
    window.localStorage.setItem(LocalCacheKey.Wallets, walletsStr)
    return true
  },
  load: () => {
    const walletsStr = window.localStorage.getItem(LocalCacheKey.Wallets) || `[]`
    try {
      const walletList = JSON.parse(walletsStr)
      if (!Array.isArray(walletList)) {
        throw new TypeError(`Wallets should be type of WalletIdentity[]`)
      }
      return walletList
    } catch (err) {
      console.error(err)
      return []
    }
  },
}

export const currentWallet = {
  save: (wallet: State.WalletIdentity | null) => {
    const walletStr = JSON.stringify({ id: '', name: '', ...wallet })
    window.localStorage.setItem(LocalCacheKey.CurrentWallet, walletStr)
    return true
  },
  load: (): { [index: string]: string } => {
    const walletStr = window.localStorage.getItem(LocalCacheKey.CurrentWallet) || '{}'
    try {
      return JSON.parse(walletStr)
    } catch (err) {
      console.error(`Cannot parse current wallet`)
      return {}
    }
  },
}

export const currentNetworkID = {
  save: (networkID: string = '') => {
    window.localStorage.setItem(LocalCacheKey.CurrentNetworkID, networkID)
    return true
  },
  load: () => {
    return window.localStorage.getItem(LocalCacheKey.CurrentNetworkID) || ''
  },
}

export const systemScript = {
  save: ({ codeHash = '' }: { codeHash: string }) => {
    window.localStorage.setItem(LocalCacheKey.SystemScript, JSON.stringify({ codeHash }))
    return true
  },
  load: (): { codeHash: string } => {
    try {
      const systemScriptStr = window.localStorage.getItem(LocalCacheKey.SystemScript) || `{codeHash: ''}`
      return JSON.parse(systemScriptStr)
    } catch {
      console.error(`Cannot parse system script`)
      return { codeHash: '' }
    }
  },
}

export const language = {
  save: (lng: string) => {
    window.localStorage.setItem(LocalCacheKey.Language, lng)
    return true
  },
  load: () => {
    return window.localStorage.getItem(LocalCacheKey.Language) || 'en'
  },
}

export default {
  LocalCacheKey,
  addressBook,
  addresses,
  networks,
  wallets,
  currentWallet,
  currentNetworkID,
  systemScript,
  language,
}
