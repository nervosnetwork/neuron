export default {
  translation: {
    keywords: {
      wallet: 'Portefeuille',
      password: 'Mot de passe',
      'wallet-name': 'Nom du portefeuille',
    },
    'application-menu': {
      neuron: {
        about: 'À propos de {{app}}',
        preferences: 'Préférences...',
        'check-updates': 'Vérifier les mises à jour...',
        quit: 'Quitter {{app}}',
      },
      wallet: {
        label: 'Portefeuille',
        select: 'Sélectionner un portefeuille',
        'create-new': 'Créer un portefeuille',
        import: 'Importer un portefeuille',
        backup: 'Sauvegarder le portefeuille actuel',
        'export-xpubkey': 'Exporter la clé publique étendue',
        delete: 'Supprimer le portefeuille actuel',
        'change-password': 'Changer de mot de passe',
        'import-mnemonic': 'Importer une phrase de récupération',
        'import-keystore': 'Importer depuis le fichier Keystore',
        'import-xpubkey': 'Importer la clé publique étendue',
        'import-hardware': 'Importer un portefeuille matériel',
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
        'broadcast-transaction': 'Diffuser une transaction',
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
      wallets: 'Portefeuilles',
    },
    messages: {
      'failed-to-load-networks': 'Échec du chargement des réseaux.',
      'Networks-will-be-reset': 'Les réseaux seront réinitialisés.',
      'wallet-password-less-than-min-length':
        'Le mot de passe doit comporter au moins {{minPasswordLength}} caractères.',
      'wallet-password-more-than-max-length': 'Le mot de passe ne doit pas dépasser {{maxPasswordLength}} caractères.',
      'wallet-password-letter-complexity':
        'Le mot de passe doit contenir une combinaison de lettres majuscules et minuscules, de chiffres et de caractères spéciaux.',
      'current-wallet-not-set': "Le portefeuille actuel n'est pas défini.",
      'incorrect-password': 'Le mot de passe est incorrect',
      'invalid-address': "L'adresse {{address}} n'est pas valide.",
      'codehash-not-loaded': "Le hachage du code n'est pas chargé.",
      'wallet-not-found': 'Le portefeuille {{id}} est introuvable.',
      'failed-to-create-mnemonic': 'Impossible de créer la phrase de récupération.',
      'network-not-found': "Le réseau portant l'identifiant {{id}} est introuvable.",
      'invalid-name': "Le nom {{field}} n'est pas valide.",
      'default-network-unremovable': 'Le réseau par défaut ne peut pas être supprimé.',
      'lack-of-default-network': "Aucun réseau par défaut n'est défini.",
      'current-network-not-set': "L'URL RPC du nœud CKB actuel n'a pas été définie.",
      'transaction-not-found': 'La transaction {{hash}} est introuvable.',
      'is-required': '{{field}} est requis.',
      'invalid-format': "Le format de {{field}} n'est pas valide.",
      'used-name': 'Le nom {{field}} est déjà utilisé. Choisissez-en un autre.',
      'missing-required-argument': 'Argument requis manquant.',
      'save-keystore': 'Sauvegarder le fichier Keystore.',
      'save-extended-public-key': 'Sauvegarder la clé publique étendue.',
      'import-extended-public-key': 'Importer la clé publique étendue.',
      'invalid-mnemonic': "La phrase de récupération du portefeuille n'est pas valide. Vérifiez-la.",
      'unsupported-cipher': 'Chiffrement non pris en charge.',
      'capacity-not-enough': 'Solde insuffisant.',
      'capacity-not-enough-for-change': 'La sortie de monnaie nécessite plus de 61 CKBytes.',
      'capacity-not-enough-for-change-by-transfer':
        'La sortie de monnaie nécessite plus de 61 CKBytes. Vous pouvez aussi sélectionner "Max" pour envoyer tout le solde.',
      'live-capacity-not-enough':
        'Solde disponible insuffisant, veuillez réessayer lorsque la dernière transaction a été confirmée.',
      'capacity-too-small': 'Le solde de transfert minimal est de {{bytes}} CKBytes.',
      'should-be-type-of': '{{field}} doit être de type {{type}}.',
      'invalid-keystore': "Le fichier Keystore n'est pas valide. Vérifiez son intégrité.",
      'invalid-json': "Le fichier JSON n'est pas valide. Vérifiez son intégrité.",
      'cell-is-not-yet-live': 'Veuillez attendre que la dernière transaction soit confirmée par la chaîne.',
      'transaction-is-not-committed-yet':
        'Impossible de trouver les Cells requises sur la chaîne. Assurez-vous que les transactions associées ont été confirmées.',
      'mainnet-address-required': "{{address}} n'est pas une adresse Mainnet.",
      'testnet-address-required': "{{address}} n'est pas une adresse Testnet.",
      'address-not-found':
        "L'adresse indiquée n'appartient pas au portefeuille actuel. Vérifiez le portefeuille ou attendez la fin de la synchronisation.",
      'target-output-not-found': "Aucun compte d'actifs n'est associé à cette adresse.",
      'acp-same-account': 'Le compte de paiement et le compte de réception ne doivent pas être les mêmes.',
      'device-sign-canceled':
        'La demande de signature a été annulée. Si vous ne l\'avez pas annulée, activez le réglage "autoriser les données du contrat" dans l\'application Nervos de votre appareil.',
      'connect-device-failed': "Impossible de connecter l'appareil. Vérifiez la connexion.",
      'unsupported-manufacturer': 'Les appareils de {{manufacturer}} ne sont pas encore pris en charge.',
      'wallet-not-supported-function': 'Ce portefeuille ne prend pas en charge la fonction {name}.',
      'unsupported-ckb-cli-keystore':
        "Neuron ne prend pas en charge l'importation du fichier de stockage de clés de ckb-cli.",
      'invalid-transaction-file': 'Fichier de transaction non valide.',
      'offline-sign-failed': 'Échec de la signature. Vérifiez que vous utilisez le bon portefeuille.',
      'multisig-script-prefix-error': 'La configuration multisig est erronée',
      'multisig-config-not-exist': "La configuration multisig n'existe pas",
      'multisig-config-exist': 'La configuration multisig existe déjà',
      'multisig-config-address-error': "Le paramètre d'adresse de la configuration multisig est incorrect",
      'multisig-config-need-error': 'La génération de transactions multisig nécessite une configuration multisig',
      'transaction-no-input-parameter': "Un paramètre requis manque dans l'entrée de la Cell demandée",
      'migrate-sudt-no-type': "La Cell à migrer n'a pas de script de type",
      'multisig-not-signed': 'Des signatures partielles manquent pour les transactions multisig',
      'multisig-lock-hash-mismatch': "L'adresse multisig actuelle ne correspond pas à la transaction à approuver",
      'sudt-acp-have-data': 'Le compte ACP sUDT à supprimer contient encore des actifs',
      'no-match-address-for-sign': 'Aucune adresse correspondante',
      'target-lock-error': "Un compte d'actifs CKB peut uniquement être transféré vers une adresse secp256k1 ou ACP",
      'no-exist-ckb-node-data':
        '{{path}} ne contient ni configuration ni données de nœud CKB. Confirmez pour recommencer la synchronisation depuis le début.',
      'light-client-sudt-acp-error':
        "Le client léger ne permet pas d'envoyer des actifs vers le compte d'actifs d'un tiers",
      'could-not-connect-service': 'Impossible de se connecter au service. Veuillez réessayer plus tard.',
      'address-required': "L'adresse ne peut pas être vide.",
    },
    messageBox: {
      button: {
        confirm: 'OK',
        discard: 'Annuler',
      },
      'clear-sync-data': {
        title: 'Effacer toutes les données synchronisées',
        message:
          'Cette opération supprimera toutes les données synchronisées localement, puis les téléchargera de nouveau depuis la chaîne. La synchronisation complète peut prendre beaucoup de temps.',
      },
      'send-capacity': {
        title: 'Envoyer la transaction',
      },
      'remove-network': {
        title: 'Supprimer le réseau',
        message: 'Le réseau {{name}} (adresse : {{address}}) sera supprimé.',
        alert: "Il s'agit du réseau actuel. Après sa suppression, la connexion basculera vers le réseau par défaut.",
      },
      'remove-wallet': {
        title: 'Supprimer le portefeuille',
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
        title: 'Signer ou vérifier un message',
      },
      'multisig-address': {
        title: 'Adresses multisig',
      },
      'ckb-dependency': {
        title: 'Nœud CKB intégré',
        message: 'Dépendance requise',
        detail: `Les nœuds réseau de Neuron dépendent de composants C++. Installez la dernière version de Microsoft Visual C++ Redistributable pour x64 pour garantir le bon fonctionnement du logiciel.`,
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
          migrate: 'Mettre à niveau maintenant',
          skip: 'Reporter la mise à niveau',
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
          'Envoyez-nous les informations de débogage obtenues via "Menu" -> "Aide" -> "Exporter les informations de débogage".',
        'open-client': "Ouvrir l'application de messagerie",
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
      'unrecognized-lock-script': {
        message: 'Un script de verrouillage non reconnu a été trouvé dans cette transaction, veuillez vérifier.',
        buttons: {
          cancel: 'Annuler',
          ignore: 'Ignorer et continuer',
        },
      },
      'unrecognized-multisig-transaction': {
        message:
          "Il s'agit d'une transaction multisig. Veuillez l'approuver depuis l'adresse multisig avec le portefeuille approprié.",
        buttons: {
          cancel: 'Annuler',
        },
      },
    },
    prompt: {
      password: {
        label: 'Saisissez votre mot de passe',
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
      'app-version': 'Version de {{name}} : {{version}}',
      'ckb-client-version': 'Version du client CKB : {{version}}',
      'ckb-light-client-version': 'Version du client léger CKB : {{version}}',
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
        'tx-hash': 'Hachage de transaction',
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
