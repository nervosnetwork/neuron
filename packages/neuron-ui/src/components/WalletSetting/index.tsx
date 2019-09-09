import React, { useState, useCallback, useMemo } from 'react'
import { RouteComponentProps } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import {
  Stack,
  PrimaryButton,
  ChoiceGroup,
  IChoiceGroupOption,
  Text,
  Callout,
  MessageBar,
  MessageBarType,
  ActionButton,
  getTheme,
} from 'office-ui-fabric-react'

import { StateWithDispatch } from 'states/stateProvider/reducer'
import { setCurrentWallet, addPopup } from 'states/stateProvider/actionCreators'

import { WalletWizardPath } from 'components/WalletWizard'

import { contextMenu } from 'services/remote'
import { Routes, MnemonicAction, ErrorCode } from 'utils/const'

const theme = getTheme()

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
  chain: { codeHash = '' },
  settings: { wallets = [] },
  dispatch,
  history,
}: React.PropsWithoutRef<StateWithDispatch & RouteComponentProps>) => {
  const [t] = useTranslation()
  const [target, setTarget] = useState<any>(null)
  const [minerInfo, setMinerInfo] = useState<{ address: string; identifier: string }>({
    address: '',
    identifier: '',
  })

  const [showMinerInfo, hideMinerInfo] = useMemo(
    () => [
      (info: { address: string; identifier: string }) => setMinerInfo(info),
      () => setMinerInfo({ address: '', identifier: '' }),
    ],
    [setMinerInfo]
  )

  const onCopyPubkeyHash = useCallback(() => {
    if (minerInfo) {
      window.navigator.clipboard.writeText(minerInfo.identifier)
      hideMinerInfo()
      addPopup('lock-arg-copied')(dispatch)
    }
  }, [minerInfo, hideMinerInfo, dispatch])

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
                  {wallet.minerAddress ? (
                    <Text
                      variant="tiny"
                      className="ms-ChoiceFieldLabel"
                      onClick={(e: React.MouseEvent<HTMLDivElement>) => {
                        e.preventDefault()
                        setTarget(e.target)
                        if (wallet.minerAddress) {
                          showMinerInfo(wallet.minerAddress)
                        }
                      }}
                      styles={{
                        root: [{ color: theme.semanticColors.bodySubtext, fontSize: '12px!important' }],
                      }}
                    >
                      {t('overview.miner-info')}
                    </Text>
                  ) : null}
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
      <Callout target={target} hidden={!minerInfo.address} onDismiss={hideMinerInfo} gapSpace={0}>
        <Stack tokens={{ padding: 15 }}>
          {minerInfo.address ? (
            <Stack tokens={{ childrenGap: 15 }} styles={{ root: { padding: 5 } }}>
              <Stack tokens={{ childrenGap: 15 }}>
                <Text variant="small" style={{ fontWeight: 600 }}>
                  {t('overview.address')}
                </Text>
                <Text variant="small" className="monospacedFont">
                  {minerInfo.address}
                </Text>
              </Stack>
              <Stack tokens={{ childrenGap: 15 }}>
                <Text variant="small" style={{ fontWeight: 600 }}>
                  {t('overview.code-hash')}
                </Text>
                <Text variant="small" className="monospacedFont">
                  {codeHash}
                </Text>
              </Stack>
              <Stack tokens={{ childrenGap: 15 }}>
                <Text variant="small" style={{ fontWeight: 600 }}>
                  {t('overview.lock-arg')}
                </Text>
                <Text variant="small" className="monospacedFont">
                  {minerInfo.identifier}
                </Text>
              </Stack>
              <Stack horizontalAlign="end">
                <ActionButton iconProps={{ iconName: 'MiniCopy' }} onClick={onCopyPubkeyHash}>
                  {t('overview.copy-pubkey-hash')}
                </ActionButton>
              </Stack>
            </Stack>
          ) : (
            <MessageBar messageBarType={MessageBarType.error}>
              {t(`messages.codes.${ErrorCode.FieldNotFound}`, { fieldName: `default-address` })}
            </MessageBar>
          )}
        </Stack>
      </Callout>
    </Stack>
  )
}

WalletSetting.displayName = 'WalletSetting'

export default WalletSetting
