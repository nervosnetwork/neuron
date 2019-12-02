import React, { useCallback } from 'react'
import { RouteComponentProps } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { Stack, Text, PrimaryButton, ChoiceGroup, IChoiceGroupOption } from 'office-ui-fabric-react'

import { StateWithDispatch } from 'states/stateProvider/reducer'
import chainState from 'states/initStates/chain'
import { setCurrentNetowrk, openContextMenu, deleteNetwork } from 'services/remote'

import { Routes } from 'utils/const'

const Label = ({ type, t }: { type: 'ckb' | 'ckb_testnet' | 'ckb_dev' | string; t: any }) => {
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

const NetworkSetting = ({
  chain = chainState,
  settings: { networks = [] },
  history,
}: React.PropsWithoutRef<StateWithDispatch & RouteComponentProps>) => {
  const [t] = useTranslation()

  const onChoiceChange = useCallback((_e, option?: IChoiceGroupOption) => {
    if (option) {
      setCurrentNetowrk(option.key)
    }
  }, [])

  const goToCreateNetwork = useCallback(() => {
    history.push(`${Routes.NetworkEditor}/new`)
  }, [history])

  const onContextMenu = useCallback(
    (e: React.MouseEvent<HTMLElement, MouseEvent>) => {
      const { networkId } = (e.target as HTMLElement).dataset
      const item = networks.find(n => n.id === networkId)
      if (item) {
        const isCurrent = item.id === chain.networkID
        const isDefault = item.type === 0
        const menuTemplate = [
          {
            label: t('common.select'),
            enabled: !isCurrent,
            click: () => {
              setCurrentNetowrk(item.id)
            },
          },
          {
            label: t('common.edit'),
            enabled: !isDefault,
            click: () => {
              history.push(`${Routes.NetworkEditor}/${item.id}`)
            },
          },
          {
            label: t('common.delete'),
            enabled: !isDefault,
            click: () => {
              deleteNetwork(item.id)
            },
          },
        ]
        openContextMenu(menuTemplate)
      }
    },
    [chain.networkID, networks, history, t]
  )

  return (
    <Stack tokens={{ childrenGap: 15 }}>
      <Stack.Item>
        <ChoiceGroup
          options={networks.map(
            (network): IChoiceGroupOption => ({
              key: network.id,
              text: network.name,
              checked: chain.networkID === network.id,
              onRenderLabel: ({ text }: IChoiceGroupOption) => {
                return (
                  <Stack
                    horizontal
                    tokens={{ childrenGap: 5 }}
                    data-network-id={network.id}
                    onContextMenu={onContextMenu}
                    title={`${text}: ${network.remote}`}
                  >
                    <Text as="span" className="ms-ChoiceFieldLabel" style={{ pointerEvents: 'none' }}>
                      {text}
                    </Text>
                    <Text as="span" style={{ color: '#999', pointerEvents: 'none' }}>
                      {`(${network.remote})`}
                    </Text>
                    <Label type={network.chain} t={t} />
                  </Stack>
                )
              },
            })
          )}
          onChange={onChoiceChange}
        />
      </Stack.Item>
      <Stack horizontal horizontalAlign="start" tokens={{ childrenGap: 20 }}>
        <PrimaryButton
          text={t('settings.network.add-network')}
          onClick={goToCreateNetwork}
          ariaDescription="Create new network configuration"
        />
      </Stack>
    </Stack>
  )
}

NetworkSetting.displayName = 'NetworkSetting'

export default NetworkSetting
