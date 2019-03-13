import React, { useContext } from 'react'
import styled from 'styled-components'

import Dropdown from '../../widgets/Dropdown'
import { NetworkStatus, Routes } from '../../utils/const'
import ChainContext, { Network } from '../../contexts/Chain'
import { HeaderActions, actionCreators } from '../../containers/Header/reducer'

const Status = styled.div`
  width: 8px;
  height: 8px;
  border-radius: 50%;
  vertical-align: middle;
  background: currentColor;
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

const NetworkStatusHeader = ({
  networks,
  navTo,
  dispatch,
}: {
  networks: Network[]
  dispatch: React.Dispatch<{ type: HeaderActions; payload?: any }>
  navTo: Function
}) => {
  const chain = useContext(ChainContext)

  const tipNumber = chain.tipBlockNumber === undefined ? undefined : `#${(+chain.tipBlockNumber).toLocaleString()}`
  const networkItems = [
    ...networks.map(network => ({
      label: network.name || network.remote,
      onClick: () => {
        dispatch(actionCreators.setNetwork(network))
      },
    })),
    {
      label: 'Mangement',
      onClick: () => navTo(Routes.SettingsNetworks),
    },
  ]

  return (
    <>
      <FlexDiv>
        <Span>
          <Status
            style={{
              color: chain.network.status === NetworkStatus.Online ? 'green' : 'red',
            }}
          />
        </Span>
        <Span>{`${(chain.network.name && chain.network.name.slice(0, 30)) || chain.network.remote} - `}</Span>
        {tipNumber === undefined ? null : <Span>{tipNumber}</Span>}
        <Dropdown
          items={networkItems}
          style={{
            top: '100%',
            left: '0',
            zIndex: '999',
            display: 'none',
          }}
        />
      </FlexDiv>
    </>
  )
}

export default NetworkStatusHeader
