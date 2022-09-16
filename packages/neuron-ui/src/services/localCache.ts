import { SYNC_REBUILD_SINCE_VERSION } from 'utils/const'

export enum LocalCacheKey {
  Addresses = 'addresses',
  Networks = 'networks',
  Wallets = 'wallets',
  CurrentWallet = 'currentWallet',
  CurrentNetworkID = 'currentNetworkID',
  CacheClearDate = 'cacheClearDate',
  SyncRebuildNotification = 'syncRebuildNotification',
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

export const cacheClearDate = {
  save: (date: string) => {
    window.localStorage.setItem(LocalCacheKey.CacheClearDate, date)
    return true
  },
  load: () => {
    return window.localStorage.getItem(LocalCacheKey.CacheClearDate) ?? ''
  },
}

export const syncRebuildNotification = {
  save: () => {
    window.localStorage.setItem(LocalCacheKey.SyncRebuildNotification, SYNC_REBUILD_SINCE_VERSION)
    return true
  },
  load: () => {
    return window.localStorage.getItem(LocalCacheKey.SyncRebuildNotification)
  },
}
