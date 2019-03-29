import React, { useContext } from 'react'
import styled from 'styled-components'
import { useTranslation } from 'react-i18next'

import Dropdown from '../../widgets/Dropdown'
import { NetworkStatus, Routes } from '../../utils/const'
import ChainContext, { Network } from '../../contexts/Chain'
import { HeaderActions, actionCreators } from '../../containers/Header/reducer'

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

const NetworkStatusHeader = ({
  networks,
  navTo,
  dispatch,
}: {
  networks: Network[]
  dispatch: React.Dispatch<{ type: HeaderActions; payload?: any }>
  navTo: Function
}) => {
  const [t] = useTranslation()
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
      label: t('menuitem.management'),
      onClick: () => navTo(Routes.SettingsNetworks),
    },
  ]

  return (
    <>
      <FlexDiv>
        <Span>
          <Status online={chain.network.status === NetworkStatus.Online} />
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

export default NetworkStatusHeader
