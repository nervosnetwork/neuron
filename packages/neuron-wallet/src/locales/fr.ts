export default {
  translation: {
    keywords: {
      wallet: 'Wallet',
      password: 'Mot de passe',
      'wallet-name': 'Nom du Wallet',
    },
    'application-menu': {
      neuron: {
        about: 'À propos de {{app}}',
        preferences: 'Préférences...',
        'check-updates': 'Vérifier les mises à jour...',
        quit: 'Quitter {{app}}',
      },
      wallet: {
        label: 'Wallet',
        select: 'Sélectionner un Wallet',
        'create-new': 'Créer un nouveau Wallet',
        import: 'Importer un Wallet',
        backup: 'Sauvegarder le Wallet actuel',
        'export-xpubkey': 'Exporter la clé publique étendue',
        delete: 'Supprimer le Wallet actuel',
        'change-password': 'Changer de mot de passe',
        'import-mnemonic': 'Importer la graine du Wallet',
        'import-keystore': 'Importer depuis le fichier Keystore',
        'import-xpubkey': 'Importer la clé publique étendue',
        'import-hardware': 'Importer un Wallet matériel',
      },
      edit: {
        label: 'Édition',
        cut: 'Couper',
        copy: 'Copier',
        paste: 'Coller',
        selectall: 'Sélectionner tout',
      },
      tools: {
        label: 'Outils',
        'sign-and-verify': 'Signer/Vérifier le message',
        'multisig-address': 'Adresses multisig',
        'offline-sign': 'Signature hors ligne',
        'clear-sync-data': 'Effacer toutes les données synchronisées',
      },
      window: {
        label: 'Fenêtre',
        minimize: 'Réduire',
        close: 'Fermer la fenêtre',
        lock: 'Fenêtre verrouillée',
      },
      help: {
        label: 'Aide',
        'nervos-website': 'Site Web de Nervos',
        'source-code': 'Code source',
        'report-issue': 'Signaler un problème',
        'contact-us': 'Contactez-nous',
        'contact-us-message':
          '> Veuillez ajouter les informations de débogage exportées via "Menu" -> "Aide" -> "Exporter les informations de débogage".',
        documentation: 'Documentation',
        settings: 'Paramètres',
        'export-debug-info': 'Exporter les informations de débogage',
      },
      develop: {
        develop: 'Développer',
        'force-reload': 'Forcer le rechargement',
        reload: 'Recharger',
        'toggle-dev-tools': 'Basculer les outils de développement',
      },
    },
    services: {
      transactions: 'Transactions',
      wallets: 'Wallets',
    },
    messages: {
      'failed-to-load-networks': 'Échec du chargement des réseaux.',
      'Networks-will-be-reset': 'Les réseaux seront réinitialisés.',
      'wallet-password-less-than-min-length':
        'Le mot de passe doit comporter au moins {{minPasswordLength}} caractères.',
      'wallet-password-more-than-max-length':
        "Le mot de passe doit comporter jusqu'à {{maxPasswordLength}} caractères.",
      'wallet-password-letter-complexity':
        'Le mot de passe doit contenir une combinaison de lettres majuscules et minuscules, de chiffres et de caractères spéciaux.',
      'current-wallet-not-set': "Le Wallet actuel n'est pas défini.",
      'incorrect-password': 'Le mot de passe est incorrect',
      'invalid-address': "L'adresse {{address}} n'est pas valide.",
      'codehash-not-loaded': "Le codehash n'est pas chargé.",
      'wallet-not-found': 'Le Wallet {{id}} est introuvable.',
      'failed-to-create-mnemonic': 'Échec de la création de la mnémonique.',
      'network-not-found': "Le réseau de l'ID {{id}} n'a pas été trouvé.",
      'invalid-name': "Le nom {{field}} n'est pas valide.",
      'default-network-unremovable': 'Le réseau par défaut est irréparable.',
      'lack-of-default-network': 'Manque de réseau par défaut.',
      'current-network-not-set': "Le RPC du noeud CKB actuel n'a pas été défini.",
      'transaction-not-found': 'La transaction {{hash}} est introuvable.',
      'is-required': '{{field}} est requis.',
      'invalid-format': '{{field}} est dans un format invalide.',
      'used-name': 'Le nom {{field}} est utilisé, veuillez en choisir un autre.',
      'missing-required-argument': 'Argument requis manquant.',
      'save-keystore': 'Sauvegarder le fichier Keystore.',
      'save-extended-public-key': 'Sauvegarder la clé publique étendue.',
      'import-extended-public-key': 'Importer la clé publique étendue.',
      'invalid-mnemonic': "La graine du Wallet n'est pas valide, veuillez la vérifier à nouveau.",
      'unsupported-cipher': 'Chiffrement non pris en charge.',
      'capacity-not-enough': 'Solde insuffisant.',
      'capacity-not-enough-for-change':
        'Vous avez besoin de plus de capacités pour la monnaie de rendu (plus de 61 CKBytes).',
      'capacity-not-enough-for-change-by-transfer':
        'Vous avez besoin de plus de capacités pour la monnaie de rendu (plus de 61 CKBytes), ou cliquez sur le bouton "Max" pour envoyer tout votre solde.',
      'live-capacity-not-enough':
        'Solde disponible insuffisant, veuillez réessayer lorsque la dernière transaction a été confirmée.',
      'capacity-too-small': 'Le solde de transfert minimal est de {{bytes}} CKBytes.',
      'should-be-type-of': '{{field}} doit être de type {{type}}.',
      'invalid-keystore': "Le fichier Keystore n'est pas valide, veuillez vérifier l'intégrité de votre fichier.",
      'invalid-json': "Fichier JSON non valide, veuillez vérifier l'intégrité de votre fichier.",
      'cell-is-not-yet-live': 'Veuillez attendre que la dernière transaction soit confirmée par la chaîne.',
      'transaction-is-not-committed-yet':
        'Impossible de trouver les cellules requises sur la chaîne, veuillez vous assurer que les transactions liées ont été confirmées.',
      'mainnet-address-required': "{{address}} n'est pas une adresse du réseau principal.",
      'testnet-address-required': "{{address}} n'est pas une adresse du réseau de test.",
      'address-not-found':
        "L'adresse donnée ne fait pas partie du Wallet actuel. Veuillez vérifier votre Wallet ou attendre la fin de la synchronisation.",
      'target-output-not-found': "Il n'y a pas de Wallet de compte associé à cette adresse.",
      'acp-same-account': 'Le compte de paiement et le compte de réception ne doivent pas être les mêmes.',
      'device-sign-canceled':
        'Vous avez annulé la demande de signature. Sinon, assurez-vous que l\'application Nervos sur votre appareil a la configuration "autoriser les données de contrat" activée',
      'connect-device-failed': "L'appareil ne peut pas être connecté, veuillez vérifier votre connexion.",
      'unsupported-manufacturer': 'Les appareils de {{manufacturer}} ne sont pas encore pris en charge.',
      'wallet-not-supported-function': 'Ce Wallet ne prend pas en charge la fonction {name}.',
      'unsupported-ckb-cli-keystore':
        "Neuron ne prend pas en charge l'importation du fichier de stockage de clés de ckb-cli.",
      'invalid-transaction-file': 'Fichier de transaction non valide.',
      'offline-sign-failed': 'Échec de la signature, veuillez vérifier si vous signez avec le bon Wallet.',
      'multisig-script-prefix-error': 'La configuration multisig est erronée',
      'multisig-config-not-exist': "La configuration multisig n'existe pas",
      'multisig-config-exist': 'La configuration multisig existe déjà',
      'multisig-config-address-error': "Le paramètre d'adresse de la configuration multisig est incorrect",
      'multisig-config-need-error': 'La génération de transactions multisig nécessite une configuration multisig',
      'transaction-no-input-parameter': "Il manque un paramètre requis à l'entrée de la cellule de requête",
      'migrate-sudt-no-type': "La cellule de migration n'a pas de script de type",
      'multisig-not-signed': 'Des signatures partielles manquent pour les transactions multisig',
      'multisig-lock-hash-mismatch': "L'adresse multisig actuelle ne correspond pas à la transaction à approuver",
      'sudt-acp-have-data': 'Le compte acp sUDT à détruire contient une certaine quantité',
      'no-match-address-for-sign': 'Aucune adresse correspondante trouvée',
      'target-lock-error': "Le compte d'actifs CKB ne peut être transféré qu'à l'adresse secp256k1 ou acp",
      'no-exist-ckb-node-data':
        "{{path}} n'a pas de configuration et de stockage de noeud CKB, appuyez sur Confirmer pour synchroniser à partir de zéro",
      'light-client-sudt-acp-error':
        "Le mode client léger ne prend pas en charge l'envoi d'actifs vers le compte d'actifs d'autrui",
    },
    messageBox: {
      button: {
        confirm: 'OK',
        discard: 'Annuler',
      },
      'clear-sync-data': {
        title: 'Effacer toutes les données synchronisées',
        message:
          'Effacer toutes les données synchronisées supprimera toutes les données locales synchronisées et resynchronisera les données sur la chaîne. La synchronisation complète peut prendre beaucoup de temps.',
      },
      'send-capacity': {
        title: 'Envoyer la transaction',
      },
      'remove-network': {
        title: 'Supprimer le réseau',
        message: 'Le réseau {{name}} (adresse : {{address}}) sera supprimé.',
        alert: "C'est le réseau actuel. En le supprimant, la connexion passera au réseau par défaut",
      },
      'remove-wallet': {
        title: 'Supprimer le Wallet',
        password: 'Mot de passe',
      },
      'backup-keystore': {
        title: 'Sauvegarder le fichier Keystore',
        password: 'Mot de passe',
      },
      transaction: {
        title: 'Transaction : {{hash}}',
      },
      'sign-and-verify': {
        title: 'Signer/Vérifier le message',
      },
      'multisig-address': {
        title: 'Adresses multisig',
      },
      'ckb-dependency': {
        title: 'Noeud CKB inclus',
        message: 'Dépendance requise',
        detail: `Les noeuds réseau dans Neuron dépendent de composants C++, veuillez donc installer la dernière version de Microsoft Visual C++ Redistributable pour x64 pour garantir le bon fonctionnement du logiciel.`,
        buttons: {
          'install-and-exit': 'Installer et quitter',
        },
      },
      'acp-migration': {
        title: "Mise à niveau du compte d'actif",
        message: "Mise à niveau du compte d'actif",
        detail:
          "Récemment, notre équipe de sécurité a identifié une vulnérabilité potentielle dans le script expérimental du compte d'actif. Nous avons déployé un nouveau script de compte d'actif avec une correction sur le réseau principal, et tous les futurs comptes d'actif utiliseront la nouvelle version. Nous vous recommandons de les mettre à niveau pour utiliser le nouveau script.",
        buttons: {
          migrate: 'Mise à niveau sécurisée maintenant',
          skip: 'Je connais les risques, je mettrai à niveau plus tard',
        },
      },
      'acp-migration-completed': {
        title: 'Félicitations ! Vous avez terminé la mise à niveau sécurisée.',
        message: 'Félicitations ! Vous avez terminé la mise à niveau sécurisée.',
        buttons: {
          ok: 'OK',
        },
      },
      'hard-fork-migrate': {
        message:
          "Afin de s'adapter à la dernière version de CKB, Neuron va resynchroniser les données sur la chaîne, et la synchronisation complète peut prendre un certain temps.",
      },
      'mail-us': {
        message:
          'Veuillez nous envoyer un courriel avec les informations de débogage exportées par "Menu" -> "Aide" -> "Exporter les informations de débogage".',
        'open-client': 'Ouvrir le client de messagerie',
        'fail-message':
          'Impossible de lancer le client de messagerie. Veuillez copier l\'adresse e-mail, ajouter les informations de débogage exportées par "Menu" -> "Aide" -> "Exporter les informations de débogage" et nous les envoyer.',
        'copy-mail-addr': "Copier l'adresse e-mail",
      },
      'migrate-failed': {
        title: 'Échec de la migration',
        message:
          "Échec de la migration. Appuyez sur OK pour supprimer les anciennes données et resynchroniser à partir de zéro, ou cliquez sur Annuler pour migrer ultérieurement en relançant Neuron. Raison de l'échec de la migration : {{ reason }}",
        buttons: {
          ok: 'OK',
          cancel: 'Annuler',
        },
      },
    },
    prompt: {
      password: {
        label: 'Entrez votre mot de passe',
        submit: 'Soumettre',
        cancel: 'Annuler',
      },
    },
    updater: {
      'update-not-available': "Aucune mise à jour n'est actuellement disponible.",
    },
    common: {
      yes: 'Oui',
      no: 'Non',
      ok: 'OK',
      cancel: 'Annuler',
      error: 'Erreur',
    },
    'export-debug-info': {
      'export-debug-info': 'Exporter les informations de débogage',
      'debug-info-exported': 'Les informations de débogage ont été exportées vers {{ file }}',
    },
    about: {
      'app-version': '{{name}} Version : {{version}}',
      'ckb-client-version': 'Version du client CKB : {{version}}',
      'ckb-light-client-version': 'Version légère du client CKB : {{version}}',
    },
    settings: {
      title: {
        normal: 'Paramètres',
        mac: 'Préférences',
      },
    },
    'export-transactions': {
      'export-transactions': "Exporter l'historique des transactions",
      'export-success': 'Les transactions ont été exportées',
      'transactions-exported': '{{total}} enregistrements de transactions ont été exportés vers {{file}}',
      column: {
        time: 'Heure',
        'block-number': 'Numéro de bloc',
        'tx-hash': 'hash de transaction',
        'tx-type': 'Type de transaction',
        amount: 'Montant de CKB',
        'udt-amount': 'Montant UDT',
        description: 'Description',
      },
      'tx-type': {
        send: 'Envoyer',
        receive: 'Recevoir',
        'create-asset-account': "Créer un compte d'actif {{name}}",
        'destroy-asset-account': "Détruire le compte d'actif {{name}}",
      },
    },
    'offline-signature': {
      'export-transaction': 'Exporter la transaction au format JSON',
      'transaction-exported': 'La transaction a été exportée vers {{filePath}}.',
      'load-transaction': 'Charger le fichier de transaction',
    },
    'multisig-config': {
      'import-config': 'Importer une configuration multisig',
      'export-config': 'Exporter une configuration multisig',
      'config-exported': 'Les configurations multisig ont été exportées vers {{filePath}}.',
      'import-duplicate': 'Veuillez vérifier les configurations en double',
      'import-result': 'Importations réussies {{success}}, échecs {{fail}}.{{failCheck}}',
      'confirm-delete': 'Confirmer la suppression de la configuration multisig ?',
      'approve-tx': 'Confirmer la transaction multisig',
      'delete-actions': {
        ok: 'Confirmer',
        cancel: 'Annuler',
      },
    },
    'open-in-explorer': {
      title: "Voir dans l'explorateur CKB",
      transaction: 'transaction',
      message: "Voir {{type}} {{key}} dans l'explorateur CKB",
    },
  },
}
