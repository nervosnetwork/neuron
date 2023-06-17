import React, { useState, useCallback, useReducer, useMemo, useRef, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { useLocation, useParams } from 'react-router-dom'
import { useState as useGlobalState, useDispatch, AppActions } from 'states'
import { isMainnet as isMainnetUtil, isSuccessResponse, validateAddress } from 'utils'
import useGetCountDownAndFeeRateStats from 'utils/hooks/useGetCountDownAndFeeRateStats'
import TextField from 'widgets/TextField'
import { generateNFTSendTransaction } from 'services/remote'
import Button from 'widgets/Button'
import { ReactComponent as Attention } from 'widgets/Icons/Attention.svg'
import { isErrorWithI18n } from 'exceptions'
import styles from './NFTSend.module.scss'

enum Fields {
  Address = 'address',
  Description = 'description',
  Send = 'send',
}

const initState = {
  [Fields.Address]: '',
  [Fields.Description]: '',
}

const reducer: React.Reducer<typeof initState, { type: Fields; payload: string }> = (state, action) => {
  switch (action.type) {
    case Fields.Address: {
      return { ...state, [Fields.Address]: action.payload.toString() }
    }
    case Fields.Description: {
      return { ...state, [Fields.Description]: action.payload.toString() }
    }
    default: {
      return state
    }
  }
}

const NFTSend = () => {
  const { nftId } = useParams<{ nftId: string }>()
  const {
    wallet: { id: walletId },
    app: {
      loadings: { sending: isSending = false },
    },
    settings: { networks },
    chain: { networkID },
  } = useGlobalState()
  const [t] = useTranslation()
  const globalDispatch = useDispatch()
  const { suggestFeeRate } = useGetCountDownAndFeeRateStats()
  const timerRef = useRef<NodeJS.Timeout | null>(null)
  const [sendState, dispatch] = useReducer(reducer, initState)
  const [remoteError, setRemoteError] = useState('')

  const onInput = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const {
      dataset: { field },
      value,
    } = e.target as HTMLInputElement
    if (typeof field === 'string' && field in initState) {
      dispatch({ type: field as Fields, payload: value })
      setRemoteError('')
    }
  }, [])

  const isMainnet = isMainnetUtil(networks, networkID)

  const addressError = useMemo(() => {
    if (!sendState.address) {
      return undefined
    }
    try {
      validateAddress(sendState.address, isMainnet)
    } catch (err) {
      if (isErrorWithI18n(err)) {
        return t(err.message, err.i18n)
      }
    }
    return undefined
  }, [t, sendState.address, isMainnet])

  const isFormReady = !!sendState.address.trim() && !addressError && !isSending
  const isSubmittable = isFormReady && !remoteError

  const onSubmit = useCallback(
    (e: React.FormEvent) => {
      e.preventDefault()
      e.stopPropagation()
      if (isSubmittable) {
        globalDispatch({
          type: AppActions.RequestPassword,
          payload: {
            walletID: walletId as string,
            actionType: 'send-nft',
          },
        })
      }
    },
    [isSubmittable, globalDispatch, walletId]
  )

  const location = useLocation()

  const outPoint = location.state?.outPoint

  useEffect(() => {
    const clearTimer = () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current)
      }
    }
    clearTimer()
    if (!isSubmittable || !walletId) {
      return clearTimer
    }
    globalDispatch({ type: AppActions.UpdateExperimentalParams, payload: null })
    const TIMER_DELAY = 300
    timerRef.current = setTimeout(() => {
      const params = {
        walletID: walletId,
        receiveAddress: sendState.address,
        outPoint,
        description: sendState.description,
        feeRate: `${suggestFeeRate}`,
      }

      generateNFTSendTransaction(params)
        .then(res => {
          if (isSuccessResponse(res)) {
            globalDispatch({
              type: AppActions.UpdateExperimentalParams,
              payload: { tx: res.result },
            })
            return
          }
          throw new Error(typeof res.message === 'string' ? res.message : res.message.content)
        })
        .catch((err: Error) => {
          setRemoteError(err.message)
        })
    }, TIMER_DELAY)
    return clearTimer
  }, [isSubmittable, globalDispatch, sendState, walletId, outPoint, suggestFeeRate])

  return (
    <div>
      <div className={styles.title}>{`#${nftId} mNFT`}</div>
      <form onSubmit={onSubmit}>
        <div className={styles.card}>
          <div className={styles.send}>
            <TextField
              label={t('s-udt.send.address')}
              value={sendState.address}
              required
              field={Fields.Address}
              onChange={onInput}
              error={addressError}
            />
            <div className={styles.description}>
              <TextField
                label={t('s-udt.send.description')}
                value={sendState.description}
                field={Fields.Description}
                onChange={onInput}
                placeholder={t('s-udt.send.click-to-edit')}
                className={styles.descriptionField}
              />
            </div>
            <div className={styles.remoteError}>
              {remoteError ? (
                <>
                  <Attention />
                  {remoteError}
                </>
              ) : null}
            </div>
          </div>
        </div>
      </form>
      <div className={styles.footer}>
        <Button type="submit" label={t('s-udt.send.submit')} onClick={onSubmit} disabled={!isSubmittable} />
      </div>
    </div>
  )
}

export default NFTSend
