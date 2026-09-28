import { ServiceManager } from '../../../Services'
import { IDestroyable, MemoryHandler } from '../../../Utils/MemoryHandler'
import { arrayPush } from '../../01_libraries/Basic_functions'
import { DrawLine } from '../../01_libraries/Draw_lines'
import { MonsterSpawn } from '../MonsterSpawn/MonsterSpawn'
import { LineRegion } from './LineRegion'
import {
    END_POINT_OFFSET_AFTER_END_OF_REGION,
    MECRegion,
    OFFSET_FOR_START_LINE_NOT_SPAWNED_MONSTERS_TO_BE_CONSIDERED_OUT,
    StartAndEndPoints,
} from './MECRegion'

const RECTANGLE_REGION_MINIMUM_SIZE = 31 // LINE_REGION_WIDTH is 32 but because of float imprecision we need to set it a bit lower than 32

function GetTriangleArea(x1: number, y1: number, x2: number, y2: number, x3: number, y3: number): number {
    return Math.abs((x1 * (y2 - y3) + x2 * (y3 - y1) + x3 * (y1 - y2)) / 2)
}

export class MECZoneWidthTooSmallError extends Error {
    private readonly backupLineRegion: LineRegion
    constructor(message: string, lineRegion: LineRegion) {
        super(message)
        this.backupLineRegion = lineRegion
    }

    getBackupLineRegion() {
        return this.backupLineRegion
    }
}

export class TrapezeRegion extends MECRegion {
    protected x1: number
    protected y1: number
    protected x2: number
    protected y2: number
    protected x3: number
    protected y3: number
    private x4: number = 0
    private y4: number = 0

    private distanceP3P4: number

    private middleP1P2x = 0
    private middleP1P2y = 0
    private middleP3P4x = 0
    private middleP3P4y = 0
    protected middleVectorX = 0
    protected middleVectorY = 0
    private middleSidesVectorX = 0
    private middleSidesVectorY = 0

    protected startLineX1: number = 0
    protected startLineY1: number = 0
    protected startLineX2: number = 0
    protected startLineY2: number = 0
    private startLineDeltaX: number = 0
    private startLineDeltaY: number = 0
    private startLineLength: number = 0

    protected deltaX2X1: number = 0
    protected deltaY2Y1: number = 0
    private points1_2_denominator: number = 0

    private vectorStartX = 0
    private vectorStartY = 0
    private vectorStartLength = 0
    private vectorEndX = 0
    private vectorEndY = 0
    private vectorEndLength = 0

    protected endLineX1: number = 0
    protected endLineY1: number = 0
    protected endLineX2: number = 0
    protected endLineY2: number = 0
    private endLineDeltaX: number = 0
    private endLineDeltaY: number = 0
    private endLineLength = 0

    private area: number = 0

    // For parallelogram calculations preparation, but has to be declared here
    protected directionAngleCos: number = 0
    protected directionAngleSine: number = 0

    // For rect calculations preparation, but has to be declared here
    protected dotP1P2: number = 0
    protected dotP1P4: number = 0

    constructor(x1: number, y1: number, x2: number, y2: number, x3: number, y3: number, distanceP3P4: number) {
        super()

        this.x1 = x1
        this.y1 = y1
        this.x2 = x2
        this.y2 = y2
        this.x3 = x3
        this.y3 = y3
        this.distanceP3P4 = distanceP3P4

        const angle = Math.atan2(this.y2 - this.y1, this.x2 - this.x1)
        const minimalDistanceToP3 = Math.max(distanceP3P4, RECTANGLE_REGION_MINIMUM_SIZE)
        this.x4 = this.x3 + Math.cos(angle) * minimalDistanceToP3
        this.y4 = this.y3 + Math.sin(angle) * minimalDistanceToP3

        this.redefineZone()
    }

