import { NetworkType, SYNC_REBUILD_SINCE_VERSION } from 'utils/const'

export enum LocalCacheKey {
  Addresses = 'addresses',
  Networks = 'networks',
  Wallets = 'wallets',
  CurrentWallet = 'currentWallet',
  CurrentNetworkID = 'currentNetworkID',
  CacheClearDate = 'cacheClearDate',
  SyncRebuildNotification = 'syncRebuildNotification',
  LoadedWalletIDs = 'loadedWalletIDs',
  ImportedWallet = 'ImportedWallet',
  ShownNodeId = 'ShownNodeId',
  ScreenAwake = 'ScreenAwake',
  RetryUnlockWindowInfo = 'RetryUnlockWindowInfo',
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
        throw new TypeError(`Addresses should be type of Address[]`)
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
  load: (): State.WalletIdentity | undefined => {
    const walletStr = window.localStorage.getItem(LocalCacheKey.CurrentWallet) || '{}'
    try {
      return JSON.parse(walletStr) as State.WalletIdentity
    } catch (err) {
      console.error(`Cannot parse current wallet`)
      return undefined
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

export const loadedWalletIDs = {
  save: (ids: string) => {
    window.localStorage.setItem(LocalCacheKey.LoadedWalletIDs, ids)
  },
  load: () => {
    return window.localStorage.getItem(LocalCacheKey.LoadedWalletIDs) || ''
  },
}

export const importedWalletDialogShown = {
  getKey: (walletId: string) => `${walletId}_${LocalCacheKey.ImportedWallet}`,
  setStatus: (walletId: string, show: boolean) => {
    window.localStorage.setItem(importedWalletDialogShown.getKey(walletId), show.toString())
  },
  getStatus: (walletId: string) => {
    try {
      const status = window.localStorage.getItem(importedWalletDialogShown.getKey(walletId))
      return status ? (JSON.parse(status) as boolean) : false
    } catch (error) {
      return false
    }
  },
}

export const lastShowInternalNodeIds = {
  get: (type: NetworkType) => {
    const savedNodeId = window.localStorage.getItem(`${type}_${LocalCacheKey.ShownNodeId}`)
    return savedNodeId ?? networks.load().find(v => v.type === type)?.id
  },
  save: (type: NetworkType, id: string) => {
    window.localStorage.setItem(`${type}_${LocalCacheKey.ShownNodeId}`, id)
  },
}

export const keepScreenAwake = {
  get: () => {
    const value = window.localStorage.getItem(LocalCacheKey.ScreenAwake)
    return !!value && value === 'true'
  },
  save: (value: boolean) => {
    window.localStorage.setItem(LocalCacheKey.ScreenAwake, value.toString())
  },
}

export const retryUnlockWindow = {
  reset: () => {
    window.localStorage.setItem(LocalCacheKey.RetryUnlockWindowInfo, JSON.stringify({ retryTimes: 0 }))
  },
  save: (info: { lastRetryTime?: number; retryTimes: number }) => {
    window.localStorage.setItem(LocalCacheKey.RetryUnlockWindowInfo, JSON.stringify(info))
  },
  get: (): { lastRetryTime?: number; retryTimes: number } => {
    try {
      const info = window.localStorage.getItem(LocalCacheKey.RetryUnlockWindowInfo)
      return info ? JSON.parse(info) : { retryTimes: 0 }
    } catch (error) {
      return { retryTimes: 0 }
    }
  },
}
