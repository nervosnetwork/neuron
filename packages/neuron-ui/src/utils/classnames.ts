type ClassValue =
  | string
  | undefined
  | null
  // There shouldn't be a situation where `true` exists
  | false

export function clsx(
  ...classes: (
    | ClassValue
    | {
        [key: string]: undefined | null | boolean
      }
  )[]
): string {
  return classes
    .map(cls => {
      if (cls != null && typeof cls === 'object') {
        return Object.entries(cls)
          .filter(([, isApply]) => Boolean(isApply))
          .map(([clsName]) => clsName)
      }

      return cls
    })
    .flat()
    .filter(Boolean)
    .join(' ')
}

export default clsx
