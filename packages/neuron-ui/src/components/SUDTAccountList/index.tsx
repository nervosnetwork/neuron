import React, { useState, useCallback, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import SUDTAccountPile, { SUDTAccountPileProps } from 'components/SUDTAccountPile'
import SUDTCreateDialog, { TokenInfo, AccountType } from 'components/SUDTCreateDialog'
import SUDTUpdateDialog, { SUDTUpdateDialogProps } from 'components/SUDTUpdateDialog'
import Button from 'widgets/Button'
import Spinner, { SpinnerSize } from 'widgets/Spinner'
import PageContainer from 'components/PageContainer'
import { ReactComponent as Experiment } from 'widgets/Icons/Experiment.svg'
import { ReactComponent as EyesOpen } from 'widgets/Icons/EyesOpen.svg'
import { ReactComponent as EyesClose } from 'widgets/Icons/EyesClose.svg'
import { ReactComponent as Search } from 'widgets/Icons/SearchIcon.svg'
import { ReactComponent as AddSimple } from 'widgets/Icons/AddSimple.svg'
import SUDTReceiveDialog, { DataProps } from 'components/SUDTReceiveDialog'
import TableNoData from 'widgets/Icons/TableNoData.png'

import { useState as useGlobalState, useDispatch, AppActions, NeuronWalletActions } from 'states'
import {
  isMainnet as isMainnetUtil,
  RoutePath,
  CONSTANTS,
  isSuccessResponse,
  useIsInsufficientToCreateSUDTAccount,
  useOnGenerateNewAccountTransaction,
} from 'utils'

import { getSUDTAccountList, updateSUDTAccount, checkMigrateAcp } from 'services/remote'

import styles from './sUDTAccountList.module.scss'

const { DEFAULT_SUDT_FIELDS } = CONSTANTS

export type SUDTAccount = Omit<SUDTAccountPileProps, 'onClick'>

const SUDTAccountList = () => {
  const [t] = useTranslation()
  const navigate = useNavigate()
  const {
    wallet: { id: walletId, balance },
    chain: { networkID },
    settings: { networks = [] },
    sUDTAccounts,
  } = useGlobalState()
  const dispatch = useDispatch()

  const [keyword, setKeyword] = useState('')
  const [dialog, setDialog] = useState<{ id: string; action: 'create' | 'update' } | null>(null)
  const [isLoaded, setIsLoaded] = useState(false)
  const [insufficient, setInsufficient] = useState({ [AccountType.CKB]: false, [AccountType.SUDT]: false })

  const isMainnet = isMainnetUtil(networks, networkID)
  const [receiveData, setReceiveData] = useState<DataProps | null>(null)
  const [showBalance, setShowBalance] = useState(true)

  const existingAccountNames = sUDTAccounts.filter(acc => acc.accountName).map(acc => acc.accountName || '')

  useEffect(() => {
    checkMigrateAcp().then(res => {
      if (isSuccessResponse(res)) {
        if (res.result === false) {
          navigate(RoutePath.Overview)
        }
      } else {
        dispatch({
          type: AppActions.AddNotification,
          payload: {
            type: 'alert',
            timestamp: +new Date(),
            content: typeof res.message === 'string' ? res.message : res.message.content,
          },
        })
      }
    })
  }, [dispatch, navigate])
  useIsInsufficientToCreateSUDTAccount({ walletId, balance: BigInt(balance), setInsufficient })

  const fetchAndUpdateList = useCallback(() => {
    getSUDTAccountList({ walletID: walletId })
      .then(res => {
        if (isSuccessResponse(res)) {
          return res.result
        }
        throw new Error(res.message.toString())
      })
      .then((list: Controller.GetSUDTAccountList.Response) => {
        dispatch({
          type: NeuronWalletActions.GetSUDTAccountList,
          payload: list,
        })
      })
      .catch((err: Error) => console.error(err))
      .finally(() => {
        setIsLoaded(true)
      })
  }, [walletId, setIsLoaded, dispatch])

  useEffect(() => {
    let timer: ReturnType<typeof setInterval> | undefined
    if (walletId) {
      fetchAndUpdateList()
      timer = setInterval(() => {
        fetchAndUpdateList()
      }, 10000)
    }
    return () => {
      if (timer) {
        clearInterval(timer)
      }
      dispatch({
        type: AppActions.UpdateExperimentalParams,
        payload: null,
      })
    }
  }, [walletId, dispatch, isMainnet, fetchAndUpdateList])

  const onClick = (e: any) => {
    const {
      currentTarget: {
        dataset: { role, id },
      },
    } = e

    switch (role) {
      case 'edit': {
        if (id) {
          setDialog({ id, action: 'update' })
        }
        break
      }
      case 'receive': {
        const account = sUDTAccounts.find(a => a.accountId === id)
        if (!account) {
          break
        }
        setReceiveData({
          address: account.address,
          accountName: account.accountName ?? DEFAULT_SUDT_FIELDS.accountName,
          tokenName: account.tokenName ?? DEFAULT_SUDT_FIELDS.tokenName,
          symbol: account.symbol ?? DEFAULT_SUDT_FIELDS.symbol,
        })
        break
      }
      case 'send': {
        navigate(`${RoutePath.SUDTSend}/${id}`)
        break
      }
      default: {
        // ignore
      }
    }
  }

  const onKeywordChange = useCallback(
    (e: React.FormEvent<HTMLInputElement>) => {
      setKeyword(e.currentTarget.value)
    },
    [setKeyword]
  )

  const onTransactionGenerated = useCallback(() => {
    setDialog(null)
  }, [setDialog])

  const handleCreateAccount = useOnGenerateNewAccountTransaction({
    walletId,
    dispatch,
    onGenerated: onTransactionGenerated,
    t,
  })

  const onOpenCreateDialog = useCallback(() => {
    setDialog({ id: '', action: 'create' })
  }, [setDialog])

  const filteredAccounts = keyword
    ? sUDTAccounts.filter(
        account =>
          account.accountName?.toLowerCase().includes(keyword.toLowerCase()) ||
          account.tokenName?.toLowerCase().includes(keyword.toLowerCase()) ||
          account.symbol?.toLowerCase().includes(keyword.toLowerCase()) ||
          account.tokenId.toLowerCase() === keyword.toLowerCase()
      )
    : sUDTAccounts

  const accountToUpdate =
    dialog && dialog.action === 'update' && sUDTAccounts.find(account => account.accountId === dialog.id)

  const updateDialogProps: SUDTUpdateDialogProps | undefined = accountToUpdate
    ? {
        ...accountToUpdate,
        isMainnet,
        accountName: accountToUpdate.accountName || DEFAULT_SUDT_FIELDS.accountName,
        tokenName: accountToUpdate.tokenName || DEFAULT_SUDT_FIELDS.tokenName,
        symbol: accountToUpdate.symbol || DEFAULT_SUDT_FIELDS.symbol,
        isCKB: accountToUpdate.tokenId === DEFAULT_SUDT_FIELDS.CKBTokenId,
        onSubmit: (info: Omit<TokenInfo, 'isCKB'>) => {
          const params: any = { id: accountToUpdate.accountId }
          Object.keys(info).forEach(key => {
            if (info[key as keyof typeof info] !== accountToUpdate[key as keyof typeof accountToUpdate]) {
              params[key] = info[key as keyof typeof info]
            }
          })
          return updateSUDTAccount(params)
            .then(res => {
              if (isSuccessResponse(res)) {
                fetchAndUpdateList()
                setDialog(null)
                return true
              }
              throw new Error(typeof res.message === 'string' ? res.message : res.message.content)
            })
            .catch((err: Error) => {
              console.error(err)
              return false
            })
        },
        onCancel: () => {
          setDialog(null)
        },
        existingAccountNames: existingAccountNames.filter(name => name !== accountToUpdate.accountName),
      }
    : undefined

  return (
    <PageContainer
      head={
        <div className={styles.pageHeader}>
          <Experiment />
          <p>{t('s-udt.account-list.title')}</p>
          <Button className={styles.btn} type="text" onClick={() => setShowBalance(prev => !prev)}>
            {showBalance ? <EyesOpen /> : <EyesClose />}
          </Button>
        </div>
      }
    >
      <div className={styles.container}>
        <div className={styles.head}>
          <div className={styles.searchBox}>
            <Search />
            <input value={keyword} placeholder={t('s-udt.account-list.search')} onChange={onKeywordChange} />
          </div>
          <button type="button" onClick={onOpenCreateDialog} className={styles.addBtn}>
            <AddSimple /> {t('s-udt.create-dialog.create-asset-account')}
          </button>
        </div>

        {isLoaded ? (
          <>
            {filteredAccounts.length ? (
              <div className={styles.list}>
                {filteredAccounts.map(account => (
                  <SUDTAccountPile key={account.accountId} {...account} showBalance={showBalance} onClick={onClick} />
                ))}
              </div>
            ) : (
              <div className={styles.noRecords}>
                <img src={TableNoData} alt="No Data" />
                {t('s-udt.account-list.no-asset-accounts')}
              </div>
            )}
          </>
        ) : (
          <div className={styles.loading}>
            <Spinner size={SpinnerSize.large} />
          </div>
        )}

        {receiveData ? <SUDTReceiveDialog data={receiveData} onClose={() => setReceiveData(null)} /> : null}

        {accountToUpdate ? <SUDTUpdateDialog {...updateDialogProps!} /> : null}

        {dialog?.action === 'create' ? (
          <SUDTCreateDialog
            onSubmit={handleCreateAccount}
            onCancel={() => {
              setDialog(null)
            }}
            existingAccountNames={existingAccountNames}
            insufficient={insufficient}
            isMainnet={isMainnet}
          />
        ) : null}
      </div>
    </PageContainer>
  )
}

SUDTAccountList.displayName = 'SUDTAccountList'

export default SUDTAccountList
