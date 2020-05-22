export default {
  translation: {
    keywords: {
      wallet: 'Wallet',
      password: 'Password',
      'wallet-name': 'Wallet Name',
    },
    'application-menu': {
      neuron: {
        about: 'About {{app}}',
        preferences: 'Preferences...',
        'check-updates': 'Check for Updates...',
        quit: 'Quit {{app}}',
      },
      wallet: {
        label: 'Wallet',
        select: 'Select Wallet',
        'create-new': 'Create New Wallet',
        import: 'Import Wallet',
        backup: 'Backup Current Wallet',
        'export-xpubkey': 'Export Extended Public Key',
        delete: 'Delete Current Wallet',
        'change-password': 'Change Password',
        'import-mnemonic': 'Import Wallet Seed',
        'import-keystore': 'Import from Keystore',
        'import-xpubkey': 'Import Extended Public Key',
      },
      edit: {
        label: 'Edit',
        cut: 'Cut',
        copy: 'Copy',
        paste: 'Paste',
        selectall: 'Select All',
      },
      tools: {
        label: "Tools",
        "sign-and-verify": "Sign/Verify Message",
      },
      window: {
        label: 'Window',
        minimize: 'Minimize',
        close: 'Close Window',
      },
      help: {
        label: 'Help',
        'nervos-website': 'Nervos Website',
        'source-code': 'Source Code',
        'report-issue': 'Report Issue',
        documentation: 'Documentation',
        faq: 'Neuron FAQ',
        settings: 'Settings',
        'export-debug-info': 'Export Debug Information'
      },
      develop: {
        develop: 'Develop',
        'force-reload': 'Force Reload',
        reload: 'Reload',
        'toggle-dev-tools': 'Toggle Developer Tools',
      },
    },
    services: {
      transactions: 'Transactions',
      wallets: 'Wallets',
    },
    messages: {
      'failed-to-load-networks': 'Failed to load networks.',
      'Networks-will-be-reset': 'Networks will be reset.',
      'wallet-password-less-than-min-length': 'Password must be at least {{minPasswordLength}} characters.',
      'wallet-password-more-than-max-length': 'Password up to {{maxPasswordLength}} characters.',
      'wallet-password-letter-complexity':
        'Password must contain a combination of uppercase and lowercase letters, numbers and special symbols.',
      'current-wallet-not-set': 'Current wallet is not set.',
      'incorrect-password': 'Password is incorrect.',
      'invalid-address': 'Address {{address}} is invalid.',
      'codehash-not-loaded': 'codehash is not loaded.',
      'wallet-not-found': 'Wallet {{id}} not found.',
      'failed-to-create-mnemonic': 'Failed to create mnemonic.',
      'network-not-found': 'Network of ID {{id}} is not found.',
      'invalid-name': '{{field}} name is invalid.',
      'default-network-unremovable': 'Default network is unremovable.',
      'lack-of-default-network': 'Lack of default network.',
      'current-network-not-set': 'Current CKB node RPC has not been set.',
      'transaction-not-found': 'Transaction {{hash}} is not found.',
      'is-required': '{{field}} is required.',
      'invalid-format': '{{field}} is in invalid format.',
      'used-name': '{{field}} name is used, please choose another one.',
      'missing-required-argument': 'Missing required argument.',
      'save-keystore': 'Save Keystore.',
      'save-extended-public-key': 'Save Extended Public Key.',
      'import-extended-public-key': 'Import Extended Public Key.',
      'invalid-mnemonic': 'Wallet seed is invalid, please check it again.',
      'unsupported-cipher': 'Unsupported cipher.',
      'capacity-not-enough': 'Insufficient balance.',
      'capacity-not-enough-for-change': "You need more capacities for change (at least 61 CKBytes), or click 'Max' button to send all your balance.",
      'live-capacity-not-enough': 'Insufficient available balance, please try again when last transaction has been confirmed.',
      'capacity-too-small': 'The minimal transfer balance is {{bytes}} CKBytes.',
      'should-be-type-of': '{{field}} should be type of {{type}}.',
      'invalid-keystore': 'Keystore is invalid, please check your file integrity.',
      'invalid-json': 'Invalid JSON file, please check your file integrity.',
      'cell-is-not-yet-live': 'Please wait until last transaction is confirmed by chain.',
      'transaction-is-not-committed-yet': 'Cannot find required cells on chain, please make sure the related transactions has been confirmed.',
      'mainnet-address-required': '{{address}} is not a mainnet address.',
      'testnet-address-required': '{{address}} is not a testnet address.',
      'address-not-found': 'The given address does not belong to current wallet. Please check your wallet or wait for synchronizing complete.'
    },
    messageBox: {
      button: {
        confirm: 'OK',
        discard: 'Cancel',
      },
      'send-capacity': {
        title: 'Send Transaction',
      },
      'remove-network': {
        title: 'Remove Network',
        message: 'Network {{name}} (address: {{address}}) will be removed.',
        alert: 'This is the current network, by removing it, the connection will be switched to the default network',
      },
      'remove-wallet': {
        title: 'Delete the wallet',
        password: 'Password',
      },
      'backup-keystore': {
        title: 'Backup the Keystore',
        password: 'Password',
      },
      transaction: {
        title: 'Transaction: {{hash}}',
      },
      'sign-and-verify':{
        title: 'Sign/verify message'
      },
    },
    prompt: {
      password: {
        label: 'Input your password',
        submit: 'Submit',
        cancel: 'Cancel',
      },
    },
    updater: {
      'update-not-available': 'There are currently no updates available.',
    },
    common: {
      yes: 'Yes',
      no: 'No',
      ok: 'OK',
      error: 'Error',
    },
    'export-debug-info':{
      'export-debug-info': 'Export Debug Information',
      'debug-info-exported': 'Debug information has been exported to {{ file }}'
    },
    about: {
      "app-version": "{{name}} Version: {{version}}",
      "ckb-client-version": "CKB Client Version: {{version}}"
    }
  },
}
