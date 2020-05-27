export const getCurrentUrl = (id: string, networks: Readonly<State.Network[]>) => {
  const network = networks.find(n => n.id === id)
  return network?.remote
}

export default getCurrentUrl
