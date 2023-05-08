import React, { FC, useState } from 'react'
import { onEnter } from 'utils/inputDevice'

export type Tab<T = {}> = {
  id: string
  render?: (tab: Tab<T>) => React.ReactNode
} & T

export interface VariantProps<T> {
  tabs: Tab<T>[]
  selectedTab: Tab<T>
  onTabChange: (tabId: string) => void
}

const DefaultVariant = <T extends any = {}>({ tabs, selectedTab, onTabChange }: VariantProps<T>) => {
  return (
    <div>
      <div role="tablist">
        {tabs.map(tab => (
          <div
            key={tab.id}
            role="tab"
            tabIndex={0}
            onKeyDown={onEnter(() => onTabChange(tab.id))}
            onClick={() => onTabChange(tab.id)}
          >
            {tab.id}
          </div>
        ))}
      </div>
      <div role="tabpanel">{selectedTab.render?.(selectedTab)}</div>
    </div>
  )
}

export const Tabs = <T extends any = {}>({
  tabs,
  Variant = DefaultVariant,
}: {
  tabs: Tab<T>[]
  Variant?: FC<VariantProps<T>>
}) => {
  if (tabs.length === 0) {
    throw new Error('Tabs must have at least one tab')
  }

  const [selectedTabId, setSelectedTabId] = useState<string>(tabs[0].id)
  const selectedTab = tabs.find(tab => tab.id === selectedTabId) ?? tabs[0]

  return <Variant tabs={tabs} selectedTab={selectedTab} onTabChange={setSelectedTabId} />
}

export default Tabs
