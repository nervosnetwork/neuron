export default {
  translation: {
    keywords: {
      wallet: 'Billetera',
      password: 'Contraseña',
      'wallet-name': 'Nombre de la billetera',
    },
    'application-menu': {
      neuron: {
        about: 'Acerca de {{app}}',
        preferences: 'Preferencias...',
        'check-updates': 'Buscar actualizaciones...',
        quit: 'Salir de {{app}}',
      },
      wallet: {
        label: 'Billetera',
        select: 'Seleccionar billetera',
        'create-new': 'Crear una billetera',
        import: 'Importar una billetera',
        backup: 'Respaldar la billetera actual',
        'export-xpubkey': 'Exportar la clave pública extendida',
        delete: 'Eliminar la billetera actual',
        'change-password': 'Cambiar la contraseña',
        'import-mnemonic': 'Importar una frase de recuperación',
        'import-keystore': 'Importar desde un archivo Keystore',
        'import-xpubkey': 'Importar la clave pública extendida',
        'import-hardware': 'Importar una billetera de hardware',
      },
      edit: {
        label: 'Editar',
        cut: 'Cortar',
        copy: 'Copiar',
        paste: 'Pegar',
        selectall: 'Seleccionar todo',
      },
      tools: {
        label: 'Herramientas',
        'sign-and-verify': 'Firmar o verificar un mensaje',
        'multisig-address': 'Direcciones multifirma',
        'offline-sign': 'Firma sin conexión',
        'clear-sync-data': 'Limpiar todos los datos sincronizados',
        'broadcast-transaction': 'Transmitir una transacción',
      },
      window: {
        label: 'Ventana',
        minimize: 'Minimizar',
        close: 'Cerrar ventana',
        lock: 'Ventana bloqueada',
      },
      help: {
        label: 'Ayuda',
        'nervos-website': 'Sitio web de Nervos',
        'source-code': 'Código fuente',
        'report-issue': 'Informar de un problema',
        'contact-us': 'Contáctenos',
        'contact-us-message':
          '> Por favor, adjunte la información de depuración exportada a través de "Menú" -> "Ayuda" -> "Exportar Información de Depuración".',
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
      'wallet-password-more-than-max-length': 'La contraseña no debe superar los {{maxPasswordLength}} caracteres.',
      'wallet-password-letter-complexity':
        'La contraseña debe contener una combinación de letras mayúsculas y minúsculas, números y símbolos especiales.',
      'current-wallet-not-set': 'La billetera actual no está configurada.',
      'incorrect-password': 'Contraseña incorrecta',
      'invalid-address': 'La dirección {{address}} no es válida.',
      'codehash-not-loaded': 'No se ha cargado el hash del código.',
      'wallet-not-found': 'No se encontró la billetera {{id}}.',
      'failed-to-create-mnemonic': 'No se pudo crear la frase de recuperación.',
      'network-not-found': 'No se encuentra la red con ID {{id}}.',
      'invalid-name': 'El nombre de {{field}} no es válido.',
      'default-network-unremovable': 'La red predeterminada no se puede quitar.',
      'lack-of-default-network': 'No hay ninguna red predeterminada.',
      'current-network-not-set': 'No se ha configurado la URL RPC del nodo CKB actual.',
      'transaction-not-found': 'No se encuentra la transacción {{hash}}.',
      'is-required': '{{field}} es obligatorio.',
      'invalid-format': '{{field}} tiene un formato inválido.',
      'used-name': 'El nombre de {{field}} ya está en uso, elija otro.',
      'missing-required-argument': 'Falta el argumento obligatorio.',
      'save-keystore': 'Guardar el archivo Keystore.',
      'save-extended-public-key': 'Guardar la clave pública extendida.',
      'import-extended-public-key': 'Importar la clave pública extendida.',
      'invalid-mnemonic': 'La frase de recuperación de la billetera no es válida. Revísela.',
      'unsupported-cipher': 'Cifrado no compatible.',
      'capacity-not-enough': 'Saldo insuficiente.',
      'capacity-not-enough-for-change': 'La salida de cambio necesita más de 61 CKBytes.',
      'capacity-not-enough-for-change-by-transfer':
        "La salida de cambio necesita más de 61 CKBytes. También puede seleccionar 'Max' para enviar todo el saldo.",
      'live-capacity-not-enough':
        'Saldo disponible insuficiente. Inténtelo de nuevo cuando se confirme la última transacción.',
      'capacity-too-small': 'El saldo mínimo de transferencia es de {{bytes}} CKBytes.',
      'should-be-type-of': '{{field}} debe ser de tipo {{type}}.',
      'invalid-keystore': 'El archivo Keystore no es válido. Compruebe su integridad.',
      'invalid-json': 'El archivo JSON no es válido. Compruebe su integridad.',
      'cell-is-not-yet-live': 'Espere a que la cadena confirme la última transacción.',
      'transaction-is-not-committed-yet':
        'No se encontraron las Cells necesarias en la cadena. Asegúrese de que las transacciones relacionadas estén confirmadas.',
      'mainnet-address-required': '{{address}} no es una dirección Mainnet.',
      'testnet-address-required': '{{address}} no es una dirección Testnet.',
      'address-not-found':
        'La dirección indicada no pertenece a la billetera actual. Compruebe la billetera o espere a que termine la sincronización.',
      'target-output-not-found': 'No hay ninguna cuenta de activos asociada a esta dirección.',
      'acp-same-account': 'La cuenta de pago y la cuenta receptora no deben ser iguales.',
      'device-sign-canceled':
        "Se ha cancelado la solicitud de firma. Si usted no la canceló, active la opción 'permitir datos de contrato' en la aplicación Nervos del dispositivo.",
      'connect-device-failed': 'No se pudo conectar el dispositivo. Compruebe la conexión.',
      'unsupported-manufacturer': 'Los dispositivos de {{manufacturer}} aún no son compatibles.',
      'wallet-not-supported-function': 'Esta billetera no admite la función {name}.',
      'unsupported-ckb-cli-keystore': 'Neuron no admite la importación del archivo Keystore de ckb-cli.',
      'invalid-transaction-file': 'Archivo de transacción no válido.',
      'offline-sign-failed': 'La firma falló. Compruebe que esté usando la billetera correcta.',
      'multisig-script-prefix-error': 'Error en la configuración multifirma',
      'multisig-config-not-exist': 'La configuración multifirma no existe',
      'multisig-config-exist': 'La configuración multifirma ya existe',
      'multisig-config-address-error': 'La configuración de dirección de la configuración multifirma es incorrecta',
      'multisig-config-need-error': 'La generación de transacciones multifirma requiere configuración multifirma',
      'transaction-no-input-parameter': 'Falta un parámetro requerido en la Cell de entrada de la consulta',
      'migrate-sudt-no-type': 'La Cell que se va a migrar no tiene un script de tipo',
      'multisig-not-signed': 'Faltan firmas parciales para transacciones multifirma',
      'multisig-lock-hash-mismatch':
        'La dirección multifirma actual no coincide con la transacción que se va a aprobar',
      'sudt-acp-have-data': 'La cuenta ACP sUDT que se va a eliminar todavía tiene saldo',
      'no-match-address-for-sign': 'No se encontró una dirección coincidente',
      'target-lock-error': 'La cuenta de activos CKB solo puede transferirse a una dirección secp256k1 o ACP',
      'no-exist-ckb-node-data':
        '{{path}} no contiene la configuración ni los datos del nodo CKB. Confirme para sincronizar desde cero.',
      'light-client-sudt-acp-error':
        'El cliente ligero no permite enviar activos a la cuenta de activos de otra persona',
      'could-not-connect-service': 'No se pudo conectar al servicio. Inténtelo de nuevo más tarde.',
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
          'Esta operación eliminará todos los datos sincronizados localmente y volverá a descargarlos de la cadena. La sincronización completa puede tardar bastante.',
      },
      'send-capacity': {
        title: 'Enviar transacción',
      },
      'remove-network': {
        title: 'Eliminar red',
        message: 'La red {{name}} (dirección: {{address}}) será eliminada.',
        alert: 'Esta es la red actual. Al eliminarla, la conexión cambiará a la red predeterminada.',
      },
      'remove-wallet': {
        title: 'Eliminar la billetera',
        password: 'Contraseña',
      },
      'backup-keystore': {
        title: 'Respaldar el archivo Keystore',
        password: 'Contraseña',
      },
      transaction: {
        title: 'Transacción: {{hash}}',
      },
      'sign-and-verify': {
        title: 'Firmar/verificar mensaje',
      },
      'multisig-address': {
        title: 'Direcciones multifirma',
      },
      'ckb-dependency': {
        title: 'Nodo CKB integrado',
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
          skip: 'Actualizar más tarde',
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
      'unrecognized-lock-script': {
        message: 'Esta transacción contiene un script de bloqueo desconocido. Revíselo.',
        buttons: {
          cancel: 'Cancelar',
          ignore: 'Ignorar y continuar',
        },
      },
      'unrecognized-multisig-transaction': {
        message:
          'Esta es una transacción multifirma. Apruébela desde la dirección multifirma con la billetera correspondiente.',
        buttons: {
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
      'export-debug-info': 'Exportar información de depuración',
      'debug-info-exported': 'La información de depuración se ha exportado a {{ file }}',
    },
    about: {
      'app-version': 'Versión de {{name}}: {{version}}',
      'ckb-client-version': 'Versión del cliente CKB: {{version}}',
      'ckb-light-client-version': 'Versión del cliente ligero CKB: {{version}}',
    },
    settings: {
      title: {
        normal: 'Configuración',
        mac: 'Preferencias',
      },
    },
    'export-transactions': {
      'export-transactions': 'Exportar historial de transacciones',
      'export-success': 'Las transacciones se han exportado',
      'transactions-exported': '{{total}} registros de transacciones se han exportado a {{file}}',
      column: {
        time: 'Tiempo',
        'block-number': 'Número de bloque',
        'tx-hash': 'Hash de transacción',
        'tx-type': 'Tipo de transacción',
        amount: 'Cantidad de CKB',
        'udt-amount': 'Cantidad de UDT',
        description: 'Descripción',
      },
      'tx-type': {
        send: 'Enviar',
        receive: 'Recibir',
        'create-asset-account': 'Crear cuenta de activos {{name}}',
        'destroy-asset-account': 'Eliminar cuenta de activos {{name}}',
      },
    },
    'offline-signature': {
      'export-transaction': 'Exportar la transacción como JSON',
      'transaction-exported': 'La transacción se ha exportado a {{filePath}}.',
      'load-transaction': 'Cargar archivo de transacción',
    },
    'multisig-config': {
      'import-config': 'Importar configuración multifirma',
      'export-config': 'Exportar configuración multifirma',
      'config-exported': 'Las configuraciones multifirma se han exportado a {{filePath}}.',
      'import-duplicate': 'Compruebe si hay configuraciones duplicadas',
      'import-result': 'Importación exitosa {{success}}, fallida {{fail}}.{{failCheck}}',
      'confirm-delete': '¿Confirma que desea eliminar la configuración multifirma?',
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
