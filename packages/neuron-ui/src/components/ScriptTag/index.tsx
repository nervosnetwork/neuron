import React from 'react'
import {
  MultiSigLockInfo,
  LocktimeLockInfo,
  DefaultLockInfo,
  AnyoneCanPayLockInfoOnAggron,
  AnyoneCanPayLockInfoOnLina,
  ChequeLockInfoOnAggron,
  ChequeLockInfoOnLina,
} from 'utils'
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

  const commonLockArray = [MultiSigLockInfo, LocktimeLockInfo, DefaultLockInfo]

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

  return (
    <button type="button" className={className || styles.tag} onClick={onClick}>
      {foundLock.TagName}
    </button>
  )
}

ScriptTag.displayName = 'ScriptTag'

export default ScriptTag
