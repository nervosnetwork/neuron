import React, { useCallback } from 'react'
import { RouteComponentProps } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { Stack, PrimaryButton, ChoiceGroup, IChoiceGroupOption } from 'office-ui-fabric-react'

import { StateWithDispatch } from 'states/stateProvider/reducer'
import { setCurrentWallet } from 'states/stateProvider/actionCreators'

import { WalletWizardPath } from 'components/WalletWizard'

import { openContextMenu, requestPassword } from 'services/remote'
import { Routes, MnemonicAction } from 'utils/const'

const buttons = [
  {
    label: 'wizard.create-new-wallet',
    url: `${Routes.WalletWizard}${WalletWizardPath.Mnemonic}/${MnemonicAction.Create}`,
  },
  {
    label: 'wizard.import-mnemonic',
    url: `${Routes.WalletWizard}${WalletWizardPath.Mnemonic}/${MnemonicAction.Import}`,
  },
  {
    label: 'wizard.import-keystore',
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
    <Stack tokens={{ childrenGap: 15 }}>
      <Stack.Item>
        <ChoiceGroup
          options={wallets.map(wallet => ({
            key: wallet.id,
            text: wallet.name,
            checked: wallet.id === currentID,
            onRenderLabel: ({ text }: IChoiceGroupOption) => {
              return (
                <Stack>
                  <span className="ms-ChoiceFieldLabel" data-id={wallet.id} onContextMenu={onContextMenu}>
                    {text}
                  </span>
                </Stack>
              )
            },
          }))}
          onChange={onChange}
        />
      </Stack.Item>
      <Stack horizontal horizontalAlign="start" tokens={{ childrenGap: 20 }}>
        {buttons.map(({ label, url }) => (
          <PrimaryButton key={label} onClick={navTo(url)} text={t(label)} />
        ))}
      </Stack>
    </Stack>
  )
}

WalletSetting.displayName = 'WalletSetting'

export default WalletSetting
