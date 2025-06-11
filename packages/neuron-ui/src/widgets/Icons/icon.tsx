import React from 'react'
import SearchSvg from './Search.svg?react'
import InfoCircleOutlinedSvg from './InfoCircleOutlined.svg?react'
import CloseSvg from './Close.svg?react'
import SettingsSvg from './Settings.svg?react'
import PendingIconSvg from './PendingIcon.svg?react'
import NewTabSvg from './new_tab.svg?react'
import SuccessInfoSvg from './SuccessInfo.svg?react'
import ErrorSvg from './Error.svg?react'
import SuccessNoBorderSvg from './SuccessNoBorder.svg?react'
import LoadingSvg from './Loading.svg?react'
import AttentionSvg from './ExperimentalAttention.svg?react'
import OverviewSvg from './Overview.svg?react'
import SendSvg from './Send.svg?react'
import ReceiveSvg from './Receive.svg?react'
import HistorySvg from './History.svg?react'
import NervosDAOSvg from './NervosDAO.svg?react'
import ExperimentalSvg from './Experimental.svg?react'
import MenuExpandSvg from './MenuExpand.svg?react'
import ArrowEndSvg from './ArrowEnd.svg?react'
import ArrowNextSvg from './ArrowNext.svg?react'
import SignSvg from './Sign.svg?react'
import ExportSvg from './Export.svg?react'
import ConfirmingSvg from './Confirming.svg?react'
import CopySvg from './Copy.svg?react'
import AddressTransformSvg from './AddressTransform.svg?react'
import TransferSvg from './Transfer.svg?react'
import LineDownArrowSvg from './LineDownArrow.svg?react'
import DepositSvg from './Deposit.svg?react'
import ClockSvg from './Clock.svg?react'
import ArrowDownRoundSvg from './ArrowDownRound.svg?react'
import EyesOpenSvg from './EyesOpen.svg?react'
import EyesCloseSvg from './EyesClose.svg?react'
import SuccessSvg from './Success.svg?react'
import DownloadSvg from './Download.svg?react'
import ExplorerIconSvg from './ExplorerIcon.svg?react'
import DetailIconSvg from './DetailIcon.svg?react'
import CheckUpdateIconSvg from './CheckUpdateIcon.svg?react'
import LanguageSelectSvg from './LanguageSelect.svg?react'
import GoBackSvg from './GoBack.svg?react'
import SortSvg from './Sort.svg?react'
import EditSvg from './Edit.svg?react'
import OverviewSendSvg from './OverviewSend.svg?react'
import OverviewReceiveSvg from './OverviewReceive.svg?react'
import AddressbookSvg from './Addressbook.svg?react'
import AddSvg from './Add.svg?react'
import AddSimpleSvg from './AddSimple.svg?react'
import SwitchSvg from './Switch.svg?react'
import CleanSvg from './Clean.svg?react'
import CellManageSvg from './CellManage.svg?react'
import LockSvg from './Lock.svg?react'
import LockCellSvg from './LockCell.svg?react'
import UnLockSvg from './Unlock.svg?react'
import ConsumeSvg from './Consume.svg?react'
import ConsolidateSvg from './Consolidate.svg?react'
import DetectSvg from './Detect.svg?react'
import DeleteSvg from './Delete.svg?react'
import ImportKeystoreSvg from './SoftWalletImportKeystore.svg?react'
import ImportHardwareSvg from './HardWalletImport.svg?react'
import DepositTimeSortSvg from './DepositTimeSort.svg?react'
import QuestionSvg from './Question.svg?react'
import DetailsSvg from './Details.svg?react'
import ConfirmSvg from './Confirm.svg?react'
import UploadSvg from './Upload.svg?react'
import PrivateKeySvg from './PrivateKey.svg?react'
import DAODepositSvg from './DAODeposit.svg?react'
import DAOWithdrawalSvg from './DAOWithdrawal.svg?react'
import RecycleSvg from './Recycle.svg?react'
import MoreSvg from './More.svg?react'
import PerunSvg from './Perun.svg?react'
import CkbIconSvg from './CkbIcon.svg?react'
import PartnerSvg from './Partner.svg?react'
import PerunSendSvg from './PerunSend.svg?react'
import PerunCloseSvg from './PerunClose.svg?react'

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

