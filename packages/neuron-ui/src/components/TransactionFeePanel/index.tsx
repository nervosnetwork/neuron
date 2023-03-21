import React, { useState, useMemo, useRef } from 'react'
import clsx from 'clsx'
import { Stack } from 'office-ui-fabric-react'
import { useClickAway } from 'ahooks'
import TextField from 'widgets/TextField'
import { useTranslation } from 'react-i18next'
import { Price, localNumberFormatter } from 'utils'
import Button from 'widgets/Button'
import { ArrowActive, ArrowClose, Select } from 'widgets/Icons/icon'

import styles from './transactionFeePanel.module.scss'

interface TransactionFeeProps {
  fee: string
  price: string
  onPriceChange: any
}

interface PriceObj {
  key: string
  text: string[]
  color: string
}

interface SelectItemProps {
  priceObj: PriceObj
  className?: any
  onClick: any
  sufIcon?: any
}

const priceOptions: PriceObj[] = [
  { key: Price.Low, text: ['send.slow', Price.Low], color: 'blue' },
  { key: Price.Medium, text: ['send.standard', Price.Medium], color: 'green' },
  { key: Price.High, text: ['send.fast', Price.High], color: 'red' },
]

const SelectItem: React.FunctionComponent<SelectItemProps> = ({
  priceObj = priceOptions[0],
  className,
  sufIcon,
  ...res
}: SelectItemProps) => {
  const [t] = useTranslation()
  return (
    <Button type="text" className={clsx(className, styles['select-item'])} {...res}>
      <div className={styles.wrap}>
        <div>
          <p className={styles.title}>{t(priceObj.text[0])}</p>
          <p className={clsx(styles[priceObj.color], styles.tag)}>
            {t('send.price')} {priceObj.text[1]} shannons/kB
          </p>
        </div>
        <p>{sufIcon}</p>
      </div>
    </Button>
  )
}

const TransactionFee: React.FunctionComponent<TransactionFeeProps> = ({
  price,
  fee,
  onPriceChange,
}: TransactionFeeProps) => {
  const [t] = useTranslation()
  const [isCustom, setIsCustom] = useState(false)
  const [isDropdownOpen, setIsDropdownOpen] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)

  useClickAway(() => {
    if (isDropdownOpen) {
      setIsDropdownOpen(false)
    }
  }, dropdownRef)

  const selectedPrice = useMemo(() => priceOptions.filter(item => item.key === price)?.[0], [price])

  const onTroggle = (e: any) => {
    if (isCustom && !selectedPrice) {
      e.target.value = priceOptions[0].key
      onPriceChange(e)
    }
    setIsCustom(() => !isCustom)
  }

  return (
    <Stack tokens={{ childrenGap: 15 }} aria-label="transaction fee">
      <Stack tokens={{ childrenGap: 15 }}>
        <TextField label={t('send.fee')} field="fee" value={fee} readOnly disabled width="100%" />
      </Stack>

      {isCustom ? (
        <TextField
          field="price"
          value={localNumberFormatter(price)}
          onChange={onPriceChange}
          suffix="shannons/kB"
          width="100%"
          label={
            <div className={styles.header}>
              <div>{t('send.custom-price')}</div>
              <Button onClick={onTroggle} className={styles['change-btn']} type="text" />
            </div>
          }
        />
      ) : (
        <div>
          <div className={styles.header}>
            <div className={styles.left}>
              <div>{t('send.price')}</div>
              <Button type="text" onClick={onTroggle} className={styles['change-btn']} />
            </div>
            {/* <div className={styles.right}>单价将在8秒后刷新</div> */}
          </div>

          <div className={styles.dropdown} ref={dropdownRef}>
            <SelectItem
              priceObj={selectedPrice}
              className={styles.content}
              onClick={() => setIsDropdownOpen(!isDropdownOpen)}
              sufIcon={isDropdownOpen ? <ArrowActive /> : <ArrowClose />}
            />
            {isDropdownOpen && (
              <div className={styles.selects}>
                {priceOptions.map(item => (
                  <SelectItem
                    priceObj={item}
                    key={item.key}
                    sufIcon={item.key === price && <Select />}
                    onClick={(e: any) => {
                      e.target.value = item.key
                      onPriceChange(e)
                    }}
                  />
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </Stack>
  )
}

TransactionFee.displayName = 'TransactionFee'

export default TransactionFee
