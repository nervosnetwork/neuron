/* eslint-disable no-console */
import React, { useCallback, useEffect, useMemo, useState } from 'react'
import { localNumberFormatter, shannonToCKBFormatter } from 'utils'
import RingProgressBar from 'widgets/RingProgressBar'
import TextField from 'widgets/TextField'
import { Transfer } from 'widgets/Icons/icon'
import DropdownWithCustomRender from 'widgets/DropdownWithCustomRender'
import useGetCountDownAndFeeRateStats from 'utils/hooks/useGetCountDownAndFeeRateStats'
import { useTranslation } from 'react-i18next'
import { appState, useState as useGlobalState } from 'states'

import { FeeRateValueArrayItemType, useGetBatchGeneratedTx } from 'components/Send/hooks'

import styles from './pricePanel.module.scss'

interface PricePanelProps {
  field: string
  price: string
  onPriceChange: (value: string) => void
}
enum PriceTypeEnum {
  Custom = 'custom',
  Standard = 'standard',
}
const DEFAULT_PRICE_ARRAY = ['1000', '2000', '3000']
const DEFAULT_COUNT_DOWN = 30

const PricePanel: React.FunctionComponent<PricePanelProps> = ({ price, field, onPriceChange }: PricePanelProps) => {
  const [t] = useTranslation()
  const [type, setType] = useState<PriceTypeEnum>(PriceTypeEnum.Standard)
  const [feeRateValueArray, setFeeRateValueArray] = useState<FeeRateValueArrayItemType[]>([])
  const [priceArray, setPriceArray] = useState(DEFAULT_PRICE_ARRAY)
  const [currentModeIdx, setCurrentModeIdx] = useState<number>(1)

  const {
    app: { send = appState.send },
    wallet: { id: walletID = '' },
  } = useGlobalState()
  const { countDown, suggestFeeRate } = useGetCountDownAndFeeRateStats({ seconds: DEFAULT_COUNT_DOWN })

  const isStandard = type === PriceTypeEnum.Standard
  const label = isStandard ? t('price-switch.price') : t('price-switch.customPrice')
  const percent = (countDown / DEFAULT_COUNT_DOWN) * 100

  const handleDropdownChange = useCallback(
    (e: { value: string; index?: number }) => {
      const { value: dropdownChangedValue, index = 1 } = e
      setCurrentModeIdx(index)

      onPriceChange?.(dropdownChangedValue)
    },
    [setCurrentModeIdx, onPriceChange]
  )

  const dropdownValue = useMemo(() => priceArray[currentModeIdx], [priceArray, currentModeIdx])

  const handleInputChange = useCallback(
    (e: React.SyntheticEvent<HTMLInputElement>) => {
      const { value: inputChangedValue } = e.currentTarget

      onPriceChange?.(inputChangedValue)
    },
    [onPriceChange]
  )

  const inputError = useMemo(
    () => (Number(price) < 1000 ? t('price-switch.errorTip', { minPrice: 1000 }) : null),
    [price]
  )

  const feeValuesArray = useMemo(
    () =>
      feeRateValueArray?.map((item: FeeRateValueArrayItemType) => ({
        feeRateValue: item.feeRateValue,
        value: shannonToCKBFormatter(item.feeValue),
      })),
    [feeRateValueArray]
  )

  useEffect(() => {
    if (isStandard) {
      handleDropdownChange({ value: priceArray[currentModeIdx], index: currentModeIdx })
    }
  }, [isStandard, handleDropdownChange, priceArray])

  const options = useMemo(
    () =>
      [
        ['slow', 'blue'],
        ['standard', 'green'],
        ['fast', 'red'],
      ].map(([mode, color], idx) => ({
        idx,
        value: priceArray[idx],
        label: (
          <div className={styles.labelWrap}>
            <span>{t(`price-switch.${mode}`)}</span>
            <span className={`${styles.labelComment} ${styles[color]}`}>
              {t('price-switch.priceColumn', {
                priceValue: feeValuesArray?.[idx]?.feeRateValue || priceArray[idx],
                feeValue: feeValuesArray?.[idx]?.value || 0,
              })}
            </span>
          </div>
        ),
      })),
    [priceArray, feeValuesArray]
  )

  useEffect(() => {
    useGetBatchGeneratedTx({ walletID, items: send.outputs, priceArray }).then(res => {
      setFeeRateValueArray(res)
    })
  }, [send.outputs, priceArray])

  useEffect(() => {
    if (suggestFeeRate === 0) {
      setPriceArray(['1000', '2000', '3000'])
    } else {
      setPriceArray(['1000', `${suggestFeeRate}`, `${Number(suggestFeeRate) * 2 - 1000}`])
    }
  }, [suggestFeeRate])

  const inputHint = t('price-switch.hintTip', { suggestFeeRate })

  return (
    <div>
      <div className={styles.pricePanel}>
        <div className={styles.transferSwitch}>
          <label htmlFor={field} aria-label={label} title={label}>
            {label}
          </label>
          <button
            data-content={isStandard ? t('price-switch.switchToCustomPrice') : t('price-switch.switchToPrice')}
            className={styles.transferWrap}
            onClick={() =>
              setType(currentType =>
                currentType === PriceTypeEnum.Standard ? PriceTypeEnum.Custom : PriceTypeEnum.Standard
              )
            }
            onKeyDown={() => {}}
            type="button"
          >
            <Transfer />
          </button>
        </div>
        {isStandard ? (
          <div className={styles.timeoutWrap}>
            <RingProgressBar percents={percent} color="#00C891" strokeWidth="3px" size="16px" backgroundColor="#CCC" />
            <span>{t('price-switch.countDownTip', { countDown })}</span>
          </div>
        ) : null}
      </div>

      {isStandard ? (
        <div className={styles.dropdownBox}>
          <DropdownWithCustomRender
            onChange={handleDropdownChange}
            options={options}
            placeholder={t('dropdown.placeholder')}
            value={dropdownValue}
          />
        </div>
      ) : (
        <TextField
          field="price"
          value={localNumberFormatter(price)}
          onChange={handleInputChange}
          suffix="shannons/kB"
          error={inputError}
          hint={!inputError && inputHint ? inputHint : null}
          width="100%"
        />
      )}
    </div>
  )
}

PricePanel.displayName = 'PricePanel'

export default React.memo(PricePanel)