export const Search = WrapSvg(SearchSvg)
export const InfoCircleOutlined = WrapSvg(InfoCircleOutlinedSvg)
export const Close = WrapSvg(CloseSvg)
export const Settings = WrapSvg(SettingsSvg)
export const PendingIcon = WrapSvg(PendingIconSvg)
export const NewTab = WrapSvg(NewTabSvg)
export const SuccessInfo = WrapSvg(SuccessInfoSvg)
export const Error = WrapSvg(ErrorSvg)
export const Loading = WrapSvg(LoadingSvg)
export const Attention = WrapSvg(AttentionSvg)
export const Overview = WrapSvg(OverviewSvg)
export const Send = WrapSvg(SendSvg)
export const Receive = WrapSvg(ReceiveSvg)
export const History = WrapSvg(HistorySvg)
export const NervosDAO = WrapSvg(NervosDAOSvg)
export const Experimental = WrapSvg(ExperimentalSvg)
export const MenuExpand = WrapSvg(MenuExpandSvg)
export const ArrowEnd = WrapSvg(ArrowEndSvg)
export const ArrowNext = WrapSvg(ArrowNextSvg)
export const Export = WrapSvg(ExportSvg)
export const Sign = WrapSvg(SignSvg)
export const Confirming = WrapSvg(ConfirmingSvg)
export const SuccessNoBorder = WrapSvg(SuccessNoBorderSvg)
export const Copy = WrapSvg(CopySvg)
export const Download = WrapSvg(DownloadSvg)
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
export const GoBack = WrapSvg(GoBackSvg)
export const BalanceHide = WrapSvg(EyesCloseSvg, styles.balance)
export const BalanceShow = WrapSvg(EyesOpenSvg, styles.balance)
export const Sort = WrapSvg(SortSvg)
export const Edit = WrapSvg(EditSvg)
export const OverviewSend = WrapSvg(OverviewSendSvg)
export const OverviewReceive = WrapSvg(OverviewReceiveSvg)
export const Addressbook = WrapSvg(AddressbookSvg, styles.withTheme)
export const Add = WrapSvg(AddSvg)
export const Switch = WrapSvg(SwitchSvg)
export const AddSimple = WrapSvg(AddSimpleSvg)
export const Clean = WrapSvg(CleanSvg)
export const CellManage = WrapSvg(CellManageSvg, styles.withTheme)
export const Lock = WrapSvg(LockSvg, styles.withTheme)
export const LockCell = WrapSvg(LockCellSvg)
export const UnLock = WrapSvg(UnLockSvg)
export const Consume = WrapSvg(ConsumeSvg)
export const Consolidate = WrapSvg(ConsolidateSvg)
export const Detect = WrapSvg(DetectSvg)
export const Delete = WrapSvg(DeleteSvg)
export const ImportKeystore = WrapSvg(ImportKeystoreSvg)
export const ImportHardware = WrapSvg(ImportHardwareSvg)
export const DepositTimeSort = WrapSvg(DepositTimeSortSvg)
export const Question = WrapSvg(QuestionSvg)
export const Details = WrapSvg(DetailsSvg)
export const Confirm = WrapSvg(ConfirmSvg)
export const Upload = WrapSvg(UploadSvg)
export const PrivateKey = WrapSvg(PrivateKeySvg)
export const DAODeposit = WrapSvg(DAODepositSvg)
export const DAOWithdrawal = WrapSvg(DAOWithdrawalSvg)
export const Recycle = WrapSvg(RecycleSvg)
export const More = WrapSvg(MoreSvg)
export const PerunIcon = WrapSvg(PerunSvg)
export const CkbIcon = WrapSvg(CkbIconSvg)
export const PartnerIcon = WrapSvg(PartnerSvg)
export const PerunSend = WrapSvg(PerunSendSvg)
export const PerunClose = WrapSvg(PerunCloseSvg)
