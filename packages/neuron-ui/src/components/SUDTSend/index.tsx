import React, { useState, useCallback, useReducer, useMemo, useEffect } from 'react'
import { useHistory, useParams } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import TextField from 'widgets/TextField'
import Breadcrum from 'widgets/Breadcrum'
import Button from 'widgets/Button'
import { verifySUDTAddress, verifySUDTAmount } from 'utils/validators'
import TransactionFeePanel from 'components/TransactionFeePanel'
import { shannonToCKBFormatter, localNumberFormatter } from 'utils/formatters'
import { INIT_SEND_PRICE, Routes } from 'utils/const'
import { generateSUDTTransaction, generateSendAllSUDTTransaction, sendSUDTTransaction } from 'services/remote'
import styles from './sUDTSend.module.scss'

enum Fields {
  Address = 'address',
  Amount = 'amount',
  Price = 'price',
  Description = 'description',
  Password = 'password',
  SendAll = 'sendAll',
  Generated = 'generated',
}

const initState = {
  [Fields.Address]: '',
  [Fields.Amount]: '',
  [Fields.Price]: INIT_SEND_PRICE,
  [Fields.SendAll]: false,
  [Fields.Description]: '',
  [Fields.Generated]: '',
  [Fields.Password]: '',
}

const reducer: React.Reducer<typeof initState, { type: Fields; payload: string | boolean }> = (state, action) => {
  switch (action.type) {
    case Fields.Password: {
      return { ...state, [Fields.Password]: action.payload.toString() }
    }
    case Fields.Address: {
      return { ...state, [Fields.Address]: action.payload.toString(), generated: '', password: '' }
    }
    case Fields.Amount: {
      return { ...state, [Fields.Amount]: action.payload.toString(), generated: '', password: '' }
    }
    case Fields.SendAll: {
      return { ...state, [Fields.SendAll]: !!action.payload, generated: '', password: '' }
    }
    case Fields.Price: {
      return { ...state, [Fields.Price]: action.payload.toString(), generated: '', password: '' }
    }
    case Fields.Generated: {
      return { ...state, generated: action.payload.toString() }
    }
    default: {
      return state
    }
  }
}

