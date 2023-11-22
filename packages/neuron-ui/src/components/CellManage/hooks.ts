import { useCallback, useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  openExternal,
  getLiveCells,
  updateLiveCellsLocalInfo,
  updateLiveCellsLockStatus as updateLiveCellsLockStatusAPI,
} from 'services/remote'
import { AppActions, useDispatch } from 'states'
import {
  LockScriptType,
  RoutePath,
  TypeScriptType,
  calculateUsedCapacity,
  getExplorerUrl,
  isSuccessResponse,
  outPointToStr,
} from 'utils'
import { SortType } from 'widgets/Table'

const cellTypeOrder: Record<string, number> = {
  [TypeScriptType.SUDT]: 1,
  [TypeScriptType.NFT]: 2,
  [TypeScriptType.Unknown]: 3,
}

const getLockStatusAndReason = (item: State.LiveCellWithLocalInfo) => {
  if (item.locked) {
    return {
      locked: true,
    }
  }
  let lockedReason = ''
  if (item.typeScriptType) {
    switch (item.typeScriptType) {
      case TypeScriptType.NFT:
      case TypeScriptType.NFTClass:
      case TypeScriptType.NFTIssuer:
      case TypeScriptType.Unknown:
        lockedReason = 'cell-manage.locked-reason.operate-in-special-assets'
        break
      case TypeScriptType.SUDT:
        lockedReason = 'cell-manage.locked-reason.operate-in-assets-account'
        break
      case TypeScriptType.DAO:
        lockedReason = 'cell-manage.locked-reason.operate-in-dao'
        break
      default:
        break
    }
  } else {
    switch (item.lockScriptType) {
      case LockScriptType.Cheque:
      case LockScriptType.ANYONE_CAN_PAY:
      case LockScriptType.MULTI_LOCK_TIME:
        lockedReason = 'cell-manage.locked-reason.operate-in-special-assets'
        break
      case LockScriptType.MULTISIG:
        lockedReason = 'cell-manage.locked-reason.operate-in-multisig'
        break
      default:
        break
    }
  }
  return {
    locked: !!lockedReason,
    lockedReason,
  }
}

const getCellType = (item: State.LiveCellWithLocalInfo) => {
  if (item.typeScriptType) {
    switch (item.typeScriptType) {
      case TypeScriptType.NFT:
      case TypeScriptType.SUDT:
      case TypeScriptType.Unknown:
        return item.typeScriptType
      default:
        break
    }
  }
  return item.lockScriptType === LockScriptType.Unknown ? LockScriptType.Unknown : 'CKB'
}

const sortFunctions: Record<
  string,
  (a: State.LiveCellWithLocalInfo, b: State.LiveCellWithLocalInfo, type: SortType) => number
> = {
  timestamp: (a, b, orderDirection) =>
    orderDirection === SortType.Increase ? +a.timestamp - +b.timestamp : +b.timestamp - +a.timestamp,
  capacity: (a, b, orderDirection) =>
    orderDirection === SortType.Increase ? +a.capacity - +b.capacity : +b.capacity - +a.capacity,
  locked: (a, b, orderDirection) => {
    const aLockedNum = a.locked ? 1 : 0
    const bLockedNum = b.locked ? 1 : 0
    return orderDirection === SortType.Increase ? aLockedNum - bLockedNum : bLockedNum - aLockedNum
  },
  cellType: (a, b, orderDirection) => {
    const aOrderNum = a.typeScriptType ? cellTypeOrder[a.typeScriptType] ?? 0 : 0
    const bOrderNum = b.typeScriptType ? cellTypeOrder[b.typeScriptType] ?? 0 : 0
    return orderDirection === SortType.Increase ? aOrderNum - bOrderNum : bOrderNum - aOrderNum
  },
}

type KeyOfLiveCellWithLocalInfo = keyof State.LiveCellWithLocalInfo

