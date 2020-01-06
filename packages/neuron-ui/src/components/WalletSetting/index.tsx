import React, { useEffect, useCallback } from 'react'
import { RouteComponentProps } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { ChoiceGroup, IChoiceGroupOption } from 'office-ui-fabric-react'
import Button from 'widgets/Button'

import { StateWithDispatch } from 'states/stateProvider/reducer'
import { setCurrentWallet } from 'states/stateProvider/actionCreators'

import { WalletWizardPath } from 'components/WalletWizard'

import { openContextMenu, requestPassword } from 'services/remote'
import { Routes, MnemonicAction } from 'utils/const'
import { backToTop } from 'utils/animations'
import styles from './walletSetting.module.scss'

const buttons = [
  {
    label: 'wizard.create-new-wallet',
    ariaLabel: 'create a wallet',
    url: `${Routes.WalletWizard}${WalletWizardPath.Mnemonic}/${MnemonicAction.Create}`,
  },
  {
    label: 'wizard.import-mnemonic',
    ariaLabel: 'import wallet seed',
    url: `${Routes.WalletWizard}${WalletWizardPath.Mnemonic}/${MnemonicAction.Import}`,
  },
  {
    label: 'wizard.import-keystore',
    ariaLabel: 'import from keystore',
    url: Routes.ImportKeystore,
  },
]

const WalletSetting = ({
  wallet: { id: currentID = '' },
  settings: { wallets = [] },
  dispatch,
  history,
}: React.PropsWithoutRef<StateWithDispatch & RouteComponentProps>) => {
  const [t] = useTranslation()
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
  const onContextMenu = useCallback(
    (e: React.MouseEvent<HTMLSpanElement, MouseEvent>) => {
      const { id } = (e.target as HTMLSpanElement).dataset
      if (id) {
        const menuTemplate = [
          {
            label: t('common.select'),
            click: () => {
              setCurrentWallet(id)(dispatch)
            },
          },
          {
            label: t('common.backup'),
            click: () => {
              requestPassword({
                walletID: id,
                action: 'backup-wallet',
              })
            },
          },
          {
            label: t('common.edit'),
            click: () => {
              history.push(`${Routes.WalletEditor}/${id}`)
            },
          },
          {
            label: t('common.delete'),
            click: () => {
              requestPassword({ walletID: id, action: 'delete-wallet' })
            },
          },
        ]
        openContextMenu(menuTemplate)
      }
    },
    [t, history, dispatch]
  )

  const navTo = useCallback(
    (url: string = '/') => () => {
      history.push(url)
    },
    [history]
  )

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
              <span className="ms-ChoiceFieldLabel" data-id={wallet.id} onContextMenu={onContextMenu}>
                {text}
              </span>
            )
          },
        }))}
        onChange={onChange}
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
