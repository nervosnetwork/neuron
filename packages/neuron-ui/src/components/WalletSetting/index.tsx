import React, { useCallback } from 'react'
import { RouteComponentProps } from 'react-router-dom'
import { Stack, PrimaryButton, ChoiceGroup, IChoiceGroupOption } from 'office-ui-fabric-react'
import { useTranslation } from 'react-i18next'

import { appCalls } from 'services/UILayer'
import { Routes, MnemonicAction } from 'utils/const'
import { WalletWizardPath } from 'components/WalletWizard'
import { StateWithDispatch } from 'states/stateProvider/reducer'
import actionCreators from 'states/stateProvider/actionCreators'

const buttons = [
  {
    label: 'wizard.create-new-wallet',
    url: `${Routes.WalletWizard}${WalletWizardPath.Mnemonic}/${MnemonicAction.Create}`,
  },
  {
    label: 'wizard.import-wallet',
    url: `${Routes.WalletWizard}${WalletWizardPath.Mnemonic}/${MnemonicAction.Import}`,
  },
]

const Wallets = ({
  wallet: { id: currentID },
  settings: { wallets },
  dispatch,
  history,
}: React.PropsWithoutRef<StateWithDispatch & RouteComponentProps>) => {
  const [t] = useTranslation()
  const onChange = useCallback(
    (_e, option) => {
      if (option) {
        dispatch(actionCreators.activateWallet(option.key))
      }
    },
    [dispatch]
  )
  const onContextMenu = useCallback(
    (id: string) => () => {
      appCalls.contextMenu({ type: 'walletList', id })
    },
    []
  )

  const navTo = useCallback(
    (url: string) => () => {
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
            disabled: wallet.id === currentID,
            onRenderLabel: ({ text }: IChoiceGroupOption) => {
              return (
                <span className="ms-ChoiceFieldLabel" onContextMenu={onContextMenu(wallet.id)}>
                  {text}
                </span>
              )
            },
          }))}
          onChange={onChange}
        />
      </Stack.Item>
      <Stack horizontal horizontalAlign="space-around">
        {buttons.map(({ label, url }) => (
          <PrimaryButton key={label} onClick={navTo(url)} text={t(label)} />
        ))}
      </Stack>
    </Stack>
  )
}

export default Wallets
