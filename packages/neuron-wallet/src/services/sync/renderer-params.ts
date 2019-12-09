import { remote } from 'electron'

export const {
  nodeService
} = remote.require(
  './startup/sync-block-task/params'
)
