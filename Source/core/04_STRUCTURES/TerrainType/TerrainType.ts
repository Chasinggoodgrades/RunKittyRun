import { MemoryHandler } from 'Utils/MemoryHandler'
import { CanUseTerrain } from 'core/07_TRIGGERS/Modify_terrain_Functions/Terrain_functions'
import { Ascii2String } from '../../01_libraries/Ascii'
import { TerrainTypeDeath } from './TerrainTypeDeath'
import { TerrainTypeSlide } from './TerrainTypeSlide'
import { TerrainTypeWalk } from './TerrainTypeWalk'

export const DISPLAY_SPACE = '   '

export const isWalkTerrain = (tt: TerrainType): tt is TerrainTypeWalk => tt.kind === 'walk'
export const isSlideTerrain = (tt: TerrainType): tt is TerrainTypeSlide => tt.kind === 'slide'
export const isDeathTerrain = (tt: TerrainType): tt is TerrainTypeDeath => tt.kind === 'death'

export abstract class TerrainType {
    label: string
    theAlias: string | null
    kind: 'walk' | 'slide' | 'death'
    terrainTypeId: number
    orderId: number //numéro du terrain (ordre des tilesets), de 1 à 16
    cliffClassId: number //cliff class 1 or 2, depending of the main tileset
    gravity: number | undefined = undefined

    constructor(
        label: string,
        terrainTypeId: number,
        theAlias: string | null,
        kind: 'walk' | 'slide' | 'death',
        orderId: number,
        cliffClassId: number
    ) {
        if (terrainTypeId == 0) {
            throw 'Wrong terrain type id'
        }

        if (!CanUseTerrain(terrainTypeId)) {
            throw 'Terrain tiles number limit reached'
        }

        this.label = label
        this.terrainTypeId = terrainTypeId
        this.theAlias = theAlias
        this.kind = kind
        this.orderId = orderId
        this.cliffClassId = cliffClassId
    }

    setOrderId = (orderId: number): TerrainType => {
        this.orderId = orderId
        return this
    }

    getOrderId = (): number => {
        return this.orderId
    }

    setCliffClassId = (cliffClassId: number): TerrainType => {
        if (cliffClassId === 1 || cliffClassId === 2) {
            this.cliffClassId = cliffClassId
        }
        return this
    }

    getCliffClassId = (): number => {
        return this.cliffClassId
    }

    setType = (terrainTypeId: number) => {
        this.terrainTypeId = terrainTypeId
    }

    setLabel = (label: string) => {
        this.label = label
    }

    setAlias = (theAlias: string): TerrainType => {
        this.theAlias = theAlias
        return this
    }

    getTerrainTypeId = (): number => {
        return this.terrainTypeId
    }

    setTerrainTypeId = (terrainTypeId: number): boolean => {
        if (!CanUseTerrain(terrainTypeId)) {
            return false
        }
        this.terrainTypeId = terrainTypeId
        return true
    }

    getKind = () => {
        return this.kind
    }

    getGravity = () => this.gravity
    setGravity = (gravity: number) => (this.gravity = gravity)

    abstract getColor(): string

    abstract displayForPlayer(p: player): void

    abstract toText(): string

    baseTextForDisplay = () => {
        let order: string
        if (this.orderId !== 0) {
            order = ' (order ' + I2S(this.orderId) + ')'
        } else {
            order = ''
        }

        let display =
            this.getColor() +
            this.label +
            (this.theAlias && this.theAlias != '' ? ' ' + this.theAlias : '') +
            order +
            " : '" +
            Ascii2String(this.terrainTypeId) +
            "'"

        if (this.gravity) {
            display += ` g:${this.gravity}`
        }

        display += DISPLAY_SPACE

        return display
    }

    toJson() {
        const output = MemoryHandler.getEmptyObject<any>()

        output['label'] = this.label
        output['alias'] = this.theAlias
        output['orderId'] = this.orderId
        output['kind'] = this.kind
        output['terrainTypeId'] = Ascii2String(this.terrainTypeId)
        output['cliffClassId'] = this.cliffClassId
        output['gravity'] = this.gravity

        return output
    }

    abstract destroy(): void
}
