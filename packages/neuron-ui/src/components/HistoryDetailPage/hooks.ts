import { TFunction } from 'i18next'
import { useCallback, useState } from 'react'

export const TabId = {
  Basic: 'Basic',
  Topology: 'Topology',
}

export const useTxTabs = ({ t }: { t: TFunction }) => {
  const tabs = [
    { id: TabId.Basic, label: t('send-tx-detail.basic-info') },
    { id: TabId.Topology, label: t('send-tx-detail.topology') },
  ]
  const [currentTab, setCurrentTab] = useState(tabs[0])
  return {
    currentTab,
    setCurrentTab,
    tabs,
  }
}

export const useCellInfoDialog = () => {
  const [outputCell, setOutputCell] = useState<State.DetailedOutput | undefined>()
  const onCancel = useCallback(() => {
    setOutputCell(undefined)
  }, [])
  return {
    outputCell,
    setOutputCell,
    onCancel,
  }
}
