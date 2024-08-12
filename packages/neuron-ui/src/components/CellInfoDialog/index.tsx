import React, { useCallback, useMemo, useState } from 'react'
import Dialog from 'widgets/Dialog'
import { calculateUsedCapacity, getExplorerUrl, shannonToCKBFormatter, truncateMiddle, useCopy } from 'utils'
import { useTranslation } from 'react-i18next'
import Tabs from 'widgets/Tabs'
import { type TFunction } from 'i18next'
import { Script } from '@ckb-lumos/lumos'
import Switch from 'widgets/Switch'
import { Copy, ExplorerIcon } from 'widgets/Icons/icon'
import Alert from 'widgets/Alert'
import { openExternal } from 'services/remote'
import styles from './cellInfoDialog.module.scss'

type ScriptRenderType = 'table' | 'raw'

const ScriptRender = ({ script, renderType }: { script?: Script; renderType: ScriptRenderType }) => {
  if (renderType === 'raw') {
    const scriptRaw = script
      ? `{
  "code_hash": "${script.codeHash}"
  "hash_type": "${script.hashType}"
  "args": "${script.args}"
}`
      : `{
  "null"
}`
    return <pre className={styles.preStyle}>{scriptRaw}</pre>
  }
  return (
    <table className={styles.scriptTable}>
      <thead>
        <tr>
          <td>KEY</td>
          <td>VALUE</td>
        </tr>
      </thead>
      <tbody>
        <tr>
          <td>code_hash</td>
          <td>{script?.codeHash ?? '--'}</td>
        </tr>
        <tr>
          <td>hash_type</td>
          <td>{script?.hashType ?? '--'}</td>
        </tr>
        <tr>
          <td>args</td>
          <td>{script?.args ?? '--'}</td>
        </tr>
      </tbody>
    </table>
  )
}

const tabIds = {
  lock: 'lock',
  type: 'type',
  data: 'data',
  capacityUsage: 'capacityUsage',
}

const useTabs = ({ t, output }: { t: TFunction; output?: State.DetailedOutput }) => {
  const [scriptRenderType, setScriptRenderType] = useState<ScriptRenderType>('table')
  const usedCapacity = useMemo(() => (output ? calculateUsedCapacity(output) : 0), [output])
  const tabs = [
    {
      id: tabIds.lock,
      label: 'Lock Script',
      render() {
        return <ScriptRender renderType={scriptRenderType} script={output?.lock} />
      },
    },
    {
      id: tabIds.type,
      label: 'Type Script',
      render() {
        return <ScriptRender renderType={scriptRenderType} script={output?.type} />
      },
    },
    {
      id: tabIds.data,
      label: 'Data',
      render() {
        return <pre className={styles.preStyle}>{output?.data}</pre>
      },
    },
    {
      id: tabIds.capacityUsage,
      label: t('cell-manage.cell-detail-dialog.capacity-used'),
      render() {
        return (
          <section className={styles.capacityUsed}>
            <div className={styles.slider}>
              <div style={{ width: `${(100 * usedCapacity) / +shannonToCKBFormatter(output?.capacity ?? '')}%` }} />
            </div>
            <div className={styles.capacityDetail}>
              {`Occupied ${usedCapacity} CKB, Declared ${shannonToCKBFormatter(output?.capacity ?? '')} CKB`}
            </div>
          </section>
        )
      },
    },
  ]
  const [currentTab, setCurrentTab] = useState(tabs[0])
  return {
    currentTab,
    setCurrentTab,
    tabs,
    setScriptRenderType,
    scriptRenderType,
  }
}

const CellInfoDialog = ({
  onCancel,
  output,
  isMainnet,
}: {
  onCancel: () => void
  output?: State.DetailedOutput
  isMainnet: boolean
}) => {
  const [t] = useTranslation()

  const { tabs, currentTab, setCurrentTab, scriptRenderType, setScriptRenderType } = useTabs({
    t,
    output,
  })
  const { copied, copyTimes, onCopy } = useCopy()
  const onOpenTx = useCallback(() => {
    const explorerUrl = getExplorerUrl(isMainnet)
    openExternal(`${explorerUrl}/transaction/${output?.outPoint.txHash}`)
  }, [isMainnet, output?.outPoint.txHash])
  if (!output) {
    return null
  }
  return (
    <Dialog
      show
      title={
        <div className={styles.title}>
          <span>{t('cell-manage.cell-detail-dialog.title')}</span>
          <div className={styles.outPoint}>
            {t('cell-manage.cell-detail-dialog.transaction-hash')}
            :&nbsp;&nbsp;
            {truncateMiddle(output.outPoint.txHash, 10, 10)}
            <Copy onClick={() => onCopy(output.outPoint.txHash)} />
            <ExplorerIcon onClick={onOpenTx} />
          </div>
        </div>
      }
      onCancel={onCancel}
      showFooter={false}
      className={styles.cellInfoDialog}
    >
      <div className={styles.content}>
        <Tabs
          tabs={tabs}
          onTabChange={setCurrentTab}
          tabsClassName={styles.tabsClassName}
          tabsWrapClassName={styles.tabsWrapClassName}
          tabsColumnClassName={styles.tabsColumnClassName}
          activeColumnClassName={styles.active}
        />
        {[tabIds.lock, tabIds.type].includes(currentTab.id) ? (
          <div className={styles.switchFormat}>
            Raw Data&nbsp;&nbsp;
            <Switch
              checked={scriptRenderType === 'raw'}
              onChange={checked => setScriptRenderType(checked ? 'raw' : 'table')}
            />
          </div>
        ) : null}
      </div>
      {copied ? (
        <Alert status="success" className={styles.notice} key={copyTimes.toString()}>
          {t('common.copied')}
        </Alert>
      ) : null}
    </Dialog>
  )
}

CellInfoDialog.displayName = 'CellInfoDialog'

export default CellInfoDialog
