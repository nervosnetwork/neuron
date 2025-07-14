import React, { useCallback, useMemo, useState } from 'react'
import { Slider } from 'office-ui-fabric-react'
import { Trans, useTranslation } from 'react-i18next'
import TextField from 'widgets/TextField'
import Spinner, { SpinnerSize } from 'widgets/Spinner'
import { openExternal, MultisigConfig } from 'services/remote'
import { localNumberFormatter, shannonToCKBFormatter } from 'utils'
import getMultisigSignStatus from 'utils/getMultisigSignStatus'
import { Attention, Success } from 'widgets/Icons/icon'
import Dialog from 'widgets/Dialog'
import Tooltip from 'widgets/Tooltip'
import Alert from 'widgets/Alert'
import styles from './perunSendPayment.module.scss'
import {
  useBalanceReserved,
  useDepositValue,
  useGenerateDaoDepositTx,
  useOnDepositDialogCancel,
  useOnDepositDialogSubmit,
  useDepositRewards,
} from './hooks'

const NERVOS_DAO_RFC_URL =
  'https://www.github.com/nervosnetwork/rfcs/blob/master/rfcs/0023-dao-deposit-withdraw/0023-dao-deposit-withdraw.md'

const PerunSendPayment = ({ onClose }: { onClose: () => void }) => {
  const [t, { language }] = useTranslation()
  const [errorMessage, setErrorMessage] = useState('')

  const balance = '1000000000000000000'

  const [isTyping, setIsTyping] = useState(false)
  const { depositValue, onChangeDepositValue, slidePercent, onSliderChange, resetDepositValue } =
    useDepositValue(balance)

  const { isBalanceReserved, onIsBalanceReservedChange, setIsBalanceReserved } = useBalanceReserved()

  const handleBlur = useCallback(() => {
    setIsTyping(false)
  }, [setIsTyping])

  const handleFocus = useCallback(() => {
    setIsTyping(true)
  }, [setIsTyping])

  return (
    <Dialog show title={t('perun.send-payment')} onCancel={onClose} className={styles.container}>
      <div>
        <div className={styles.depositValueLabelWrap}>
          <label className={styles.depositValueLabel} htmlFor="depositValue">{`${t(
            'nervos-dao.deposit-amount'
          )}`}</label>
        </div>
        <Slider
          className={styles.slider}
          value={slidePercent}
          min={0}
          max={100}
          step={1}
          showValue={false}
          onChange={onSliderChange}
        />
        <TextField
          className={styles.depositValue}
          width="100%"
          field="depositValue"
          value={isTyping ? depositValue : localNumberFormatter(depositValue)}
          onChange={onChangeDepositValue}
          onBlur={handleBlur}
          onFocus={handleFocus}
          suffix="CKB"
          required
          error={errorMessage}
        />

        <p className={styles.fee}>{t('perun.transaction-fee')}:</p>
      </div>
    </Dialog>
  )
}

PerunSendPayment.displayName = 'PerunSendPayment'

export default PerunSendPayment
