export const calculateFee = (tx: any) => {
  if (!tx) {
    return '0'
  }
  const inputCapacities = tx.inputs.reduce(
    (result: bigint, input: { capacity: string }) => result + BigInt(input.capacity),
    BigInt(0)
  )
  const outputCapacities = tx.outputs.reduce(
    (result: bigint, output: { capacity: string }) => result + BigInt(output.capacity),
    BigInt(0)
  )

  return (inputCapacities - outputCapacities).toString()
}

export default calculateFee
