import React, { useReducer } from 'react'
import styled from 'styled-components'
import { RangeInput } from 'grommet'

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
    width: 640px;
  }
`

const SendButton = styled.button`
  height: 30px;
  font-size: 18px;
  margin: 30px 0 0 160px;
  width: 300px;
`

const RangeLayout = styled.div`
  display: flex;
  flex-direction: column;
  width: 600px;
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

interface Transfer {
  addr: string
  capacity: number
  fee: number
  submitting: boolean
}

const reducer = (state: Transfer, action: { type: TRANSFER_ACTION_TYPES; value?: any }) => {
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

const initState: Transfer = {
  addr: '',
  capacity: 0,
  fee: 0,
  submitting: false,
}

function isMouseEvent(e: React.ChangeEvent | React.MouseEvent): e is React.MouseEvent {
  return e.type === 'click'
}

const Transfer = () => {
  const [state, dispatch] = useReducer(reducer, initState)
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
          defaultValue={state.addr || ''}
          placeholder="eg: 0x0da2fe99fe549e082d4ed483c2e968a89ea8d11aabf5d79e5cbf06522de6e674"
          onChange={() => {
            handleAction(TRANSFER_ACTION_TYPES.ADDR)
          }}
        />
      </InputDiv>
      <InputDiv>
        <div>Capacity: </div>
        <input
          type="text"
          defaultValue={state.capacity || ''}
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
          defaultValue={state.fee.toString()}
          min={0}
          max={100}
          step={1}
          onChange={(event: any) => {
            state.fee = event.target.value
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