    redefineZone() {
        this.deltaX2X1 = this.x2 - this.x1
        this.deltaY2Y1 = this.y2 - this.y1

        this.points1_2_denominator = this.deltaX2X1 * this.deltaX2X1 + this.deltaY2Y1 * this.deltaY2Y1

        // Make sure the region has a minimal start width, or fallbacks to a line region
        const zoneWidth = Math.sqrt(this.deltaX2X1 * this.deltaX2X1 + this.deltaY2Y1 * this.deltaY2Y1)
        if (zoneWidth < RECTANGLE_REGION_MINIMUM_SIZE) {
            const middleX2X1 = (this.x1 + this.x2) / 2
            const middleY2Y1 = (this.y1 + this.y2) / 2
            const backupLineRegion = ServiceManager.getService('MECRegionService').newLineRegion(
                middleX2X1,
                middleY2Y1,
                this.x3,
                this.y3
            )

            throw new MECZoneWidthTooSmallError(
                `ParallelogramRegion: The width of the zone region is too small (width: ${zoneWidth}, minimum: ${RECTANGLE_REGION_MINIMUM_SIZE}) ; use LineRegion instead`,
                backupLineRegion
            )
        }

        // Make sure the region has a minimal length
        this.vectorStartX = this.x3 - this.x1
        this.vectorStartY = this.y3 - this.y1
        this.vectorStartLength = Math.sqrt(
            this.vectorStartX * this.vectorStartX + this.vectorStartY * this.vectorStartY
        )
        this.vectorEndX = this.x4 - this.x2
        this.vectorEndY = this.y4 - this.y2
        this.vectorEndLength = Math.sqrt(this.vectorEndX * this.vectorEndX + this.vectorEndY * this.vectorEndY)

        const multiplierToHaveMinimumLength = Math.max(
            Math.min(1, RECTANGLE_REGION_MINIMUM_SIZE / this.vectorStartLength),
            Math.min(1, RECTANGLE_REGION_MINIMUM_SIZE / this.vectorEndLength)
        )

        if (multiplierToHaveMinimumLength > 1) {
            this.vectorStartLength = this.vectorStartLength * multiplierToHaveMinimumLength
            this.vectorEndLength = this.vectorEndLength * multiplierToHaveMinimumLength
            this.vectorStartX = this.vectorStartX * multiplierToHaveMinimumLength
            this.vectorStartY = this.vectorStartY * multiplierToHaveMinimumLength
            this.vectorEndX = this.vectorEndX * multiplierToHaveMinimumLength
            this.vectorEndY = this.vectorEndY * multiplierToHaveMinimumLength
            this.x3 = this.x1 + this.vectorStartX
            this.y3 = this.y1 + this.vectorStartY
            this.x4 = this.x2 + this.vectorEndX
            this.y4 = this.y2 + this.vectorEndY
        }

        // Calculate middle vectors
        this.middleP1P2x = (this.x1 + this.x2) / 2
        this.middleP1P2y = (this.y1 + this.y2) / 2
        this.middleP3P4x = (this.x3 + this.x4) / 2
        this.middleP3P4y = (this.y3 + this.y4) / 2
        this.middleVectorX = this.middleP3P4x - this.middleP1P2x
        this.middleVectorY = this.middleP3P4y - this.middleP1P2y

        const middleSidesP1P3x = (this.x1 + this.x3) / 2
        const middleSidesP1P3y = (this.y1 + this.y3) / 2
        const middleSidesP2P4x = (this.x2 + this.x4) / 2
        const middleSidesP2P4y = (this.y2 + this.y4) / 2
        this.middleSidesVectorX = middleSidesP2P4x - middleSidesP1P3x
        this.middleSidesVectorY = middleSidesP2P4y - middleSidesP1P3y

        this.calculateStartAndEndLine()

        this.areCoordsInRegionPreCalculation()
    }

