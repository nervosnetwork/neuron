import React, { useCallback } from 'react'
import { RouteComponentProps } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { Stack, Button, ChoiceGroup, IChoiceGroupOption } from 'office-ui-fabric-react'

import { StateWithDispatch } from 'states/stateProvider/reducer'
import { setCurrentWallet } from 'states/stateProvider/actionCreators'

import { WalletWizardPath } from 'components/WalletWizard'

import { contextMenu } from 'services/remote'
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
    (id: string = '') => () => {
      contextMenu({ type: 'walletList', id })
    },
    []
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
                  <span className="ms-ChoiceFieldLabel" onContextMenu={onContextMenu(wallet.id)}>
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
          <Button key={label} onClick={navTo(url)} text={t(label)} />
        ))}
      </Stack>
    </Stack>
  )
}

WalletSetting.displayName = 'WalletSetting'

export default WalletSetting
