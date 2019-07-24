import { NeuronWalletActions, StateDispatch } from 'states/stateProvider/reducer'
import initStates from 'states/initStates'

import {
  wallets as walletsCache,
  networks as networksCache,
  addresses as addressesCache,
  currentNetworkID as currentNetworkIDCache,
  currentWallet as currentWalletCache,
  systemScript as systemScriptCache,
  language as languageCache,
} from 'utils/localCache'
import { Routes, ConnectionStatus } from 'utils/const'
import { WalletWizardPath } from 'components/WalletWizard'
import addressesToBalance from 'utils/addressesToBalance'

const intializeApp = ({
  initializedState,
  i18n,
  history,
  dispatch,
}: {
  initializedState: any
  i18n: any
  history: any
  dispatch: StateDispatch
}) => {
  const {
    locale,
    networks = [],
    currentNetworkID: networkID = '',
    wallets = [],
    currentWallet: wallet = initStates.wallet,
    addresses = [],
    transactions = initStates.chain.transactions,
    tipNumber = '0',
    connectionStatus = false,
    codeHash = '',
  } = initializedState
  if (locale && locale !== i18n.language) {
    i18n.changeLanguage(locale)
    languageCache.save(locale)
  }
  if (wallet && wallet.id) {
    history.push(Routes.Overview)
  } else {
    history.push(`${Routes.WalletWizard}${WalletWizardPath.Welcome}`)
  }
  if (networks.length) {
    dispatch({
      type: NeuronWalletActions.Initiate,
      payload: {
        networks,
        networkID,
        wallet: { ...wallet, balance: addressesToBalance(addresses), addresses },
        wallets,
      },
    })
  }
  dispatch({
    type: NeuronWalletActions.Chain,
    payload: {
      tipBlockNumber: tipNumber,
      codeHash,
      connectionStatus: connectionStatus ? ConnectionStatus.Online : ConnectionStatus.Offline,
      transactions: { ...initStates.chain.transactions, ...transactions },
    },
  })

  currentWalletCache.save(wallet)
  currentNetworkIDCache.save(networkID)
  walletsCache.save(wallets)
  addressesCache.save(addresses)
  networksCache.save(networks)
  systemScriptCache.save({ codeHash })
}
export default intializeApp
