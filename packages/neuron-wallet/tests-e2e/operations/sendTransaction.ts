import Application from '../application'

interface TransactionSendTo {
  address: string
  amount: number
}

interface Transaction {
  sendTo: TransactionSendTo[]
}

export const sendTransaction = async (app: Application, transaction: Transaction) => {
  const { client } = app.spectron

  // Switch to receive page
  const receiveButton = await app.getElementByTagName('button', 'Receive')
  expect(receiveButton).not.toBeNull()
  await client.elementIdClick(receiveButton!.ELEMENT)
  await app.waitUntilLoaded()

  // Get balance
  const balanceElement = await app.element('//MAIN/DIV/DIV[4]/DIV[2]')
  expect(balanceElement.value).not.toBeNull()
  const balanceText = await client.elementIdText(balanceElement.value.ELEMENT)
  const balance = parseInt(balanceText.value.slice(0, balanceText.value.length - 4))
  console.log(`balance = ${balance}`);

  // Check balance
  let sendAmount = 0
  for (let index = 0; index < transaction.sendTo.length; index++) {
    sendAmount += transaction.sendTo[index].amount; 
  }
  if (sendAmount > balance) {
    throw `The amount sent exceeds the balance. balance: ${balance} send_amount: ${sendAmount}`
  }
  
  // Setup send elements
  const sendItemGroupElementPath = '//MAIN/DIV/DIV[1]/DIV/DIV/DIV'
  for (let index = 1; index <= transaction.sendTo.length; index++) {
    const sendTo = transaction.sendTo[index];
    if (sendTo.amount < 61) {
      throw `Amount should not be less than 61 CKB.  amount = ${sendTo.amount}`
    }

    const sendItemElementPath = `${sendItemGroupElementPath}/DIV[${index}]`
    await app.setElementValue(`${sendItemElementPath}/DIV/DIV[1]//INPUT`, sendTo.address)
    await app.setElementValue(`${sendItemElementPath}/DIV/DIV[2]//INPUT`, `${sendTo.amount}`)

    const addButton = await app.element(`${sendItemElementPath}/DIV/DIV[2]//BUTTON`)
    expect(addButton.value).not.toBeNull()
    await client.elementIdClick(addButton.value.ELEMENT)
    app.waitUntilLoaded()
  }

  const sendButton = await app.element(`//MAIN/DIV/DIV[5]/BUTTON[2]`)
  expect(sendButton.value).not.toBeNull()
  await client.elementIdClick(sendButton.value.ELEMENT)
  app.waitUntilLoaded()
}