    private calculateStartAndEndLine() {
        const dist1_2 = Math.sqrt(this.points1_2_denominator)

        /**
         * Calculate start line
         */
        // start line reduced a little for edge spawn monsters not to instantly disapear because of considered out of the region
        this.startLineX1 =
            this.x1 + (OFFSET_FOR_START_LINE_NOT_SPAWNED_MONSTERS_TO_BE_CONSIDERED_OUT * this.deltaX2X1) / dist1_2
        this.startLineY1 =
            this.y1 + (OFFSET_FOR_START_LINE_NOT_SPAWNED_MONSTERS_TO_BE_CONSIDERED_OUT * this.deltaY2Y1) / dist1_2
        this.startLineX2 =
            this.x2 - (OFFSET_FOR_START_LINE_NOT_SPAWNED_MONSTERS_TO_BE_CONSIDERED_OUT * this.deltaX2X1) / dist1_2
        this.startLineY2 =
            this.y2 - (OFFSET_FOR_START_LINE_NOT_SPAWNED_MONSTERS_TO_BE_CONSIDERED_OUT * this.deltaY2Y1) / dist1_2

        // start line moved a little towards the end line for edge spawn monsters not to instantly disapear because of considered out of the region
        this.startLineX1 =
            this.startLineX1 +
            (OFFSET_FOR_START_LINE_NOT_SPAWNED_MONSTERS_TO_BE_CONSIDERED_OUT * this.vectorStartX) /
                this.vectorStartLength
        this.startLineY1 =
            this.startLineY1 +
            (OFFSET_FOR_START_LINE_NOT_SPAWNED_MONSTERS_TO_BE_CONSIDERED_OUT * this.vectorStartY) /
                this.vectorStartLength
        this.startLineX2 =
            this.startLineX2 +
            (OFFSET_FOR_START_LINE_NOT_SPAWNED_MONSTERS_TO_BE_CONSIDERED_OUT * this.vectorEndX) / this.vectorEndLength
        this.startLineY2 =
            this.startLineY2 +
            (OFFSET_FOR_START_LINE_NOT_SPAWNED_MONSTERS_TO_BE_CONSIDERED_OUT * this.vectorEndY) / this.vectorEndLength

        this.startLineDeltaX = this.startLineX2 - this.startLineX1
        this.startLineDeltaY = this.startLineY2 - this.startLineY1
        this.startLineLength = Math.sqrt(
            this.startLineDeltaX * this.startLineDeltaX + this.startLineDeltaY * this.startLineDeltaY
        )

        /**
         * Calculate end line
         */
        const dist3_4 = Math.sqrt((this.x4 - this.x3) ** 2 + (this.y4 - this.y3) ** 2)

        // end line reduced a little for edge spawn monsters not to instantly disapear because of considered out of the region
        this.endLineX1 =
            this.x3 + (OFFSET_FOR_START_LINE_NOT_SPAWNED_MONSTERS_TO_BE_CONSIDERED_OUT * this.deltaX2X1) / dist3_4
        this.endLineY1 =
            this.y3 + (OFFSET_FOR_START_LINE_NOT_SPAWNED_MONSTERS_TO_BE_CONSIDERED_OUT * this.deltaY2Y1) / dist3_4
        this.endLineX2 =
            this.x4 - (OFFSET_FOR_START_LINE_NOT_SPAWNED_MONSTERS_TO_BE_CONSIDERED_OUT * this.deltaX2X1) / dist3_4
        this.endLineY2 =
            this.y4 - (OFFSET_FOR_START_LINE_NOT_SPAWNED_MONSTERS_TO_BE_CONSIDERED_OUT * this.deltaY2Y1) / dist3_4

        this.endLineDeltaX = this.endLineX2 - this.endLineX1
        this.endLineDeltaY = this.endLineY2 - this.endLineY1

        this.endLineLength = Math.sqrt(
            this.endLineDeltaX * this.endLineDeltaX + this.endLineDeltaY * this.endLineDeltaY
        )

        // Offset set endline outside of the region for spawned monsters to leave the region at the end of their movement and dispear correctly
        const startToEndLineDeltaX1 = this.endLineX1 - this.startLineX1
        const startToEndLineDeltaY1 = this.endLineY1 - this.startLineY1
        const angleStartToEndLineP1 = Math.atan2(startToEndLineDeltaY1, startToEndLineDeltaX1)
        this.endLineX1 = this.endLineX1 + Math.cos(angleStartToEndLineP1) * END_POINT_OFFSET_AFTER_END_OF_REGION
        this.endLineY1 = this.endLineY1 + Math.sin(angleStartToEndLineP1) * END_POINT_OFFSET_AFTER_END_OF_REGION

        const startToEndLineDeltaX2 = this.endLineX2 - this.startLineX2
        const startToEndLineDeltaY2 = this.endLineY2 - this.startLineY2
        const angleStartToEndLineP2 = Math.atan2(startToEndLineDeltaY2, startToEndLineDeltaX2)
        this.endLineX2 = this.endLineX2 + Math.cos(angleStartToEndLineP2) * END_POINT_OFFSET_AFTER_END_OF_REGION
        this.endLineY2 = this.endLineY2 + Math.sin(angleStartToEndLineP2) * END_POINT_OFFSET_AFTER_END_OF_REGION
    }

