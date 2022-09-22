import React from 'react'
import { ReactComponent as ExplorerSvg } from './Explorer.svg'
import { ReactComponent as SearchSvg } from './Search.svg'
import { ReactComponent as FirstPageSvg } from './FirstPage.svg'
import { ReactComponent as PreviousPageSvg } from './PreviousPage.svg'
import { ReactComponent as LastPageSvg } from './LastPage.svg'
import { ReactComponent as NextPageSvg } from './NextPage.svg'
import { ReactComponent as MatchedSvg } from './Matched.svg'
import { ReactComponent as InfoCircleOutlinedSvg } from './InfoCircleOutlined.svg'
import { ReactComponent as CheckSvg } from './Check.svg'
import { ReactComponent as CloseSvg } from './Close.svg'
import { ReactComponent as MoreSvg } from './More.svg'
import { ReactComponent as ArrowDownSvg } from './ArrowToNext.svg'
import { ReactComponent as AlertSvg } from './Alert.svg'
import { ReactComponent as CopyOutlinedSvg } from './CopyOutlined.svg'
import { ReactComponent as RightOutlinedSvg } from './RightOutlined.svg'
import { ReactComponent as ScanOutlinedSvg } from './ScanOutlined.svg'
import { ReactComponent as UploadOutlinedSvg } from './UploadOutlined.svg'
import { ReactComponent as PlusSvg } from './Plus.svg'
import { ReactComponent as ArrowLeftOutlinedSvg } from './ArrowLeftOutlined.svg'
import { ReactComponent as ConnectedSvg } from './Connected.svg'
import { ReactComponent as KeystoreSvg } from './Keystore.svg'
import { ReactComponent as SettingsSvg } from './Settings.svg'
import { ReactComponent as PendingIconSvg } from './PendingIcon.svg'
import { ReactComponent as NewTabSvg } from './new_tab.svg'
import { ReactComponent as TooltipSvg } from './Tooltip.svg'
import { ReactComponent as OpenFolderSvg } from './OpenFolder.svg'
import { ReactComponent as SuccessInfoSvg } from './SuccessInfo.svg'
import { ReactComponent as ErrorSvg } from './Error.svg'
import { ReactComponent as LoadingSvg } from './Loading.svg'
import { ReactComponent as AttentionSvg } from './ExperimentalAttention.svg'
import { ReactComponent as AttentionOutlineSvg } from './AttentionOutline.svg'
import { ReactComponent as PasswordHideSvg } from './PasswordHide.svg'
import { ReactComponent as PasswordShowSvg } from './PasswordShow.svg'

import styles from './icon.module.scss'

function WrapSvg(SvgComponent: React.FC<React.SVGProps<SVGSVGElement>>) {
  return ({
    type,
    className,
    ...props
  }: { type?: 'success' | 'activity' | 'error' } & React.SVGProps<SVGSVGElement> = {}) => {
    return <SvgComponent className={`${type ? styles[type] : ''} ${className || ''}`} {...props} />
  }
}

export const Explorer = WrapSvg(ExplorerSvg)
export const Search = WrapSvg(SearchSvg)
export const FirstPage = WrapSvg(FirstPageSvg)
export const PreviousPage = WrapSvg(PreviousPageSvg)
export const LastPage = WrapSvg(LastPageSvg)
export const NextPage = WrapSvg(NextPageSvg)
export const Matched = WrapSvg(MatchedSvg)
export const InfoCircleOutlined = WrapSvg(InfoCircleOutlinedSvg)
export const Close = WrapSvg(CloseSvg)
export const More = WrapSvg(MoreSvg)
export const ArrowDown = WrapSvg(ArrowDownSvg)
export const Alert = WrapSvg(AlertSvg)
export const Check = WrapSvg(CheckSvg)
export const CopyOutlined = WrapSvg(CopyOutlinedSvg)
export const RightOutlined = WrapSvg(RightOutlinedSvg)
export const ScanOutlined = WrapSvg(ScanOutlinedSvg)
export const UploadOutlined = WrapSvg(UploadOutlinedSvg)
export const Plus = WrapSvg(PlusSvg)
export const ArrowLeftOutlined = WrapSvg(ArrowLeftOutlinedSvg)
export const Connected = WrapSvg(ConnectedSvg)
export const Keystore = WrapSvg(KeystoreSvg)
export const Settings = WrapSvg(SettingsSvg)
export const PendingIcon = WrapSvg(PendingIconSvg)
export const NewTab = WrapSvg(NewTabSvg)
export const Tooltip = WrapSvg(TooltipSvg)
export const OpenFolder = WrapSvg(OpenFolderSvg)
export const SuccessInfo = WrapSvg(SuccessInfoSvg)
export const Error = WrapSvg(ErrorSvg)
export const Loading = WrapSvg(LoadingSvg)
export const Attention = WrapSvg(AttentionSvg)
export const AttentionOutline = WrapSvg(AttentionOutlineSvg)
export const PasswordHide = WrapSvg(PasswordHideSvg)
export const PasswordShow = WrapSvg(PasswordShowSvg)