export const useLiveCells = () => {
  const [sortInfo, setSortInfo] = useState<{ key: KeyOfLiveCellWithLocalInfo; type: SortType } | undefined>()
  const onSorted = useCallback((key?: KeyOfLiveCellWithLocalInfo, type?: SortType) => {
    if (key && type) {
      setSortInfo({ key, type })
    } else {
      setSortInfo(undefined)
    }
  }, [])
  const [liveCells, setLiveCells] = useState<State.LiveCellWithLocalInfo[]>([])
  const sortedLiveCells = useMemo(() => {
    if (sortInfo && sortFunctions[sortInfo.key]) {
      const sorted = [...liveCells]
      return sorted.sort((a, b) => sortFunctions[sortInfo.key](a, b, sortInfo.type))
    }
    return liveCells
  }, [sortInfo, liveCells])
  useEffect(() => {
    getLiveCells().then(res => {
      if (isSuccessResponse(res) && res.result) {
        setLiveCells(res.result.map(v => ({ ...v, ...getLockStatusAndReason(v), cellType: getCellType(v) })))
      }
    })
  }, [])

  const updateLiveCell = useCallback((params: State.UpdateLiveCellLocalInfo) => {
    updateLiveCellsLocalInfo(params).then(res => {
      if (isSuccessResponse(res)) {
        setLiveCells(cells =>
          cells.map(v => {
            if (v.outPoint.txHash === params.outPoint.txHash && v.outPoint.index === params.outPoint.index) {
              return {
                ...v,
                description: params.description ?? v.description,
                locked: params.locked ?? v.locked,
              }
            }
            return v
          })
        )
      }
    })
  }, [])

  const updateLiveCellsLockStatus = useCallback((params: State.UpdateLiveCellsLockStatus) => {
    return updateLiveCellsLockStatusAPI(params).then(res => {
      if (isSuccessResponse(res)) {
        const outPointSet = new Set(params.outPoints.map(outPointToStr))
        setLiveCells(cells =>
          cells.map(v => {
            if (outPointSet.has(outPointToStr(v.outPoint))) {
              return {
                ...v,
                locked: params.locked,
              }
            }
            return v
          })
        )
      } else {
        throw new Error(typeof res.message === 'string' ? res.message : res.message.content)
      }
    })
  }, [])

  return {
    liveCells: sortedLiveCells,
    updateLiveCell,
    onSorted,
    updateLiveCellsLockStatus,
  }
}

export enum Actions {
  View = 'view',
  Lock = 'lock',
  Unlock = 'unlock',
  Consume = 'consume',
}

export const useAction = ({
  liveCells,
  currentPageLiveCells,
  updateLiveCellsLockStatus,
  selectedOutPoints,
  resetPassword,
  setError,
  password,
}: {
  liveCells: State.LiveCellWithLocalInfo[]
  currentPageLiveCells: State.LiveCellWithLocalInfo[]
  updateLiveCellsLockStatus: (params: State.UpdateLiveCellsLockStatus) => Promise<void>
  selectedOutPoints: Set<string>
  resetPassword: () => void
  setError: (error: string) => void
  password: string
}) => {
  const dispatch = useDispatch()
  const navigate = useNavigate()
  const [action, setAction] = useState<undefined | Actions>()
  const [operateCells, setOperateCells] = useState<State.LiveCellWithLocalInfo[]>([])
  const [loading, setLoading] = useState(false)
  const onClickTableRow = useCallback((_, item: State.LiveCellWithLocalInfo) => {
    setAction(Actions.View)
    setOperateCells([item])
  }, [])
  const onOpenActionDialog = useCallback(
    (e: React.SyntheticEvent<SVGSVGElement, MouseEvent>) => {
      e.stopPropagation()
      const { action: curAction, index } = e.currentTarget.dataset as { action: Actions; index: string }
      if (!curAction || index === undefined || !currentPageLiveCells[+index]) return
      const operateCell = currentPageLiveCells[+index]
      setOperateCells([operateCell])
      setAction(curAction)
      resetPassword()
    },
    [currentPageLiveCells, setOperateCells, dispatch, navigate]
  )
  const onMultiAction = useCallback(
    (e: React.SyntheticEvent<HTMLButtonElement, MouseEvent>) => {
      e.stopPropagation()
      const { action: curAction } = e.currentTarget.dataset as { action: Actions }
      if (!curAction || !selectedOutPoints.size) return
      setOperateCells(liveCells.filter(v => selectedOutPoints.has(outPointToStr(v.outPoint))))
      setAction(curAction)
      resetPassword()
    },
    [liveCells, selectedOutPoints, setOperateCells, dispatch, navigate]
  )
  const onActionConfirm = useCallback(() => {
    switch (action) {
      case 'lock':
      case 'unlock':
        setLoading(true)
        updateLiveCellsLockStatus({
          outPoints: operateCells.map(v => v.outPoint),
          lockScripts: operateCells.map(v => v.lock),
          locked: action === 'lock',
          password,
        })
          .then(() => {
            setOperateCells([])
            setAction(undefined)
          })
          .catch((err: Error) => {
            setError(err.message)
          })
          .finally(() => {
            setLoading(false)
          })
        break
      case 'consume':
        dispatch({
          type: AppActions.UpdateConsumeOutPoints,
          payload: operateCells.map(v => v.outPoint),
        })
        navigate(RoutePath.Send)
        break
      default:
        break
    }
  }, [action, operateCells, dispatch, navigate, password])
  const onActionCancel = useCallback(() => {
    setAction(undefined)
    setOperateCells([])
  }, [])
  return {
    action,
    loading,
    operateCells,
    onOpenActionDialog,
    onActionConfirm,
    onClickTableRow,
    onActionCancel,
    onMultiAction,
  }
}