const SUDTSend = () => {
  const history = useHistory()
  const [t] = useTranslation()
  const { accountId } = useParams<{ accountId: string }>()
  const [sendState, dispatch] = useReducer(reducer, initState)
  const [isPwdDialogOpen, setisPwdDialogOpen] = useState(false)
  const [passwordError, setPasswordError] = useState('')
  const [isSending, setIsSending] = useState(false)

  useEffect(() => {
    if (accountId) {
      console.info(`Fetching info of account id`)
    }
  }, [accountId])

  const breakcrum = [{ label: t('navbar.s-udt'), link: Routes.SUDTAccountList }]
  const fields: { key: Fields.Address | Fields.Amount; label: string }[] = [
    { key: Fields.Address, label: 'Send to' },
    { key: Fields.Amount, label: 'Amount' },
  ]

  const errors: { [Fields.Address]: string; [Fields.Amount]: string } = useMemo(
    () => ({
      address: sendState.address && !verifySUDTAddress(sendState.address) ? 'invalid address' : '',
      amount: sendState.amount && verifySUDTAmount(sendState.amount) !== true ? 'invalid amount' : '',
    }),
    [sendState]
  )

  // isSubmittable => ready for password
  const isSubmittable = !isSending && [Fields.Address, Fields.Amount, Fields.Generated].every(key => sendState[key])
  Object.values(errors).every(v => !v)

  // isSendable => ready for sending to CKB
  const isSendable = !isSending && sendState.password && sendState.generated

  useEffect(() => {
    const params = {
      walletID: 'id',
      address: sendState.address,
      amount: sendState.amount,
      feeRate: '100',
      description: sendState.description,
    }
    const generator = sendState.sendAll ? generateSendAllSUDTTransaction : generateSUDTTransaction
    generator(params)
      .then(res => {
        if (res.status === 1) {
          dispatch({ type: Fields.Generated, payload: res.result })
          // TODO: set the fee
        }
      })
      .catch((err: Error) => {
        // mock
        dispatch({ type: Fields.Generated, payload: JSON.stringify(params) })
        console.error(err)
      })
  }, [sendState.address, sendState.amount, sendState.description, sendState.sendAll, dispatch])

  const onInput = useCallback(
    e => {
      const {
        dataset: { field },
        value,
      } = e.target as HTMLInputElement
      if (typeof field === 'string' && field in initState) {
        dispatch({ type: field as Fields, payload: value })
      }
      if (field === Fields.Password) {
        setPasswordError('')
      }
    },
    [dispatch]
  )

  const onToggleSendingAll = useCallback(() => {
    dispatch({ type: Fields.SendAll, payload: !sendState.sendAll })
  }, [dispatch, sendState.sendAll])

  const onPriceChange = useCallback(
    (e: React.SyntheticEvent<HTMLInputElement>) => {
      const { value } = e.target as HTMLInputElement
      const price = value.split('.')[0].replace(/[^\d]/, '')
      dispatch({ type: Fields.Price, payload: price })
    },
    [dispatch]
  )

  const onSubmit = useCallback(
    (e: React.FormEvent) => {
      e.preventDefault()
      e.stopPropagation()
      if (isSubmittable) {
        window.alert(JSON.stringify(sendState))
        setisPwdDialogOpen(true)
      }
    },
    [isSubmittable, sendState, setisPwdDialogOpen]
  )

  const onDismissPassword = useCallback(() => {
    setisPwdDialogOpen(false)
    setPasswordError('')
    dispatch({ type: Fields.Password, payload: '' })
  }, [dispatch, setisPwdDialogOpen])

  const onSend = useCallback(
    (e: React.SyntheticEvent<HTMLFormElement>) => {
      e.preventDefault()
      e.stopPropagation()
      if (isSendable) {
        setIsSending(true)

        sendSUDTTransaction({ walletID: 'id', tx: sendState.generated, password: sendState.password })
          .then(res => {
            if (res.status === 1) {
              onDismissPassword()
              history.push(Routes.History)
            } else {
              // TODO: error handler
            }
          })
          .catch((err: Error) => {
            // mock
            setPasswordError('password error')

            console.error(err)
          })
          .finally(() => {
            setIsSending(false)
          })
      }
    },
    [sendState.generated, sendState.password, isSendable, onDismissPassword, setIsSending, history]
  )

  return (
    <div>
      <div className={styles.breadcrum}>
        <Breadcrum pages={breakcrum} />
      </div>
      <div className={styles.title}>Send</div>
      <form onSubmit={onSubmit}>
        <div className={styles.cardContainer}>
          <div className={styles.info}>
            <div className={styles.avatar}>
              <div className={styles.icon}>C</div>
            </div>
            <div className={styles.accountName}>Account Name</div>
            <div className={styles.tokenName}>Token Name</div>
            <div className={styles.balance}>{localNumberFormatter('11111111111111111111.000000000000000')}</div>
            <div className={styles.symbol}>SYM</div>
          </div>
          <div className={styles.sendContainer}>
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
                  disabled={sendState.sendAll}
                  error={errors[field.key]}
                  className={styles[field.key]}
                />
              )
            })}
            <div className={styles.sendAll}>
              <Button type="primary" label="Max" onClick={onToggleSendingAll} disabled={!sendState.address} />
            </div>
            <div className={styles.fee}>
              <TransactionFeePanel
                fee={shannonToCKBFormatter('100')}
                price={sendState.price}
                onPriceChange={onPriceChange}
              />
            </div>
            <div className={styles.description}>
              <TextField
                label="Description"
                value={sendState.description}
                field={Fields.Description}
                onChange={onInput}
                placeholder="Click to edit"
                className={styles.descriptionField}
              />
            </div>
          </div>
        </div>
        <div className={styles.footer}>
          <Button type="submit" label="Submit" onClick={onSubmit} disabled={!isSubmittable} />
        </div>
      </form>
      <div className={styles.modal} hidden={!isPwdDialogOpen}>
        <div className={styles.passwordDialog}>
          <h2>Sending Symbol</h2>
          <form onSubmit={onSend}>
            <TextField
              label="password"
              field={Fields.Password}
              value={sendState.password}
              onChange={onInput}
              error={passwordError}
            />
            <div className={styles.dialogFooter}>
              <Button type="cancel" label="cancel" onClick={onDismissPassword} />
              <Button type="submit" label="confirm" onClick={onSend} disabled={!isSendable} />
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}

SUDTSend.displayName = 'SUDTSend'

export default SUDTSend
