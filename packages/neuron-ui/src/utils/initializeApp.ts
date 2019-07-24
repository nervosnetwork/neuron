import { NeuronWalletActions, StateDispatch } from 'states/stateProvider/reducer'
import initStates from 'states/initStates'

import {
  wallets as walletsCache,
  addresses as addressesCache,
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
    locale = '',
    wallets = [],
    currentWallet: wallet = initStates.wallet,
    addresses = [],
    transactions = initStates.chain.transactions,
    tipNumber = '0',
    connectionStatus = false,
    codeHash = '',
  } = initializedState
  const lng = ['zh', 'zh-CN'].includes(locale) ? 'zh' : 'en'
  if (lng !== i18n.language) {
    i18n.changeLanguage(lng)
    languageCache.save(lng)
  }
  if (wallet && wallet.id) {
    history.push(Routes.Overview)
  } else {
    history.push(`${Routes.WalletWizard}${WalletWizardPath.Welcome}`)
  }
  dispatch({
    type: NeuronWalletActions.Initiate,
    payload: {
      wallet: { ...wallet, balance: addressesToBalance(addresses), addresses },
      wallets,
    },
  })
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
  walletsCache.save(wallets)
  addressesCache.save(addresses)
  systemScriptCache.save({ codeHash })
}
export default intializeApp
