import React, { useMemo } from 'react'
import styled from 'styled-components'
import { useTranslation } from 'react-i18next'
import { FormSubtract as HyphenIcon } from 'grommet-icons'

import Dropdown from 'widgets/Dropdown'
import { ConnectStatus, Routes } from 'utils/const'
import { Network } from 'contexts/NeuronWallet'
import { useNeuronWallet } from 'utils/hooks'

const Container = styled.div`
  position: relative;
  display: flex;
  justify-content: space-around;
  align-items: center;
  height: 100%;
  padding: 0 15px;
  &:hover {
    & > ul {
      display: flex !important;
    }
  }
`

const CurrentNetwork = styled.div<{ online: boolean }>`
  position: relative;
  display: flex;
  align-items: center;
  &:before {
    display: block;
    content: '';
    border-radius: 50%;
    width: 10px;
    height: 10px;
    color: ${props => (props.online ? 'green' : 'red')};
    background-color: currentColor;
    margin-right: 15px;
    filter: drop-shadow(0 0 1px currentColor);
  }
`

const ConnectStatusHeader = ({
  networks,
  navTo,
  activate,
}: {
  networks: Network[]
  activate: (id: string) => void
  navTo: Function
}) => {
  const { chain } = useNeuronWallet()
  const [t] = useTranslation()

  const tipNumber = chain.tipBlockNumber === undefined ? null : `#${(+chain.tipBlockNumber).toLocaleString()}`
  const networkItems = [
    ...networks.map(network => ({
      label: network.name || network.remote,
      key: network.id,
      onClick: () => {
        activate(network.id)
      },
    })),
    {
      label: t('menuitem.management'),
      key: 'management',
      onClick: () => navTo(Routes.SettingsNetworks),
    },
  ]
  const activeNetwork = useMemo(() => networks.find(network => network.id === chain.networkId), [
    networks,
    chain.networkId,
  ])

  return (
    <Container>
      {activeNetwork ? (
        <>
          <CurrentNetwork online={chain.connectStatus === ConnectStatus.Online}>
            {`${(activeNetwork.name && activeNetwork.name.slice(0, 30)) || activeNetwork.remote}`}
          </CurrentNetwork>
          <Dropdown
            items={networkItems}
            selected={networkItems.findIndex(network => network.label === activeNetwork.name)}
            style={{
              position: 'absolute',
              top: '100%',
              left: tipNumber === null ? 'auto' : '0',
              right: tipNumber === null ? '0' : 'auto',
              zIndex: '999',
              display: 'none',
              maxHeight: '50vh',
              overflowY: 'scroll',
              border: '1px solid #ddd',
            }}
            itemsStyle={{
              textTransform: 'capitalize',
              boxShadow: '0px 0px 1px rgba(120, 120, 120, 0.5)',
              maxWidth: '200px',
              minHeight: '48px',
            }}
          />
        </>
      ) : null}
      {tipNumber === null ? null : (
        <>
          <HyphenIcon />
          {tipNumber}
        </>
      )}
    </Container>
  )
}

export default ConnectStatusHeader
