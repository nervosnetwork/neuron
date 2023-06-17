import React, { ReactElement, ReactNode, useCallback, useState } from 'react'
import { clsx } from 'utils'
import { onEnter } from 'utils/inputDevice'

type TabId = string | number

export type Tab<T = {}> = {
  id: TabId
  label?: ReactNode
  render?: (tab: Tab<T>) => ReactNode
} & T

export interface VariantProps<T> {
  tabs: Tab<T>[]
  onTabChange: (tabId: TabId) => void
  selectedTab: Tab<T>
}

type DefaultVariantProps = {
  tabsClassName?: string
  tabsWrapClassName?: string
  tabsColumnClassName?: string
  activeColumnClassName?: string
}

export const DefaultVariant = <T extends {} = {}>({
  tabs,
  selectedTab,
  onTabChange,
  tabsClassName,
  tabsWrapClassName,
  tabsColumnClassName,
  activeColumnClassName,
}: VariantProps<T> & DefaultVariantProps) => {
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
            className={clsx(tabsColumnClassName, selectedTab.id === tab.id && activeColumnClassName)}
          >
            {tab.label ?? tab.id}
          </div>
        ))}
      </div>
      <div role="tabpanel">{selectedTab.render?.(selectedTab)}</div>
    </div>
  )
}

export const Tabs = <T extends {}, E extends {} = DefaultVariantProps>({
  tabs,
  Variant = DefaultVariant<T>,
  onTabChange,
  ...rest
}: {
  tabs: Tab<T>[]
  Variant?: (props: VariantProps<T> & E) => ReactElement<any, any> | null
  onTabChange?: (currentTab: Tab<T>) => void
  // The finer-grained type of E is lost during destructuring, so a manual exclusion operation is performed to address this.
} & Omit<E, keyof VariantProps<T>>) => {
  if (tabs.length === 0) {
    throw new Error('Tabs must have at least one tab')
  }

  const [selectedTabId, setSelectedTabId] = useState<TabId>(tabs[0].id)
  const selectedTab = tabs.find(tab => tab.id === selectedTabId) ?? tabs[0]

  const combinedOnTabChange = useCallback<VariantProps<T>['onTabChange']>(
    id => {
      const selectedTab = tabs.find(tab => tab.id === id) ?? tabs[0]
      setSelectedTabId(selectedTab.id)
      onTabChange?.(selectedTab)
    },
    [onTabChange, tabs]
  )

  return (
    <Variant
      tabs={tabs}
      selectedTab={selectedTab}
      onTabChange={combinedOnTabChange}
      // Handling this properly would increase complexity, so I opted to do a direct type casting instead.
      {...(rest as unknown as E)}
    />
  )
}

export default Tabs
