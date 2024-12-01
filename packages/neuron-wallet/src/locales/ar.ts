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
        quit: 'خروج {{app}}',
      },
      wallet: {
        label: 'محفظة',
        select: 'اختر المحفظة',
        'create-new': 'إنشاء محفظة جديدة',
        import: 'استيراد المحفظة',
        backup: 'نسخ احتياطي للمحفظة الحالية',
        'export-xpubkey': 'تصدير المفتاح العام الموسع',
        delete: 'حذف المحفظة الحالية',
        'change-password': 'تغيير كلمة المرور',
        'import-mnemonic': 'استيراد بذور المحفظة',
        'import-keystore': 'الاستيراد من مخزن المفاتيح',
        'import-xpubkey': 'استيراد المفتاح العام الموسع',
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
        'sign-and-verify': 'توقيع/تحقق من الرسالة',
        'multisig-address': 'عناوين التوقيع المتعدد',
        'offline-sign': 'توقيع دون اتصال',
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
        'nervos-website': 'موقع نيرفوس',
        'source-code': 'رمز المصدر',
        'report-issue': 'الإبلاغ عن مشكلة',
        'contact-us': 'اتصل بنا',
        'contact-us-message':
          '> يرجى إرفاق معلومات التصحيح المصدرة من "القائمة" -> "مساعدة" -> "تصدير معلومات التصحيح".',
        documentation: 'التوثيق',
        settings: 'الإعدادات',
        'export-debug-info': 'تصدير معلومات التصحيح',
      },
      develop: {
        develop: 'تطوير',
        'force-reload': 'إعادة تحميل بالقوة',
        reload: 'إعادة تحميل',
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
      'wallet-password-less-than-min-length': 'يجب أن تتكون كلمة المرور من {{minPasswordLength}} أحرف على الأقل.',
      'wallet-password-more-than-max-length': 'يمكن أن تكون كلمة المرور حتى {{maxPasswordLength}} أحرف.',
      'wallet-password-letter-complexity':
        'يجب أن تحتوي كلمة المرور على مزيج من الأحرف الكبيرة والصغيرة والأرقام والرموز الخاصة.',
      'current-wallet-not-set': 'لم يتم تعيين المحفظة الحالية.',
      'incorrect-password': 'كلمة المرور غير صحيحة',
      'invalid-address': 'العنوان {{address}} غير صالح.',
      'codehash-not-loaded': 'codehash غير محمل.',
      'wallet-not-found': 'لم يتم العثور على المحفظة {{id}}.',
      'failed-to-create-mnemonic': 'فشل في إنشاء العبارة الميمونية.',
      'network-not-found': 'لم يتم العثور على شبكة بالمعرف {{id}}.',
      'invalid-name': 'اسم {{field}} غير صالح.',
      'default-network-unremovable': 'لا يمكن إزالة الشبكة الافتراضية.',
      'lack-of-default-network': 'نقص في الشبكة الافتراضية.',
      'current-network-not-set': 'لم يتم تعيين RPC لعقدة CKB الحالية.',
      'transaction-not-found': 'لم يتم العثور على المعاملة {{hash}}.',
      'is-required': '{{field}} مطلوب.',
      'invalid-format': '{{field}} بتنسيق غير صالح.',
      'used-name': 'اسم {{field}} مستخدم، يرجى اختيار اسم آخر.',
      'missing-required-argument': 'الحجة المطلوبة مفقودة.',
      'save-keystore': 'حفظ مخزن المفاتيح.',
      'save-extended-public-key': 'حفظ المفتاح العام الموسع.',
      'import-extended-public-key': 'استيراد المفتاح العام الموسع.',
      'invalid-mnemonic': 'بذور المحفظة غير صالحة، يرجى التحقق منها مرة أخرى.',
      'unsupported-cipher': 'الشيفرة غير مدعومة.',
      'capacity-not-enough': 'الرصيد غير كاف.',
      'capacity-not-enough-for-change': 'تحتاج إلى المزيد من السعات للمتغير (أكثر من 61 CKBytes).',
      'capacity-not-enough-for-change-by-transfer':
        "تحتاج إلى المزيد من السعات للمتغير (أكثر من 61 CKBytes)، أو انقر فوق زر 'الحد الأقصى' لإرسال كل رصيدك.",
      'live-capacity-not-enough': 'الرصيد المتاح غير كافٍ، يرجى المحاولة مرة أخرى عندما يتم تأكيد المعاملة الأخيرة.',
      'capacity-too-small': 'الحد الأدنى لرصيد التحويل هو {{bytes}} CKBytes.',
      'should-be-type-of': '{{field}} يجب أن يكون من نوع {{type}}.',
      'invalid-keystore': 'مخزن المفاتيح غير صالح، يرجى التحقق من سلامة الملف الخاص بك.',
      'invalid-json': 'ملف JSON غير صالح، يرجى التحقق من سلامة الملف الخاص بك.',
      'cell-is-not-yet-live': 'يرجى الانتظار حتى يتم تأكيد المعاملة الأخيرة من قبل السلسلة.',
      'transaction-is-not-committed-yet':
        'لا يمكن العثور على الخلايا المطلوبة على السلسلة، يرجى التأكد من تأكيد المعاملات ذات الصلة.',
      'mainnet-address-required': '{{address}} ليس عنوان Mainnet.',
      'testnet-address-required': '{{address}} ليس عنوان Testnet.',
      'address-not-found':
        'العنوان المعطى لا ينتمي إلى المحفظة الحالية. يرجى التحقق من محفظتك أو الانتظار حتى يتم الانتهاء من المزامنة.',
      'target-output-not-found': 'لا يوجد محفظة حساب مرتبطة بهذا العنوان.',
      'acp-same-account': 'يجب ألا يكون حساب الدفع وحساب الاستلام هو نفسه.',
      'device-sign-canceled':
        'لقد قمت بإلغاء طلب التوقيع. وإلا، يرجى التأكد من تمكين إعداد "السماح ببيانات العقد" في تطبيق Nervos على جهازك.',
      'connect-device-failed': 'لا يمكن توصيل الجهاز، يرجى التحقق من الاتصال الخاص بك.',
      'unsupported-manufacturer': 'الأجهزة من {{manufacturer}} غير مدعومة بعد.',
      'wallet-not-supported-function': 'هذه المحفظة لا تدعم وظيفة {name}.',
      'unsupported-ckb-cli-keystore': "Neuron لا يدعم استيراد ملف مخزن المفاتيح الخاص ب ckb-cli's ",
      'invalid-transaction-file': 'ملف المعاملة غير صالح.',
      'offline-sign-failed': 'فشل التوقيع، يرجى التحقق مما إذا كنت تقوم بالتوقيع باستخدام المحفظة الصحيحة.',
      'multisig-script-prefix-error': 'إعداد التوقيع المتعدد خاطئ',
      'multisig-config-not-exist': 'إعداد التوقيع المتعدد غير موجود',
      'multisig-config-exist': 'إعداد التوقيع المتعدد موجود بالفعل',
      'multisig-config-address-error': 'إعداد عنوان إعداد التوقيع المتعدد غير صحيح',
      'multisig-config-need-error': 'يتطلب إنشاء معاملة توقيع متعدد إعدادًا لتوقيع متعدد',
      'transaction-no-input-parameter': 'معامل الإدخال المفقود لخلايا الاستعلام',
      'migrate-sudt-no-type': 'الخلايا المهجر ليس لديها نص النوع',
      'multisig-not-signed': 'التوقيعات الجزئية مفقودة للمعاملات ذات التوقيع المتعدد',
      'multisig-lock-hash-mismatch': 'عنوان التوقيع المتعدد الحالي لا يتطابق مع المعاملة التي سيتم الموافقة عليها',
      'sudt-acp-have-data': 'حساب sUDT المدمر لديه مبلغ',
      'no-match-address-for-sign': 'لم يتم العثور على عنوان مطابق',
      'target-lock-error': 'يمكن لحساب أصول CKB أن ينقل فقط إلى عنوان sepe256k1 أو acp',
      'no-exist-ckb-node-data': '{{path}} لا يحتوي على تكوين وتخزين عقدة CKB، اضغط تأكيد للمزامنة من البداية',
      'light-client-sudt-acp-error': 'وضع العميل الخفيف لا يدعم إرسال الأصول إلى حسابات أصول الآخرين',
      'could-not-connect-service': 'تعذر الاتصال بالخدمة، يرجى المحاولة مرة أخرى لاحقًا.',
      'address-required': 'لا يمكن أن يكون العنوان فارغًا.',
    },
    messageBox: {
      button: {
        confirm: 'حسناً',
        discard: 'إلغاء',
      },
      'clear-sync-data': {
        title: 'مسح جميع البيانات المتزامنة',
        message:
          'سيؤدي مسح جميع البيانات المتزامنة إلى حذف جميع البيانات المتزامنة المحلية وإعادة مزامنة البيانات على السلسلة، وقد تستغرق المزامنة بأكملها وقتًا طويلاً.',
      },
      'send-capacity': {
        title: 'إرسال معاملة',
      },
      'remove-network': {
        title: 'إزالة الشبكة',
        message: 'سيتم إزالة شبكة {{name}} (العنوان: {{address}}).',
        alert: 'هذه هي الشبكة الحالية، عند إزالتها، ستنتقل الاتصال إلى الشبكة الافتراضية',
      },
      'remove-wallet': {
        title: 'حذف المحفظة',
        password: 'كلمة المرور',
      },
      'backup-keystore': {
        title: 'نسخ احتياطي لمخزن المفاتيح',
        password: 'كلمة المرور',
      },
      transaction: {
        title: 'معاملة: {{hash}}',
      },
      'sign-and-verify': {
        title: 'توقيع/التحقق من الرسالة',
      },
      'multisig-address': {
        title: 'عناوين التوقيع المتعدد',
      },
      'ckb-dependency': {
        title: 'عقدة CKB المجمعة',
        message: 'اعتماد مطلوب',
        detail: `تعتمد عقد الشبكة في Neuron على مكونات بلغة C++، لذا يرجى تثبيت أحدث إصدار من Redistributable لـ Microsoft Visual C++ لنظام x64 لضمان تشغيل البرنامج بشكل صحيح.`,
        buttons: {
          'install-and-exit': 'تثبيت والخروج',
        },
      },
      'acp-migration': {
        title: 'ترقية حساب الأصول',
        message: 'ترقية حساب الأصول',
        detail:
          'في الآونة الأخيرة، حدد فريق الأمان لدينا ثغرة محتملة في نص حساب الأصول التجريبي. لقد قمنا بنشر نص حساب الأصول الجديد مع إصلاح على الشبكة الرئيسية وسيستخدم جميع حسابات الأصول المستقبلية الإصدار الجديد. نقترح عليك ترقيتها لاستخدام النص الجديد.',
        buttons: {
          migrate: 'ترقية آمنة الآن',
          skip: 'أنا أعلم بالمخاطر، سأرقى لاحقًا',
        },
      },
      'acp-migration-completed': {
        title: 'تهانينا! لقد أكملت الترقية الآمنة.',
        message: 'تهانينا! لقد أكملت الترقية الآمنة.',
        buttons: {
          ok: 'حسناً',
        },
      },
      'hard-fork-migrate': {
        message:
          'من أجل التكيف مع أحدث إصدار من CKB، سيقوم Neuron بمزامنة البيانات على السلسلة، وقد تستغرق المزامنة بأكملها وقتًا طويلاً.',
      },
      'mail-us': {
        message: 'يرجى مراسلتنا بمعلومات التصحيح المصدرة من "القائمة" -> "مساعدة" -> "تصدير معلومات التصحيح".',
        'open-client': 'فتح عميل البريد',
        'fail-message':
          'تعذر تشغيل عميل البريد، يرجى نسخ عنوان البريد، وإرفاق معلومات التصحيح المصدرة من "القائمة" -> "مساعدة" -> "تصدير معلومات التصحيح" وإرسالها لنا.',
        'copy-mail-addr': 'نسخ عنوان البريد',
      },
      'migrate-failed': {
        title: 'فشلت الترقية',
        message:
          'فشلت الترقية، اضغط حسناً لحذف البيانات القديمة والمزامنة من البداية، أو انقر إلغاء للترقية لاحقًا بإعادة تشغيل Neuron. سبب الفشل في الترقية: {{ reason }}',
        buttons: {
          ok: 'حسناً',
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
      'update-not-available': 'لا توجد تحديثات متاحة حالياً.',
    },
    common: {
      yes: 'نعم',
      no: 'لا',
      ok: 'حسناً',
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
      'export-success': 'تم تصدير المعاملات',
      'transactions-exported': 'تم تصدير {{total}} سجل معاملة إلى {{file}}',
      column: {
        time: 'الوقت',
        'block-number': 'رقم الكتلة',
        'tx-hash': 'هاش المعاملة',
        'tx-type': 'نوع المعاملة',
        amount: 'مبلغ CKB',
        'udt-amount': 'مبلغ UDT',
        description: 'الوصف',
      },
      'tx-type': {
        send: 'إرسال',
        receive: 'استلام',
        'create-asset-account': 'إنشاء حساب الأصول {{name}}',
        'destroy-asset-account': 'تدمير حساب الأصول {{name}}',
      },
    },
    'offline-signature': {
      'export-transaction': 'تصدير المعاملة كـ JSON',
      'transaction-exported': 'تم تصدير المعاملة إلى {{filePath}}.',
      'load-transaction': 'تحميل ملف المعاملة',
    },
    'multisig-config': {
      'import-config': 'استيراد إعداد التوقيع المتعدد',
      'export-config': 'تصدير إعداد التوقيع المتعدد',
      'config-exported': 'تم تصدير إعدادات التوقيع المتعدد إلى {{filePath}}.',
      'import-duplicate': 'يرجى التحقق من وجود إعدادات مكررة',
      'import-result': 'نجحت الاستيرادات: {{success}}، فشلت: {{fail}}.{{failCheck}}',
      'confirm-delete': 'تأكيد حذف إعداد التوقيع المتعدد؟',
      'approve-tx': 'تأكيد معاملة التوقيع المتعدد',
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
