import Application from '../application'
// import { sleep } from '../application/utils'

export const importWallet = async (app: Application, mnemonic: string, password: string = 'Azusa2233') => {
  const { client } = app.spectron
  
    // Input mnemonic

    const res = await client.selectorExecute('<textarea />', (elements: any, args) => {
      const element = elements[0]
      console.log(`element = ${element}`);
      console.log(`args = ${args}`);
  
      element.focus();
      element.value = args;
      // element.fireEvent("onchange");
  
      // if ("createEvent" in document) {
      //   var evt = document.createEvent("HTMLEvents");
      //   evt.initEvent("input", false, true);
      //   element.dispatchEvent(evt);
      // }
      // else {
      //   element.fireEvent("onchange");
      // }
  
      // var evt = document.createEvent("HTMLEvents");
      // evt.initEvent("input", false, true);
      // element.dispatchEvent(event);
  
  
      var ev = new Event('input', { bubbles: true}) as any;
      ev.simulated = true;
      element.value = args;
      element.dispatchEvent(ev);
  
  
      return `${element}  ${args}`
    }, mnemonic)
    console.log(`res = ${res}`);
  


    const mnemonicTextarea = await app.element('<textarea />')
    expect(mnemonicTextarea.value).not.toBeNull()
    // Next
    // await client.elementIdValue(mnemonicTextarea.value.ELEMENT, mnemonic)
    // for (let index = 0; index < Math.ceil(mnemonic.length / 6); index++) {
    //   const text = mnemonic.slice(index * 6, Math.min(index * 6 + 6, mnemonic.length))
    //   console.log(`text = ${text}]  ${index}  ${index * 6}`);
    //   await client.elementIdValue(mnemonicTextarea.value.ELEMENT, text)
    //   sleep(200)
    // }
    app.waitUntilLoaded()
    const mnemonicNextButton = await app.getElementByTagName('button', 'Next')
    expect(mnemonicNextButton).not.toBeNull()
    await client.elementIdClick(mnemonicNextButton!.ELEMENT)

    // Setup wallet
    const inputElements = await app.elements('<input />')
    expect(inputElements.value).not.toBeNull()
    expect(inputElements.value.length).toBe(3)
    const walletNameInputText = await client.elementIdAttribute(inputElements.value[0].ELEMENT, 'value')
    await client.elementIdValue(inputElements.value[1].ELEMENT, password)
    await client.elementIdValue(inputElements.value[2].ELEMENT, password)
    console.log(`walletNameInputText - ${walletNameInputText.value}`);
    // Next
    const setupWalletNextButton = await app.getElementByTagName('button', 'Next')
    expect(setupWalletNextButton).not.toBeNull()
    await client.elementIdClick(setupWalletNextButton!.ELEMENT)
    await app.waitUntilLoaded()

    // Check wallet name
    const walletNameElement = await app.element('//MAIN/DIV/H1')
    expect(walletNameElement.value).not.toBeNull()
    const walletName = await client.elementIdText(walletNameElement.value.ELEMENT)
    expect(walletName.value).toBe(walletNameInputText.value)
    console.log(`walletName - ${walletName.value}  ${new Date().toTimeString()}`);
}
