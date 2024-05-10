import React, { useCallback } from 'react'
import { Slider } from 'office-ui-fabric-react'
import { Trans, useTranslation } from 'react-i18next'
import TextField from 'widgets/TextField'
import Spinner, { SpinnerSize } from 'widgets/Spinner'
import { openExternal } from 'services/remote'
import { localNumberFormatter, shannonToCKBFormatter } from 'utils'
import { Attention, Success } from 'widgets/Icons/icon'
import Dialog from 'widgets/Dialog'
import Tooltip from 'widgets/Tooltip'
import Alert from 'widgets/Alert'
import styles from './depositDialog.module.scss'
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

interface DepositDialogProps {
  balance: string
  show: boolean
  fee: string
  onCloseDepositDialog: () => void
  isDepositing: boolean
  isTxGenerated: boolean
  suggestFeeRate: number
  walletID: string
  globalAPC: number
  onDepositSuccess: () => void
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
  globalAPC,
  onDepositSuccess,
}: DepositDialogProps) => {
  const [t, { language }] = useTranslation()
  const disabled = !isTxGenerated
  const { isBalanceReserved, onIsBalanceReservedChange, setIsBalanceReserved } = useBalanceReserved()
  const { depositValue, onChangeDepositValue, slidePercent, onSliderChange, resetDepositValue } = useDepositValue(
    balance,
    show
  )
  const { errorMessage, maxDepositValue } = useGenerateDaoDepositTx({
    walletID,
    isBalanceReserved,
    depositValue,
    suggestFeeRate,
    showDepositDialog: show,
    slidePercent,
  })
  const onConfirm = useOnDepositDialogSubmit({ onDepositSuccess, walletID })
  const onCancel = useOnDepositDialogCancel({ onCloseDepositDialog, resetDepositValue, setIsBalanceReserved })
  const onSubmit = useCallback(
    (e: React.FormEvent) => {
      e.preventDefault()
      if (disabled) {
        return
      }
      onConfirm()
    },
    [disabled, onConfirm]
  )
  const { annualRewards, monthRewards } = useDepositRewards({
    depositValue,
    maxDepositValue,
    disabled,
    globalAPC,
  })

  const isChinese = language === 'zh' || language.startsWith('zh-')

  return (
    <Dialog
      show={show}
      title={t('nervos-dao.deposit')}
      disabled={disabled}
      onCancel={onCancel}
      onConfirm={onConfirm}
      cancelText={t('nervos-dao.cancel')}
      confirmText={t('nervos-dao.proceed')}
      className={styles.container}
    >
      {isDepositing ? (
        <Spinner size={SpinnerSize.large} />
      ) : (
        <form onSubmit={onSubmit}>
          <div className={styles.depositValueLabelWrap}>
            <label className={styles.depositValueLabel} htmlFor="depositValue">{`${t(
              'nervos-dao.deposit-amount'
            )}`}</label>
            <Tooltip
              tipClassName={styles.tooltip}
              tip={
                <div className={styles.tip}>
                  <Trans i18nKey="nervos-dao.deposit-terms" components={[<RfcLink />]} />
                </div>
              }
            >
              <Attention />
            </Tooltip>
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
            value={localNumberFormatter(maxDepositValue ?? depositValue)}
            onChange={onChangeDepositValue}
            suffix="CKB"
            required
            error={errorMessage}
          />

          <div className={styles.fee}>
            <div>
              <span>{t('nervos-dao.fee')}</span>
              <span>{`${shannonToCKBFormatter(fee)}`}</span>
            </div>

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
          </div>

          <div className={styles.rewards}>
            <div>
              <p>{t(`nervos-dao.estimated-rewards`, { days: 30 })}</p>
              <p>{shannonToCKBFormatter(monthRewards)} CKB</p>
            </div>
            <div>
              <p>{t(`nervos-dao.estimated-rewards`, { days: 360 })}</p>
              <p>{shannonToCKBFormatter(annualRewards)} CKB</p>
            </div>
            <div>
              <div className={styles.acpContent}>
                {t(`nervos-dao.estimated-apc`)}
                {isChinese ? null : (
                  <Tooltip
                    placement="top"
                    showTriangle
                    tip={<p className={styles.tip}>{t(`nervos-dao.estimated-apc-tooltip`)}</p>}
                  >
                    <Attention />
                  </Tooltip>
                )}
              </div>
              <p>{globalAPC}%</p>
            </div>
          </div>
          <Alert status="warn" className={styles.notification}>
            <span>{t('nervos-dao.attention')}</span>
          </Alert>
        </form>
      )}
    </Dialog>
  )
}

DepositDialog.displayName = 'DepositDialog'

export default DepositDialog
