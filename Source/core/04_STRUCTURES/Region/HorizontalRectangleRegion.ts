import { MemoryHandler } from '../../../Utils/MemoryHandler'
import { Constants } from '../../01_libraries/Constants'
import { DrawLine } from '../../01_libraries/Draw_lines'
import { RectangleRegion } from './RectangleRegion'

export type HorizontalRegionDirection = 'up' | 'down' | 'left' | 'right'

export class HorizontalRectangleRegion extends RectangleRegion {
    private minX: number
    private minY: number
    private maxX: number
    private maxY: number
    private direction: HorizontalRegionDirection

    constructor(x1: number, y1: number, x2: number, y2: number, direction: HorizontalRegionDirection = 'up') {
        const minX = Math.min(x1, x2)
        const maxX = Math.max(x1, x2)
        const minY = Math.min(y1, y2)
        const maxY = Math.max(y1, y2)

        let diagX1 = 0
        let diagY1 = 0
        let diagX2 = 0
        let diagY2 = 0
        let diagX3 = 0
        let diagY3 = 0

        switch (direction) {
            case 'right':
                diagX1 = minX
                diagY1 = minY
                diagX2 = minX
                diagY2 = maxY
                diagX3 = maxX
                diagY3 = maxY
                break
            case 'left':
                diagX1 = maxX
                diagY1 = minY
                diagX2 = maxX
                diagY2 = maxY
                diagX3 = minX
                diagY3 = maxY
                break
            case 'up':
                diagX1 = minX
                diagY1 = minY
                diagX2 = maxX
                diagY2 = minY
                diagX3 = maxX
                diagY3 = maxY
                break
            case 'down':
                diagX1 = minX
                diagY1 = maxY
                diagX2 = maxX
                diagY2 = maxY
                diagX3 = maxX
                diagY3 = minY
                break
        }

        super(diagX1, diagY1, diagX2, diagY2, diagX3, diagY3)

        this.minX = minX
        this.maxX = maxX
        this.minY = minY
        this.maxY = maxY

        this.direction = direction
    }

    areCoordsInRegion(x: number, y: number) {
        return x >= this.minX && x <= this.maxX && y >= this.minY && y <= this.maxY
    }

    getMinX(): number {
        return this.minX
    }

    getMaxX(): number {
        return this.maxX
    }

    getMinY(): number {
        return this.minY
    }

    getMaxY(): number {
        return this.maxY
    }

    // minX/maxX/minY/maxY are true tile edges for terrain-save zones (see MakeTerrainSaveZoneBase), so the
    // span is always an exact multiple of the tile size - no +1 fencepost needed here (unlike center-to-center
    // measurements, e.g. TerrainSave's capture loop / MAP_MIN_X..MAP_MAX_X).
    getSurface(): number {
        const widthTiles = Math.round((this.maxX - this.minX) / Constants.LARGEUR_CASE)
        const heightTiles = Math.round((this.maxY - this.minY) / Constants.LARGEUR_CASE)
        return widthTiles * heightTiles
    }

    protected generateDebugCross(): void {
        const diagonal1 = DrawLine(this.minX, this.minY, this.maxX, this.maxY)
        if (diagonal1) {
            this.debugLightnings.push(diagonal1)
        }

        const diagonal2 = DrawLine(this.maxX, this.minY, this.minX, this.maxY)
        if (diagonal2) {
            this.debugLightnings.push(diagonal2)
        }
    }

    moveTo(newCenterX: number, newCenterY: number) {
        const halfWidth = (this.maxX - this.minX) / 2
        const halfHeight = (this.maxY - this.minY) / 2

        this.minX = newCenterX - halfWidth
        this.maxX = newCenterX + halfWidth
        this.minY = newCenterY - halfHeight
        this.maxY = newCenterY + halfHeight

        super.moveTo(newCenterX, newCenterY)
    }

    toJson() {
        const output = MemoryHandler.getEmptyObject<any>()

        output.type = this.constructor.name
        output.x1 = R2I(this.minX)
        output.y1 = R2I(this.minY)
        output.x2 = R2I(this.maxX)
        output.y2 = R2I(this.maxY)
        output.direction = this.direction

        return output
    }
}
