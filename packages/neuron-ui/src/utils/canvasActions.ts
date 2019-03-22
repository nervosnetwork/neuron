export interface Point {
  x: number
  y: number
}
export const drawPolygon = (_canvas: any, points: Point[], config: { color?: string }) => {
  const canvas = _canvas
  if (points.length < 3) {
    throw new Error('Not a Polygon')
  }
  canvas.beginPath()
  canvas.moveTo(points[0].x, points[0].y)
  points.slice(1).forEach((p: Point) => {
    canvas.lineTo(p.x, p.y)
  })
  canvas.lineTo(points[0].x, points[0].y)
  canvas.lineWidth = 4
  canvas.strokeStyle = config.color || 'red'
  canvas.stroke()
}

export default undefined
