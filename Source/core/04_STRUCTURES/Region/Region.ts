import { MemoryHandler } from 'Utils/MemoryHandler'
import { createPoint } from 'Utils/Point'
import { createEvent } from 'Utils/mapUtils'
import { Constants } from 'core/01_libraries/Constants'
import { hooks } from 'core/API/GeneralHooks'
import { udg_colorCode } from '../../01_libraries/Init_colorCodes'
import { Text } from '../../01_libraries/Text'
import { Natives } from '../../wc3_natives_unsecured/Natives'
import { Hero2Escaper } from '../Escaper/Escaper_functions'
import { Level } from '../Level/Level'
import { requestContactChunksRebuild } from '../Monster/ContactChunks'

export class Region {
    private static lastInstanceId = -1

    public static getNextId = () => {
        return ++Region.lastInstanceId
    }

    public level: Level | undefined = undefined
    private id: number
    private label: string

    private minX: number
    private minY: number
    private maxX: number
    private maxY: number

    private flags: string[] = []

    private wRect: rect | null = null
    private wRectOnce: { [x: number]: boolean } = {}
    private wTrigger: trigger | null = null

    private activeB = false

    constructor(label: string, x1: number, y1: number, x2: number, y2: number) {
        this.id = Region.getNextId()
        this.label = label
        this.minX = Math.round(RMinBJ(x1, x2))
        this.minY = Math.round(RMinBJ(y1, y2))
        this.maxX = Math.round(RMaxBJ(x1, x2))
        this.maxY = Math.round(RMaxBJ(y1, y2))
    }

    activate = (activ: boolean) => {
        this.activeB = activ
        this.recalcRect()
    }

    getId() {
        return this.id
    }

    getLabel = (): string => {
        return this.label
    }

    getMinX = () => this.minX
    getMaxX = () => this.maxX
    getMinY = () => this.minY
    getMaxY = () => this.maxY

    setMinX = (x: number) => {
        this.minX = x
        this.recalcXY()
    }

    setMaxX = (x: number) => {
        this.maxX = x
        this.recalcXY()
    }

    setMinY = (y: number) => {
        this.minY = y
        this.recalcXY()
    }

    setMaxY = (y: number) => {
        this.maxY = y
        this.recalcXY()
    }

    recalcXY = () => {
        const x1 = this.minX
        const y1 = this.minY
        const x2 = this.maxX
        const y2 = this.maxY

        this.minX = Math.round(RMinBJ(x1, x2))
        this.minY = Math.round(RMinBJ(y1, y2))
        this.maxX = Math.round(RMaxBJ(x1, x2))
        this.maxY = Math.round(RMaxBJ(y1, y2))
        this.recalcRect()
    }

    recalcRect = () => {
        this.wRect && RemoveRect(this.wRect)

        if (this.activeB) {
            this.wRect = Rect(this.minX, this.minY, this.maxX, this.maxY)

            if (!!hooks.hooks_onHeroEnterRegion || !!hooks.hooks_onHeroEnterRegionOnce) {
                this.wTrigger && DestroyTrigger(this.wTrigger)
                this.wTrigger = createEvent({
                    events: [t => this.wRect && TriggerRegisterEnterRectSimple(t, this.wRect)],
                    actions: [
                        () => {
                            const escaper = Hero2Escaper(Natives.UGetTriggerUnit())

                            if (escaper) {
                                if (!!hooks.hooks_onHeroEnterRegion) {
                                    for (const hook of hooks.hooks_onHeroEnterRegion.getHooks()) {
                                        hook.execute2(escaper, this)
                                    }
                                }

                                if (!this.wRectOnce[escaper.getId()]) {
                                    this.wRectOnce[escaper.getId()] = true

                                    if (!!hooks.hooks_onHeroEnterRegionOnce) {
                                        for (const hook of hooks.hooks_onHeroEnterRegionOnce.getHooks()) {
                                            hook.execute2(escaper, this)
                                        }
                                    }
                                }
                            }
                        },
                    ],
                })
            }
        } else {
            this.wTrigger && DestroyTrigger(this.wTrigger)
        }
    }

    getRandomPoint = () => {
        return createPoint(
            this.minX + Math.random() * (this.maxX - this.minX),
            this.minY + Math.random() * (this.maxY - this.minY)
        )
    }

    destroy = () => {
        this.level && this.level.regions.removeRegion(this.id)
    }

    setLabel = (newLabel: string) => {
        this.label = newLabel
    }

    toText = (): string => {
        return udg_colorCode[Constants.GREY] + this.label
    }

    displayForPlayer = (p: player) => {
        Text.P_timed(p, Constants.TERRAIN_DATA_DISPLAY_TIME, this.toText())
    }

    setFlags = (flags: string[]) => {
        this.flags = flags
        requestContactChunksRebuild() // a wanderable region is how far the monsters inside it roam
    }

    hasFlag = (flag: string) => {
        return this.flags.includes(flag)
    }

    setFlag = (flag: string, b: boolean) => {
        requestContactChunksRebuild()

        if (b) {
            if (!this.flags.includes(flag)) {
                this.flags.push(flag)
            }
        } else {
            if (this.flags.includes(flag)) {
                this.flags.splice(this.flags.indexOf(flag), 1)
            }
        }
    }

    toJson = () => {
        const output = MemoryHandler.getEmptyObject<any>()

        output['label'] = this.label
        output['minX'] = R2I(this.minX)
        output['minY'] = R2I(this.minY)
        output['maxX'] = R2I(this.maxX)
        output['maxY'] = R2I(this.maxY)
        output['flags'] = this.flags

        return output
    }
}
