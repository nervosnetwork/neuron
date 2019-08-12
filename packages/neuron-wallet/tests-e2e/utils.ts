import { SpectronClient } from 'spectron'

export const getElementByTagName = async (client: SpectronClient, tagName: string, textContent: string) => {
  const elements = await client.elements(`<${tagName} />`)        
  for (let index = 0; index < elements.value.length; index++) {
    const element = elements.value[index];
    const text = await client.elementIdText(element.ELEMENT)    
    if (text.value === textContent) {
      return element
    }
  }
  return null
}
