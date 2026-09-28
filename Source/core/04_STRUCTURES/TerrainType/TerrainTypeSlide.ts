import { Constants } from 'core/01_libraries/Constants'
import { COLOR_TERRAIN_SLIDE } from '../../01_libraries/Init_colorCodes'
import { Text } from '../../01_libraries/Text'
import { HERO_ROTATION_SPEED } from '../../07_TRIGGERS/Slide_and_CheckTerrain_triggers/SlidingMax'
import { DISPLAY_SPACE, TerrainType } from './TerrainType'

export class TerrainTypeSlide extends TerrainType {
    private slideSpeed: number
    private rotationSpeed: number
    private canTurn: boolean

    constructor(
        label: string,
        terrainTypeId: number,
        slideSpeed: number,
        canTurn: boolean,
        rotationSpeed: number | null
    ) {
        super(label, terrainTypeId, null, 'slide', 0, 1)

        this.slideSpeed = slideSpeed
        this.canTurn = canTurn
        this.rotationSpeed = !canTurn ? 0 : rotationSpeed === null ? HERO_ROTATION_SPEED : rotationSpeed
    }

    getSlideSpeed = (): number => {
        return this.slideSpeed
    }

    setSlideSpeed = (slideSpeed: number) => {
        this.slideSpeed = slideSpeed
    }

    getRotationSpeed = (): number => {
        return this.rotationSpeed
    }

    setRotationSpeed = (rotationSpeed: number) => {
        this.rotationSpeed = rotationSpeed
    }

    getCanTurn = (): boolean => {
        return this.canTurn
    }

    setCanTurn = (canTurn: boolean): boolean => {
        if (canTurn === this.canTurn) {
            return false
        }
        this.canTurn = canTurn
        return true
    }

    getColor = () => {
        return COLOR_TERRAIN_SLIDE
    }

    toText = (): string => {
        let display = this.baseTextForDisplay()

        let displayCanTurn: string
        if (this.getCanTurn()) {
            displayCanTurn = 'can turn'
        } else {
            displayCanTurn = "can't turn"
        }

        display =
            display +
            I2S(R2I(this.getSlideSpeed())) +
            DISPLAY_SPACE +
            displayCanTurn +
            (this.getCanTurn() ? ':' + this.rotationSpeed : '')

        //display cliff class
        display += DISPLAY_SPACE + 'cliff' + I2S(this.cliffClassId)
        return display
    }

    displayForPlayer = (p: player) => {
        Text.P_timed(p, Constants.TERRAIN_DATA_DISPLAY_TIME, this.toText())
    }

    toJson() {
        const output = super.toJson()

        output['slideSpeed'] = this.getSlideSpeed()
        output['canTurn'] = this.getCanTurn()
        output['rotationSpeed'] = this.rotationSpeed

        return output
    }

    destroy = () => {}
}
