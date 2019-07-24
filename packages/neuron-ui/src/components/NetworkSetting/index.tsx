import React, { useCallback } from 'react'
import { RouteComponentProps } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { Stack, PrimaryButton, ChoiceGroup, IChoiceGroupOption } from 'office-ui-fabric-react'

import { StateWithDispatch } from 'states/stateProvider/reducer'
import chainState from 'states/initStates/chain'
import { appCalls } from 'services/UILayer'
import { setCurrentNetowrk } from 'services/remote'

import { Routes } from 'utils/const'

const onContextMenu = (id: string = '') => () => {
  appCalls.contextMenu({ type: 'networkList', id })
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
