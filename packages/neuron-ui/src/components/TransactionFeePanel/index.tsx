import React from 'react'
import styled from 'styled-components'
import { CaretDown as DownIcon } from 'grommet-icons'

const Panel = styled.div``
const PanelHeader = styled.div`
  display: flex;
  justify-content: space-between;
`
const PanelBody = styled.div`
  display: grid;
  grid-template:
    'price cycles' 1fr
    'speed cycles' 1fr /
    250px auto;
`

const Price = styled.div`
  grid-area: price;
  display: flex;
  align-items: center;
`

const Speed = styled.div`
  grid-area: speed;
  display: flex;
`

const Cycles = styled.div`
  grid-area: cycles;
  display: flex;
`

interface TransactionFee {
  fee: string
  cycles: string
  price: string
  onPriceChange: any
}

const TransactionFee: React.FunctionComponent<TransactionFee> = ({
  cycles,
  price,
  fee,
  onPriceChange,
}: TransactionFee) => (
  <Panel>
    <PanelHeader>
      <span>
        Transaction Fee:
        {fee}
      </span>
      <DownIcon />
    </PanelHeader>
    <PanelBody>
      <Price>
        Price:
        <input value={price} type="string" onChange={onPriceChange} />
      </Price>
      <Speed>
        Expected Speed:
        <select>
          <option value="0">immediately</option>
          <option value="30">~ 30s</option>
          <option value="60">~ 1min</option>
          <option value="180">~ 3min</option>
        </select>
      </Speed>
      <Cycles>
        Total RISC-V Cycles:
        {cycles}
      </Cycles>
    </PanelBody>
  </Panel>
)

TransactionFee.displayName = 'TransactionFee'

export default TransactionFee
