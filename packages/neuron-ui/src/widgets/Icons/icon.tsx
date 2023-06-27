import React from 'react'
import { ReactComponent as ExplorerSvg } from './Explorer.svg'
import { ReactComponent as SearchSvg } from './Search.svg'
import { ReactComponent as SearchIconSvg } from './SearchIcon.svg'
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
import { ReactComponent as SuccessNoBorderSvg } from './SuccessNoBorder.svg'
import { ReactComponent as LoadingSvg } from './Loading.svg'
import { ReactComponent as AttentionSvg } from './ExperimentalAttention.svg'
import { ReactComponent as AttentionOutlineSvg } from './AttentionOutline.svg'
import { ReactComponent as PasswordHideSvg } from './PasswordHide.svg'
import { ReactComponent as PasswordShowSvg } from './PasswordShow.svg'
import { ReactComponent as OverviewSvg } from './Overview.svg'
import { ReactComponent as SendSvg } from './Send.svg'
import { ReactComponent as ReceiveSvg } from './Receive.svg'
import { ReactComponent as HistorySvg } from './History.svg'
import { ReactComponent as NervosDAOSvg } from './NervosDAO.svg'
import { ReactComponent as ExperimentalSvg } from './Experimental.svg'
import { ReactComponent as ArrowOpenRightSvg } from './ArrowOpenRight.svg'
import { ReactComponent as ArrowOpenRightIconSvg } from './ArrowOpenRightIcon.svg'
import { ReactComponent as MenuExpandSvg } from './MenuExpand.svg'
import { ReactComponent as ArrowEndSvg } from './ArrowEnd.svg'
import { ReactComponent as ArrowNextSvg } from './ArrowNext.svg'
import { ReactComponent as SignSvg } from './Sign.svg'
import { ReactComponent as ExportSvg } from './Export.svg'
import { ReactComponent as ConfirmingSvg } from './Confirming.svg'
import { ReactComponent as CopySvg } from './Copy.svg'
import { ReactComponent as AddressTransformSvg } from './AddressTransform.svg'
import { ReactComponent as TransferSvg } from './Transfer.svg'
import { ReactComponent as LineDownArrowSvg } from './LineDownArrow.svg'
import { ReactComponent as DepositSvg } from './Deposit.svg'
import { ReactComponent as ClockSvg } from './Clock.svg'
import { ReactComponent as ArrowDownRoundSvg } from './ArrowDownRound.svg'
import { ReactComponent as EyesOpenSvg } from './EyesOpen.svg'
import { ReactComponent as EyesCloseSvg } from './EyesClose.svg'
import { ReactComponent as SuccessSvg } from './Success.svg'
import { ReactComponent as DownloadIconSvg } from './DownloadIcon.svg'
import { ReactComponent as ExplorerIconSvg } from './ExplorerIcon.svg'
import { ReactComponent as DetailIconSvg } from './DetailIcon.svg'
import { ReactComponent as CheckUpdateIconSvg } from './CheckUpdateIcon.svg'
import { ReactComponent as LanguageSelectSvg } from './LanguageSelect.svg'

import styles from './icon.module.scss'

function WrapSvg(SvgComponent: React.FC<React.SVGProps<SVGSVGElement>>, classNameForTheme: string = '') {
  return ({
    type,
    className,
    ...props
  }: { type?: 'success' | 'activity' | 'error' } & React.SVGProps<SVGSVGElement> = {}) => {
    return <SvgComponent className={`${type ? styles[type] : ''} ${className || ''} ${classNameForTheme}`} {...props} />
  }
}

export const Explorer = WrapSvg(ExplorerSvg)
export const Search = WrapSvg(SearchSvg)
export const SearchIcon = WrapSvg(SearchIconSvg)
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
export const Overview = WrapSvg(OverviewSvg)
export const Send = WrapSvg(SendSvg)
export const Receive = WrapSvg(ReceiveSvg)
export const History = WrapSvg(HistorySvg)
export const NervosDAO = WrapSvg(NervosDAOSvg)
export const Experimental = WrapSvg(ExperimentalSvg)
export const ArrowOpenRight = WrapSvg(ArrowOpenRightSvg)
export const ArrowOpenRightIcon = WrapSvg(ArrowOpenRightIconSvg)
export const MenuExpand = WrapSvg(MenuExpandSvg)
export const ArrowEnd = WrapSvg(ArrowEndSvg)
export const ArrowNext = WrapSvg(ArrowNextSvg)
export const Export = WrapSvg(ExportSvg)
export const Sign = WrapSvg(SignSvg)
export const Confirming = WrapSvg(ConfirmingSvg)
export const SuccessNoBorder = WrapSvg(SuccessNoBorderSvg)
export const Copy = WrapSvg(CopySvg)
export const DownloadIcon = WrapSvg(DownloadIconSvg)
export const ExplorerIcon = WrapSvg(ExplorerIconSvg)
export const DetailIcon = WrapSvg(DetailIconSvg)
export const AddressTransform = WrapSvg(AddressTransformSvg, styles.addressTransform)
export const Transfer = WrapSvg(TransferSvg)
export const LineDownArrow = WrapSvg(LineDownArrowSvg)
export const Deposit = WrapSvg(DepositSvg, styles.deposit)
export const Clock = WrapSvg(ClockSvg)
export const ArrowDownRound = WrapSvg(ArrowDownRoundSvg)
export const EyesOpen = WrapSvg(EyesOpenSvg)
export const EyesClose = WrapSvg(EyesCloseSvg)
export const Success = WrapSvg(SuccessSvg)
export const CheckUpdateIcon = WrapSvg(CheckUpdateIconSvg)
export const LanguageSelect = WrapSvg(LanguageSelectSvg)
