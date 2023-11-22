import React, { useCallback, useMemo, useState } from 'react'
import { Attention, Consume, Copy, DetailIcon, EyesClose, EyesOpen, LockCell, NewTab, UnLock } from 'widgets/Icons/icon'
import PageContainer from 'components/PageContainer'
import { useTranslation } from 'react-i18next'
import Breadcrum from 'widgets/Breadcrum'
import Table, { TableProps, SortType } from 'widgets/Table'
import Pagination from 'widgets/Pagination'
import { useState as useGlobalState } from 'states'
import {
  shannonToCKBFormatter,
  uniformTimeFormatter,
  usePagination,
  isMainnet as isMainnetUtil,
  useCopy,
  clsx,
  outPointToStr,
  LockScriptCategory,
  getLockTimestamp,
} from 'utils'
import { HIDE_BALANCE } from 'utils/const'
import Tooltip from 'widgets/Tooltip'
import Dialog from 'widgets/Dialog'
import Alert from 'widgets/Alert'
import ShowOrEditDesc from 'widgets/ShowOrEditDesc'
import { TFunction } from 'i18next'
import TextField from 'widgets/TextField'
import { useSearchParams } from 'react-router-dom'
import { Actions, useAction, useLiveCells, usePassword, useSelect, useViewCell } from './hooks'
import styles from './cellManagement.module.scss'

const getColumns = ({
  updateLiveCell,
  t,
  onAction,
  isAllSelected,
  selectedOutPoints,
  onSelectAll,
  onSelect,
  epoch,
  bestKnownBlockTimestamp,
}: {
  updateLiveCell: (params: State.UpdateLiveCellLocalInfo) => void
  t: TFunction
  onAction: (e: React.SyntheticEvent<SVGSVGElement, MouseEvent>) => void
  isAllSelected: boolean
  selectedOutPoints: Set<string>
  onSelectAll: (e: React.ChangeEvent<HTMLInputElement>) => void
  onSelect: (e: React.ChangeEvent<HTMLInputElement>) => void
  epoch: string
  bestKnownBlockTimestamp: number
}): TableProps<State.LiveCellWithLocalInfo>['columns'] => {
  return [
    {
      dataIndex: 'select',
      width: '40px',
      title: (
        <label htmlFor="cell-manage-select-all">
          <input
            type="checkbox"
            id="cell-manage-select-all"
            onChange={onSelectAll}
            checked={isAllSelected}
            data-some-checked={!!selectedOutPoints.size && !isAllSelected}
          />
          <span />
        </label>
      ),
      render(_, __, item) {
        return (
          <label htmlFor={outPointToStr(item.outPoint)} onClick={e => e.stopPropagation()} role="presentation">
            <input
              id={outPointToStr(item.outPoint)}
              data-tx-hash={item.outPoint.txHash}
              data-index={item.outPoint.index}
              type="checkbox"
              onChange={onSelect}
              checked={selectedOutPoints.has(outPointToStr(item.outPoint))}
              disabled={!!item.lockedReason}
            />
            <span />
          </label>
        )
      },
    },
    {
      dataIndex: 'timestamp',
      title: t('cell-manage.table.head.date'),
      render(v: string) {
        if (+v) {
          const time = uniformTimeFormatter(v)
          return time.split(' ')[0]
        }
        return 'none'
      },
      sortable: true,
    },
    {
      dataIndex: 'cellType',
      title: t('cell-manage.table.head.type'),
      sortable: true,
    },
    {
      dataIndex: 'capacity',
      title: t('cell-manage.table.head.balance'),
      width: '200px',
      isBalance: true,
      render(capacity: string, _: number, __: State.LiveCellWithLocalInfo, show: boolean) {
        return <div>{show ? shannonToCKBFormatter(capacity || '0') : HIDE_BALANCE} CKB</div>
      },
      sortable: true,
    },
    {
      dataIndex: 'locked',
      title: t('cell-manage.table.head.status'),
      render(_, __, item: State.LiveCellWithLocalInfo) {
        const { locked, lockedReason } = item
        if (locked) {
          let params = lockedReason?.params
          let i18nKey = lockedReason?.key
          if (item.lockScriptType === LockScriptCategory.MULTI_LOCK_TIME) {
            if (bestKnownBlockTimestamp) {
              const { hasReached, lockTimestamp } = getLockTimestamp({
                lockArgs: item.lock.args,
                epoch,
                bestKnownBlockTimestamp,
              })
              if (hasReached) {
                i18nKey = 'cell-manage.locked-reason.multi-locktime-reached'
              } else {
                const targetTime = new Date(lockTimestamp)
                params = {
                  time: `${targetTime.getFullYear()}-${targetTime.getMonth() + 1}-${targetTime.getDate()}`,
                }
              }
            } else {
              params = { time: '--' }
            }
          }
          return (
            <div className={styles.lockedWithTip}>
              {t('cell-manage.table.locked')}
              {lockedReason ? (
                <Tooltip tip={t(i18nKey!, params)} className={styles.lockedTip} placement="top" showTriangle>
                  <Attention />
                </Tooltip>
              ) : null}
            </div>
          )
        }
        return t('cell-manage.table.unlocked')
      },
      sortable: true,
    },
    {
      dataIndex: 'description',
      title: t('cell-manage.table.head.description'),
      align: 'center',
      render(description: string, __, item) {
        return (
          <Tooltip
            tip={
              <ShowOrEditDesc
                description={description}
                descKey={`${item.outPoint.txHash}_${item.outPoint.index}`}
                onSubmitDescription={({ description: newDesc }) => {
                  updateLiveCell({ outPoint: item.outPoint, description: newDesc })
                }}
              />
            }
            showTriangle
            isTriggerNextToChild
            className={styles.description}
            tipClassName={styles.descTips}
          >
            <div className={styles.descText}>{description || t('cell-manage.table.default-description')}</div>
          </Tooltip>
        )
      },
    },
    {
      dataIndex: 'action',
      title: t('cell-manage.table.head.action'),
      render(_, index, item) {
        const { locked, lockedReason } = item
        return (
          <div className={styles.actions}>
            <DetailIcon onClick={onAction} data-action={Actions.View} data-index={index} />
            {locked ? (
              <UnLock
                data-disabled={!!lockedReason}
                onClick={onAction}
                data-action={Actions.Unlock}
                data-index={index}
              />
            ) : (
              <LockCell
                data-disabled={!!lockedReason}
                onClick={onAction}
                data-action={Actions.Lock}
                data-index={index}
              />
            )}
            <Consume
              data-disabled={!!locked}
              onClick={locked ? undefined : onAction}
              data-action={Actions.Consume}
              data-index={index}
            />
          </div>
        )
      },
    },
  ]
}

