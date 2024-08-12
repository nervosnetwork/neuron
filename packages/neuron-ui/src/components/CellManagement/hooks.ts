import { CkbAppNotFoundException, DeviceNotFoundException } from 'exceptions'
import { TFunction } from 'i18next'
import { useCallback, useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  connectDevice,
  getDeviceCkbAppVersion,
  getDevices,
  getLiveCells,
  getPlatform,
  updateLiveCellsLocalInfo,
  updateLiveCellsLockStatus as updateLiveCellsLockStatusAPI,
  updateWallet,
} from 'services/remote'
import { ControllerResponse } from 'services/remote/remoteApiWrapper'
import { AppActions, useDispatch } from 'states'
import { ErrorCode, LockScriptCategory, RoutePath, TypeScriptCategory, isSuccessResponse, outPointToStr } from 'utils'
import { SortType } from 'widgets/Table'

const cellTypeOrder: Record<string, number> = {
  [TypeScriptCategory.SUDT]: 0,
  [TypeScriptCategory.XUDT]: 1,
  [TypeScriptCategory.NFT]: 2,
  [TypeScriptCategory.Spore]: 3,
  [TypeScriptCategory.Unknown]: 4,
}

const getLockStatusAndReason = (item: State.LiveCellWithLocalInfo) => {
  if (item.locked) {
    return {
      locked: true,
    }
  }
  let lockedReason: { key: string; params?: Record<string, any> } | undefined
  if (item.typeScriptType) {
    switch (item.typeScriptType) {
      case TypeScriptCategory.NFT:
      case TypeScriptCategory.NFTClass:
      case TypeScriptCategory.NFTIssuer:
        lockedReason = { key: 'cell-manage.locked-reason.NFT-SUDT-DAO', params: { type: 'NTF' } }
        break
      case TypeScriptCategory.Spore:
        lockedReason = { key: 'cell-manage.locked-reason.NFT-SUDT-DAO', params: { type: 'Spore' } }
        break
      case TypeScriptCategory.SUDT:
        lockedReason = { key: 'cell-manage.locked-reason.NFT-SUDT-DAO', params: { type: 'SUDT' } }
        break
      case TypeScriptCategory.DAO:
        lockedReason = { key: 'cell-manage.locked-reason.NFT-SUDT-DAO', params: { type: 'Nervos DAO' } }
        break
      case TypeScriptCategory.XUDT:
        lockedReason = { key: 'cell-manage.locked-reason.NFT-SUDT-DAO', params: { type: 'XUDT' } }
        break
      case TypeScriptCategory.Unknown:
        lockedReason = { key: 'cell-manage.locked-reason.Unknown' }
        break
      default:
        break
    }
  } else {
    switch (item.lockScriptType) {
      case LockScriptCategory.Cheque:
        lockedReason = { key: 'cell-manage.locked-reason.cheque-acp-multisig', params: { type: 'Cheque' } }
        break
      case LockScriptCategory.ANYONE_CAN_PAY:
        lockedReason = { key: 'cell-manage.locked-reason.cheque-acp-multisig', params: { type: 'Acp' } }
        break
      case LockScriptCategory.MULTISIG:
        lockedReason = { key: 'cell-manage.locked-reason.cheque-acp-multisig', params: { type: 'Multisig' } }
        break
      case LockScriptCategory.MULTI_LOCK_TIME:
        lockedReason = { key: 'cell-manage.locked-reason.multi-locktime' }
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
      case TypeScriptCategory.NFT:
      case TypeScriptCategory.SUDT:
      case TypeScriptCategory.XUDT:
      case TypeScriptCategory.Spore:
      case TypeScriptCategory.Unknown:
        return item.typeScriptType
      default:
        break
    }
  }
  return item.lockScriptType === LockScriptCategory.Unknown ? LockScriptCategory.Unknown : 'CKB'
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

export const useLiveCells = ({
  initSortInfo,
}: {
  initSortInfo?: {
    key: KeyOfLiveCellWithLocalInfo
    direction: SortType
  }
}) => {
  const [sortInfo, setSortInfo] = useState<{ key: KeyOfLiveCellWithLocalInfo; direction: SortType } | undefined>(
    initSortInfo
  )
  const onSorted = useCallback((key?: KeyOfLiveCellWithLocalInfo, direction?: SortType) => {
    if (key && direction) {
      setSortInfo({ key, direction })
    } else {
      setSortInfo(undefined)
    }
  }, [])
  const [liveCells, setLiveCells] = useState<State.LiveCellWithLocalInfo[]>([])
  const sortedLiveCells = useMemo(() => {
    if (sortInfo && sortFunctions[sortInfo.key]) {
      const sorted = [...liveCells]
      return sorted.sort((a, b) => sortFunctions[sortInfo.key](a, b, sortInfo.direction))
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
    sortInfo,
  }
}

export enum Actions {
  View = 'view',
  Lock = 'lock',
  Unlock = 'unlock',
  Consume = 'consume',
  Consolidate = 'consolidate',
}

export const useAction = ({
  liveCells,
  currentPageLiveCells,
  updateLiveCellsLockStatus,
  selectedOutPoints,
  resetPassword,
  setError,
  password,
  verifyDeviceStatus,
  wallet,
}: {
  liveCells: State.LiveCellWithLocalInfo[]
  currentPageLiveCells: State.LiveCellWithLocalInfo[]
  updateLiveCellsLockStatus: (params: State.UpdateLiveCellsLockStatus) => Promise<void>
  selectedOutPoints: Set<string>
  resetPassword: () => void
  setError: (error: string) => void
  password: string
  verifyDeviceStatus: () => Promise<boolean>
  wallet: State.Wallet
}) => {
  const dispatch = useDispatch()
  const navigate = useNavigate()
  const [action, setAction] = useState<undefined | Actions>()
  const [operateCells, setOperateCells] = useState<State.LiveCellWithLocalInfo[]>([])
  const [loading, setLoading] = useState(false)
  const onOpenActionDialog = useCallback(
    async (e: React.SyntheticEvent<SVGSVGElement, MouseEvent>) => {
      e.stopPropagation()
      const { action: curAction, index } = e.currentTarget.dataset as { action: Actions; index: string }
      if (!curAction || index === undefined || !currentPageLiveCells[+index]) return
      const operateCell = currentPageLiveCells[+index]
      setOperateCells([operateCell])
      setAction(curAction)
      resetPassword()
      await verifyDeviceStatus()
    },
    [currentPageLiveCells, setOperateCells, dispatch, navigate]
  )
  const onMultiAction = useCallback(
    async (e: React.SyntheticEvent<HTMLButtonElement, MouseEvent>) => {
      e.stopPropagation()
      const { action: curAction } = e.currentTarget.dataset as { action: Actions }
      if (!curAction || !selectedOutPoints.size) return
      setOperateCells(liveCells.filter(v => selectedOutPoints.has(outPointToStr(v.outPoint))))
      setAction(curAction)
      resetPassword()
      await verifyDeviceStatus()
    },
    [liveCells, selectedOutPoints, setOperateCells, dispatch, navigate]
  )

  const getConsolidateAddress = useCallback(() => {
    const { addresses } = wallet
    if (addresses.length === 1) {
      return addresses[0].address
    }
    const unusedReceiveAddress = addresses.find(a => a.type === 0 && a.txCount === 0)?.address ?? ''

    return unusedReceiveAddress
  }, [wallet])

  const onActionConfirm = useCallback(async () => {
    switch (action) {
      case Actions.Lock:
      case Actions.Unlock:
        if (!(await verifyDeviceStatus())) return
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
      case Actions.Consume:
        dispatch({
          type: AppActions.UpdateConsumeCells,
          payload: operateCells.map(v => ({ outPoint: v.outPoint, capacity: v.capacity })),
        })
        navigate(`${RoutePath.Send}?isSendMax=true`)
        break
      case Actions.Consolidate:
        dispatch({
          type: AppActions.UpdateConsumeCells,
          payload: operateCells.map(v => ({ outPoint: v.outPoint, capacity: v.capacity })),
        })
        navigate(`${RoutePath.Send}?isSendMax=true&toAddress=${getConsolidateAddress()}`)
        break
      default:
        break
    }
  }, [action, operateCells, dispatch, navigate, password, getConsolidateAddress])
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
  const allLockedOutPoints = useMemo(
    () => new Set(liveCells.filter(v => !v.lockedReason && v.locked).map(v => outPointToStr(v.outPoint))),
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
  const hasSelectLocked = useMemo(
    () => [...selectedOutPoints].some(v => allLockedOutPoints.has(v)),
    [selectedOutPoints, allLockedOutPoints]
  )
  const isAllLocked = useMemo(
    () => [...selectedOutPoints].every(v => allLockedOutPoints.has(v)),
    [selectedOutPoints, allLockedOutPoints]
  )
  return {
    selectedOutPoints,
    onSelect,
    onSelectAll,
    isAllSelected: selectedOutPoints.size === allCanSelectOutPoints.size && !!allCanSelectOutPoints.size,
    hasSelectLocked,
    isAllLocked,
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

export const useHardWallet = ({ wallet, t }: { wallet: State.WalletIdentity; t: TFunction }) => {
  const isWin32 = useMemo<boolean>(() => {
    return getPlatform() === 'win32'
  }, [])
  const [error, setError] = useState<ErrorCode | string | undefined>()
  const isNotAvailable = useMemo(() => {
    return error === ErrorCode.DeviceNotFound || error === ErrorCode.CkbAppNotFound
  }, [error])

  const [deviceInfo, setDeviceInfo] = useState(wallet.device)
  const [isReconnecting, setIsReconnecting] = useState(false)

  const ensureDeviceAvailable = useCallback(
    async (device: State.DeviceInfo) => {
      try {
        const connectionRes = await connectDevice(device)
        let { descriptor } = device
        if (!isSuccessResponse(connectionRes)) {
          // for win32, opening or closing the ckb app changes the HID descriptor(deviceInfo),
          // so if we can't connect to the device, we need to re-search device automatically.
          // for unix, the descriptor never changes unless user plugs the device into another USB port,
          // in that case, mannauly re-search device one time will do.
          if (isWin32) {
            setIsReconnecting(true)
            const devicesRes = await getDevices(device)
            setIsReconnecting(false)
            if (isSuccessResponse(devicesRes) && Array.isArray(devicesRes.result) && devicesRes.result.length > 0) {
              const [updatedDeviceInfo] = devicesRes.result
              descriptor = updatedDeviceInfo.descriptor
              setDeviceInfo(updatedDeviceInfo)
            } else {
              throw new DeviceNotFoundException()
            }
          } else {
            throw new DeviceNotFoundException()
          }
        }

        // getDeviceCkbAppVersion will halt forever while in win32 sleep mode.
        const ckbVersionRes = await Promise.race([
          getDeviceCkbAppVersion(descriptor),
          new Promise<ControllerResponse>((_, reject) => {
            setTimeout(() => reject(), 1000)
          }),
        ]).catch(() => {
          return { status: ErrorCode.DeviceInSleep }
        })

        if (!isSuccessResponse(ckbVersionRes)) {
          if (ckbVersionRes.status !== ErrorCode.DeviceInSleep) {
            throw new CkbAppNotFoundException()
          } else {
            throw new DeviceNotFoundException()
          }
        }
        setError(undefined)
        return true
      } catch (err) {
        if (err instanceof CkbAppNotFoundException || err instanceof DeviceNotFoundException) {
          setError(err.code)
        }
        return false
      }
    },
    [isWin32]
  )

  const reconnect = useCallback(async () => {
    if (!deviceInfo) return
    setError(undefined)
    setIsReconnecting(true)
    try {
      const res = await getDevices(deviceInfo)
      if (isSuccessResponse(res) && Array.isArray(res.result) && res.result.length > 0) {
        const [device] = res.result
        setDeviceInfo(device)
        if (device.descriptor !== deviceInfo.descriptor) {
          await updateWallet({
            id: wallet.id,
            device,
          })
        }
        await ensureDeviceAvailable(device)
      } else {
        setError(ErrorCode.DeviceNotFound)
      }
    } catch (err) {
      setError(ErrorCode.DeviceNotFound)
    } finally {
      setIsReconnecting(false)
    }
  }, [deviceInfo, ensureDeviceAvailable, wallet.id])

  const verifyDeviceStatus = useCallback(async () => {
    if (deviceInfo) {
      return ensureDeviceAvailable(deviceInfo)
    }
    return true
  }, [ensureDeviceAvailable, deviceInfo])

  const errorMessage = useMemo(() => {
    switch (error) {
      case ErrorCode.DeviceNotFound:
        return t('hardware-verify-address.status.disconnect')
      case ErrorCode.CkbAppNotFound:
        return t(CkbAppNotFoundException.message)
      default:
        return error
    }
  }, [error, t])
  return {
    deviceInfo,
    isReconnecting,
    isNotAvailable,
    reconnect,
    verifyDeviceStatus,
    errorMessage,
    setError,
  }
}
