import React, { useCallback } from 'react'
import { createPortal } from 'react-dom'
import { RouteComponentProps } from 'react-router-dom'
import styled from 'styled-components'

import NetworkStatus from 'components/NetworkStatus'
import { useNeuronWallet } from 'utils/hooks'
import { networksCall } from 'services/UILayer'

const AppHeader = styled.div`
  height: 100%;
  border-bottom: solid 1px #ccc;
  display: flex;
  justify-content: flex-end;
`

const Header = ({ history: { push } }: React.PropsWithoutRef<RouteComponentProps>) => {
  const { settings } = useNeuronWallet()

  const activateNetwork = useCallback(networksCall.activate, [])

  const navTo = useCallback(push, [])

  return (
    <AppHeader>
      <NetworkStatus networks={settings.networks} navTo={navTo} activate={activateNetwork} />
    </AppHeader>
  )
}

const Container: React.SFC<RouteComponentProps<{}>> = props =>
  createPortal(<Header {...props} />, document.querySelector('.header') as HTMLElement)

export default Container
