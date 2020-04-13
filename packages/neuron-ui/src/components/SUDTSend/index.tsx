import React, { useState, useCallback, useReducer, useMemo } from 'react'
import TextField from 'widgets/TextField'
import Breadcrum from 'widgets/Breadcrum'
import Button from 'widgets/Button'
import { verifySUDTAddress, verifySUDTAmount } from 'utils/validators'
import styles from './sUDTSend.module.scss'

enum Fields {
  Address = 'address',
  Amount = 'amount',
  SendAll = 'sendAll',
}

const initState = {
  [Fields.Address]: '',
  [Fields.Amount]: '',
  [Fields.SendAll]: false,
}

const reducer: React.Reducer<typeof initState, { type: Fields; payload: string | boolean }> = (state, action) => {
  switch (action.type) {
    case Fields.Address: {
      return { ...state, [Fields.Address]: action.payload.toString() }
    }
    case Fields.Amount: {
      return { ...state, [Fields.Amount]: action.payload.toString() }
    }
    case Fields.SendAll: {
      return { ...state, [Fields.SendAll]: !!action.payload }
    }
    default: {
      return state
    }
  }
}

const SUDTSend = () => {
  const [sendState, dispatch] = useReducer(reducer, initState)
  const [isSendingAll, setIsSendingAll] = useState(false)
  const breakcrum = [{ label: 'asset account', link: 'asset account' }]
  const fields: { key: Fields.Address | Fields.Amount; label: string }[] = [
    {
      key: Fields.Address,
      label: 'Send to',
    },
    {
      key: Fields.Amount,
      label: 'Amount',
    },
  ]

  const errors = useMemo(
    () => ({
      [Fields.Address]: sendState.address && !verifySUDTAddress(sendState.address) ? 'invalid address' : '',
      [Fields.Amount]: sendState.amount && verifySUDTAmount(sendState.amount) !== true ? 'invalid amount' : '',
    }),
    [sendState]
  )

  const isSendable = Object.values(sendState).every(v => v) && Object.values(errors).every(v => !v)

  const onInput = useCallback(
    e => {
      const {
        dataset: { field },
        value,
      } = e.target as HTMLInputElement
      if (typeof field === 'string' && field in initState) {
        dispatch({
          type: field as Fields,
          payload: value,
        })
      }
    },
    [dispatch]
  )

  const onToggleSendingAll = useCallback(() => {
    setIsSendingAll(all => !all)
  }, [setIsSendingAll])

  const onSubmit = useCallback(
    (e: React.FormEvent) => {
      e.preventDefault()
      e.stopPropagation()
      if (isSendable) {
        window.alert(JSON.stringify(sendState))
      }
    },
    [isSendable]
  )

  return (
    <div className={styles.container}>
      <div className={styles.breadcrum}>
        <Breadcrum pages={breakcrum} />
      </div>
      <div className={styles.title}>Send</div>
      <form onSubmit={onSubmit}>
        <div className={styles.cardContainer} data-is-sending-all={isSendingAll}>
          <div className={styles.info}>
            <div className={styles.avatar}>
              <div className={styles.icon}>C</div>
            </div>
            <div className={styles.accountName}>Account Name</div>
            <div className={styles.tokenName}>Token Name</div>
            <div className={styles.balance}>1.000000000000000</div>
            <div className={styles.symbol}>SYM</div>
          </div>
          <div className="sendContainer">
            {fields.map(field => {
              return (
                <TextField
                  label={field.label}
                  value={sendState[field.key]}
                  key={field.label}
                  required
                  field={field.key}
                  onChange={onInput}
                  suffix={field.key === Fields.Amount && 'SYM'}
                  disabled={isSendingAll}
                  error={errors[field.key]}
                />
              )
            })}
            <Button type="primary" label="Max" onClick={onToggleSendingAll} />
          </div>
        </div>
        <Button type="submit" label="Submit" onClick={onSubmit} disabled={!isSendable} />
      </form>
    </div>
  )
}

SUDTSend.displayName = 'SUDTSend'

export default SUDTSend
