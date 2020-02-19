import { MAINNET_TAG } from './const'

export default (networks: Readonly<State.Network[]>, networkID: string) => {
  return (networks.find(n => n.id === networkID) || {}).chain === MAINNET_TAG
}
