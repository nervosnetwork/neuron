import React from 'react'
import { type CKBComponents } from '@ckb-lumos/lumos/rpc'
import {
  LegacyMultiSigLockInfo,
  MultiSigLockInfo,
  LocktimeLockInfo,
  DefaultLockInfo,
  AnyoneCanPayLockInfoOnAggron,
  AnyoneCanPayLockInfoOnLina,
  ChequeLockInfoOnAggron,
  ChequeLockInfoOnLina,
  clsx,
} from 'utils'
import Tooltip from 'widgets/Tooltip'
import CopyZone from 'widgets/CopyZone'
import { Copy } from 'widgets/Icons/icon'
import styles from './scriptTag.module.scss'

const ScriptTag = ({
  script,
  isMainnet,
  onClick,
  className = '',
}: {
  script: CKBComponents.Script | null
  isMainnet: boolean
  onClick?: () => void
  className?: string
}) => {
  if (!script) {
    return null
  }

  const commonLockArray = [LegacyMultiSigLockInfo, MultiSigLockInfo, LocktimeLockInfo, DefaultLockInfo]

  const lockArray: Array<Record<'CodeHash' | 'HashType' | 'ArgsLen' | 'TagName', string>> = isMainnet
    ? [...commonLockArray, AnyoneCanPayLockInfoOnLina, ChequeLockInfoOnLina]
    : [...commonLockArray, AnyoneCanPayLockInfoOnAggron, ChequeLockInfoOnAggron]

  const foundLock = lockArray.find(
    (info: { CodeHash: string; HashType: string; ArgsLen: string }) =>
      script.codeHash === info.CodeHash &&
      script.hashType === info.HashType &&
      info.ArgsLen.split(',').includes(`${(script.args.length - 2) / 2}`)
  )

  if (!foundLock) {
    return null
  }

  if (LegacyMultiSigLockInfo.TagName === foundLock.TagName || MultiSigLockInfo.TagName === foundLock.TagName) {
    const isLegacy = LegacyMultiSigLockInfo.TagName === foundLock.TagName
    return (
      <div className={styles.tagWrap}>
        <Tooltip
          tip={
            <div>
              <div className={styles.titleWrap}>
                <p>Code Hash</p>
                <div className={clsx(styles.badge, isLegacy && styles.legacy)}>
                  {isLegacy ? 'Legacy' : 'Recommended'}
                </div>
              </div>
              <CopyZone content={foundLock.CodeHash} className={styles.copyLockCodeHash}>
                {foundLock.CodeHash}
                <Copy />
              </CopyZone>
            </div>
          }
          showTriangle
        >
          <button type="button" className={clsx(styles.tag, className)} onClick={onClick}>
            Multisig
            <span className={clsx(!isLegacy && styles.highlight)}>(@{foundLock.CodeHash.slice(0, 8)})</span>
          </button>
        </Tooltip>
      </div>
    )
  }
  return (
    <button type="button" className={clsx(styles.tag, className)} onClick={onClick}>
      {foundLock.TagName}
    </button>
  )
}

ScriptTag.displayName = 'ScriptTag'

export default ScriptTag
