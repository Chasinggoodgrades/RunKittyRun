import { globals } from '../../../../globals'
import { Constants } from '../../01_libraries/Constants'
import { HorizontalRectangleRegion } from '../../04_STRUCTURES/Region/HorizontalRectangleRegion'
import { MECRegion } from '../../04_STRUCTURES/Region/MECRegion'
import { MakeMECRegion } from '../Make_create_region/MakeMECRegion'

const HALF_TILE = Constants.LARGEUR_CASE / 2

// MAP_MIN_X/MAP_MIN_Y (and every tile-grid sample point elsewhere in this codebase, e.g. Change_all_terrains.ts,
// Save_terrain.ts's "centerOffsetX/Y") refer to the CENTER of a tile, not its corner. So the center of the
// tile containing `value` is the nearest point on that grid at or below it, and its edges are +/-64 from there.
const tileCenter = (value: number, origin: number): number =>
    origin + Math.round((value - origin) / Constants.LARGEUR_CASE) * Constants.LARGEUR_CASE

export abstract class MakeTerrainSaveZoneBase extends MakeMECRegion {
    private clickX: number[] = []
    private clickY: number[] = []

    constructor(maker: unit) {
        super(maker, 'horizRect')

        // Remember the raw click positions - the landmark cross shown while clicking must stay exactly
        // where the player clicked. The actual zone is computed separately in onMECRegionCreated, snapped
        // to the tile grid so it always exactly edges whole tiles.
        const baseSaveLoc = this.saveLoc
        this.saveLoc = (x: number, y: number) => {
            const index = this.currentMakingLocIndex + 1
            this.clickX[index] = x
            this.clickY[index] = y
            baseSaveLoc(x, y)
        }
    }

    onMECRegionCreated(mecRegion: MECRegion) {
        // The region built by MakeMECRegion from the raw (unsnapped) clicks is discarded - only used to
        // know clicking is done. The real zone below is rebuilt from the tile grid, so it can never be
        // too thin (always at least one full tile) and always exactly edges the tiles it covers.
        mecRegion.destroy()

        const rawMinX = Math.min(this.clickX[0], this.clickX[1])
        const rawMaxX = Math.max(this.clickX[0], this.clickX[1])
        const rawMinY = Math.min(this.clickY[0], this.clickY[1])
        const rawMaxY = Math.max(this.clickY[0], this.clickY[1])

        const minX = tileCenter(rawMinX, globals.MAP_MIN_X) - HALF_TILE
        const minY = tileCenter(rawMinY, globals.MAP_MIN_Y) - HALF_TILE
        const maxX = tileCenter(rawMaxX, globals.MAP_MIN_X) + HALF_TILE
        const maxY = tileCenter(rawMaxY, globals.MAP_MIN_Y) + HALF_TILE

        this.onZoneDrawn(new HorizontalRectangleRegion(minX, minY, maxX, maxY))
    }

    protected abstract onZoneDrawn(zone: HorizontalRectangleRegion): void

    getMakingMessage(): string {
        return `Define the terrain save zone with ${this.requiredLocsNumber} clicks`
    }
}
