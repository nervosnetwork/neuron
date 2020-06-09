export default {
  translation: {
    keywords: {
      wallet: '钱包',
      password: '密码',
      'wallet-name': '钱包名称',
    },
    'application-menu': {
      neuron: {
        about: '关于{{app}}',
        preferences: '偏好设置...',
        'check-updates': '检查更新...',
        quit: '退出{{app}}',
      },
      wallet: {
        label: '钱包',
        select: '选择钱包',
        'create-new': '创建新钱包',
        import: '导入钱包',
        backup: '备份当前钱包',
        'export-xpubkey': '导出 Extended Public Key',
        delete: '删除当前钱包',
        'change-password': '修改密码',
        'import-mnemonic': '导入助记词',
        'import-keystore': '导入 Keystore 文件',
        'import-xpubkey': '导入 Extended Public Key',
      },
      edit: {
        label: '编辑',
        cut: '剪切',
        copy: '复制',
        paste: '粘贴',
        selectall: '全部选中',
      },
      tools: {
        label: "工具",
        "sign-and-verify": "签名/验签信息",
      },
      window: {
        label: '窗口',
        minimize: '最小化',
        close: '关闭窗口',
      },
      help: {
        label: '帮助',
        'nervos-website': 'Nervos 网站',
        'source-code': '源代码',
        'report-issue': '报告问题',
        documentation: '使用文档',
        faq: 'Neuron FAQ',
        settings: '设置',
        'export-debug-info': '导出调试信息',
      },
      develop: {
        develop: '开发',
        'force-reload': '强制刷新',
        reload: '刷新',
        'toggle-dev-tools': '开发者工具',
      },
    },
    services: {
      transactions: '交易',
      wallets: '钱包',
    },
    messages: {
      'failed-to-load-networks': '加载节点失败。',
      'Networks-will-be-reset': '节点列表将被重置。',
      'wallet-password-less-than-min-length': '密码应至少包含{{minPasswordLength}}位字符。',
      'wallet-password-more-than-max-length': '密码不能超过{{maxPasswordLength}}位字符。',
      'wallet-password-letter-complexity': '密码包含大写字母、小写字母、数字、特殊符号的至少三类。',
      'current-wallet-not-set': '未设置当前钱包。',
      'incorrect-password': '密码不正确。',
      'invalid-address': '地址 {{address}} 不合法。',
      'codehash-not-loaded': 'codehash 还未加载完成。',
      'wallet-not-found': '未找到钱包 {{id}}。',
      'failed-to-create-mnemonic': '创建助记词失败。',
      'network-not-found': '未找到 ID 为 {{id}} 的网络设置。',
      'invalid-name': '{{field}} 名称不合法。',
      'default-network-unremovable': '默认网络不可删除。',
      'lack-of-default-network': '缺少默认网络。',
      'current-network-not-set': '当前 CKB 节点 RPC 地址未设置。',
      'transaction-not-found': '未找到交易 {{hash}}。',
      'is-required': '缺少 {{field}}。',
      'invalid-format': '{{field}} 格式不正确。',
      'used-name': '{{field}} 名称已存在，请输入其它名称。',
      'missing-required-argument': '缺少必要参数。',
      'save-keystore': '保存 Keystore 文件。',
      'save-extended-public-key': '保存 Extended Public Key。',
      'import-extended-public-key': '导入 Extended Public Key。',
      'invalid-mnemonic': '助记词不合法，请检查。',
      'unsupported-cipher': '不支持的 Cipher。',
      'capacity-not-enough': '余额不足。',
      'capacity-not-enough-for-change': "您需要有足够的余额来支付找零（至少 61 CKBytes），或者点击 'Max' 按钮发送全部余额。",
      'live-capacity-not-enough': '可用余额不足，请等待上一笔交易上链。',
      'capacity-too-small': '最小转账金额为 {{bytes}} CKBytes。',
      'should-be-type-of': '{{field}} 应该为 {{type}} 类型。',
      'invalid-keystore': 'Keystore 格式不正确，请检查文件完整性。',
      'invalid-json': 'JSON 文件格式不正确，请检查文件完整性。',
      'cell-is-not-yet-live': '请耐心等待上一笔交易被区块链确认。',
      'transaction-is-not-committed-yet': '无法在链上找到交易所需要的 cell，请确保相关的交易已经被区块链确认。',
      'mainnet-address-required': '{{address}} 不是主网地址。',
      'testnet-address-required': '{{address}} 不是测试网地址。',
      'address-not-found': '当前钱包地址列表中不包含输入地址，请检查钱包设置或等待同步完成。',
      'target-output-not-found': "无法找到与指定地址关联的账户钱包。",
      'acp-same-account': "请设置与转出账户不同的收款账户。"
    },
    messageBox: {
      button: {
        confirm: '确定',
        discard: '放弃',
      },
      'send-capacity': {
        title: '发送交易',
      },
      'remove-network': {
        title: '删除网络',
        message: '将删除网络 {{name}}(地址: {{address}})的设置.',
        alert: '这是当前连接网络, 删除后会连接到默认网络',
      },
      'remove-wallet': {
        title: '删除钱包',
        password: '密码',
      },
      'backup-keystore': {
        title: '备份 Keystore 文件',
        password: '密码',
      },
      transaction: {
        title: '交易: {{hash}}',
      },
      'sign-and-verify': {
        title: '签名/验签信息'
      },
      'ckb-dependency': {
        title: '内置 CKB 节点',
        message: '缺少必要的依赖',
        detail: 'Neuron 内置的 CKB 节点需要安装 Microsoft Visual C++ Redistributable 才能正常运行。您需要安装该组件来启用内置节点。如果您使用外部节点，也可以跳过该步骤。',
        buttons: {
          'skip': '跳过',
          'install-and-exit': '安装并退出'
        }
      },
      'clear-cache': {
        title: '清除缓存',
        message: '清除缓存',
        detail: '是否确认清除缓存？需要至少两小时重建缓存。',
        buttons: {
          cancel: '取消',
          ok: '确认'
        }
      }
    },
    prompt: {
      password: {
        label: '请输入密码',
        submit: '提交',
        cancel: '取消',
      },
    },
    updater: {
      'update-not-available': '没有可供升级的新版本。',
    },
    common: {
      yes: '是',
      no: '否',
      ok: '确定',
      error: '错误'
    },
    'export-debug-info': {
      'export-debug-info': '导出调试信息',
      'debug-info-exported': '调试信息已被导出至 {{ file }}'
    },
    about: {
      "app-version": "{{name}} 版本: {{version}}",
      "ckb-client-version": "CKB 节点版本: {{version}}"
    },
    settings: {
      title: {
        normal: '设置',
        mac: '偏好设置'
      }
    },
    'export-transactions': {
      'export-transactions': '导出交易历史',
      'transactions-exported': '{{total}} 条交易记录已被导出至 {{file}}',
      column: {
        "time": "时间",
        "block-number": "区块高度",
        "tx-hash": "交易哈希",
        "tx-type": "交易类型",
        "amount": "金额",
        "description": "备注"
      },
      "tx-type": {
        "send": "转账",
        "receive": "收款"
      }
    }
  },
}
