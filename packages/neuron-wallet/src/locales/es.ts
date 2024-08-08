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
        'check-updates': 'Buscar Actualizaciones...',
        quit: 'Salir de {{app}}',
      },
      wallet: {
        label: 'Billetera',
        select: 'Seleccionar Billetera',
        'create-new': 'Crear Nueva Billetera',
        import: 'Importar Billetera',
        backup: 'Respaldar Billetera Actual',
        'export-xpubkey': 'Exportar Clave Pública Extendida',
        delete: 'Eliminar Billetera Actual',
        'change-password': 'Cambiar Contraseña',
        'import-mnemonic': 'Importar Semilla de Billetera',
        'import-keystore': 'Importar desde Keystore',
        'import-xpubkey': 'Importar Clave Pública Extendida',
        'import-hardware': 'Importar Billetera de Hardware',
      },
      edit: {
        label: 'Editar',
        cut: 'Cortar',
        copy: 'Copiar',
        paste: 'Pegar',
        selectall: 'Seleccionar Todo',
      },
      tools: {
        label: 'Herramientas',
        'sign-and-verify': 'Firmar/Verificar Mensaje',
        'multisig-address': 'Direcciones Multifirma',
        'offline-sign': 'Firma sin Conexión',
        'clear-sync-data': 'Limpiar todos los datos sincronizados',
      },
      window: {
        label: 'Ventana',
        minimize: 'Minimizar',
        close: 'Cerrar Ventana',
        lock: 'Ventana bloqueada',
      },
      help: {
        label: 'Ayuda',
        'nervos-website': 'Sitio web de Nervos',
        'source-code': 'Código Fuente',
        'report-issue': 'Informar Problema',
        'contact-us': 'Contáctenos',
        'contact-us-message':
          '> Por favor, adjunte la información de depuración exportada a través de "Menú" -> "Ayuda" -> "Exportar Información de Depuración".',
        documentation: 'Documentación',
        settings: 'Configuración',
        'export-debug-info': 'Exportar Información de Depuración',
      },
      develop: {
        develop: 'Desarrollar',
        'force-reload': 'Forzar Recarga',
        reload: 'Recargar',
        'toggle-dev-tools': 'Alternar Herramientas de Desarrollo',
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
        'La contraseña debe contener una combinación de letras mayúsculas y minúsculas, números y símbolos especiales.',
      'current-wallet-not-set': 'La billetera actual no está configurada.',
      'incorrect-password': 'Contraseña incorrecta',
      'invalid-address': 'La dirección {{address}} no es válida.',
      'codehash-not-loaded': 'codehash no está cargado.',
      'wallet-not-found': 'Billetera {{id}} no encontrada.',
      'failed-to-create-mnemonic': 'Error al crear mnemónico.',
      'network-not-found': 'No se encuentra la red con ID {{id}}.',
      'invalid-name': 'El nombre de {{field}} no es válido.',
      'default-network-unremovable': 'La red predeterminada no se puede quitar.',
      'lack-of-default-network': 'Falta la red predeterminada.',
      'current-network-not-set': 'La RPC del nodo CKB actual no ha sido configurada.',
      'transaction-not-found': 'No se encuentra la transacción {{hash}}.',
      'is-required': '{{field}} es obligatorio.',
      'invalid-format': '{{field}} tiene un formato inválido.',
      'used-name': 'El nombre de {{field}} ya está en uso, elija otro.',
      'missing-required-argument': 'Falta el argumento obligatorio.',
      'save-keystore': 'Guardar Keystore.',
      'save-extended-public-key': 'Guardar Clave Pública Extendida.',
      'import-extended-public-key': 'Importar Clave Pública Extendida.',
      'invalid-mnemonic': 'La semilla de la billetera no es válida, por favor, revísela nuevamente.',
      'unsupported-cipher': 'Cifrado no compatible.',
      'capacity-not-enough': 'Saldo insuficiente.',
      'capacity-not-enough-for-change': 'Necesitas más capacidades para el cambio (más de 61 CKBytes).',
      'capacity-not-enough-for-change-by-transfer':
        "Necesitas más capacidades para el cambio (más de 61 CKBytes), o haz clic en el botón 'Max' para enviar todo tu saldo.",
      'live-capacity-not-enough':
        'Saldo disponible insuficiente, por favor, inténtalo nuevamente cuando la última transacción haya sido confirmada.',
      'capacity-too-small': 'El saldo mínimo de transferencia es de {{bytes}} CKBytes.',
      'should-be-type-of': '{{field}} debe ser de tipo {{type}}.',
      'invalid-keystore': 'Keystore no válido, por favor, verifica la integridad de tu archivo.',
      'invalid-json': 'Archivo JSON no válido, por favor, verifica la integridad de tu archivo.',
      'cell-is-not-yet-live': 'Por favor, espera hasta que la última transacción sea confirmada por la cadena.',
      'transaction-is-not-committed-yet':
        'No se pueden encontrar Cells requeridas en la cadena, por favor, asegúrate de que las transacciones relacionadas hayan sido confirmadas.',
      'mainnet-address-required': '{{address}} no es una dirección de mainnet.',
      'testnet-address-required': '{{address}} no es una dirección de testnet.',
      'address-not-found':
        'La dirección proporcionada no pertenece a la billetera actual. Por favor, verifica tu billetera o espera a que se complete la sincronización.',
      'target-output-not-found': 'No hay una billetera de cuenta asociada con esta dirección.',
      'acp-same-account': 'La cuenta de pago y la cuenta receptora no deben ser iguales.',
      'device-sign-canceled':
        "Has cancelado la solicitud de firma. De lo contrario, asegúrate de que la aplicación Nervos en tu dispositivo tenga la configuración 'permitir datos de contrato' habilitada.",
      'connect-device-failed': 'No se puede conectar el dispositivo, por favor, verifica tu conexión.',
      'unsupported-manufacturer': 'Los dispositivos de {{manufacturer}} aún no son compatibles.',
      'wallet-not-supported-function': 'Esta billetera no admite la función {name}.',
      'unsupported-ckb-cli-keystore':
        'Neuron no soporta la importación del archivo de almacenamiento de claves de ckb-cli.',
      'invalid-transaction-file': 'Archivo de transacción no válido.',
      'offline-sign-failed': 'Firma fallida, por favor, verifica si estás firmando con la billetera correcta.',
      'multisig-script-prefix-error': 'Error en la configuración multifirma',
      'multisig-config-not-exist': 'La configuración multifirma no existe',
      'multisig-config-exist': 'La configuración multifirma ya existe',
      'multisig-config-address-error': 'La configuración de dirección de la configuración multifirma es incorrecta',
      'multisig-config-need-error': 'La generación de transacciones multifirma requiere configuración multifirma',
      'transaction-no-input-parameter': 'Falta un parámetro requerido en la Cell de entrada de la consulta',
      'migrate-sudt-no-type': 'La Cell de migración no tiene un type script',
      'multisig-not-signed': 'Faltan firmas parciales para transacciones multifirma',
      'multisig-lock-hash-mismatch':
        'La dirección multifirma actual no coincide con la transacción que se va a aprobar',
      'sudt-acp-have-data': 'La cuenta ACP de sUDT destruida tiene saldo',
      'no-match-address-for-sign': 'No se encontró una dirección coincidente',
      'target-lock-error': 'La cuenta de activos CKB solo puede transferirse a una dirección sepe256k1 o acp',
      'no-exist-ckb-node-data':
        '{{path}} no tiene configuración y almacenamiento de nodo CKB, presiona confirmar para sincronizar desde cero',
      'light-client-sudt-acp-error':
        'El modo cliente ligero no admite el envío de activos a la cuenta de activos de otra persona',
      'could-not-connect-service': 'No se pudo conectar al servicio, por favor, inténtalo nuevamente más tarde.',
      'address-required': 'La dirección no puede estar vacía.',
    },
    messageBox: {
      button: {
        confirm: 'Aceptar',
        discard: 'Cancelar',
      },
      'clear-sync-data': {
        title: 'Borrar todos los datos sincronizados',
        message:
          'Borrar todos los datos sincronizados eliminará todos los datos sincronizados locales y volverá a sincronizar los datos en la cadena, la sincronización completa puede llevar mucho tiempo.',
      },
      'send-capacity': {
        title: 'Enviar transacción',
      },
      'remove-network': {
        title: 'Eliminar red',
        message: 'La red {{name}} (dirección: {{address}}) será eliminada.',
        alert: 'Esta es la red actual, al eliminarla, la conexión cambiará a la red predeterminada',
      },
      'remove-wallet': {
        title: 'Eliminar la billetera',
        password: 'Contraseña',
      },
      'backup-keystore': {
        title: 'Respaldar el Keystore',
        password: 'Contraseña',
      },
      transaction: {
        title: 'Transacción: {{hash}}',
      },
      'sign-and-verify': {
        title: 'Firmar/verificar mensaje',
      },
      'multisig-address': {
        title: 'Direcciones Multifirma',
      },
      'ckb-dependency': {
        title: 'Nodo CKB empaquetado',
        message: 'Se requiere dependencia',
        detail: `Los nodos de red en Neuron dependen de componentes C++, así que instale la última versión de Microsoft Visual C++ Redistributable for x64 para garantizar que el software funcione correctamente.`,
        buttons: {
          'install-and-exit': 'Instalar y salir',
        },
      },
      'acp-migration': {
        title: 'Actualizar cuenta de activos',
        message: 'Actualizar cuenta de activos',
        detail:
          'Recientemente, nuestro equipo de seguridad identificó una posible vulnerabilidad en el script experimental de la cuenta de activos. Hemos implementado un nuevo script de cuenta de activos con una solución en la red principal y todas las cuentas de activos futuras usarán la nueva versión. Le sugerimos que las actualice para utilizar el nuevo script.',
        buttons: {
          migrate: 'Actualizar de forma segura ahora',
          skip: 'Conozco el riesgo, actualizaré más tarde',
        },
      },
      'acp-migration-completed': {
        title: '¡Felicidades! Ha completado la actualización segura.',
        message: '¡Felicidades! Ha completado la actualización segura.',
        buttons: {
          ok: 'Aceptar',
        },
      },
      'hard-fork-migrate': {
        message:
          'Para adaptarse a la última versión de CKB, Neuron volverá a sincronizar los datos en la cadena, y la sincronización completa puede llevar mucho tiempo.',
      },
      'mail-us': {
        message:
          'Por favor, envíenos un correo con la información de depuración exportada a través de "Menú" -> "Ayuda" -> "Exportar información de depuración".',
        'open-client': 'Abrir cliente de correo',
        'fail-message':
          'No se puede iniciar el cliente de correo, copie la dirección de correo, agregue la información de depuración exportada a través de "Menú" -> "Ayuda" -> "Exportar información de depuración" y envíenosla.',
        'copy-mail-addr': 'Copiar dirección de correo',
      },
      'migrate-failed': {
        title: 'Falló la migración',
        message:
          'La migración falló, presione Aceptar para eliminar los datos antiguos y sincronizar desde cero, o haga clic en Cancelar para migrar más tarde al reiniciar Neuron. Razón del fallo de la migración: {{ reason }}',
        buttons: {
          ok: 'Aceptar',
          cancel: 'Cancelar',
        },
      },
    },
    prompt: {
      password: {
        label: 'Ingrese su contraseña',
        submit: 'Enviar',
        cancel: 'Cancelar',
      },
    },
    updater: {
      'update-not-available': 'Actualmente no hay actualizaciones disponibles.',
    },
    common: {
      yes: 'Sí',
      no: 'No',
      ok: 'OK',
      cancel: 'Cancelar',
      error: 'Error',
    },
    'export-debug-info': {
      'export-debug-info': 'Exportar Información de Depuración',
      'debug-info-exported': 'La información de depuración se ha exportado a {{ file }}',
    },
    about: {
      'app-version': '{{name}} Versión: {{version}}',
      'ckb-client-version': 'Versión del Cliente CKB: {{version}}',
      'ckb-light-client-version': 'Versión del Cliente Ligero CKB: {{version}}',
    },
    settings: {
      title: {
        normal: 'Configuraciones',
        mac: 'Preferencias',
      },
    },
    'export-transactions': {
      'export-transactions': 'Exportar Historial de Transacciones',
      'export-success': 'Las transacciones se han exportado',
      'transactions-exported': '{{total}} registros de transacciones se han exportado a {{file}}',
      column: {
        time: 'Tiempo',
        'block-number': 'Número de Bloque',
        'tx-hash': 'Hash de Transacción',
        'tx-type': 'Tipo de Transacción',
        amount: 'Cantidad de CKB',
        'udt-amount': 'Cantidad de UDT',
        description: 'Descripción',
      },
      'tx-type': {
        send: 'Enviar',
        receive: 'Recibir',
        'create-asset-account': 'Crear Cuenta de Activos {{name}}',
        'destroy-asset-account': 'Destruir Cuenta de Activos {{name}}',
      },
    },
    'offline-signature': {
      'export-transaction': 'Exportar Transacción como JSON',
      'transaction-exported': 'La transacción se ha exportado a {{filePath}}.',
      'load-transaction': 'Cargar archivo de transacción',
    },
    'multisig-config': {
      'import-config': 'Importar configuración multifirma',
      'export-config': 'Exportar configuración multifirma',
      'config-exported': 'Las configuraciones multifirma se han exportado a {{filePath}}.',
      'import-duplicate': 'Por favor, verifique configuraciones duplicadas',
      'import-result': 'Importación exitosa {{success}}, fallida {{fail}}.{{failCheck}}',
      'confirm-delete': '¿Confirmar eliminar la configuración multifirma?',
      'approve-tx': 'Confirmar transacción multifirma',
      'delete-actions': {
        ok: 'Confirmar',
        cancel: 'Cancelar',
      },
    },
    'open-in-explorer': {
      title: 'Ver en CKB Explorer',
      transaction: 'transacción',
      message: 'Ver {{type}} {{key}} en CKB Explorer',
    },
  },
}
