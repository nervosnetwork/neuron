import React from 'react'
import { List, getTheme } from 'office-ui-fabric-react'
import styles from './PropertyList.module.scss'

const theme = getTheme()

export interface Property {
  label: string
  value: string | number | Element | React.ReactNode
}
export interface CellStyles {
  color?: string
  labelWidth?: string
  valueWidth?: string
  height?: string
}

const onRenderCell = (item?: Property & CellStyles) =>
  item ? (
    <div className={styles.propertyCell} style={{ height: item.height || 'auto' }} aria-label="property">
      <span
        className={styles.label}
        style={{ width: item.labelWidth || 'auto', fontSize: '1.125rem' }}
        title={item.label}
        aria-label={item.label}
      >
        {item.label}
      </span>
      <span
        className={styles.value}
        style={{ width: item.valueWidth || 'auto', fontSize: theme.fonts.small.fontSize, textAlign: 'right' }}
        title={typeof item.value === 'string' ? `${item.value}` : ''}
        aria-label={item.label}
      >
        {item.value}
      </span>
    </div>
  ) : null
const PropertyList = ({
  properties,
  cellStyles = { labelWidth: '100px', height: 'auto', color: 'inherit' },
}: {
  properties: Property[]
  cellStyles?: CellStyles
}) => {
  return <List items={properties.map(prop => ({ ...prop, ...cellStyles }))} onRenderCell={onRenderCell} />
}

PropertyList.displayName = 'PropertyList'

export default PropertyList
