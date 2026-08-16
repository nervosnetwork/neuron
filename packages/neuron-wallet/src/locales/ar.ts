export default {
  translation: {
    keywords: {
      wallet: 'محفظة',
      password: 'كلمة المرور',
      'wallet-name': 'اسم المحفظة',
    },
    'application-menu': {
      neuron: {
        about: 'حول {{app}}',
        preferences: 'التفضيلات...',
        'check-updates': 'التحقق من التحديثات...',
        quit: 'إنهاء {{app}}',
      },
      wallet: {
        label: 'المحفظة',
        select: 'اختيار المحفظة',
        'create-new': 'إنشاء محفظة جديدة',
        import: 'استيراد المحفظة',
        backup: 'نسخ احتياطي للمحفظة الحالية',
        'export-xpubkey': 'تصدير المفتاح العام الممتد',
        delete: 'حذف المحفظة الحالية',
        'change-password': 'تغيير كلمة المرور',
        'import-mnemonic': 'استيراد عبارة الاسترداد',
        'import-keystore': 'الاستيراد من Keystore',
        'import-xpubkey': 'استيراد المفتاح العام الممتد',
        'import-hardware': 'استيراد محفظة الأجهزة',
      },
      edit: {
        label: 'تعديل',
        cut: 'قص',
        copy: 'نسخ',
        paste: 'لصق',
        selectall: 'تحديد الكل',
      },
      tools: {
        label: 'أدوات',
        'sign-and-verify': 'توقيع الرسالة أو التحقق منها',
        'multisig-address': 'عناوين متعددة التواقيع',
        'offline-sign': 'التوقيع دون اتصال',
        'clear-sync-data': 'مسح جميع البيانات المتزامنة',
        'broadcast-transaction': 'بث المعاملة',
      },
      window: {
        label: 'نافذة',
        minimize: 'تصغير',
        close: 'إغلاق النافذة',
        lock: 'قفل النافذة',
      },
      help: {
        label: 'مساعدة',
        'nervos-website': 'موقع Nervos',
        'source-code': 'شفرة المصدر',
        'report-issue': 'الإبلاغ عن مشكلة',
        'contact-us': 'اتصل بنا',
        'contact-us-message':
          '> يرجى إرفاق معلومات التصحيح المصدرة من "القائمة" -> "مساعدة" -> "تصدير معلومات التصحيح".',
        documentation: 'الوثائق',
        settings: 'الإعدادات',
        'export-debug-info': 'تصدير معلومات التصحيح',
      },
      develop: {
        develop: 'تطوير',
        'force-reload': 'إعادة التحميل بالقوة',
        reload: 'إعادة التحميل',
        'toggle-dev-tools': 'تبديل أدوات المطور',
      },
    },
    services: {
      transactions: 'المعاملات',
      wallets: 'المحافظ',
    },
    messages: {
      'failed-to-load-networks': 'فشل في تحميل الشبكات.',
      'Networks-will-be-reset': 'سيتم إعادة تعيين الشبكات.',
      'wallet-password-less-than-min-length': 'يجب أن تكون كلمة المرور من {{minPasswordLength}} أحرف على الأقل.',
      'wallet-password-more-than-max-length': 'يمكن أن تصل كلمة المرور إلى {{maxPasswordLength}} أحرف.',
      'wallet-password-letter-complexity':
        'يجب أن تحتوي كلمة المرور على مزيج من الأحرف الكبيرة والصغيرة والأرقام والرموز الخاصة.',
      'current-wallet-not-set': 'لم يتم تعيين المحفظة الحالية.',
      'incorrect-password': 'كلمة المرور غير صحيحة',
      'invalid-address': 'العنوان {{address}} غير صالح.',
      'codehash-not-loaded': 'لم يتم تحميل تجزئة الشفرة.',
      'wallet-not-found': 'لم يتم العثور على المحفظة {{id}}.',
      'failed-to-create-mnemonic': 'تعذر إنشاء عبارة الاسترداد.',
      'network-not-found': 'لم يتم العثور على شبكة بالمعرف {{id}}.',
      'invalid-name': 'الاسم {{field}} غير صالح.',
      'default-network-unremovable': 'لا يمكن إزالة الشبكة الافتراضية.',
      'lack-of-default-network': 'لا توجد شبكة افتراضية.',
      'current-network-not-set': 'لم يتم تعيين عنوان RPC لعقدة CKB الحالية.',
      'transaction-not-found': 'لم يتم العثور على المعاملة {{hash}}.',
      'is-required': '{{field}} مطلوب.',
      'invalid-format': '{{field}} بتنسيق غير صالح.',
      'used-name': 'الاسم {{field}} مستخدم، يرجى اختيار اسم آخر.',
      'missing-required-argument': 'المعامل المطلوب مفقود.',
      'save-keystore': 'حفظ ملف Keystore.',
      'save-extended-public-key': 'حفظ المفتاح العام الممتد.',
      'import-extended-public-key': 'استيراد المفتاح العام الممتد.',
      'invalid-mnemonic': 'عبارة الاسترداد غير صالحة. تحقق منها مرة أخرى.',
      'unsupported-cipher': 'الشيفرة غير مدعومة.',
      'capacity-not-enough': 'الرصيد غير كاف.',
      'capacity-not-enough-for-change': 'تتطلب مخرجات الفائض سعة تزيد على 61 CKBytes.',
      'capacity-not-enough-for-change-by-transfer':
        "تتطلب مخرجات الفائض سعة تزيد على 61 CKBytes، ويمكن أيضا اختيار 'الحد الأقصى' لإرسال الرصيد بالكامل.",
      'live-capacity-not-enough': 'الرصيد المتاح غير كاف، يرجى المحاولة مرة أخرى بعد تأكيد المعاملة الأخيرة.',
      'capacity-too-small': 'الحد الأدنى للسعة للتحويل هو {{bytes}} CKBytes.',
      'should-be-type-of': '{{field}} يجب أن يكون من نوع {{type}}.',
      'invalid-keystore': 'ملف Keystore غير صالح. تحقق من سلامته.',
      'invalid-json': 'ملف JSON غير صالح، يرجى التحقق من سلامة الملف.',
      'cell-is-not-yet-live': 'يرجى الانتظار حتى يتم تأكيد المعاملة الأخيرة على السلسلة.',
      'transaction-is-not-committed-yet':
        'تعذر العثور على Cells المطلوبة على السلسلة. تأكد من تأكيد المعاملات ذات الصلة.',
      'mainnet-address-required': '{{address}} ليس عنوان Mainnet.',
      'testnet-address-required': '{{address}} ليس عنوان Testnet.',
      'address-not-found':
        'العنوان المعطى لا ينتمي إلى المحفظة الحالية. يرجى التحقق من محفظتك أو الانتظار حتى تكتمل المزامنة.',
      'target-output-not-found': 'لا يوجد حساب أصول مرتبط بهذا العنوان.',
      'acp-same-account': 'يجب ألا يكون حساب الدفع وحساب الاستلام هو نفسه.',
      'device-sign-canceled':
        'لقد قمت بإلغاء طلب التوقيع. إذا لم يكن الأمر كذلك، يرجى التأكد من تمكين إعداد "السماح ببيانات العقد" في تطبيق Nervos على جهازك.',
      'connect-device-failed': 'لا يمكن الاتصال بالجهاز، يرجى التحقق من اتصالك.',
      'unsupported-manufacturer': 'الأجهزة من {{manufacturer}} غير مدعومة حاليا.',
      'wallet-not-supported-function': 'هذه المحفظة لا تدعم الوظيفة {name}.',
      'unsupported-ckb-cli-keystore': 'لا يدعم Neuron استيراد ملف Keystore الخاص بأداة ckb-cli.',
      'invalid-transaction-file': 'ملف المعاملة غير صالح.',
      'offline-sign-failed': 'فشل التوقيع، يرجى التحقق من استخدام المحفظة الصحيحة.',
      'multisig-script-prefix-error': 'إعداد التواقيع المتعددة خاطئ',
      'multisig-config-not-exist': 'إعداد التواقيع المتعددة غير موجود',
      'multisig-config-exist': 'إعداد التواقيع المتعددة موجود بالفعل',
      'multisig-config-address-error': 'عنوان إعداد التواقيع المتعددة غير صحيح',
      'multisig-config-need-error': 'يتطلب إنشاء معاملة متعددة التواقيع إعداد التواقيع المتعددة',
      'transaction-no-input-parameter': 'تفتقد Cell الإدخال في الاستعلام معاملا مطلوبا',
      'migrate-sudt-no-type': 'لا تحتوي Cell الجاري ترحيلها على نص النوع',
      'multisig-not-signed': 'تفتقر المعاملات متعددة التواقيع إلى بعض التواقيع الجزئية',
      'multisig-lock-hash-mismatch': 'عنوان متعدد التواقيع الحالي لا يتطابق مع المعاملة التي سيتم الموافقة عليها',
      'sudt-acp-have-data': 'يحتوي حساب sUDT المراد حذفه على بيانات',
      'no-match-address-for-sign': 'لم يتم العثور على عنوان مطابق للتوقيع',
      'target-lock-error': 'يمكن لحساب أصول CKB التحويل فقط إلى عنوان secp256k1 أو acp',
      'no-exist-ckb-node-data': '{{path}} لا يحتوي على تكوين وتخزين عقدة CKB، اضغط على "تأكيد" للمزامنة من البداية',
      'light-client-sudt-acp-error': 'وضع العميل الخفيف لا يدعم إرسال الأصول إلى حسابات أصول الآخرين',
      'could-not-connect-service': 'تعذر الاتصال بالخدمة، يرجى المحاولة مرة أخرى لاحقا.',
      'address-required': 'لا يمكن أن يكون العنوان فارغا.',
    },
    messageBox: {
      button: {
        confirm: 'تأكيد',
        discard: 'إلغاء',
      },
      'clear-sync-data': {
        title: 'مسح جميع البيانات المتزامنة',
        message:
          'سيؤدي مسح جميع البيانات المتزامنة إلى حذف جميع البيانات المحلية وإعادة مزامنة البيانات على السلسلة، وقد تستغرق المزامنة الكاملة وقتا طويلا.',
      },
      'send-capacity': {
        title: 'إرسال معاملة',
      },
      'remove-network': {
        title: 'إزالة الشبكة',
        message: 'سيتم إزالة شبكة {{name}} (العنوان: {{address}}).',
        alert: 'هذه هي الشبكة الحالية، عند إزالتها، سيتم التحويل إلى الشبكة الافتراضية',
      },
      'remove-wallet': {
        title: 'حذف المحفظة',
        password: 'كلمة المرور',
      },
      'backup-keystore': {
        title: 'نسخ ملف Keystore احتياطيا',
        password: 'كلمة المرور',
      },
      transaction: {
        title: 'معاملة: {{hash}}',
      },
      'sign-and-verify': {
        title: 'توقيع الرسالة أو التحقق منها',
      },
      'multisig-address': {
        title: 'عناوين متعددة التواقيع',
      },
      'ckb-dependency': {
        title: 'عقدة CKB المضمنة',
        message: 'يتطلب الاعتماد',
        detail: `تتطلب عقدة CKB المضمنة في Neuron أحدث إصدار من Microsoft Visual C++ Redistributable لنظام x64. الإصدار المثبت مفقود أو قديم، لذا يرجى تثبيت أحدث إصدار لضمان عمل البرنامج بصورة سليمة.`,
        buttons: {
          'install-and-exit': 'تثبيت وإنهاء',
        },
      },
      'acp-migration': {
        title: 'ترقية حساب الأصول',
        message: 'ترقية حساب الأصول',
        detail:
          'حدد فريق الأمان مؤخرا ثغرة محتملة في نص حساب الأصول التجريبي. نشرنا نصا جديدا مصححا على Mainnet، وستستخدمه كل حسابات الأصول الجديدة. نوصي بترقية حساباتك إلى النص الجديد.',
        buttons: {
          migrate: 'ترقية آمنة الآن',
          skip: 'الترقية لاحقا مع تحمل المخاطر',
        },
      },
      'acp-migration-completed': {
        title: 'تهانينا! لقد أكملت الترقية الآمنة.',
        message: 'تهانينا! لقد أكملت الترقية الآمنة.',
        buttons: {
          ok: 'حسنا',
        },
      },
      'hard-fork-migrate': {
        message:
          'من أجل التوافق مع أحدث إصدار من CKB، سيقوم Neuron بمزامنة البيانات على السلسلة، وقد تستغرق المزامنة الكاملة وقتا طويلا.',
      },
      'mail-us': {
        message: 'يرجى مراسلتنا مع إرفاق معلومات التصحيح المصدرة من "القائمة" -> "مساعدة" -> "تصدير معلومات التصحيح".',
        'open-client': 'فتح عميل البريد',
        'fail-message':
          'تعذر تشغيل عميل البريد، يرجى نسخ عنوان البريد الإلكتروني، وإرفاق معلومات التصحيح المصدرة من "القائمة" -> "مساعدة" -> "تصدير معلومات التصحيح" وإرسالها لنا.',
        'copy-mail-addr': 'نسخ عنوان البريد الإلكتروني',
      },
      'migrate-failed': {
        title: 'فشلت الترقية',
        message:
          'فشلت الترقية، اضغط على "حسنا" لحذف البيانات القديمة والمزامنة من البداية، أو اضغط على "إلغاء" للترقية لاحقا بإعادة تشغيل Neuron. سبب فشل الترقية: {{ reason }}',
        buttons: {
          ok: 'حسنا',
          cancel: 'إلغاء',
        },
      },
      'unrecognized-lock-script': {
        message: 'تم العثور على نص قفل غير معرف في هذه المعاملة، يرجى التحقق.',
        buttons: {
          cancel: 'إلغاء',
          ignore: 'تجاهل واستمرار',
        },
      },
      'unrecognized-multisig-transaction': {
        message: 'هذه معاملة متعددة التواقيع. يرجى الموافقة عليها من عنوان متعدد التواقيع باستخدام المحفظة المناسبة.',
        buttons: {
          cancel: 'إلغاء',
        },
      },
    },
    prompt: {
      password: {
        label: 'أدخل كلمة المرور الخاصة بك',
        submit: 'إرسال',
        cancel: 'إلغاء',
      },
    },
    updater: {
      'update-not-available': 'لا توجد تحديثات متاحة حاليا.',
    },
    common: {
      yes: 'نعم',
      no: 'لا',
      ok: 'حسنا',
      cancel: 'إلغاء',
      error: 'خطأ',
    },
    'export-debug-info': {
      'export-debug-info': 'تصدير معلومات التصحيح',
      'debug-info-exported': 'تم تصدير معلومات التصحيح إلى {{ file }}',
    },
    about: {
      'app-version': 'إصدار {{name}}: {{version}}',
      'ckb-client-version': 'إصدار عميل CKB: {{version}}',
      'ckb-light-client-version': 'إصدار عميل CKB الخفيف: {{version}}',
    },
    settings: {
      title: {
        normal: 'الإعدادات',
        mac: 'التفضيلات',
      },
    },
    'export-transactions': {
      'export-transactions': 'تصدير سجل المعاملات',
      'export-success': 'تم تصدير المعاملات بنجاح',
      'transactions-exported': 'تم تصدير {{total}} سجل معاملات إلى {{file}}',
      column: {
        time: 'الوقت',
        'block-number': 'رقم الكتلة',
        'tx-hash': 'تجزئة المعاملة',
        'tx-type': 'نوع المعاملة',
        amount: 'مبلغ CKB',
        'udt-amount': 'مبلغ UDT',
        description: 'الوصف',
      },
      'tx-type': {
        send: 'إرسال',
        receive: 'استلام',
        'create-asset-account': 'إنشاء حساب أصول {{name}}',
        'destroy-asset-account': 'حذف حساب الأصول {{name}}',
      },
    },
    'offline-signature': {
      'export-transaction': 'تصدير المعاملة بصيغة JSON',
      'transaction-exported': 'تم تصدير المعاملة إلى {{filePath}}.',
      'load-transaction': 'تحميل ملف المعاملة',
    },
    'multisig-config': {
      'import-config': 'استيراد إعداد التواقيع المتعددة',
      'export-config': 'تصدير إعداد التواقيع المتعددة',
      'config-exported': 'تم تصدير إعداد التواقيع المتعددة إلى {{filePath}}.',
      'import-duplicate': 'يرجى التحقق من وجود إعدادات مكررة',
      'import-result': 'عمليات الاستيراد الناجحة: {{success}}، الفاشلة: {{fail}}.{{failCheck}}',
      'confirm-delete': 'تأكيد حذف إعداد التواقيع المتعددة؟',
      'approve-tx': 'تأكيد معاملة متعددة التواقيع',
      'delete-actions': {
        ok: 'تأكيد',
        cancel: 'إلغاء',
      },
    },
    'open-in-explorer': {
      title: 'عرض في مستكشف CKB',
      transaction: 'معاملة',
      message: 'عرض {{type}} {{key}} في مستكشف CKB',
    },
  },
}
