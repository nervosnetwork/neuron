/* eslint-disable no-console */
import React, { useState } from 'react'
import { Price, localNumberFormatter } from 'utils'
import { Dropdown, IDropdownProps, Icon, IDropdownOption } from 'office-ui-fabric-react'
import { Transfer } from 'widgets/Icons/icon'
import DropdownWithCustomRender from 'widgets/DropdownWithCustomRender'
import { useTranslation } from 'react-i18next'

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

const PricePanel: React.FunctionComponent<PricePanelProps> = ({ price, field, onPriceChange }: PricePanelProps) => {
  const [t] = useTranslation()
  const [type, setType] = useState<PriceTypeEnum>(PriceTypeEnum.Standard)
  const isStandard = type === PriceTypeEnum.Standard
  const label = isStandard ? '单价' : '自定义价格'

  const TransferIcon = () => (
    <button
      data-content={isStandard ? '切换到自定义价格' : '切换到单价'}
      className={styles['transfer-wrap']}
      onClick={() => setType(isStandard ? PriceTypeEnum.Customer : PriceTypeEnum.Standard)}
      onKeyDown={() => {}}
      type="button"
      // role="button"
      // tabIndex={0}
    >
      <Transfer />
    </button>
  )

  const CustomDropdown = (props: IDropdownProps) => (
    <Dropdown
      onRenderCaretDown={() => {
        return <Icon iconName="ArrowDown" className={styles.arrowDown} />
      }}
      styles={{
        label: {
          fontSize: '0.75rem',
          fontWeight: 500,
        },
        title: {
          fontSize: '0.75rem!important',
          fontWeight: 500,
          height: '1.625rem',
          lineHeight: '1.625rem',
        },
        dropdownOptionText: {
          fontSize: '0.75rem!important',
          boxShadow: 'border-box',
        },
        dropdownItem: {
          fontSize: '0.75rem!important',
          boxShadow: 'border-box',
          minHeight: '1.5rem',
        },
        dropdownItemSelected: {
          fontSize: '0.75rem!important',
          minHeight: '1.5rem',
          backgroundColor: '#e3e3e3',
        },
        root: {
          fontSize: '0.75rem',
          marginBottom: '10px',
        },
      }}
      {...props}
    />
  )

  const options = [
    {
      value: Price.Low,
      label: <div style={{ color: 'red' }}>{`慢速 ( 单价${Price.Low}shannons/byte | 费用50CKB )`}</div>,
    },
    { value: Price.Medium, label: `标准 ( 单价${Price.Medium}shannons/byte | 费用100CKB )` },
    { value: Price.High, label: `快速 ( 单价${Price.High}shannons/byte | 费用200CKB )` },
  ]

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
        <span>倒计时</span>
      </div>

      {isStandard ? (
        <CustomDropdown
          selectedKey={price}
          options={[
            { key: Price.Low, text: `慢速 ( 单价${Price.Low}shannons/byte | 费用50CKB )` },
            { key: Price.Medium, text: `标准 ( 单价${Price.Medium}shannons/byte | 费用100CKB )` },
            { key: Price.High, text: `快速 ( 单价${Price.High}shannons/byte | 费用200CKB )` },
          ]}
          onChange={(e: any, item?: IDropdownOption) => {
            if (item) {
              e.target.value = item.key
              onPriceChange(e)
            }
          }}
          aria-label="expected speed"
        />
      ) : (
        <div className={styles['input-box']}>
          <input
            id={field}
            type="text"
            value={localNumberFormatter(price)}
            title={label}
            name={label}
            onChange={onPriceChange}
            // data-field={field}
            // onClick={onClick}
            // readOnly={readOnly}
            // {...rest}
          />
          <span className={styles.suffix}>shannons/kB</span>
        </div>
      )}
      <DropdownWithCustomRender
        onChange={e => {
          console.log(e, 'changedValue')
        }}
        options={options}
        placeholder={t('dropdown.placeholder')}
      />
    </div>
  )
}

PricePanel.displayName = 'PricePanel'

export default React.memo(PricePanel)
