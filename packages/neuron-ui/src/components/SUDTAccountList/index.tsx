import React, { useState, useCallback, useEffect } from 'react'
import { useHistory } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { SpinnerSize, SearchBox } from 'office-ui-fabric-react'
import SUDTAccountPile, { SUDTAccountPileProps } from 'components/SUDTAccountPile'
import SUDTCreateDialog, { TokenInfo, AccountType } from 'components/SUDTCreateDialog'
import SUDTUpdateDialog, { SUDTUpdateDialogProps } from 'components/SUDTUpdateDialog'
import Experimental from 'widgets/ExperimentalRibbon'
import Spinner from 'widgets/Spinner'

import { useState as useGlobalState, useDispatch, AppActions } from 'states'
import {
  isMainnet as isMainnetUtil,
  RoutePath,
  SyncStatus,
  CONSTANTS,
  getSyncStatus,
  getCurrentUrl,
  sortAccounts,
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
  const history = useHistory()
  const {
    wallet: { id: walletId, balance },
    chain: {
      networkID,
      syncState: { cacheTipBlockNumber, bestKnownBlockNumber, bestKnownBlockTimestamp },
    },
    settings: { networks = [] },
  } = useGlobalState()
  const dispatch = useDispatch()

  const [accounts, setAccounts] = useState<SUDTAccount[]>([])
  const [keyword, setKeyword] = useState('')
  const [dialog, setDialog] = useState<{ id: string; action: 'create' | 'update' } | null>(null)
  const [isLoaded, setIsLoaded] = useState(false)
  const [insufficient, setInsufficient] = useState({ [AccountType.CKB]: false, [AccountType.SUDT]: false })

  const isMainnet = isMainnetUtil(networks, networkID)

  const existingAccountNames = accounts.filter(acc => acc.accountName).map(acc => acc.accountName || '')

  useEffect(() => {
    checkMigrateAcp().then(res => {
      if (isSuccessResponse(res)) {
        if (res.result === false) {
          history.push(RoutePath.Overview)
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
  }, [dispatch, history])
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
        setAccounts(
          list
            .filter(account => account.id !== undefined)
            .sort(sortAccounts)
            .map(({ id, accountName, tokenName, symbol, tokenID, balance: accountBalance, address, decimal }) => ({
              accountId: id!.toString(),
              accountName,
              tokenName,
              symbol,
              balance: accountBalance,
              address,
              decimal,
              tokenId: tokenID,
            }))
        )
      })
      .catch((err: Error) => console.error(err))
      .finally(() => {
        setIsLoaded(true)
      })
  }, [walletId, setAccounts, setIsLoaded])

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
  }, [walletId, setAccounts, dispatch, isMainnet, fetchAndUpdateList])

  const onClick = (e: any) => {
    const {
      target: {
        dataset: { role },
      },
      currentTarget: {
        dataset: { id },
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
        const account = accounts.find(a => a.accountId === id)
        if (!account) {
          break
        }
        const query = new URLSearchParams({
          address: account.address,
          accountName: account.accountName ?? DEFAULT_SUDT_FIELDS.accountName,
          tokenName: account.tokenName ?? DEFAULT_SUDT_FIELDS.tokenName,
          symbol: account.symbol ?? DEFAULT_SUDT_FIELDS.symbol,
        })
        history.push(`${RoutePath.SUDTReceive}?${query}`)
        break
      }
      case 'send': {
        history.push(`${RoutePath.SUDTSend}/${id}`)
        break
      }
      default: {
        // ignore
      }
    }
  }

  const onKeywordChange = useCallback(
    (_e?: React.ChangeEvent<HTMLInputElement>, newValue?: string) => {
      if (newValue !== undefined) {
        setKeyword(newValue)
      }
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
  })

  const onOpenCreateDialog = useCallback(() => {
    setDialog({ id: '', action: 'create' })
  }, [setDialog])

  const filteredAccounts = keyword
    ? accounts.filter(
        account =>
          account.accountName?.toLowerCase().includes(keyword.toLowerCase()) ||
          account.tokenName?.toLowerCase().includes(keyword.toLowerCase()) ||
          account.symbol?.toLowerCase().includes(keyword.toLowerCase()) ||
          account.tokenId.toLowerCase() === keyword.toLowerCase()
      )
    : accounts

  const accountToUpdate =
    dialog && dialog.action === 'update' && accounts.find(account => account.accountId === dialog.id)

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

  const EXPERIMENTAL_TAG = 'sudt-accounts'

  if (!isLoaded) {
    return (
      <div className={styles.loading}>
        <div className={styles.title}>{t('s-udt.account-list.title')}</div>
        <Experimental tag={EXPERIMENTAL_TAG} />
        <Spinner size={SpinnerSize.large} />
      </div>
    )
  }
  const syncStatus = getSyncStatus({
    bestKnownBlockNumber,
    bestKnownBlockTimestamp,
    cacheTipBlockNumber,
    currentTimestamp: Date.now(),
    url: getCurrentUrl(networkID, networks),
  })

  let prompt = ''
  if (SyncStatus.SyncCompleted !== syncStatus) {
    prompt = t('s-udt.account-list.syncing')
  } else if (!filteredAccounts.length) {
    prompt = t('s-udt.account-list.no-asset-accounts')
  }

  return (
    <div className={styles.container}>
      <div className={styles.title}>{t('s-udt.account-list.title')}</div>
      <Experimental tag={EXPERIMENTAL_TAG} />
      <div className={styles.header}>
        <SearchBox
          value={keyword}
          styles={{
            root: {
              background: '#e3e3e3',
              border: 'none',
              borderRadius: 0,
              fontSize: '1rem',
            },
          }}
          placeholder={t('s-udt.account-list.search')}
          onChange={onKeywordChange}
          iconProps={{ iconName: 'Search', styles: { root: { height: '18px' } } }}
        />
        <div role="presentation" onClick={onOpenCreateDialog} className={styles.add} />
      </div>
      <div className={styles.notice}>{prompt}</div>
      <div className={styles.list}>
        {filteredAccounts.map(account => (
          <SUDTAccountPile key={account.accountId} {...account} onClick={onClick} />
        ))}
      </div>
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
  )
}

SUDTAccountList.displayName = 'SUDTAccountList'

export default SUDTAccountList
