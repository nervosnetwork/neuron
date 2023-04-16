/* eslint-disable no-console */
import React, { FC, useState } from 'react'
import { onEnter } from 'utils/inputDevice'

export type Tab<T extends any = {}> = {
  id: string | number
  label?: string | React.ReactNode
  render?: (tab: Tab<T>) => React.ReactNode
} & T

export interface VariantProps<T> {
  tabs: Tab<T>[]
  onTabChange: (id: string | number) => void
  selectedTab: Tab<T>
}

export type TabsProps<T extends any = {}> = Omit<VariantProps<T>, 'onTabChange' | 'selectedTab'> & {
  Variant?: FC<VariantProps<T>>
  onChange?: (changedTabValue: string | number) => void
} & Partial<{ tabsClassName?: string; tabsWrapClassName?: string; tabsColumnClassName?: string }>

const DefaultVariant = <T extends any = {}>({
  tabs,
  selectedTab,
  onTabChange,
  tabsClassName,
  tabsWrapClassName,
  tabsColumnClassName,
}: VariantProps<T> & { tabsClassName?: string; tabsWrapClassName?: string; tabsColumnClassName?: string }) => {
  return (
    <div className={tabsClassName}>
      <div className={tabsWrapClassName} role="tablist">
        {tabs.map(tab => (
          <div
            key={tab.id}
            role="tab"
            tabIndex={0}
            onKeyDown={onEnter(() => onTabChange(tab.id))}
            onClick={() => onTabChange(tab.id)}
            className={tabsColumnClassName}
            data-active={selectedTab.id === tab.id}
          >
            {tab.label ?? tab.id}
          </div>
        ))}
      </div>
      <div role="tabpanel">{selectedTab.render?.(selectedTab)}</div>
    </div>
  )
}

export const Tabs = <T extends any = {}>({ tabs, Variant, onChange, ...rest }: TabsProps<T>) => {
  if (tabs.length === 0) {
    throw new Error('Tabs must have at least one tab')
  }

  const [selectedTabId, setSelectedTabId] = useState<string | number>(tabs[0].id)
  const selectedTab = tabs.find(tab => tab.id === selectedTabId) ?? tabs[0]

  const handleTabChange = (id: string | number) => {
    setSelectedTabId(id)
    onChange?.(id)
  }

  return Variant ? (
    <Variant tabs={tabs} selectedTab={selectedTab} onTabChange={handleTabChange} />
  ) : (
    <DefaultVariant tabs={tabs} selectedTab={selectedTab} onTabChange={handleTabChange} {...rest} />
  )
}

export default Tabs
