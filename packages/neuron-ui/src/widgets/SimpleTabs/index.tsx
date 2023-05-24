import React from 'react'
import styles from './tabs.module.scss'

type TabProps = { label: string; value: string | number }

type TabsProps = {
  tabs: TabProps[]
  value: string | number
  onChange?: (changedValue: string | number) => void
}

const Tabs = ({ tabs, value, onChange }: TabsProps) => {
  const handleTabClick = (changedValue: string | number) => {
    onChange?.(changedValue)
  }

  return (
    <div className={styles.tabs}>
      {tabs.map(({ label, value: tabValue }) => (
        <button
          type="button"
          key={tabValue}
          className={`${styles.tab} ${value === tabValue ? styles.active : ''}`}
          onClick={() => handleTabClick(tabValue)}
        >
          {label}
        </button>
      ))}
    </div>
  )
}

Tabs.displayName = 'Tabs'
export default Tabs
