import React from 'react'
import { loadTheme, getTheme } from 'office-ui-fabric-react'
import { ReactComponent as Explorer } from 'widgets/Icons/Explorer.svg'
import { ReactComponent as Search } from 'widgets/Icons/Search.svg'
import { ReactComponent as FirstPage } from 'widgets/Icons/FirstPage.svg'
import { ReactComponent as PreviousPage } from 'widgets/Icons/PreviousPage.svg'
import { ReactComponent as LastPage } from 'widgets/Icons/LastPage.svg'
import { ReactComponent as NextPage } from 'widgets/Icons/NextPage.svg'
import { ReactComponent as Matched } from 'widgets/Icons/Matched.svg'
import { ReactComponent as Unmatched } from 'widgets/Icons/Unmatched.svg'
import { ReactComponent as Close } from 'widgets/Icons/Close.svg'
import { ReactComponent as More } from 'widgets/Icons/More.svg'
import { ReactComponent as ArrowDown } from 'widgets/Icons/ArrowToNext.svg'

import {
  Alert as AlertIcon,
  Checkmark as SuccessIcon,
  CircleInformation as InfoIcon,
  Close as DismissIcon,
  Close as FailIcon,
  Copy as CopyIcon,
  FormClose as ClearIcon,
  FormAdd as CreateIcon,
  FormPreviousLink as LeaveIcon,
  FormUp as ExpandIcon,
  FormUpload as ImportIcon,
  License as KeystoreIcon,
  Nodes as ConnectedIcon,
  Scan as ScanIcon,
  SettingsOption as SettingsIcon,
  Update as UpdateIcon,
  Update as PendingIcon,
} from 'grommet-icons'

import { registerIcons } from 'utils/icons'

loadTheme({
  defaultFontStyle: { fontFamily: 'inherit' },
  fonts: {
    tiny: { fontSize: '11px' },
    xSmall: { fontSize: '12px', lineHeight: '12px' },
    small: { fontSize: '14px' },
    smallPlus: { fontSize: '15px' },
    medium: { fontSize: '16px' },
    mediumPlus: { fontSize: '17px' },
    large: { fontSize: '18px' },
    xLarge: { fontSize: '22px' },
    xxLarge: { fontSize: '28px' },
    superLarge: { fontSize: '42px' },
    mega: { fontSize: '72px' },
  },
})

const theme = getTheme()
const { semanticColors } = theme

registerIcons({
  icons: {
    info: <InfoIcon size="16px" />,
    errorbadge: <AlertIcon size="16px" />,
    completed: <SuccessIcon size="16px" />,
    cancel: <DismissIcon size="16px" />,
    MiniCopy: <CopyIcon size="small" color={semanticColors.primaryButtonBackground} />,
    Search: <Search />,
    FirstPage: <FirstPage />,
    LastPage: <LastPage />,
    PrevPage: <PreviousPage />,
    NextPage: <NextPage />,
    ArrowDown: <ArrowDown />,
    ChevronRightMed: <ExpandIcon size="16px" style={{ transform: 'rotate(90deg) translate(2px, 0px)' }} />,
    Scan: <ScanIcon />,
    Import: <ImportIcon color="white" />,
    Create: <CreateIcon />,
    Clear: <ClearIcon size="16px" />,
    Dismiss: <Close />,
    Leave: <LeaveIcon />,
    Connected: <ConnectedIcon size="small" color="green" />,
    Disconnected: <AlertIcon size="small" color="red" />,
    Updating: <UpdateIcon size="16px" style={{ animation: 'rotate360 3s linear infinite' }} />,
    More: <More />,
    Matched: <Matched />,
    Unmatched: <Unmatched />,
    TransactionSuccess: <SuccessIcon size="14px" color="green" />,
    TransactionFailure: <FailIcon size="14px" color="#d50000" />,
    TransactionPending: <PendingIcon size="14px" style={{ animation: 'rotate360 3s linear infinite' }} />,
    Keystore: <KeystoreIcon color="white" style={{ transform: 'scale(0.6)' }} />,
    Settings: <SettingsIcon size="20px" />,
    Explorer: <Explorer />,
  },
})

export default undefined
