import React, { useCallback, useEffect, useRef, useState } from 'react'
import { localNumberFormatter, shannonToCKBFormatter } from 'utils'
import RingProgressBar from 'widgets/RingProgressBar'
import TextField from 'widgets/TextField'
import { Transfer } from 'widgets/Icons/icon'
import DropdownWithCustomRender from 'widgets/DropdownWithCustomRender'
import { useTranslation } from 'react-i18next'
import { appState, useDispatch, useState as useGlobalState } from 'states'
import { getFeeRateStatics } from 'services/remote'
import { AppActions, StateDispatch } from 'states/stateProvider/reducer'
import { useGetbatchGeneratedTx } from 'components/Send/hooks'

import styles from './pricePanel.module.scss'

interface PricePanelProps {
  field: string
  price: string
  onPriceChange: any
}
enum PriceTypeEnum {
  Customer = 'customer',
  Standard = 'standard',
}
const DefaultCountDown = 30

const PricePanel: React.FunctionComponent<PricePanelProps> = ({ price, field, onPriceChange }: PricePanelProps) => {
  const [t] = useTranslation()
  const intervalHandle = useRef<any>(null)
  const dispatch = useDispatch()
  const [type, setType] = useState<PriceTypeEnum>(PriceTypeEnum.Standard)
  const [inputError, setInputError] = useState<string | null>(null)
  const [inputHint, setInputHint] = useState<string | null>(null)
  const [dropdownValue, setDropdowValue] = useState()
  const [time, setTime] = useState(DefaultCountDown)
  const [feeMap, setFeeMap] = useState([])
  const [priceArray, setPriceArray] = useState(['1000', '2000', '3000'])

  const isStandard = type === PriceTypeEnum.Standard
  const label = isStandard ? '单价' : '自定义价格'
  const percent = (time / DefaultCountDown) * 100

  const {
    app: {
      send = appState.send,
      feeRateStatics: { suggestFeeRate = 0 },
    },
    wallet: { id: walletID = '' },
  } = useGlobalState()

  const handleDropdownChange = useCallback((e: any) => {
    const { value: dropdownChangedValue } = e
    setDropdowValue(dropdownChangedValue)
    onPriceChange?.({ target: { value: dropdownChangedValue } })
  }, [])

  const handleInputChange = useCallback((e: any) => {
    const { value: inputChangedValue } = e.target
    const handledValue = inputChangedValue.replace(/,/g, '')

    setInputError(Number(handledValue) < 1000 ? '价格设定最少不得少于 1000 shannons/byte，请重新输入' : null)
    onPriceChange?.(e)
  }, [])

  const newMap = feeMap?.map((item: any) => ({
    feeValue: item.selectedValue,
    value: shannonToCKBFormatter(item.value),
  }))

  const options = [
    {
      value: priceArray[0],
      label: (
        <div className={styles['label-wrap']}>
          <span>慢速</span>
          <span
            className={styles['label-comment']}
          >{`单价${newMap?.[0]?.feeValue}shannons/byte | 费用${newMap?.[0]?.value}CKB`}</span>
        </div>
      ),
    },
    {
      value: priceArray[1],
      label: (
        <div className={styles['label-wrap']}>
          <span>标准</span>
          <span
            className={styles['label-comment']}
          >{`单价${newMap?.[1]?.feeValue}shannons/byte | 费用${newMap?.[1]?.value}CKB`}</span>
        </div>
      ),
    },

    {
      value: priceArray[2],
      label: (
        <div className={styles['label-wrap']}>
          <span>快速</span>
          <span
            className={styles['label-comment']}
          >{`单价${newMap?.[2]?.feeValue}shannons/byte | 费用${newMap?.[2]?.value}CKB`}</span>
        </div>
      ),
    },
  ]

  const handleGetFeeRateStatics = useCallback((stateDispatch: StateDispatch) => {
    getFeeRateStatics()
      .then(res => {
        const { result } = res as any
        stateDispatch({
          type: AppActions.GetFeeRateStatics,
          payload: result,
        })
      })
      .catch((err: Error) => {
        dispatch({
          type: AppActions.AddNotification,
          payload: {
            type: 'alert',
            timestamp: +new Date(),
            content: err.message,
          },
        })
      })
  }, [])

  useEffect(() => {
    if (suggestFeeRate) {
      setPriceArray(['1000', `${suggestFeeRate}`, `${Number(suggestFeeRate) * 2 - 1000}`])
    }
    setInputHint(`建议设置为${suggestFeeRate}`)
  }, [suggestFeeRate])

  useEffect(() => {
    intervalHandle.current = setInterval(() => {
      setTime(timeState => timeState - 1)
    }, 1000)

    if (time === DefaultCountDown) {
      handleGetFeeRateStatics(dispatch)
    }
    if (time < 0) {
      handleGetFeeRateStatics(dispatch)
      setTime(DefaultCountDown)
    }

    return () => {
      clearInterval(intervalHandle.current)
    }
  }, [time])

  useEffect(() => {
    useGetbatchGeneratedTx({ walletID, items: send.outputs, priceArray }).then(res => {
      setFeeMap(res as any)
    })
  }, [send.outputs])

  return (
    <div>
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          fontSize: '0.875rem',
          lineHeight: '1.125rem',
          marginBottom: '4px',
        }}
      >
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
            <span>{`单价将在${time}秒后刷新`}</span>
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
