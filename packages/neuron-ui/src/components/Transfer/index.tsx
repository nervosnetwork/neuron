import React, { useReducer } from 'react'
import styled from 'styled-components'

import ipc from '../../utils/ipc'

const TransferPanel = styled.div`
  display: flex;
  flex-direction: column;
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
      <input type="text" value={state.addr || ''} onChange={handleAction(TRANSFER_ACTION_TYPES.ADDR)} />
      <input type="number" value={state.capacity || 0} onChange={handleAction(TRANSFER_ACTION_TYPES.CAPACITY)} />
      <button type="submit" onClick={handleAction(TRANSFER_ACTION_TYPES.SUBMIT)}>
        Submit
      </button>
    </TransferPanel>
  )
}

export default Transfer