    /**
     * Pre-calculations for areCoordsInRegion best performance
     */
    protected areCoordsInRegionPreCalculation() {
        // Area pre-calculation
        const xCenter = this.getCenterX()
        const yCenter = this.getCenterY()
        this.area =
            GetTriangleArea(this.x1, this.y1, this.x2, this.y2, xCenter, yCenter) +
            GetTriangleArea(this.x2, this.y2, this.x4, this.y4, xCenter, yCenter) +
            GetTriangleArea(this.x4, this.y4, this.x3, this.y3, xCenter, yCenter) +
            GetTriangleArea(this.x3, this.y3, this.x1, this.y1, xCenter, yCenter)
    }

    moveTo(newCenterX: number, newCenterY: number): void {
        const deltaX = newCenterX - this.getCenterX()
        const deltaY = newCenterY - this.getCenterY()

        this.x1 += deltaX
        this.y1 += deltaY
        this.x2 += deltaX
        this.y2 += deltaY
        this.x3 += deltaX
        this.y3 += deltaY

        this.redefineZone()
        this.refreshDebuggingRects()
    }

    areCoordsInRegion(x: number, y: number) {
        // Let's say (x, y) is point P
        const areaIfPWouldBeIn =
            GetTriangleArea(this.x1, this.y1, this.x2, this.y2, x, y) +
            GetTriangleArea(this.x2, this.y2, this.x4, this.y4, x, y) +
            GetTriangleArea(this.x4, this.y4, this.x3, this.y3, x, y) +
            GetTriangleArea(this.x3, this.y3, this.x1, this.y1, x, y)

        return Math.abs(areaIfPWouldBeIn - this.area) < 10 // allow some margin of error because of float imprecision
    }

    generateDebugLightnings(): lightning[] {
        this.defineDebugLineTypeForStart()
        arrayPush(this.debugLightnings, DrawLine(this.x1, this.y1, this.x2, this.y2))

        this.defineDebugLineType()
        arrayPush(this.debugLightnings, DrawLine(this.x2, this.y2, this.x4, this.y4))
        arrayPush(this.debugLightnings, DrawLine(this.x3, this.y3, this.x1, this.y1))

        if (this.isLeaveZoneEnabled) {
            this.defineDebugLineTypeForEnd()
            arrayPush(this.debugLightnings, DrawLine(this.x3, this.y3, this.x4, this.y4))
        }

        return this.debugLightnings
    }

    generateStartAndEndPoints(monsterSpawn?: MonsterSpawn) {
        let startAndEndPoints: StartAndEndPoints & IDestroyable
        if (monsterSpawn?.getFixedSpawnOffset() !== undefined) {
            startAndEndPoints = this.generateStartAndEndPointsWithFixedSpawnOffset(monsterSpawn)
        } else {
            startAndEndPoints = MemoryHandler.getEmptyObject<StartAndEndPoints>()

            const randomOffsetValueStartLine = GetRandomReal(0, 1)

            startAndEndPoints.startX = this.startLineX1 + randomOffsetValueStartLine * this.startLineDeltaX
            startAndEndPoints.startY = this.startLineY1 + randomOffsetValueStartLine * this.startLineDeltaY

            const randomOffsetValueEndLine =
                monsterSpawn?.getMonsterDirectionMode() === 'random' ? GetRandomReal(0, 1) : randomOffsetValueStartLine
            startAndEndPoints.endX = this.endLineX1 + randomOffsetValueEndLine * this.endLineDeltaX
            startAndEndPoints.endY = this.endLineY1 + randomOffsetValueEndLine * this.endLineDeltaY
        }

        // Handle forced distance
        const forcedDistance = monsterSpawn?.getForcedDistance()
        if (forcedDistance !== undefined) {
            const directionAngle = Math.atan2(
                startAndEndPoints.endY - startAndEndPoints.startY,
                startAndEndPoints.endX - startAndEndPoints.startX
            )
            startAndEndPoints.endX = startAndEndPoints.startX + Math.cos(directionAngle) * forcedDistance
            startAndEndPoints.endY = startAndEndPoints.startY + Math.sin(directionAngle) * forcedDistance
        }

        // Set startAndEndPoints as ephemeral
        startAndEndPoints.ephemeral = true

        return startAndEndPoints
    }

