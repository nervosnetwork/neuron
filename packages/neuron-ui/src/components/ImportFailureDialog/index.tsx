import React, { useCallback } from 'react'
import { useTranslation } from 'react-i18next'
import Dialog from 'widgets/Dialog'
import { openExternal } from 'services/remote'
import styles from './importFailureDialog.module.scss'

const ImportFailureDialog = ({ show, onClose }: { show: boolean; onClose: () => void }) => {
  const [t] = useTranslation()

  const onBtnClick = useCallback(() => {
    openExternal(
      'https://github.com/nervosnetwork/ckb-cli/wiki/Import-ckb-cli-keystore-from%26to-Neuron-wallet#ckb-cli-and-neuron-use-the-keystore-in-different-way'
    )
  }, [])

  return (
    <Dialog
      show={show}
      title={t('import-keystore.import-failure')}
      onCancel={onClose}
      onConfirm={onClose}
      showCancel={false}
    >
      <div className={styles.container}>
        <p className={styles.content}>
          {t('import-keystore.import-failure-msg')}
          <button type="button" onClick={onBtnClick}>
            {t('navbar.learn-more')}
          </button>
        </p>
      </div>
    </Dialog>
  )
}

ImportFailureDialog.displayName = 'ImportFailureDialog'

export default ImportFailureDialog
