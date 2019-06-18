import React from 'react'
import styled from 'styled-components'

const GeneralPanel = styled.div`
  display: grid;
  grid-template:
    'balance activity' 1fr
    'blockchain activity' 1fr /
    1fr 1fr;
`
const Balance = styled.div`
  grid-area: balance;
`
const Activity = styled.div`
  grid-area: activity;
`

const Blockchain = styled.div`
  grid-area: blockchain;
`

const General = () => {
  return (
    <GeneralPanel>
      <Balance>
        <h1>Balance</h1>
        <div>Capacity</div>
        <div>Living Cells</div>
        <div>Cell Types</div>
      </Balance>
      <Activity>
        <h1>Activity</h1>
        {Array.from({ length: 5 }, () => (
          <div>Activity Item</div>
        ))}
      </Activity>
      <Blockchain>
        <h1>Blockchain</h1>
        <div>Chain Identity</div>
        <div>Blockchain height</div>
        <div>RPC Service</div>
      </Blockchain>
    </GeneralPanel>
  )
}

General.displayName = 'General'

export default General
