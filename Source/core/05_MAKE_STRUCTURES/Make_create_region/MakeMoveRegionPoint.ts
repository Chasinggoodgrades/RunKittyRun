import { MemoryHandler } from 'Utils/MemoryHandler'
import { IPoint, createPoint } from 'Utils/Point'
import { arrayPush } from 'core/01_libraries/Basic_functions'
import { Text } from 'core/01_libraries/Text'
import { Region } from 'core/04_STRUCTURES/Region/Region'
import { Make } from 'core/05_MAKE_STRUCTURES/Make/Make'

type ITargetRegionPoint = 'topLeft' | 'topRight' | 'bottomLeft' | 'bottomRight'

export class MakeMoveRegionPoint extends Make {
    private targetRegion: Region | undefined
    private targetRegionPoint: ITargetRegionPoint | undefined

    constructor(maker: unit) {
        super(maker, 'moveRegionPoint', false)
    }

    doActions = () => {
        if (super.doBaseActions()) {
            if (!this.targetRegion || !this.targetRegionPoint) {
                const regions = this.escaper.getMakingLevel().regions.getAll()

                let closestRegion: Region | undefined = undefined
                let closestRegionPoint: IPoint | undefined = undefined
                let minDistance: number | undefined = undefined
                let targetRegionPoint: ITargetRegionPoint | undefined = undefined

                for (const [_, r] of pairs(regions)) {
                    const points = MemoryHandler.getEmptyArray<IPoint>()

                    arrayPush(points, createPoint(r.getMinX(), r.getMinY()))
                    arrayPush(points, createPoint(r.getMinX(), r.getMaxY()))
                    arrayPush(points, createPoint(r.getMaxX(), r.getMinY()))
                    arrayPush(points, createPoint(r.getMaxX(), r.getMaxY()))

                    let i = 0
                    for (const point of points) {
                        const dx = this.orderX - point.x
                        const dy = this.orderY - point.y
                        const distance = Math.sqrt(dx * dx + dy * dy)

                        if (!minDistance || distance < minDistance) {
                            minDistance = distance
                            closestRegionPoint = point
                            closestRegion = r
                            targetRegionPoint =
                                i === 0 ? 'topLeft' : i === 1 ? 'bottomLeft' : i === 2 ? 'topRight' : 'bottomRight'
                        }

                        i++
                    }

                    points.__destroy(true)
                }

                if (!closestRegion) {
                    Text.mkP(this.makerOwner, 'no region clicked')
                    return
                }

                this.targetRegion = closestRegion
                this.targetRegionPoint = targetRegionPoint
                Text.mkP(this.makerOwner, 'click target point')
            } else {
                if (this.targetRegionPoint === 'topLeft') {
                    this.targetRegion.setMinX(this.orderX)
                    this.targetRegion.setMinY(this.orderY)
                } else if (this.targetRegionPoint === 'topRight') {
                    this.targetRegion.setMaxX(this.orderX)
                    this.targetRegion.setMinY(this.orderY)
                } else if (this.targetRegionPoint === 'bottomLeft') {
                    this.targetRegion.setMinX(this.orderX)
                    this.targetRegion.setMaxY(this.orderY)
                } else if (this.targetRegionPoint === 'bottomRight') {
                    this.targetRegion.setMaxX(this.orderX)
                    this.targetRegion.setMaxY(this.orderY)
                }

                this.targetRegion = undefined
                this.targetRegionPoint = undefined
                Text.mkP(this.makerOwner, 'region point moved')
                this.escaper.destroyMake()

                this.escaper.getMakingLevel().updateDebugRegions()

                this.escaper.makeMoveRegionPoint()
                Text.mkP(this.escaper.getPlayer(), 'region point moving on')
            }
        }
    }
}
