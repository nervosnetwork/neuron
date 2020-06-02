import React, { useEffect, useCallback } from 'react'
import { useHistory } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { ChoiceGroup, IChoiceGroupOption } from 'office-ui-fabric-react'

import { WalletWizardPath } from 'components/WalletWizard'
import Button from 'widgets/Button'
import { ReactComponent as EditWallet } from 'widgets/Icons/Edit.svg'
import { ReactComponent as BackupWallet } from 'widgets/Icons/BackupWallet.svg'
import { ReactComponent as DeleteWallet } from 'widgets/Icons/Delete.svg'

import { StateDispatch, setCurrentWallet } from 'states'
import {
  backToTop,
  RoutePath,
  MnemonicAction,
  useOnHandleWallet,
  useOnWindowResize,
  useToggleChoiceGroupBorder,
} from 'utils'

import styles from './walletSetting.module.scss'

const buttons = [
  {
    label: 'wizard.create-new-wallet',
    ariaLabel: 'create a wallet',
    url: `${RoutePath.WalletWizard}${WalletWizardPath.Mnemonic}/${MnemonicAction.Create}`,
  },
  {
    label: 'wizard.import-mnemonic',
    ariaLabel: 'import wallet seed',
    url: `${RoutePath.WalletWizard}${WalletWizardPath.Mnemonic}/${MnemonicAction.Import}`,
  },
  {
    label: 'wizard.import-keystore',
    ariaLabel: 'import from keystore',
    url: RoutePath.ImportKeystore,
  },
]

const WalletSetting = ({
  wallet: { id: currentID = '' },
  settings: { wallets = [] },
  dispatch,
}: State.AppWithNeuronWallet & { dispatch: StateDispatch }) => {
  const [t] = useTranslation()
  const history = useHistory()

  useEffect(() => {
    backToTop()
  }, [])

  const onChange = useCallback(
    (_e, option) => {
      if (option) {
        setCurrentWallet(option.key)(dispatch)
      }
    },
    [dispatch]
  )
  const onHandleWallet = useOnHandleWallet({
    dispatch,
    history,
  })

  const navTo = useCallback(
    (url: string = '/') => () => {
      history.push(url)
    },
    [history]
  )

  const toggleBottomBorder = useToggleChoiceGroupBorder(`.${styles.wallets}`, styles.hasBottomBorder)

  useEffect(() => {
    if (wallets.length) {
      toggleBottomBorder()
    }
  }, [toggleBottomBorder, wallets.length])

  useOnWindowResize(toggleBottomBorder)

  return (
    <div className={styles.container}>
      <ChoiceGroup
        className={styles.wallets}
        options={wallets.map(wallet => ({
          key: wallet.id,
          text: wallet.name,
          checked: wallet.id === currentID,
          onRenderLabel: ({ text }: IChoiceGroupOption) => {
            return (
              <span
                role="presentation"
                className={`ms-ChoiceFieldLabel ${styles.choiceLabel}`}
                data-id={wallet.id}
                data-action="select"
                onClick={onHandleWallet}
              >
                <span className={styles.walletName}>{text}</span>

                <button type="button" data-action="edit" aria-label={t('common.edit')} title={t('common.edit')}>
                  <EditWallet />
                </button>
                <button type="button" data-action="delete" aria-label={t('common-delete')} title={t('common.delete')}>
                  <DeleteWallet />
                </button>
                <button type="button" data-action="backup" aria-label={t('common.backup')} title={t('common.backup')}>
                  <BackupWallet />
                </button>
              </span>
            )
          },
        }))}
        onChange={onChange}
        styles={{
          label: {
            padding: '3px',
          },
        }}
      />
      <div className={styles.actions}>
        {buttons.map(({ label, ariaLabel, url }) => (
          <Button key={label} onClick={navTo(url)} label={t(label)} arial-label={ariaLabel} />
        ))}
      </div>
    </div>
  )
}

WalletSetting.displayName = 'WalletSetting'

export default WalletSetting
