import React, { useEffect, useCallback } from 'react'
import { useHistory, useLocation } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { ChoiceGroup } from 'office-ui-fabric-react'

import { WalletWizardPath } from 'components/WalletWizard'
import { ReactComponent as EditWallet } from 'widgets/Icons/Edit.svg'
import { ReactComponent as BackupWallet } from 'widgets/Icons/BackupWallet.svg'
import { ReactComponent as DeleteWallet } from 'widgets/Icons/Delete.svg'
import { ReactComponent as CreateWallet } from 'widgets/Icons/SoftWalletCreate.svg'
import { ReactComponent as ImportKeystore } from 'widgets/Icons/SoftWalletImportKeystore.svg'
import { ReactComponent as ImportSeed } from 'widgets/Icons/SoftWalletImportSeed.svg'
import { ReactComponent as ImportHardware } from 'widgets/Icons/HardWalletImport.svg'

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
    label: 'wizard.new-wallet',
    ariaLabel: 'create a wallet',
    url: `${RoutePath.WalletWizard}${WalletWizardPath.Mnemonic}/${MnemonicAction.Create}`,
    icon: <CreateWallet />,
  },
  {
    label: 'wizard.wallet-seed',
    ariaLabel: 'import wallet seed',
    url: `${RoutePath.WalletWizard}${WalletWizardPath.Mnemonic}/${MnemonicAction.Import}`,
    icon: <ImportKeystore />,
  },
  {
    label: 'wizard.keystore',
    ariaLabel: 'import from keystore',
    url: RoutePath.ImportKeystore,
    icon: <ImportSeed />,
  },
  {
    label: 'wizard.hardware-wallet',
    ariaLabel: 'import from hardware wallet',
    url: RoutePath.ImportHardware,
    icon: <ImportHardware />,
  },
]

const WalletSetting = ({
  wallet: { id: currentID = '' },
  settings: { wallets = [] },
  dispatch,
}: State.AppWithNeuronWallet & { dispatch: StateDispatch }) => {
  const [t] = useTranslation()
  const history = useHistory()
  const location = useLocation()

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
      if (url === RoutePath.ImportHardware) {
        history.push(RoutePath.ImportHardware)
      } else {
        history.push(url)
      }
    },
    [history, location.pathname]
  )

  const toggleBottomBorder = useToggleChoiceGroupBorder(`.${styles.wallets}`, styles.hasBottomBorder)

  useEffect(() => {
    if (wallets.length) {
      toggleBottomBorder()
    }
  }, [toggleBottomBorder, wallets.length])

  useOnWindowResize(toggleBottomBorder)

  const [createWallet, ...importWallet] = buttons

  return (
    <div className={styles.container}>
      <ChoiceGroup
        className={styles.wallets}
        options={wallets.map(wallet => ({
          key: wallet.id,
          text: wallet.name,
          checked: wallet.id === currentID,
          onRenderLabel: props => {
            return (
              <span
                role="presentation"
                className={`ms-ChoiceFieldLabel ${styles.choiceLabel}`}
                data-id={wallet.id}
                data-action="select"
                onClick={onHandleWallet}
              >
                <span className={styles.walletName}>{props?.text}</span>

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
        <div className={styles.label}>{t('wizard.create-new-wallet')}</div>
        <button className={styles.button} type="button" onClick={navTo(createWallet.url)}>
          <span>{createWallet.icon}</span>
          <span>{t(createWallet.label)}</span>
        </button>
        <hr className={styles.hr} color="#ccc" />
        <div className={styles.label}>{t('wizard.import-wallet')}</div>
        {importWallet.map(({ label, url, icon }) => (
          <button className={styles.button} type="button" key={label} onClick={navTo(url)}>
            <span>{icon}</span>
            <span>{t(label)}</span>
          </button>
        ))}
      </div>
    </div>
  )
}

WalletSetting.displayName = 'WalletSetting'

export default WalletSetting
