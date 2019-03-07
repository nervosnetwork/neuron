import React, { useReducer } from 'react'
import { Container, Card, Form, Button } from 'react-bootstrap'

import InlineInput from '../../widgets/InlineInput'
import { sendCapacity } from '../../services/UILayer'

enum PlaceHolder {
  Address = 'eg: 0x0da2fe99fe549e082d4ed483c2e968a89ea8d11aabf5d79e5cbf06522de6e674',
  Capacity = 'eg: 100',
  Fee = 'eg: 100',
}
enum TooltipText {
  Address = 'Address to send capacity',
  Capacity = 'Capacity to send',
  Fee = 'Transaction Fee in this transaction',
}

enum TransferActionTypes {
  Address,
  Capacity,
  Fee,
  Submit,
}

interface Transfer {
  address: string
  capacity: number
  fee: number
  submitting: boolean
}

const reducer = (state: Transfer, action: { type: TransferActionTypes; payload?: any }) => {
  switch (action.type) {
    case TransferActionTypes.Address: {
      return {
        ...state,
        address: action.payload,
      }
    }
    case TransferActionTypes.Capacity: {
      return {
        ...state,
        capacity: action.payload,
      }
    }
    case TransferActionTypes.Fee: {
      return {
        ...state,
        fee: action.payload,
      }
    }
    case TransferActionTypes.Submit: {
      return {
        ...state,
        submitting: true,
      }
    }
    default: {
      return state
    }
  }
}

const initState: Transfer = {
  address: '',
  capacity: 0,
  fee: 0,
  submitting: false,
}

function isMouseEvent(e: React.ChangeEvent | React.MouseEvent): e is React.MouseEvent {
  return e.type === 'click'
}

interface InputProps {
  label: string
  value: string
  onChange: (event: React.FormEvent<React.PropsWithoutRef<any>>) => void
  tooltip?: string
  placeholder?: string
}

const Transfer = () => {
  const [state, dispatch] = useReducer(reducer, initState)
  const handleAction = (type: TransferActionTypes) => (
    e: any,
    // & React.ChangeEvent<HTMLInputElement>
    // | React.MouseEvent<HTMLButtonElement>,
  ) => {
    if (type === TransferActionTypes.Submit) {
      sendCapacity(state.address, state.capacity.toString(16))
    }
    if (isMouseEvent(e)) {
      dispatch({
        type,
      })
    } else {
      dispatch({
        type,
        payload: e.target.value ? e.target.value : '',
      })
    }
  }

  const inputs: InputProps[] = [
    {
      label: 'address',
      value: state.address,
      onChange: handleAction(TransferActionTypes.Address),
      tooltip: TooltipText.Address,
      placeholder: PlaceHolder.Address,
    },
    {
      label: 'capacity',
      value: state.capacity,
      onChange: handleAction(TransferActionTypes.Capacity),
      tooltip: TooltipText.Capacity,
      placeholder: PlaceHolder.Capacity,
    },
    {
      label: 'transaction fee',
      value: state.fee,
      onChange: handleAction(TransferActionTypes.Fee),
      tooltip: TooltipText.Fee,
      placeholder: PlaceHolder.Fee,
    },
  ]

  return (
    <Container>
      <Card>
        <Card.Header>Send Capcity</Card.Header>
        <Card.Body>
          <Form>
            {inputs.map(inputProps => (
              <InlineInput {...inputProps} key={inputProps.label} />
            ))}
          </Form>
          <Button type="submit" variant="primary" size="lg" block onClick={handleAction(TransferActionTypes.Submit)}>
            Send
          </Button>
        </Card.Body>
      </Card>
    </Container>
  )
}

export default Transfer
