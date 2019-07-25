const FallbackSubject = {
  subscribe: (args: any) => {
    console.warn('remote is not supported')
    console.info(JSON.stringify(args))
    return {
      unsubscribe: () => {
        console.info('unsubscribe')
      },
    }
  },
  unsubscribe: () => {
    console.info('unsubscribe')
  },
}
export const SystemScript = window.remote
  ? (window.remote.require('./models/subjects/system-script').default as NeuronWalletSubject<{ codeHash: string }>)
  : FallbackSubject

export const DataUpdate = window.remote
  ? (window.remote.require('./models/subjects/data-update').default as NeuronWalletSubject<{
      dataType: 'address' | 'transaction' | 'wallet' | 'network'
      actionType: 'create' | 'update' | 'delete'
      walletID?: string
    }>)
  : FallbackSubject

export default {
  SystemScript,
  DataUpdate,
}
