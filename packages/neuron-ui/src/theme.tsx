import React from 'react'
import { loadTheme, getTheme } from 'office-ui-fabric-react'

import {
  Alert as AlertIcon,
  Checkmark as SuccessIcon,
  CircleInformation as InfoIcon,
  Close as DismissIcon,
  Close as FailIcon,
  Copy as CopyIcon,
  Domain as ExplorerIcon,
  Down as ArrowDownIcon,
  FormClose as ClearIcon,
  FormAdd as CreateIcon,
  FormPreviousLink as LeaveIcon,
  FormUp as ExpandIcon,
  FormUpload as ImportIcon,
  License as KeystoreIcon,
  LinkBottom as LinkBottomIcon,
  LinkDown as LinkDownIcon,
  LinkTop as LinkTopIcon,
  LinkUp as LinkUpIcon,
  More as MoreIcon,
  Nodes as ConnectedIcon,
  Scan as ScanIcon,
  Search as SearchIcon,
  SettingsOption as SettingsIcon,
  StatusGood as MatchedIcon,
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
    Search: <SearchIcon size="14px" color="#000" />,
    FirstPage: <LinkTopIcon size="16px" color={semanticColors.menuIcon} style={{ transform: 'rotate(-90deg)' }} />,
    LastPage: <LinkBottomIcon size="16px" color={semanticColors.menuIcon} style={{ transform: 'rotate(-90deg)' }} />,
    PrevPage: <LinkUpIcon size="16px" color={semanticColors.menuIcon} style={{ transform: 'rotate(-90deg)' }} />,
    NextPage: <LinkDownIcon size="16px" color={semanticColors.menuIcon} style={{ transform: 'rotate(-90deg)' }} />,
    ArrowDown: <ArrowDownIcon size="16px" />,
    ChevronRightMed: <ExpandIcon size="16px" style={{ transform: 'rotate(90deg) translate(2px, 0px)' }} />,
    Scan: <ScanIcon />,
    Import: <ImportIcon color="white" />,
    Create: <CreateIcon />,
    Clear: <ClearIcon size="16px" />,
    Dismiss: <DismissIcon size="16px" />,
    Leave: <LeaveIcon />,
    Connected: <ConnectedIcon size="small" color="green" />,
    Disconnected: <AlertIcon size="small" color="red" />,
    Updating: <UpdateIcon size="16px" style={{ animation: 'rotate360 3s linear infinite' }} />,
    More: <MoreIcon size="16px" />,
    Matched: <MatchedIcon size="16px" color="green" />,
    Unmatched: <InfoIcon size="16px" color="#d50000" />,
    TransactionSuccess: <SuccessIcon size="14px" color="green" />,
    TransactionFailure: <FailIcon size="14px" color="#d50000" />,
    TransactionPending: <PendingIcon size="14px" style={{ animation: 'rotate360 3s linear infinite' }} />,
    Keystore: <KeystoreIcon color="white" style={{ transform: 'scale(0.6)' }} />,
    Settings: <SettingsIcon size="20px" />,
    Explorer: <ExplorerIcon size="16px" color="#FFF" />,
  },
})

export default undefined
