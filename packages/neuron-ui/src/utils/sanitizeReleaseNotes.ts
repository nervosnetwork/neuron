const ALLOWED_TAGS = new Set(['p', 'br', 'ul', 'ol', 'li', 'strong', 'em', 'b', 'i', 'code', 'pre'])
const DROP_CONTENT_TAGS = new Set(['script', 'style', 'iframe', 'object', 'embed'])

const sanitizeNodes = (doc: Document, nodes: ChildNode[]): Node[] => {
  return nodes.flatMap(node => {
    if (node.nodeType === Node.TEXT_NODE) {
      return [doc.createTextNode(node.textContent ?? '')]
    }

    if (node.nodeType !== Node.ELEMENT_NODE) {
      return []
    }

    const element = node as HTMLElement
    const tagName = element.tagName.toLowerCase()

    if (DROP_CONTENT_TAGS.has(tagName)) {
      return []
    }

    const children = sanitizeNodes(doc, Array.from(element.childNodes))

    if (!ALLOWED_TAGS.has(tagName)) {
      return children
    }

    const sanitizedElement = doc.createElement(tagName)
    children.forEach(child => {
      sanitizedElement.appendChild(child)
    })
    return [sanitizedElement]
  })
}

export const sanitizeReleaseNotes = (releaseNotes: string) => {
  const template = document.createElement('template')
  template.innerHTML = releaseNotes

  const container = document.createElement('div')
  sanitizeNodes(document, Array.from(template.content.childNodes)).forEach(node => {
    container.appendChild(node)
  })
  return container.innerHTML
}

export default sanitizeReleaseNotes
