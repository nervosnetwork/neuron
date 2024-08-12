export const calculateFee = (tx: any) => {
  if (!tx?.inputs || !tx?.outputs) {
    return '0'
  }
  const inputCapacities = tx.inputs.reduce(
    (result: bigint, input: { capacity: string }) => result + BigInt(input.capacity || '0'),
    BigInt(0)
  )
  const outputCapacities = tx.outputs.reduce(
    (result: bigint, output: { capacity: string }) => result + BigInt(output.capacity || '0'),
    BigInt(0)
  )

  return (inputCapacities - outputCapacities).toString()
}

export default calculateFee
