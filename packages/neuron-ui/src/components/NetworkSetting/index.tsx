import React, { useCallback } from 'react'
import { RouteComponentProps } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { Stack, PrimaryButton, ChoiceGroup, IChoiceGroupOption } from 'office-ui-fabric-react'

import { ContentProps } from 'containers/MainContent'
import { actionCreators } from 'containers/MainContent/reducer'

import { appCalls } from 'services/UILayer'
import { Routes } from 'utils/const'
import { useNeuronWallet } from 'utils/hooks'

const onContextMenu = (id: string) => () => {
  appCalls.contextMenu({ type: 'networkList', id })
}

const Networks = ({ dispatch, history }: React.PropsWithoutRef<ContentProps & RouteComponentProps>) => {
  const {
    chain,
    settings: { networks },
  } = useNeuronWallet()
  const [t] = useTranslation()

  const onChoiceChange = useCallback(
    (_e, option?: IChoiceGroupOption) => {
      if (option) {
        dispatch(actionCreators.setNetwork(option.key))
      }
    },
    [dispatch]
  )

  return (
    <Stack tokens={{ childrenGap: 15 }}>
      <Stack.Item>
        <ChoiceGroup
          options={networks.map(
            (network): IChoiceGroupOption => ({
              key: network.id,
              text: network.name,
              checked: chain.networkId === network.id,
              disabled: chain.networkId === network.id,
              onRenderLabel: ({ text }: IChoiceGroupOption) => {
                return (
                  <span className="ms-ChoiceFieldLabel" onContextMenu={onContextMenu(network.id)}>
                    {text}
                  </span>
                )
              },
            })
          )}
          onChange={onChoiceChange}
        />
      </Stack.Item>
      <Stack.Item>
        <PrimaryButton
          text={t('settings.network.add-network')}
          onClick={() => history.push(`${Routes.NetworkEditor}/new`)}
          ariaDescription="Create new network configuration"
        />
      </Stack.Item>
    </Stack>
  )
}

export default Networks
