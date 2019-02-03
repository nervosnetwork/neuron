import React, { useState, useContext } from 'react'
import styled from 'styled-components'
import IPCContext from '../../contexts/ipc'

const TransferPanel = styled.div`
  display: flex;
  flex-direction: column;
`

const Transfer: React.SFC = () => {
  const ipc = useContext(IPCContext)
  const [addr, setAddr] = useState('')
  const [capacity, setCapacity] = useState('')
  return (
    <TransferPanel>
      <input
        type="text"
        value={addr}
        onChange={({ target: { value } }) => {
          setAddr(value)
        }}
      />
      <input
        type="number"
        value={capacity}
        onChange={({ target: { value } }) => {
          setCapacity(`${value}`)
        }}
      />
      <button type="submit" onClick={() => ipc.sendCapacity(addr, capacity)}>
        Submit
      </button>
    </TransferPanel>
  )
}

export default Transfer
