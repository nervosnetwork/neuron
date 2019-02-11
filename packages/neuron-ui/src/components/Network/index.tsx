import React, { useContext } from 'react'
import styled from 'styled-components'
import { NETWORK_STATUS } from '../../utils/const'
import ChainContext from '../../contexts/chain'

const Status = styled.div`
  width: 8px;
  height: 8px;
  border-radius: 50%;
  vertical-align: middle;
  transform: translate(-6px, 6px);
  background: currentColor;
`

const FlexDiv = styled.div`
  display: flex;
  width: 100%;
  justify-content: space-around;
  align-items: center;
  height: 30px;
`

const NetworkStatusHeader = () => {
  const chain = useContext(ChainContext)
  return (
    <FlexDiv>
      <Status style={{ color: chain.network.status === NETWORK_STATUS.ONLINE ? 'green' : 'red' }} />
      <span>{chain.network.ip || 'Not Connected'}</span>
      <span>{chain.network.status}</span>
    </FlexDiv>
  )
}

export default NetworkStatusHeader
