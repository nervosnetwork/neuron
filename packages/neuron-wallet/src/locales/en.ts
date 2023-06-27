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
        'import-hardware': 'Import Hardware Wallet',
      },
      edit: {
        label: 'Edit',
        cut: 'Cut',
        copy: 'Copy',
        paste: 'Paste',
        selectall: 'Select All',
      },
      tools: {
        label: 'Tools',
        'sign-and-verify': 'Sign/Verify Message',
        'multisig-address': 'Multisig Addresses',
        'offline-sign': 'Offline sign',
        'clear-sync-data': 'Clear all synchronized data',
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
        'contact-us': 'Contact Us',
        'contact-us-message':
          '> Please append debug information exported by "Menu" -> "Help" -> "Export Debug Information".',
        documentation: 'Documentation',
        settings: 'Settings',
        'export-debug-info': 'Export Debug Information',
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
      'capacity-not-enough-for-change': 'You need more capacities for change (more than 61 CKBytes).',
      'capacity-not-enough-for-change-by-transfer':
        "You need more capacities for change (more than 61 CKBytes), or click 'Max' button to send all your balance.",
      'live-capacity-not-enough':
        'Insufficient available balance, please try again when last transaction has been confirmed.',
      'capacity-too-small': 'The minimal transfer balance is {{bytes}} CKBytes.',
      'should-be-type-of': '{{field}} should be type of {{type}}.',
      'invalid-keystore': 'Keystore is invalid, please check your file integrity.',
      'invalid-json': 'Invalid JSON file, please check your file integrity.',
      'cell-is-not-yet-live': 'Please wait until last transaction is confirmed by chain.',
      'transaction-is-not-committed-yet':
        'Cannot find required cells on chain, please make sure the related transactions has been confirmed.',
      'mainnet-address-required': '{{address}} is not a mainnet address.',
      'testnet-address-required': '{{address}} is not a testnet address.',
      'address-not-found':
        'The given address does not belong to current wallet. Please check your wallet or wait for synchronizing complete.',
      'target-output-not-found': "There isn't an account wallet associated with this address.",
      'acp-same-account': "The payment account and receive account shouldn't be the same.",
      'device-sign-canceled':
        'You have canceled the signing request. Otherwise, please make sure the Nervos app on your device has the configuration “allow contract data” enabled',
      'connect-device-failed': 'The device cannot be connected, please check your connection.',
      'unsupported-manufacturer': 'Devices from {{manufacturer}} are not yet supported.',
      'wallet-not-supported-function': 'This wallet does not support {name} function.',
      'invalid-transaction-file': 'Invalid transaction file.',
      'offline-sign-failed': 'Signing failed, please check if you are signing with the correct wallet.',
      'multisig-script-prefix-error': 'The multisig config is error',
      'multisig-config-not-exist': 'The multisig config is not exist',
      'multisig-config-exist': 'The multisig config has exist',
      'multisig-config-address-error': 'The address setting of the multisig configuration is incorrect',
      'multisig-config-need-error': 'Multisig transaction generation requires multisig configuration',
      'transaction-no-input-paramter': 'The query input cell is missing a required parameter',
      'migrate-sudt-no-type': 'The migrating cell does not have type script',
      'multisig-not-signed': 'Partial signatures are missing for multisig transactions',
      'multisig-lock-hash-mismatch': 'The current multisig address does not match the transaction to be approved',
      'sudt-acp-have-data': 'The destroying sUDT acp account have amount',
      'no-match-address-for-sign': 'Not found matched address',
      'target-lock-error': 'CKB asset account can only transfer to sepe256k1 or acp address',
      'no-exist-ckb-node-data': '{{path}} has no CKB Node config and storage, press ok to synchronize from scratch',
      'light-client-sudt-acp-error': "Light client mode doesn't support sending assets to other's asset account",
    },
    messageBox: {
      button: {
        confirm: 'OK',
        discard: 'Cancel',
      },
      'clear-sync-data': {
        title: 'Clear all synchronized data',
        message:
          'Clear all synchronized data will delete all local synchronized data and resynchronize the data on the chain, the whole synchronization may take a long time.',
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
      'sign-and-verify': {
        title: 'Sign/verify message',
      },
      'multisig-address': {
        title: 'Multisig Addresses',
      },
      'ckb-dependency': {
        title: 'Bundled CKB Node',
        message: 'Dependency Required',
        detail: `The embedded CKB node in Neuron requires x64 version of Microsoft Visual C++ Redistributable component to be installed to work properly. You have to install it to enable the internal node.`,
        buttons: {
          'install-and-exit': 'Install and Exit',
        },
      },
      'acp-migration': {
        title: 'Upgrade Asset Account',
        message: 'Upgrade Asset Account',
        detail:
          'Recently our security team identified a potential vulnerability in the experimental Asset Account script. We have deployed a new Asset Account script with a fix on mainnet and all future Asset Account will use the new version. We suggest you to upgrade them to use the new script.',
        buttons: {
          migrate: 'Secure upgrade now',
          skip: 'I know the risk, will upgrade later',
        },
      },
      'acp-migration-completed': {
        title: 'Congratulations! You have completed the secure upgrade.',
        message: 'Congratulations! You have completed the secure upgrade.',
        buttons: {
          ok: 'OK',
        },
      },
      'hard-fork-migrate': {
        message:
          'In order to adapt to the latest version of CKB, Neuron will resynchronize the data on the chain, and the whole synchronization may take a long time.',
      },
      'mail-us': {
        message: 'Please mail us with debug information exported by "Menu" -> "Help" -> "Export Debug Information".',
        'open-client': 'Open Mail Client',
        'fail-message':
          'Unable to launch mail client, please copy the mail address, append debug information exported by "Menu" -> "Help" -> "Export Debug Information" and send us.',
        'copy-mail-addr': 'Copy mail address',
      },
      'migrate-failed': {
        title: 'Migrate failed',
        message:
          'Migrate failed, press ok to delete old data and synchronize from scratch, or click cancel to migrate later by relanuch Neuron. Migrate fail reason: {{ reason }}',
        buttons: {
          ok: 'OK',
          cancel: 'Cancel',
        },
      },
      'node-version-different': {
        message: 'The node version is inconsistent with Neuron(v {{ version }}), please use after confirmation',
      },
      'ckb-without-indexer': {
        message: "Please add '--indexer' option to start local node",
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
      cancel: 'Cancel',
      error: 'Error',
    },
    'export-debug-info': {
      'export-debug-info': 'Export Debug Information',
      'debug-info-exported': 'Debug information has been exported to {{ file }}',
    },
    about: {
      'app-version': '{{name}} Version: {{version}}',
      'ckb-client-version': 'CKB Client Version: {{version}}',
      'ckb-light-client-version': 'CKB Light Client Version: {{version}}',
    },
    settings: {
      title: {
        normal: 'Settings',
        mac: 'Preference',
      },
    },
    'export-transactions': {
      'export-transactions': 'Export Transaction History',
      'transactions-exported': '{{total}} transaction records have been exported to {{file}}',
      column: {
        time: 'Time',
        'block-number': 'Block Number',
        'tx-hash': 'Transaction Hash',
        'tx-type': 'Transaction Type',
        amount: 'CKB Amount',
        'udt-amount': 'UDT Amount',
        description: 'Description',
      },
      'tx-type': {
        send: 'Send',
        receive: 'Receive',
        'create-asset-account': 'Create {{name}} Asset Account',
        'destroy-asset-account': 'Destroy {{name}} Asset Account',
      },
    },
    'offline-signature': {
      'export-transaction': 'Export Transaction as JSON',
      'transaction-exported': 'The transaction have beed exported to {{filePath}}.',
      'load-transaction': 'Load Transaction file',
    },
    'multisig-config': {
      'import-config': 'Import multisig config',
      'export-config': 'Export multisig config',
      'config-exported': 'Multisig configs has been exported at {{filePath}}.',
      'import-duplicate': 'Please check for duplicate configurations',
      'import-result': 'Imports succeeded {{success}}, failed {{fail}}.{{failCheck}}',
      'confirm-delete': 'Confirm delete the multisig config?',
      'approve-tx': 'Confirm multisig transaction',
      'delete-actions': {
        ok: 'Confirm',
        cancel: 'Cancel',
      },
    },
    'open-in-explorer': {
      title: 'View in CKB Explorer',
      transaction: 'transaction',
      message: 'View {{type}} {{key}} in CKB Explorer',
    },
  },
}
