import React from 'react'
import styled from 'styled-components'
import { useTranslation } from 'react-i18next'

import Dropdown from '../../widgets/Dropdown'
import { ConnectStatus, Routes } from '../../utils/const'
import { Network } from '../../contexts/NeuronWallet'
import { HeaderActions, actionCreators } from '../../containers/Header/reducer'
import { useNeuronWallet } from '../../utils/hooks'

const Status = styled.div<{ online: boolean }>`
  width: 8px;
  height: 8px;
  border-radius: 50%;
  vertical-align: middle;
  background: currentColor;
  color: ${props => (props.online ? 'green' : 'red')};
`

const FlexDiv = styled.div`
  position: relative;
  display: flex;
  justify-content: space-around;
  height: 100%;
  &:hover {
    & > ul {
      display: flex !important;
    }
  }
`

const Span = styled.span`
  display: flex;
  height: 100%;
  margin-left: 12px;
  align-items: center;
`

const ConnectStatusHeader = ({
  networks,
  navTo,
  dispatch,
}: {
  networks: Network[]
  dispatch: React.Dispatch<{ type: HeaderActions; payload?: any }>
  navTo: Function
}) => {
  const { chain } = useNeuronWallet()
  const [t] = useTranslation()

  const tipNumber = chain.tipBlockNumber === undefined ? undefined : `#${(+chain.tipBlockNumber).toLocaleString()}`
  const networkItems = [
    ...networks.map(network => ({
      label: network.name || network.remote,
      key: network.id,
      onClick: () => {
        dispatch(actionCreators.setNetwork(network.id!))
      },
    })),
    {
      label: t('menuitem.management'),
      key: 'management',
      onClick: () => navTo(Routes.SettingsNetworks),
    },
  ]

  return (
    <>
      <FlexDiv>
        <Span>
          <Status online={chain.connectStatus === ConnectStatus.Online} />
        </Span>
        <Span>{`${(chain.network.name && chain.network.name.slice(0, 30)) || chain.network.remote} - `}</Span>
        {tipNumber === undefined ? null : <Span>{tipNumber}</Span>}
        <Dropdown
          items={networkItems}
          style={{
            position: 'absolute',
            top: '100%',
            left: '0',
            zIndex: '999',
            display: 'none',
          }}
          itemsStyle={{
            textTransform: 'capitalize',
            boxShadow: '0px 1px 3px rgb(120, 120, 120)',
          }}
        />
      </FlexDiv>
    </>
  )
}

export default ConnectStatusHeader
