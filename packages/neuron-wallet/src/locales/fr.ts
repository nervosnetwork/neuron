export default {
  translation: {
    keywords: {
      wallet: 'Billetera',
      password: 'Contraseña',
      'wallet-name': 'Nombre de la Billetera',
    },
    'application-menu': {
      neuron: {
        about: 'Acerca de {{app}}',
        preferences: 'Preferencias...',
        'check-updates': 'Verificar actualizaciones...',
        quit: 'Salir de {{app}}',
      },
      wallet: {
        label: 'Billetera',
        select: 'Seleccionar una Billetera',
        'create-new': 'Crear una nueva Billetera',
        import: 'Importar una Billetera',
        backup: 'Respaldar la Billetera actual',
        'export-xpubkey': 'Exportar la clave pública extendida',
        delete: 'Eliminar la Billetera actual',
        'change-password': 'Cambiar contraseña',
        'import-mnemonic': 'Importar la semilla de la Billetera',
        'import-keystore': 'Importar desde el archivo Keystore',
        'import-xpubkey': 'Importar la clave pública extendida',
        'import-hardware': 'Importar una Billetera de hardware',
      },
      edit: {
        label: 'Edición',
        cut: 'Cortar',
        copy: 'Copiar',
        paste: 'Pegar',
        selectall: 'Seleccionar todo',
      },
      tools: {
        label: 'Herramientas',
        'sign-and-verify': 'Firmar/Verificar el mensaje',
        'multisig-address': 'Direcciones multisig',
        'offline-sign': 'Firma fuera de línea',
        'clear-sync-data': 'Borrar todos los datos sincronizados',
      },
      window: {
        label: 'Ventana',
        minimize: 'Minimizar',
        close: 'Cerrar la ventana',
      },
      help: {
        label: 'Ayuda',
        'nervos-website': 'Sitio web de Nervos',
        'source-code': 'Código fuente',
        'report-issue': 'Informar un problema',
        'contact-us': 'Contáctenos',
        'contact-us-message':
          '> Por favor, agregue la información de depuración exportada a través de "Menú" -> "Ayuda" -> "Exportar información de depuración".',
        documentation: 'Documentación',
        settings: 'Configuración',
        'export-debug-info': 'Exportar información de depuración',
      },
      develop: {
        develop: 'Desarrollar',
        'force-reload': 'Forzar recarga',
        reload: 'Recargar',
        'toggle-dev-tools': 'Alternar herramientas de desarrollo',
      },
    },
    services: {
      transactions: 'Transacciones',
      wallets: 'Billeteras',
    },
    messages: {
      'failed-to-load-networks': 'Error al cargar las redes.',
      'Networks-will-be-reset': 'Las redes se reiniciarán.',
      'wallet-password-less-than-min-length': 'La contraseña debe tener al menos {{minPasswordLength}} caracteres.',
      'wallet-password-more-than-max-length': 'La contraseña debe tener hasta {{maxPasswordLength}} caracteres.',
      'wallet-password-letter-complexity':
        'La contraseña debe contener una combinación de letras mayúsculas y minúsculas, números y caracteres especiales.',
      'current-wallet-not-set': 'La Billetera actual no está configurada.',
      'incorrect-password': 'La contraseña es incorrecta',
      'invalid-address': 'La dirección {{address}} no es válida.',
      'codehash-not-loaded': 'El código hash no se ha cargado.',
      'wallet-not-found': 'La Billetera {{id}} no se encuentra.',
      'failed-to-create-mnemonic': 'Error al crear la mnemotecnia.',
      'network-not-found': 'No se encontró la red con ID {{id}}.',
      'invalid-name': 'El nombre {{field}} no es válido.',
      'default-network-unremovable': 'La red predeterminada no se puede quitar.',
      'lack-of-default-network': 'Falta la red predeterminada.',
      'current-network-not-set': 'El RPC del nodo CKB actual no está configurado.',
      'transaction-not-found': 'La transacción {{hash}} no se encuentra.',
      'is-required': '{{field}} es obligatorio.',
      'invalid-format': '{{field}} tiene un formato inválido.',
      'used-name': 'El nombre {{field}} ya está en uso, elija otro.',
      'missing-required-argument': 'Falta el argumento requerido.',
      'save-keystore': 'Guardar el archivo Keystore.',
      'save-extended-public-key': 'Guardar la clave pública extendida.',
      'import-extended-public-key': 'Importar la clave pública extendida.',
      'invalid-mnemonic': 'La semilla de la Billetera no es válida, verifíquela nuevamente.',
      'unsupported-cipher': 'Cifrado no compatible.',
      'capacity-not-enough': 'Saldo insuficiente.',
      'capacity-not-enough-for-change': 'Necesitas más capacidad para el cambio de moneda (más de 61 CKBytes).',
      'capacity-not-enough-for-change-by-transfer':
        'Necesitas más capacidad para el cambio de moneda (más de 61 CKBytes), o haz clic en el botón "Max" para enviar todo tu saldo.',
      'live-capacity-not-enough':
        'Saldo disponible insuficiente, inténtalo nuevamente cuando la última transacción haya sido confirmada.',
      'capacity-too-small': 'El saldo de transferencia mínimo es de {{bytes}} CKBytes.',
      'should-be-type-of': '{{field}} debe ser de tipo {{type}}.',
      'invalid-keystore': 'El archivo Keystore no es válido, verifique la integridad del archivo.',
      'invalid-json': 'Archivo JSON no válido, verifique la integridad del archivo.',
      'cell-is-not-yet-live': 'Espere a que la última transacción sea confirmada por la cadena.',
      'transaction-is-not-committed-yet':
        'No se pueden encontrar las celdas requeridas en la cadena, asegúrese de que las transacciones relacionadas hayan sido confirmadas.',
      'mainnet-address-required': '{{address}} no es una dirección de la red principal.',
      'testnet-address-required': '{{address}} no es una dirección de la red de prueba.',
      'address-not-found':
        'La dirección proporcionada no pertenece a la Billetera actual. Verifique su Billetera o espere a que finalice la sincronización.',
      'target-output-not-found': 'No hay una Billetera de cuenta asociada a esta dirección.',
      'acp-same-account': 'La cuenta de pago y la cuenta receptora no deben ser las mismas.',

      'device-sign-canceled':
        'Vous avez annulé la demande de signature. Sinon, assurez-vous que l\'application Nervos sur votre appareil a la configuration "autoriser les données de contrat" activée',
      'connect-device-failed': "L'appareil ne peut pas être connecté, veuillez vérifier votre connexion.",
      'unsupported-manufacturer': 'Les appareils de {{manufacturer}} ne sont pas encore pris en charge.',
      'wallet-not-supported-function': 'Ce Wallet ne prend pas en charge la fonction {name}.',
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
