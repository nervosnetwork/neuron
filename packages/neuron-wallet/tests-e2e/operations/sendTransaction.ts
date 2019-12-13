import Application from '../application'
import { checkNetworkStatus } from './'
import { TransactionSendTo } from '../env'

export const sendTransaction = async (app: Application, password: string, sendToArr: TransactionSendTo[]) => {
  const { client } = app.spectron

  // Switch to send page
  const receiveButton = await app.getElementByTagName('button', 'Send')
  expect(receiveButton).not.toBeNull()
  await client.elementIdClick(receiveButton!.ELEMENT)
  await app.waitUntilLoaded()

  // Get balance
  let balance = 0
  let retryCount = 5
  while (balance === 0 && retryCount > 0) {
    retryCount -= 1
    const balanceElement = await client.element('//MAIN/DIV/DIV[4]/DIV[2]')
    expect(balanceElement.value).not.toBeNull()
    const balanceText = await client.elementIdText(balanceElement.value.ELEMENT)
    balance = parseInt(balanceText.value.slice(0, balanceText.value.length - 4))
    console.log(`balance = ${balance}`);
    if (balance === 0) {
      await app.wait(1000)
    }
  }
  // Check balance
  let sendAmount = 0
  for (let index = 0; index < sendToArr.length; index++) {
    sendAmount += sendToArr[index].amount;
  }
  if (sendAmount > balance) {
    throw `The amount sent exceeds the balance. balance: ${balance} send_amount: ${sendAmount}`
  }

  // Setup send elements
  const sendItemGroupElementPath = '//MAIN/DIV/DIV[1]/DIV/DIV/DIV'
  for (let index = 0; index < sendToArr.length; index++) {
    const sendTo = sendToArr[index];
    if (sendTo.amount < 61) {
      throw `Amount should not be less than 61 CKB.  amount = ${sendTo.amount}`
    }
    const elementIndex = index + 1
    // setup
    const sendItemElementPath = `${sendItemGroupElementPath}/DIV[${elementIndex}]`
    await app.setElementValue(`${sendItemElementPath}/DIV/DIV[1]//INPUT`, sendTo.address)
    await app.setElementValue(`${sendItemElementPath}/DIV/DIV[2]//INPUT`, `${sendTo.amount}`)
    console.log(`setup sent to ${sendTo.address} ${sendTo.amount}`);
    if (elementIndex < sendToArr.length) {
      // add
      const addButton = await client.element(`${sendItemElementPath}/DIV/DIV[2]//BUTTON`)
      expect(addButton.value).not.toBeNull()
      await client.elementIdClick(addButton.value.ELEMENT)
      app.waitUntilLoaded()
    }
  }

  // Send
  const sendButton = await client.element(`//MAIN/DIV/DIV[5]/BUTTON[2]`)
  expect(sendButton.value).not.toBeNull()
  await client.elementIdClick(sendButton.value.ELEMENT)
  app.waitUntilLoaded()

  // Input password
  const passwordInputElement = await client.element('//BODY/DIV[4]/DIV/DIV/DIV/DIV[2]/DIV[2]/DIV/DIV[1]//INPUT')
  expect(passwordInputElement.value).not.toBeNull()
  await app.setElementValue('//BODY/DIV[4]/DIV/DIV/DIV/DIV[2]/DIV[2]/DIV/DIV[1]//INPUT', password)
  // Confirm
  const confirmElement = await client.element('//BODY/DIV[4]/DIV/DIV/DIV/DIV[2]/DIV[2]/DIV/DIV[2]/BUTTON[2]')
  expect(confirmElement.value).not.toBeNull()
  await client.elementIdClick(confirmElement.value.ELEMENT)
  app.waitUntilLoaded()

  // Transaction element
  const transactionElementPath = `//MAIN/DIV/DIV[2]/DIV/DIV/DIV[2]/DIV/DIV/DIV/DIV/DIV/DIV[1]/DIV/DIV/DIV[2]/DIV/DIV/DIV[1]`
  const transactionElement = await client.element(transactionElementPath)
  expect(transactionElement.value).not.toBeNull()
  const transactionText = await client.elementIdText(transactionElement.value.ELEMENT)
  console.log(`transaction = ${transactionText.value}`);
  // Transaction hash
  const transactionHashElement = await client.element(`${transactionElementPath}/DIV/DIV/DIV[3]/SPAN`)
  expect(transactionHashElement.value).not.toBeNull()
  const transactionHash = await client.elementIdText(transactionHashElement.value.ELEMENT)
  console.log(`transactionHash = ${transactionHash.value}`);

  // Check transaction status
  let success = false
  while (!success) {
    if (!(await checkNetworkStatus(app))) {
      throw 'Network disconnected'
    }
    const transactionStatusElement = await client.element(`${transactionElementPath}/DIV/DIV/DIV[4]`)
    expect(transactionStatusElement.value).not.toBeNull()
    const transactionStatus = await client.elementIdText(transactionStatusElement.value.ELEMENT)
    console.log(`transactionStatus = ${transactionStatus.value}`);
    if (transactionStatus.value === 'success') {
      break
    }
    await app.wait(2000)
  }

  console.log(`transaction success hash: ${transactionHash.value}`);
  return transactionHash.value
}
