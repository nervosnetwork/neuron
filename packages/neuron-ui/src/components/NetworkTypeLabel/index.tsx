import React from 'react'
import { useTranslation } from 'react-i18next'

const NetworkTypeLabel = ({ type }: { type: 'ckb' | 'ckb_testnet' | 'ckb_dev' | string }) => {
  const [t] = useTranslation()
  switch (type) {
    case 'ckb': {
      return <span className="label primary">{t('settings.network.mainnet')}</span>
    }
    case 'ckb_testnet': {
      return <span className="label secondary">{t('settings.network.testnet')}</span>
    }
    default: {
      return <span className="label third">{t('settings.network.devnet')}</span>
    }
  }
}

NetworkTypeLabel.displayName = 'NetworkTypeLabel'

export default NetworkTypeLabel
