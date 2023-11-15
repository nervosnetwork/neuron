import fs from 'fs'
import path from 'path'

export function updateToml(filePath: string, updateValue: Record<string, string>, newFilePath?: string) {
  const values = fs.readFileSync(filePath).toString().split('\n')
  let field: string | undefined = undefined
  const newValues = values.map(v => {
    const trimValue = v.trim()
    if (trimValue.startsWith('#')) {
      return v
    }
    if (trimValue.startsWith('[') && trimValue.endsWith(']')) {
      field = trimValue.slice(1, trimValue.length - 1)
      return v
    }
    if (field && updateValue[field]) {
      const newLine = updateValue[field]
      field = undefined
      return newLine
    }
    return v
  })
  if (newFilePath) {
    if (!fs.existsSync(path.dirname(newFilePath))) {
      fs.mkdirSync(path.dirname(newFilePath), { recursive: true })
    }
    fs.writeFileSync(newFilePath, newValues.join('\n'))
  } else {
    fs.writeFileSync(filePath, newValues.join('\n'))
  }
}

export default updateToml