    private generateStartAndEndPointsWithFixedSpawnOffset(monsterSpawn: MonsterSpawn) {
        const spawnValStartLine = this.calcValOffset(monsterSpawn)
        const spawnValEndLine = (spawnValStartLine * this.endLineLength) / this.startLineLength

        const startAndEndPoints = MemoryHandler.getEmptyObject<StartAndEndPoints>()
        startAndEndPoints.startX = this.startLineX1 + (spawnValStartLine / this.startLineLength) * this.startLineDeltaX
        startAndEndPoints.startY = this.startLineY1 + (spawnValStartLine / this.startLineLength) * this.startLineDeltaY
        startAndEndPoints.endX = this.endLineX1 + (spawnValEndLine / this.endLineLength) * this.endLineDeltaX
        startAndEndPoints.endY = this.endLineY1 + (spawnValEndLine / this.endLineLength) * this.endLineDeltaY

        return startAndEndPoints
    }

    private calcValOffset = (monsterSpawn: MonsterSpawn) => {
        const lastSpawnVal = monsterSpawn.getLastSpawnVal() ?? 0

        const spawnOffset = monsterSpawn.getSpawnOffset()
        const spawnIndex = monsterSpawn.getSpawnIndex()
        const spawnAmount = monsterSpawn.getSpawnAmount()

        let newSpawnVal: number

        if (monsterSpawn.getFixedSpawnOffsetMirrored() && monsterSpawn.getMirrored()) {
            newSpawnVal = this.startLineLength - lastSpawnVal
        } else {
            newSpawnVal = lastSpawnVal
            while (true) {
                const bouncingBefore = monsterSpawn.getBouncing()
                newSpawnVal = this.calculateNextNewSpawnVal(monsterSpawn, newSpawnVal)

                if (
                    !monsterSpawn.getFixedSpawnOffsetBounce() ||
                    bouncingBefore !== monsterSpawn.getBouncing() ||
                    spawnIndex !== 0 ||
                    spawnAmount === 1
                ) {
                    break
                }

                // check if other spawnIndex mobs would be out of the start line
                const spawnValOfLastSpawnIndex =
                    newSpawnVal + spawnOffset * (spawnAmount - 1) * (monsterSpawn.getBouncing() ? -1 : 1)
                if (!this.isSpawnValOutOfBounds(spawnValOfLastSpawnIndex)) {
                    break
                }
            }
        }

        if (monsterSpawn.getFixedSpawnOffsetMirrored()) {
            if ((spawnOffset === 0 || spawnIndex % 2 === 0) && !monsterSpawn.getMirrored()) {
                monsterSpawn.setLastSpawnVal(newSpawnVal)
            }

            monsterSpawn.setMirrored(!monsterSpawn.getMirrored())
        } else if (spawnOffset === 0 || spawnIndex === 0) {
            monsterSpawn.setLastSpawnVal(newSpawnVal)
        }

        return newSpawnVal
    }

