import React from 'react'
import { ReactComponent as SearchSvg } from './Search.svg'
import { ReactComponent as InfoCircleOutlinedSvg } from './InfoCircleOutlined.svg'
import { ReactComponent as CloseSvg } from './Close.svg'
import { ReactComponent as SettingsSvg } from './Settings.svg'
import { ReactComponent as PendingIconSvg } from './PendingIcon.svg'
import { ReactComponent as NewTabSvg } from './new_tab.svg'
import { ReactComponent as SuccessInfoSvg } from './SuccessInfo.svg'
import { ReactComponent as ErrorSvg } from './Error.svg'
import { ReactComponent as SuccessNoBorderSvg } from './SuccessNoBorder.svg'
import { ReactComponent as LoadingSvg } from './Loading.svg'
import { ReactComponent as AttentionSvg } from './ExperimentalAttention.svg'
import { ReactComponent as OverviewSvg } from './Overview.svg'
import { ReactComponent as SendSvg } from './Send.svg'
import { ReactComponent as ReceiveSvg } from './Receive.svg'
import { ReactComponent as HistorySvg } from './History.svg'
import { ReactComponent as NervosDAOSvg } from './NervosDAO.svg'
import { ReactComponent as ExperimentalSvg } from './Experimental.svg'
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
import { ReactComponent as DownloadSvg } from './Download.svg'
import { ReactComponent as ExplorerIconSvg } from './ExplorerIcon.svg'
import { ReactComponent as DetailIconSvg } from './DetailIcon.svg'
import { ReactComponent as CheckUpdateIconSvg } from './CheckUpdateIcon.svg'
import { ReactComponent as LanguageSelectSvg } from './LanguageSelect.svg'
import { ReactComponent as GoBackSvg } from './GoBack.svg'
import { ReactComponent as SortSvg } from './Sort.svg'
import { ReactComponent as EditSvg } from './Edit.svg'
import { ReactComponent as OverviewSendSvg } from './OverviewSend.svg'
import { ReactComponent as OverviewReceiveSvg } from './OverviewReceive.svg'
import { ReactComponent as AddressbookSvg } from './Addressbook.svg'
import { ReactComponent as AddSvg } from './Add.svg'
import { ReactComponent as AddSimpleSvg } from './AddSimple.svg'
import { ReactComponent as SwitchSvg } from './Switch.svg'
import { ReactComponent as CleanSvg } from './Clean.svg'
import { ReactComponent as CellManageSvg } from './CellManage.svg'
import { ReactComponent as LockSvg } from './Lock.svg'
import { ReactComponent as LockCellSvg } from './LockCell.svg'
import { ReactComponent as UnLockSvg } from './Unlock.svg'
import { ReactComponent as ConsumeSvg } from './Consume.svg'
import { ReactComponent as ConsolidateSvg } from './Consolidate.svg'
import { ReactComponent as DetectSvg } from './Detect.svg'
import { ReactComponent as DeleteSvg } from './Delete.svg'
import { ReactComponent as ImportKeystoreSvg } from './SoftWalletImportKeystore.svg'
import { ReactComponent as ImportHardwareSvg } from './HardWalletImport.svg'
import { ReactComponent as DepositTimeSortSvg } from './DepositTimeSort.svg'
import { ReactComponent as QuestionSvg } from './Question.svg'
import { ReactComponent as DetailsSvg } from './Details.svg'
import { ReactComponent as ConfirmSvg } from './Confirm.svg'
import { ReactComponent as UploadSvg } from './Upload.svg'
import { ReactComponent as PrivateKeySvg } from './PrivateKey.svg'
import { ReactComponent as DAODepositSvg } from './DAODeposit.svg'
import { ReactComponent as DAOWithdrawalSvg } from './DAOWithdrawal.svg'
import { ReactComponent as RecycleSvg } from './Recycle.svg'

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
