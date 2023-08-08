import React from 'react'
import { Slider } from 'office-ui-fabric-react'
import { Trans, useTranslation } from 'react-i18next'
import TextField from 'widgets/TextField'
import Spinner, { SpinnerSize } from 'widgets/Spinner'
import { openExternal } from 'services/remote'
import { localNumberFormatter, shannonToCKBFormatter } from 'utils'
import { Attention, Success } from 'widgets/Icons/icon'
import Dialog from 'widgets/Dialog'
import styles from './depositDialog.module.scss'
import {
  useBalanceReserved,
  useDepositValue,
  useGenerateDaoDepositTx,
  useOnDepositDialogCancel,
  useOnDepositDialogSubmit,
} from './hooks'

const NERVOS_DAO_RFC_URL =
  'https://www.github.com/nervosnetwork/rfcs/blob/master/rfcs/0023-dao-deposit-withdraw/0023-dao-deposit-withdraw.md'

interface DepositDialogProps {
  balance: string
  show: boolean
  fee: string
  onCloseDepositDialog: () => void
  isDepositing: boolean
  isTxGenerated: boolean
  suggestFeeRate: number
  walletID: string
}

const RfcLink = React.memo(() => (
  <button
    type="button"
    onClick={() => {
      openExternal(NERVOS_DAO_RFC_URL)
    }}
    className={styles.rfcLink}
    aria-label="Nervos DAO RFC"
    title="Nervos DAO RFC"
  >
    Nervos DAO RFC
  </button>
))

const DepositDialog = ({
  walletID,
  balance,
  show,
  fee,
  onCloseDepositDialog,
  isDepositing,
  isTxGenerated,
  suggestFeeRate,
}: DepositDialogProps) => {
  const [t] = useTranslation()
  const disabled = !isTxGenerated
  const { isBalanceReserved, onIsBalanceReservedChange, setIsBalanceReserved } = useBalanceReserved()
  const { depositValue, onChangeDepositValue, slidePercent, onSliderChange, resetDepositValue } =
    useDepositValue(balance)
  const { errorMessage, maxDepositValue } = useGenerateDaoDepositTx({
    walletID,
    isBalanceReserved,
    depositValue,
    suggestFeeRate,
    showDepositDialog: show,
    slidePercent,
  })
  const onConfirm = useOnDepositDialogSubmit({ onCloseDepositDialog, walletID })
  const onCancel = useOnDepositDialogCancel({ onCloseDepositDialog, resetDepositValue, setIsBalanceReserved })

  return (
    <Dialog
      show={show}
      title={t('nervos-dao.deposit')}
      disabled={disabled}
      onCancel={onCancel}
      onConfirm={onConfirm}
      cancelText={t('nervos-dao.cancel')}
      confirmText={t('nervos-dao.proceed')}
    >
      {isDepositing ? (
        <Spinner size={SpinnerSize.large} />
      ) : (
        <form>
          <label className={styles.depositValueLabel} htmlFor="depositValue">{`${t(
            'nervos-dao.deposit-amount'
          )}`}</label>
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
            value={localNumberFormatter(maxDepositValue ?? depositValue)}
            onChange={onChangeDepositValue}
            suffix="CKB"
            required
            error={errorMessage}
          />

          <div className={styles.fee}>
            <div className={styles.isBalanceReserved}>
              <input
                type="checkbox"
                id="is-balance-reserved"
                checked={!isBalanceReserved}
                onChange={onIsBalanceReservedChange}
              />
              <label htmlFor="is-balance-reserved">
                <Success />
                {t(`nervos-dao.balance-not-reserved`)}
              </label>
            </div>

            <div>
              <span>{t('nervos-dao.fee')}</span>
              <span>{`${shannonToCKBFormatter(fee)}`}</span>
            </div>
          </div>

          <div className={styles.notice}>
            <Attention />
            <div>
              <Trans i18nKey="nervos-dao.deposit-terms" components={[<RfcLink />]} />
            </div>
          </div>
        </form>
      )}
    </Dialog>
  )
}

DepositDialog.displayName = 'DepositDialog'

export default DepositDialog
