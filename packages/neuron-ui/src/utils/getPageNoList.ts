export const getPageNoList = (pageNo: number, count: number) => {
  const PAGE_NO_COUNT = 5

  if (count <= 0) {
    return []
  }

  const list = new Array(Math.min(count, PAGE_NO_COUNT)).fill(undefined)

  if (pageNo < PAGE_NO_COUNT - 2 || count <= PAGE_NO_COUNT) {
    return list.map((_, i) => i + 1)
  }

  if (pageNo > count - PAGE_NO_COUNT + 2) {
    return list.map((_, i) => i + 1 + count - PAGE_NO_COUNT)
  }

  return list.map((_, i) => i + pageNo - 2)
}
export default getPageNoList
