import React, { useCallback } from 'react'
import { RouteComponentProps } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { Stack, PrimaryButton, ChoiceGroup, IChoiceGroupOption } from 'office-ui-fabric-react'
import actionCreators from 'states/stateProvider/actionCreators'

import { appCalls } from 'services/UILayer'
import { Routes } from 'utils/const'
import { StateWithDispatch } from 'states/stateProvider/reducer'

const onContextMenu = (id: string) => () => {
  appCalls.contextMenu({ type: 'networkList', id })
}

const Networks = ({
  dispatch,
  history,
  chain,
  settings: { networks },
}: React.PropsWithoutRef<StateWithDispatch & RouteComponentProps>) => {
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
              checked: chain.networkID === network.id,
              disabled: chain.networkID === network.id,
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
