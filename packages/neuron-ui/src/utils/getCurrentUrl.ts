export default (id: string, networks: Readonly<State.Network[]>) => {
  const network = networks.find(n => n.id === id)
  return network?.remote
}
