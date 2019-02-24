import React, { useContext } from 'react'
import styled from 'styled-components'
import { NetworkStatus } from '../../utils/const'
import ChainContext from '../../contexts/Chain'

const Status = styled.div`
  width: 8px;
  height: 8px;
  border-radius: 50%;
  vertical-align: middle;
  background: currentColor;
`

const FlexDiv = styled.div`
  display: flex;
  justify-content: space-around;
  height: 100%;
  float: right;
`

const Span = styled.span`
  display: flex;
  height: 100%;
  margin-left: 12px;
  align-items: center;
`

const NetworkStatusHeader = () => {
  const chain = useContext(ChainContext)
  return (
    <FlexDiv>
      <Span>
        <Status
          style={{
            color: chain.network.status === NetworkStatus.Online ? 'green' : 'red',
          }}
        />
      </Span>
      <Span>{chain.network.ip}</Span>
      <Span>{chain.network.status}</Span>
      <Span
        style={{
          display: chain.tipBlockNumber ? '' : 'none',
        }}
      >
        {chain.tipBlockNumber || null}
      </Span>
    </FlexDiv>
  )
}

export default NetworkStatusHeader