const CellManagement = () => {
  const {
    app: { epoch },
    wallet: { balance = '' },
    chain: {
      networkID,
      syncState: { bestKnownBlockTimestamp },
    },
    settings: { networks },
  } = useGlobalState()
  const isMainnet = isMainnetUtil(networks, networkID)
  const [t] = useTranslation()
  const [searchParams] = useSearchParams()
  const breadPages = useMemo(() => [{ label: t('cell-manage.title') }], [t])
  const [showBalance, setShowBalance] = useState(true)
  const onChangeShowBalance = useCallback(() => setShowBalance(v => !v), [])
  const initSortInfo = searchParams.get('order')
    ? {
        key: searchParams.get('order') as keyof State.LiveCellWithLocalInfo,
        direction: SortType.Decrease,
      }
    : undefined
  const { liveCells, updateLiveCell, onSorted, updateLiveCellsLockStatus } = useLiveCells({ initSortInfo })
  const { pageNo, pageSize, onPageChange } = usePagination()
  const currentPageLiveCells = useMemo(() => {
    return liveCells.slice(pageSize * (pageNo - 1), pageSize * pageNo)
  }, [pageNo, pageSize, liveCells])
  const { onSelect, onSelectAll, isAllSelected, selectedOutPoints, hasSelectLocked, isAllLocked } = useSelect(liveCells)
  const { password, error, onPasswordChange, setError, resetPassword } = usePassword()
  const { action, operateCells, onActionCancel, onActionConfirm, onOpenActionDialog, onMultiAction, loading } =
    useAction({
      liveCells,
      currentPageLiveCells,
      updateLiveCellsLockStatus,
      selectedOutPoints,
      setError,
      resetPassword,
      password,
    })
  const columns = useMemo(
    () =>
      getColumns({
        updateLiveCell,
        t,
        onAction: onOpenActionDialog,
        onSelect,
        onSelectAll,
        isAllSelected,
        selectedOutPoints,
        epoch,
        bestKnownBlockTimestamp,
      }),
    [
      updateLiveCell,
      t,
      onOpenActionDialog,
      onSelect,
      onSelectAll,
      isAllSelected,
      selectedOutPoints,
      epoch,
      bestKnownBlockTimestamp,
    ]
  )
  const { copied, onCopy, copyTimes } = useCopy()
  const { onViewDetail, rawData, rawLock, rawType, usedCapacity } = useViewCell({
    viewCell: operateCells[0],
    isMainnet,
  })
  const totalCapacity = useMemo(
    () => shannonToCKBFormatter(operateCells.reduce((pre, cur) => pre + BigInt(cur.capacity), BigInt(0)).toString()),
    [operateCells]
  )
  return (
    <PageContainer
      head={
        <div className={styles.head}>
          <Breadcrum pages={breadPages} showBackIcon />
          <div className={styles.balance}>
            {showBalance ? <EyesOpen onClick={onChangeShowBalance} /> : <EyesClose onClick={onChangeShowBalance} />}
            <span>{t('cell-manage.wallet-balance')}</span>
            &nbsp;&nbsp;
            {`${showBalance ? shannonToCKBFormatter(balance) : HIDE_BALANCE} CKB`}
          </div>
        </div>
      }
    >
      <div className={styles.table}>
        <Table
          head={<div className={styles.tableHead}>Live Cells&nbsp;({liveCells.length})</div>}
          columns={columns}
          dataSource={currentPageLiveCells}
          onSorted={onSorted}
          initSortInfo={initSortInfo}
        />
        {selectedOutPoints.size ? (
          <div className={styles.multiActions}>
            <button type="button" disabled={isAllLocked} onClick={onMultiAction} data-action={Actions.Lock}>
              <LockCell />
              {t('cell-manage.lock')}
            </button>
            <button type="button" disabled={!hasSelectLocked} onClick={onMultiAction} data-action={Actions.Unlock}>
              <UnLock />
              {t('cell-manage.unlock')}
            </button>
            <button type="button" disabled={hasSelectLocked} onClick={onMultiAction} data-action={Actions.Consume}>
              <Consume />
              {t('cell-manage.consume')}
            </button>
          </div>
        ) : null}
      </div>
      <Pagination
        className={styles.container}
        count={liveCells.length}
        pageSize={pageSize}
        pageNo={pageNo}
        onChange={onPageChange}
      />
      <Dialog
        show={action === Actions.View}
        title={t('cell-manage.cell-detail-dialog.title')}
        onCancel={onActionCancel}
        showFooter={false}
        className={styles.cellDetailDialog}
      >
        <section className={styles.section}>
          <h6 className={styles.title}>OutPoint.TxHash</h6>
          <div className={styles.txHash}>
            <p>{operateCells[0]?.outPoint.txHash}</p>
            <div className={styles.cellActions}>
              <Copy onClick={() => onCopy(operateCells[0]!.outPoint.txHash)} />
              <NewTab onClick={onViewDetail} data-tx-hash={operateCells[0]?.outPoint.txHash} />
            </div>
          </div>
        </section>
        <section className={styles.section}>
          <h6 className={styles.title}>Lock Script</h6>
          <pre>{rawLock}</pre>
        </section>
        <section className={styles.section}>
          <h6 className={styles.title}>Type Script</h6>
          <pre>{rawType}</pre>
        </section>
        <section className={styles.section}>
          <h6 className={styles.title}>{t('cell-manage.cell-detail-dialog.data')}</h6>
          <pre>{rawData}</pre>
        </section>
        {copied ? (
          <Alert status="success" className={styles.notice} key={copyTimes.toString()}>
            {t('common.copied')}
          </Alert>
        ) : null}
        <section className={styles.section}>
          <h6 className={clsx(styles.title, styles.capacity)}>
            {t('cell-manage.cell-detail-dialog.capacity-used')}
            <div className={styles.capacityDetail}>
              {t('cell-manage.cell-detail-dialog.total')}
              &nbsp;{shannonToCKBFormatter(operateCells[0]?.capacity ?? '')} CKB ，
              {t('cell-manage.cell-detail-dialog.used')}
              &nbsp;{usedCapacity} CKB
            </div>
          </h6>
          <div className={styles.slider}>
            <div
              style={{ width: `${(100 * usedCapacity) / +shannonToCKBFormatter(operateCells[0]?.capacity ?? '')}%` }}
            />
          </div>
        </section>
      </Dialog>
      <Dialog
        show={action === Actions.Lock || action === Actions.Unlock}
        title={t(`cell-manage.cell-${action}-dialog.title`)}
        onCancel={onActionCancel}
        onConfirm={onActionConfirm}
        className={styles.lockCell}
        disabled={!password || !!error}
        isLoading={loading}
      >
        <p className={styles.cellsCapacity}>
          {t(`cell-manage.cell-${action}-dialog.capacity`, { capacity: totalCapacity })}
        </p>
        <TextField
          className={styles.passwordInput}
          placeholder={t('cell-manage.password-placeholder')}
          width="100%"
          label={t('cell-manage.enter-password')}
          value={password}
          field="password"
          type="password"
          title={t('cell-manage.enter-password')}
          onChange={onPasswordChange}
          autoFocus
          error={error}
        />
        {action === Actions.Lock ? (
          <span className={styles.canNotUse}>
            <Attention />
            {t('cell-manage.cell-lock-dialog.locked-cell-can-not-use')}
          </span>
        ) : null}
      </Dialog>
      <Dialog
        show={action === Actions.Consume}
        title={t('cell-manage.cell-consume-dialog.title')}
        onCancel={onActionCancel}
        onConfirm={onActionConfirm}
      >
        <span className={styles.consumeNotice}>{t('cell-manage.cell-consume-dialog.warn-consume')}</span>
      </Dialog>
    </PageContainer>
  )
}

CellManagement.displayName = 'CellManage'
export default CellManagement