export const useSelect = (liveCells: State.LiveCellWithLocalInfo[]) => {
  const [selectedOutPoints, setSelectOutPoints] = useState(new Set<string>())
  const allCanSelectOutPoints = useMemo(
    () => new Set(liveCells.filter(v => !v.lockedReason).map(v => outPointToStr(v.outPoint))),
    [liveCells]
  )
  const onSelectAll = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      if (e.target.checked) {
        setSelectOutPoints(allCanSelectOutPoints)
      } else {
        setSelectOutPoints(new Set())
      }
    },
    [allCanSelectOutPoints]
  )
  const onSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    e.stopPropagation()
    const { txHash, index } = e.target.dataset
    if (txHash && index) {
      if (e.target.checked) {
        setSelectOutPoints(v => new Set([...v, outPointToStr({ txHash, index })]))
      } else {
        setSelectOutPoints(v => {
          const newSelects = new Set([...v])
          newSelects.delete(outPointToStr({ txHash, index }))
          return newSelects
        })
      }
    }
  }, [])
  return {
    selectedOutPoints,
    onSelect,
    onSelectAll,
    isAllSelected: selectedOutPoints.size === allCanSelectOutPoints.size && !!allCanSelectOutPoints.size,
  }
}

export const useViewCell = ({ isMainnet, viewCell }: { isMainnet: boolean; viewCell: State.LiveCellWithLocalInfo }) => {
  const onViewDetail = useCallback(
    (e: React.SyntheticEvent<SVGSVGElement, MouseEvent>) => {
      const {
        dataset: { txHash },
      } = e.currentTarget
      if (!txHash) {
        return
      }
      const explorerUrl = getExplorerUrl(isMainnet)
      openExternal(`${explorerUrl}/transaction/${txHash}`)
    },
    [isMainnet]
  )
  const rawLock = `{
  "code_hash": "${viewCell?.lock.codeHash}"
  "hash_type": "${viewCell?.lock.hashType}"
  "args": "${viewCell?.lock.args}"
}`
  const rawType = viewCell?.type
    ? `{
  "code_hash": "${viewCell.type.codeHash}"
  "hash_type": "${viewCell.type.hashType}"
  "args": "${viewCell.type.args}"
}`
    : `{
  "null"
}`
  const rawData = `{
  "data": "${viewCell?.data ?? '0x'}"
}`
  const usedCapacity = useMemo(() => {
    if (!viewCell) {
      return 0
    }
    return calculateUsedCapacity(viewCell)
  }, [viewCell])
  return {
    onViewDetail,
    rawData,
    rawLock,
    rawType,
    usedCapacity,
  }
}

export const usePassword = () => {
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const onPasswordChange = useCallback((e: React.SyntheticEvent<HTMLInputElement>) => {
    const { value } = e.target as HTMLInputElement
    setPassword(value)
    setError('')
  }, [])
  const resetPassword = useCallback(() => {
    setPassword('')
    setError('')
  }, [])
  return {
    password,
    error,
    setError,
    onPasswordChange,
    resetPassword,
  }
}
