import React, { useCallback, useEffect, useMemo, useState } from 'react'
import { localNumberFormatter, shannonToCKBFormatter } from 'utils'
import RingProgressBar from 'widgets/RingProgressBar'
import TextField from 'widgets/TextField'
import { Transfer } from 'widgets/Icons/icon'
import DropdownWithCustomRender from 'widgets/DropdownWithCustomRender'
import { useTranslation } from 'react-i18next'
import { appState, useState as useGlobalState } from 'states'

import { useGetbatchGeneratedTx } from 'components/Send/hooks'
import { DEFAULT_COUNT_DOWN } from 'utils/const'

import styles from './pricePanel.module.scss'

interface PricePanelProps {
  field: string
  price: string
  onPriceChange: React.EventHandler<React.SyntheticEvent>
}
enum PriceTypeEnum {
  Customer = 'customer',
  Standard = 'standard',
}

const PricePanel: React.FunctionComponent<PricePanelProps> = ({ price, field, onPriceChange }: PricePanelProps) => {
  const [t] = useTranslation()
  const [type, setType] = useState<PriceTypeEnum>(PriceTypeEnum.Standard)
  const [inputError, setInputError] = useState<string | null>(null)
  const [inputHint, setInputHint] = useState<string | null>(null)
  const [dropdownValue, setDropdowValue] = useState()
  const [feeMap, setFeeMap] = useState([])
  const [priceArray, setPriceArray] = useState(['1000', '1000', '1000'])
  const {
    app: {
      send = appState.send,
      feeRateStatics: { suggestFeeRate = 0 },
      countDown,
    },
    wallet: { id: walletID = '' },
  } = useGlobalState()

  const isStandard = type === PriceTypeEnum.Standard
  const label = isStandard ? '单价' : '自定义价格'
  const percent = (countDown / DEFAULT_COUNT_DOWN) * 100

  const handleDropdownChange = useCallback((e: any) => {
    const { value: dropdownChangedValue } = e
    setDropdowValue(dropdownChangedValue)
    onPriceChange?.({ target: { value: dropdownChangedValue } } as any)
  }, [])

  const handleInputChange = useCallback((e: any) => {
    const { value: inputChangedValue } = e.target
    const handledValue = inputChangedValue.replace(/,/g, '')

    setInputError(Number(handledValue) < 1000 ? '价格设定最少不得少于 1000 shannons/byte，请重新输入' : null)
    onPriceChange?.(e)
  }, [])

  const feeValuesMap = feeMap?.map((item: any) => ({
    feeRateValue: item.feeRateValue,
    value: shannonToCKBFormatter(item.feeValue),
  }))

  const options = useMemo(
    () => [
      {
        value: priceArray[0],
        label: (
          <div className={styles['label-wrap']}>
            <span>慢速</span>
            <span className={styles['label-comment']}>{`单价${feeValuesMap?.[0]?.feeRateValue ||
              priceArray[0]}shannons/byte | 费用${feeValuesMap?.[0]?.value || 0}CKB`}</span>
          </div>
        ),
      },
      {
        value: priceArray[1],
        label: (
          <div className={styles['label-wrap']}>
            <span>标准</span>
            <span className={styles['label-comment']}>{`单价${feeValuesMap?.[1]?.feeRateValue ||
              priceArray[1]}shannons/byte | 费用${feeValuesMap?.[1]?.value || 0}CKB`}</span>
          </div>
        ),
      },

      {
        value: priceArray[2],
        label: (
          <div className={styles['label-wrap']}>
            <span>快速</span>
            <span className={styles['label-comment']}>{`单价${feeValuesMap?.[2]?.feeRateValue ||
              priceArray[2]}shannons/byte | 费用${feeValuesMap?.[2]?.value || 0}CKB`}</span>
          </div>
        ),
      },
    ],
    [priceArray, feeValuesMap]
  )

  useEffect(() => {
    useGetbatchGeneratedTx({ walletID, items: send.outputs, priceArray }).then(res => {
      setFeeMap(res as any)
    })
  }, [send.outputs, priceArray])

  useEffect(() => {
    setPriceArray(['1000', `${suggestFeeRate}`, `${Number(suggestFeeRate) * 2 - 1000}`])
    setInputHint(`建议价格 ${suggestFeeRate} shannons/byte`)
  }, [suggestFeeRate])

  return (
    <div>
      <div className={styles['price-panel']}>
        <div style={{ display: 'flex' }}>
          <label htmlFor={field} aria-label={label} title={label}>
            {label}
          </label>
          <button
            data-content={isStandard ? '切换到自定义价格' : '切换到单价'}
            className={styles['transfer-wrap']}
            onClick={() => setType(isStandard ? PriceTypeEnum.Customer : PriceTypeEnum.Standard)}
            onKeyDown={() => {}}
            type="button"
          >
            <Transfer />
          </button>
        </div>
        {isStandard ? (
          <div className={styles['timeout-wrap']}>
            <RingProgressBar percents={percent} color="#00C891" strokeWidth="3px" size="16px" backgroundColor="#CCC" />
            <span>{`单价将在${countDown}秒后刷新`}</span>
          </div>
        ) : null}
      </div>

      {isStandard ? (
        <div className={styles['dropdown-box']}>
          <DropdownWithCustomRender
            onChange={e => handleDropdownChange(e)}
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
          error={inputError ?? null}
          hint={!inputError && inputHint ? inputHint : null}
        />
      )}
    </div>
  )
}

PricePanel.displayName = 'PricePanel'

export default React.memo(PricePanel)
