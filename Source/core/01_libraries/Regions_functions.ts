// todo get rid of this function if it's no use
import { createPoint, IPoint } from '../../Utils/Point'
import { MemoryHandler } from '../../Utils/MemoryHandler'

export const createDiagonalRegions = (startX: number, startY: number, endX: number, endY: number, size: number) => {
    const regions = MemoryHandler.getEmptyArray<{ topLeft: IPoint; bottomRight: IPoint }>()
    const distance = Math.sqrt(Math.pow(endX - startX, 2) + Math.pow(endY - startY, 2))
    const numRegions = Math.floor(distance / size)
    const xStep = (endX - startX) / numRegions
    const yStep = (endY - startY) / numRegions

    for (let i = 0; i < numRegions; i++) {
        const topLeft = createPoint(startX + i * xStep, startY + i * yStep)
        const bottomRight = createPoint(topLeft.x + size, topLeft.y + size)

        regions.push({ topLeft, bottomRight })
    }

    return regions
}