    private calculateNextNewSpawnVal(monsterSpawn: MonsterSpawn, lastSpawnVal: number) {
        const fixedSpawnOffset = monsterSpawn.getFixedSpawnOffset()
        if (fixedSpawnOffset === undefined) {
            throw new Error('fixedSpawnOffset is required for RectangleRegion calcValOffset')
        }

        let newSpawnVal
        if (fixedSpawnOffset === 'auto') {
            const spawnAmount = monsterSpawn.getSpawnAmount()

            if (spawnAmount === 1) {
                // One monster, always centered
                newSpawnVal = this.startLineLength / 2
            } else {
                // More than one monster, evenly distibuted on the line, with the first one on the start and the last one on the end
                const distanceBetweenMonsters = this.startLineLength / (spawnAmount - 1)
                newSpawnVal = monsterSpawn.getSpawnIndex() * distanceBetweenMonsters
            }
        } else {
            if (monsterSpawn.getSpawnOffset() === 0 || monsterSpawn.getSpawnIndex() === 0) {
                newSpawnVal = lastSpawnVal + fixedSpawnOffset * (monsterSpawn.getBouncing() ? -1 : 1)
            } else {
                newSpawnVal =
                    lastSpawnVal +
                    monsterSpawn.getSpawnOffset() *
                        monsterSpawn.getSpawnIndex() *
                        (monsterSpawn.getBouncing() ? -1 : 1) *
                        (monsterSpawn.getFixedSpawnOffsetMirrored() ? 0.5 : 1)
            }

            if (this.isSpawnValOutOfBounds(newSpawnVal)) {
                newSpawnVal = this.loopSpawnValToBounds(newSpawnVal, monsterSpawn.getFixedSpawnOffsetBounce())
                if (
                    monsterSpawn.getFixedSpawnOffsetBounce() &&
                    (monsterSpawn.getSpawnOffset() === 0 || monsterSpawn.getSpawnIndex() === 0)
                ) {
                    monsterSpawn.setBouncing(!monsterSpawn.getBouncing())
                }
            }
        }

        return newSpawnVal
    }

    private isSpawnValOutOfBounds(spawnVal: number): boolean {
        return spawnVal > this.startLineLength || spawnVal < 0
    }

    private loopSpawnValToBounds(spawnVal: number, fixedSpawnOffsetBounce = false): number {
        let newSpawnVal = spawnVal
        if (fixedSpawnOffsetBounce) {
            if (newSpawnVal > this.startLineLength) {
                const delta = newSpawnVal - this.startLineLength
                newSpawnVal = Math.max(0, this.startLineLength - delta)
            } else if (newSpawnVal < 0) {
                newSpawnVal = Math.min(this.startLineLength, -newSpawnVal)
            }

            return newSpawnVal
        } else {
            if (newSpawnVal > this.startLineLength) {
                newSpawnVal -= this.startLineLength
            } else if (newSpawnVal < 0) {
                newSpawnVal += this.startLineLength
            } else {
                return newSpawnVal
            }

            return this.loopSpawnValToBounds(newSpawnVal)
        }
    }

    toJson() {
        const output = MemoryHandler.getEmptyObject<any>()

        output.type = this.constructor.name
        output.x1 = R2I(this.x1)
        output.y1 = R2I(this.y1)
        output.x2 = R2I(this.x2)
        output.y2 = R2I(this.y2)
        output.x3 = R2I(this.x3)
        output.y3 = R2I(this.y3)
        output.distanceP3P4 = R2I(this.distanceP3P4)

        return output
    }

    /**
     * In trapeze region we consider the length as the distance between the middle of the start line and the middle of the end line
     */
    getLength() {
        return Math.round(Math.sqrt(this.middleVectorX ** 2 + this.middleVectorY ** 2))
    }

    /**
     * In trapeze region we consider the width as the distance between the middle of side lines
     */
    getWidth() {
        return Math.round(Math.sqrt(this.middleSidesVectorX ** 2 + this.middleSidesVectorY ** 2))
    }

    /**
     * In trapeze region we consider the direction angle as the angle between the middle of the start line and the middle of the end line
     */
    getDirectionAngleDegrees() {
        return Math.round((Math.atan2(this.middleVectorY, this.middleVectorX) * 180) / Math.PI)
    }

    getArea(): number {
        return this.area
    }

    getCenterX(): number {
        return this.middleP1P2x + this.middleVectorX / 2
    }

    getCenterY(): number {
        return this.middleP1P2y + this.middleVectorY / 2
    }

    toText(detailled = false) {
        const width = this.getWidth()
        const isLine = width <= RECTANGLE_REGION_MINIMUM_SIZE
        return (
            super.toText() +
            (detailled
                ? ': len(' +
                  this.getLength() +
                  ')' +
                  (!isLine ? ' wid(' + width + ')' : '') +
                  ' dir(' +
                  this.getDirectionAngleDegrees() +
                  '°)'
                : '')
        )
    }
}
