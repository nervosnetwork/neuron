import React, { useState } from 'react'
import styled from 'styled-components'

const TransferPanel = styled.div`
  display: flex;
  flex-direction: column;
`

const Transfer: React.SFC = () => {
  const [addr, setAddr] = useState('')
  const [amount, setAmount] = useState('')
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
        value={amount}
        onChange={({ target: { value } }) => {
          setAmount(`${value}`)
        }}
      />
      <button type="submit">Submit</button>
    </TransferPanel>
  )
}

export default Transfer
