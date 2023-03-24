import React, { useState, useMemo, useRef, useCallback } from 'react'
import clsx from 'clsx'
import TextField from 'widgets/TextField'
import { useTranslation } from 'react-i18next'
import { Price, localNumberFormatter, useDidMount } from 'utils'
import Button from 'widgets/Button'
import { Arrow, Select, Change } from 'widgets/Icons/icon'

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
  priceObj: PriceObj | undefined
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

  const onDocumentClick = useCallback(
    (e: any) => {
      if (!dropdownRef.current?.contains(e.target)) {
        setIsDropdownOpen(false)
      }
    },
    [isDropdownOpen]
  )

  useDidMount(() => {
    document.addEventListener('click', onDocumentClick, false)
    return () => document.removeEventListener('click', onDocumentClick, false)
  })

  const selectedPrice = useMemo(() => priceOptions.find(item => item.key === price), [price])

  const onTroggle = () => {
    if (isCustom && !selectedPrice) {
      onPriceChange({ target: { value: priceOptions[0].key } })
    }
    setIsCustom(v => !v)
  }

  return (
    <div>
      <TextField label={t('send.fee')} field="fee" value={fee} readOnly disabled width="100%" />

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
              <Button onClick={onTroggle} className={styles['change-btn']} type="text">
                <Change />
              </Button>
            </div>
          }
        />
      ) : (
        <div>
          <div className={styles.header}>
            <div className={styles.left}>
              <div>{t('send.price')}</div>
              <Button type="text" onClick={onTroggle} className={styles['change-btn']}>
                <Change />
              </Button>
            </div>
          </div>

          <div className={styles.dropdown} ref={dropdownRef}>
            <SelectItem
              priceObj={selectedPrice}
              className={styles.content}
              onClick={() => setIsDropdownOpen(!isDropdownOpen)}
              data-active={isDropdownOpen}
              sufIcon={<Arrow />}
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
    </div>
  )
}

TransactionFee.displayName = 'TransactionFee'

export default TransactionFee
