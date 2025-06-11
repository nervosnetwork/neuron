import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { openExternal } from 'services/remote'
import { getExplorerUrl, localNumberFormatter } from 'utils'
import Dialog from 'widgets/Dialog'
import { Attention, NewTab } from 'widgets/Icons/icon'
import TextField from 'widgets/TextField'
import Alert from 'widgets/Alert'
import styles from './setStartBlockNumberDialog.module.scss'

const SET_START_BLOCK_COUNTDOWN_SECOND = 5

const useCountDown = (second: number) => {
  const [countdown, setCountdown] = useState(0)
  const countDecreaseIntervalRef = useRef<ReturnType<typeof setInterval>>()
  const resetCountDown = useCallback(() => {
    clearInterval(countDecreaseIntervalRef.current)
    setCountdown(second)
    const decrement = () => {
      countDecreaseIntervalRef.current = setInterval(() => {
        setCountdown(v => {
          if (v > 0) {
            return v - 1
          }
          clearInterval(countDecreaseIntervalRef.current)
          return v
        })
      }, 1_000)
    }
    decrement()
  }, [setCountdown, countDecreaseIntervalRef])
  return {
    countdown,
    resetCountDown,
  }
}

const SetStartBlockNumberDialog = ({
  initStartBlockNumber,
  headerTipNumber,
  isMainnet,
  address,
  onUpdateStartBlockNumber,
  onCancel,
  show,
}: {
  initStartBlockNumber?: number
  headerTipNumber: number
  isMainnet: boolean
  address: string
  onUpdateStartBlockNumber: (blockNumber: number) => Promise<void>
  onCancel: () => void
  show: boolean
}) => {
  const [t] = useTranslation()
  const [startBlockNumber, setStartBlockNumber] = useState<number | undefined>(undefined)
  const [blockNumberErr, setBlockNumberErr] = useState('')
  const isSetLessThanBefore = useMemo(
    () =>
      startBlockNumber !== undefined && initStartBlockNumber !== undefined && startBlockNumber < initStartBlockNumber,
    [initStartBlockNumber, startBlockNumber]
  )
  const { countdown, resetCountDown } = useCountDown(SET_START_BLOCK_COUNTDOWN_SECOND)
  const onChangeStartBlockNumber = useCallback(
    (e: React.SyntheticEvent<HTMLInputElement>) => {
      const { value } = e.currentTarget
      const blockNumber = value.replaceAll(',', '')
      if (Number.isNaN(+blockNumber)) {
        return
      }
      setStartBlockNumber(
        // eslint-disable-next-line no-nested-ternary
        +blockNumber > headerTipNumber ? headerTipNumber : blockNumber === '' ? undefined : +blockNumber
      )
      setBlockNumberErr(+blockNumber > headerTipNumber ? t('set-start-block-number.reset-to-header-tip-number') : '')
      resetCountDown()
    },
    [resetCountDown, headerTipNumber, t]
  )
  const onOpenAddressInExplorer = useCallback(() => {
    const explorerUrl = getExplorerUrl(isMainnet)
    openExternal(`${explorerUrl}/address/${address}?sort=time`)
  }, [address, isMainnet])
  const onConfirm = useCallback(() => {
    if (startBlockNumber !== undefined) {
      onUpdateStartBlockNumber(startBlockNumber).catch(res => {
        setBlockNumberErr(typeof res.message === 'string' ? res.message : res.message.content!)
      })
    }
  }, [startBlockNumber])
  useEffect(() => {
    if (show) {
      setStartBlockNumber(initStartBlockNumber)
      resetCountDown()
    }
  }, [show, initStartBlockNumber, setStartBlockNumber, resetCountDown])
  return (
    <Dialog
      title={t('set-start-block-number.title')}
      confirmText={countdown ? `${t('common.confirm')} (${countdown})` : t('common.confirm')}
      show={show}
      onCancel={onCancel}
      showCancel={false}
      onConfirm={onConfirm}
      disabled={!startBlockNumber || !!countdown}
      contentClassName={styles.setBlockContent}
    >
      <div className={styles.setBlockWarn}>
        <Attention />
        {t('set-start-block-number.warn')}
      </div>
      <div className={styles.content}>
        <p className={styles.startBlockTip}>{t('set-start-block-number.tip')}</p>
        <TextField
          field="startBlockNumber"
          onChange={onChangeStartBlockNumber}
          placeholder={t('set-start-block-number.input-place-holder')}
          value={startBlockNumber === undefined ? '' : localNumberFormatter(startBlockNumber)}
          error={blockNumberErr}
          suffix={
            <button type="button" className={styles.viewAction} onClick={onOpenAddressInExplorer}>
              {t('set-start-block-number.locate-first-tx')}
              <NewTab />
            </button>
          }
        />
        {isSetLessThanBefore ? (
          <Alert status="error" className={styles.errorMessage} withIcon={false}>
            {t('set-start-block-number.set-less-than-before')}
          </Alert>
        ) : null}
      </div>
    </Dialog>
  )
}

SetStartBlockNumberDialog.displayName = 'SetStartBlockNumberDialog'

export default SetStartBlockNumberDialog
