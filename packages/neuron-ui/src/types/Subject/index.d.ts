interface Subscription {
  unsubscribe: () => void
}
interface NeuronWalletSubject<T = any> {
  subscribe: (onData?: (data: T) => void, onError?: (error: Error) => void, onComplete?: () => void) => Subscription
  unsubscribe: () => void
}

declare namespace Command {
  type Type = 'nav' | 'toggleAddressBook' | 'deleteWallet' | 'backupWallet'
  type payload = string | null
}
