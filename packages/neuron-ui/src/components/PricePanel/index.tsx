/* eslint-disable no-console */
import React, { useEffect, useRef, useState } from 'react'
import { Price, localNumberFormatter } from 'utils'
import RingProgressBar from 'widgets/RingProgressBar'
import { Transfer } from 'widgets/Icons/icon'
import DropdownWithCustomRender from 'widgets/DropdownWithCustomRender'
import { useTranslation } from 'react-i18next'

import styles from './pricePanel.module.scss'

interface PricePanelProps {
  field: string
  price: string | Price
  onPriceChange: any
}
enum PriceTypeEnum {
  Customer = 'customer',
  Standard = 'standard',
}

const PricePanel: React.FunctionComponent<PricePanelProps> = ({ price, field, onPriceChange }: PricePanelProps) => {
  const [t] = useTranslation()
  const intervalHandle = useRef<any>(null)
  const [type, setType] = useState<PriceTypeEnum>(PriceTypeEnum.Standard)
  const [time, setTime] = useState(8)
  const [dropdownValue, setDropdowValue] = useState(Object.values(Price).includes(price as any) ? price : Price.Medium)

  const isStandard = type === PriceTypeEnum.Standard
  const label = isStandard ? '单价' : '自定义价格'
  const percent = (time / 8) * 100

  useEffect(() => {
    intervalHandle.current = setInterval(() => {
      setTime(timeState => timeState - 1)
    }, 1000)

    if (time < 0) {
      // TODO: handlereseach
      setTime(8)
      console.log('do reasearch')
    }

    return () => {
      clearInterval(intervalHandle.current)
    }
  }, [time])

  const handleDropdownChange = (e: any) => {
    console.log(e, 'handleDropdownChange')
    setDropdowValue(e.value)
  }

  const TransferIcon = () => (
    <button
      data-content={isStandard ? '切换到自定义价格' : '切换到单价'}
      className={styles['transfer-wrap']}
      onClick={() => setType(isStandard ? PriceTypeEnum.Customer : PriceTypeEnum.Standard)}
      onKeyDown={() => {}}
      type="button"
    >
      <Transfer />
    </button>
  )

  const options = [
    {
      value: Price.Low,
      label: (
        <div className={styles['label-wrap']}>
          <span>慢速</span>
          <span className={styles['label-comment']}>{`单价${Price.Low}shannons/byte | 费用50CKB`}</span>
        </div>
      ),
    },
    {
      value: Price.Medium,
      label: (
        <div className={styles['label-wrap']}>
          <span>标准</span>
          <span className={styles['label-comment']}>{`单价${Price.Medium}shannons/byte | 费用100CKB`}</span>
        </div>
      ),
    },

    {
      value: Price.High,
      label: (
        <div className={styles['label-wrap']}>
          <span>快速</span>
          <span className={styles['label-comment']}>{`单价${Price.High}shannons/byte | 费用200CKB`}</span>
        </div>
      ),
    },
  ]

  console.log(time, 'time')

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
          <TransferIcon />
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
        <div className={styles['input-box']}>
          <input
            id={field}
            type="text"
            value={localNumberFormatter(price)}
            title={label}
            name={label}
            onChange={onPriceChange}
          />
          <span className={styles.suffix}>shannons/kB</span>
        </div>
      )}
    </div>
  )
}

PricePanel.displayName = 'PricePanel'

export default React.memo(PricePanel)
