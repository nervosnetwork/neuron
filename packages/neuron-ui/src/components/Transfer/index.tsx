import React, { useReducer } from 'react'
import styled from 'styled-components'

import ipc from '../../utils/ipc'

const TransferPanel = styled.div`
  display: flex;
  flex-direction: column;
`

enum TransferActionTypes {
  Address,
  Capacity,
  Submit,
}

interface ITransfer {
  address: string
  capacity: number
  submitting: boolean
}

const reducer = (
  state: ITransfer,
  action: { type: TransferActionTypes; value?: any },
) => {
  switch (action.type) {
    case TransferActionTypes.Address: {
      return { ...state, address: action.value }
    }
    case TransferActionTypes.Capacity: {
      return { ...state, capacity: action.value }
    }
    case TransferActionTypes.Submit: {
      return { ...state, submitting: true }
    }
    default: {
      return state
    }
  }
}

const initState: ITransfer = {
  address: '',
  capacity: 0,
  submitting: false,
}

function isMouseEvent(
  e: React.ChangeEvent | React.MouseEvent,
): e is React.MouseEvent {
  return e.type === 'click'
}

const Transfer = () => {
  const [state, dispatch] = useReducer(reducer, initState)
  const handleAction = (type: TransferActionTypes) => (
    e:
      | React.ChangeEvent<HTMLInputElement>
      | React.MouseEvent<HTMLButtonElement>,
  ) => {
    if (type === TransferActionTypes.Submit) {
      ipc.sendCapacity(state.address, state.capacity.toString(16))
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
      <input
        type="text"
        value={state.address || ''}
        onChange={handleAction(TransferActionTypes.Address)}
      />
      <input
        type="number"
        value={state.capacity || 0}
        onChange={handleAction(TransferActionTypes.Capacity)}
      />
      <button type="submit" onClick={handleAction(TransferActionTypes.Submit)}>
        Submit
      </button>
    </TransferPanel>
  )
}

export default Transfer
