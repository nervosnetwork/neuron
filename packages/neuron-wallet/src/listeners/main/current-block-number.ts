import CurrentBlockSubject from "models/subjects/current-block-subject"
import { SyncedBlockNumberSubject } from "models/subjects/node"

export const register = () => {
  CurrentBlockSubject.getSubject().subscribe(({ blockNumber }) => {
    SyncedBlockNumberSubject.next(blockNumber)
  })
}
