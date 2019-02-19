import React, { useReducer, useContext } from 'react'
import styled from 'styled-components'
import { RangeInput } from 'grommet'
import TransferContext from '../../contexts/transfer'

import ipc from '../../utils/ipc'

const TransferPanel = styled.div`
  display: flex;
  flex-direction: column;
`

const InputDiv = styled.div`
  div {
    margin-top: 20px;
  }

  input {
    height: 30px;
    line-height: 30px;
    font-size: 16px;
    margin-top: 10px;
    padding-left: 5px;
    width: 600px;
  }
`

const SendButton = styled.button`
  height: 30px;
  font-size: 18px;
  margin: 30px 0 0 150px;
  width: 300px;
`

const RangeLayout = styled.div`
  display: flex;
  flex-direction: column;
  width: 500px;
  margin-top: 30px;

  div {
    margin-bottom: 15px;
  }
`

enum TRANSFER_ACTION_TYPES {
  ADDR,
  CAPACITY,
  SUBMIT,
}

interface ITransfer {
  addr: string
  capacity: number
  submitting: boolean
}

const reducer = (state: ITransfer, action: { type: TRANSFER_ACTION_TYPES; value?: any }) => {
  switch (action.type) {
    case TRANSFER_ACTION_TYPES.ADDR: {
      return { ...state, addr: action.value }
    }
    case TRANSFER_ACTION_TYPES.CAPACITY: {
      return { ...state, capacity: action.value }
    }
    case TRANSFER_ACTION_TYPES.SUBMIT: {
      return { ...state, submitting: true }
    }
    default: {
      return state
    }
  }
}

const initState: ITransfer = {
  addr: '',
  capacity: 0,
  submitting: false,
}

function isMouseEvent(e: React.ChangeEvent | React.MouseEvent): e is React.MouseEvent {
  return e.type === 'click'
}

const Transfer = () => {
  const [state, dispatch] = useReducer(reducer, initState)
  const transferContext = useContext(TransferContext)
  const handleAction = (type: TRANSFER_ACTION_TYPES) => (
    e: React.ChangeEvent<HTMLInputElement> | React.MouseEvent<HTMLButtonElement>,
  ) => {
    if (type === TRANSFER_ACTION_TYPES.SUBMIT) {
      ipc.sendCapacity(state.addr, state.capacity.toString(16))
    }
    if (isMouseEvent(e)) {
      dispatch({ type })
    } else {
      dispatch({ type, value: e.target.value ? e.target.value : '' })
    }
  }

  return (
    <TransferPanel>
      <h1>Send</h1>
      <div>From: your current wallet address</div>
      <InputDiv>
        <div>To: </div>
        <input
          type="text"
          value={state.addr || ''}
          placeholder="eg: 0xcf078d66b3614C4c32B018ceF9100A39FaE7DC0D"
          onChange={() => {
            handleAction(TRANSFER_ACTION_TYPES.ADDR)
          }}
        />
      </InputDiv>
      <InputDiv>
        <div>Capacity: </div>
        <input
          type="text"
          value={state.capacity || ''}
          placeholder="eg: 100"
          onChange={() => {
            handleAction(TRANSFER_ACTION_TYPES.CAPACITY)
          }}
        />
      </InputDiv>
      <RangeLayout>
        <div>Transfer Fee: </div>
        <RangeInput
          type="text"
          defaultValue={transferContext.fee.toString()}
          min={0}
          max={100}
          step={1}
          onChange={(event: any) => {
            transferContext.fee = event.target.value
          }}
        />
      </RangeLayout>
      <SendButton type="submit" onClick={handleAction(TRANSFER_ACTION_TYPES.SUBMIT)}>
        Send
      </SendButton>
    </TransferPanel>
  )
}

export default Transfer
