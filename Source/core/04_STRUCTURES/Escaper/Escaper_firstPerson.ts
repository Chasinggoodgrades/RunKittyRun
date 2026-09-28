import { GetUnitZEx } from 'Utils/LocationUtils'
import { pathingBlockerUtils } from 'Utils/PathingBlockerUtils'
import { Constants } from 'core/01_libraries/Constants'
import { AfkMode } from 'core/08_GAME/Afk_mode/Afk_mode'
import { Timer } from 'w3ts'
import { getUdgEscapers, globals } from '../../../../globals'
import { createEvent, createTimer, forRange } from '../../../Utils/mapUtils'
import { Natives } from '../../wc3_natives_unsecured/Natives'
import { Escaper } from './Escaper'
type IKeys = 'UP' | 'DOWN' | 'LEFT' | 'RIGHT'

const FIRSTPERSON_SPEED_PER_PERIOD = 0.2
const FIRSTPERSON_ANGLE_PER_PERIOD = 0.3

export class EscaperFirstPerson {
    private forceCamTimer: Timer | null = null

    private escaper: Escaper

    private keyDownState: { [K in IKeys]: boolean } = {
        UP: false,
        DOWN: false,
        LEFT: false,
        RIGHT: false,
    }

    constructor(escaper: Escaper) {
        this.escaper = escaper
    }

    isFirstPerson = () => !!this.forceCamTimer

    toggleFirstPerson = (active: boolean) => {
        if (this.escaper.isAlive()) {
            this.escaper.setCanClick(!active)
        }

        if (active) {
            if (!this.forceCamTimer) {
                this.forceCamTimer = createTimer(0.001, true, () => {
                    const player = this.escaper.getPlayer()
                    const hero = this.escaper.getHero()

                    if (hero) {
                        if (this.escaper.isAlive() && this.isFirstPerson()) {
                            if (
                                !(this.isKeyDownState('LEFT') && this.isKeyDownState('RIGHT')) &&
                                (this.isKeyDownState('LEFT') || this.isKeyDownState('RIGHT'))
                            ) {
                                let angle = this.escaper.getHeroFacing()

                                if (this.isKeyDownState('LEFT')) {
                                    angle += FIRSTPERSON_ANGLE_PER_PERIOD
                                } else if (this.isKeyDownState('RIGHT')) {
                                    angle -= FIRSTPERSON_ANGLE_PER_PERIOD
                                }

                                BlzSetUnitFacingEx(hero, angle)
                            }

                            if (
                                !(this.isKeyDownState('UP') && this.isKeyDownState('DOWN')) &&
                                (this.isKeyDownState('UP') || this.isKeyDownState('DOWN'))
                            ) {
                                const angle = math.rad(this.escaper.getHeroFacing())
                                let fwd = 0

                                if (this.isKeyDownState('UP')) {
                                    fwd += FIRSTPERSON_SPEED_PER_PERIOD * (this.escaper.isSliding() ? 1 : 3)
                                } else if (this.isKeyDownState('DOWN')) {
                                    fwd -= FIRSTPERSON_SPEED_PER_PERIOD * (this.escaper.isSliding() ? 1 : 3)
                                }

                                const newX = this.escaper.getHeroX() + fwd * Cos(angle)
                                const newY = this.escaper.getHeroY() + fwd * Sin(angle)
                                let preventMove = false

                                if (!globals.canSlideOverPathingBlockers) {
                                    const newXd = Math.floor(newX / 64) * 64 + 32
                                    const newYd = Math.floor(newY / 64) * 64 + 32

                                    if (pathingBlockerUtils.isBlocked(newXd, newYd)) {
                                        preventMove = true
                                    }
                                }

                                if (!preventMove) {
                                    this.escaper.moveHero(newX, newY, false)
                                }
                            }
                        }

                        if (this.escaper.isAlive()) {
                            const isNormal = !this.escaper.isSliding() || this.escaper.getSlideMovePerPeriod() >= 0
                            const offsetZ = this.escaper.isLockCamHeight() ? GetUnitZEx(hero) : 0

                            SetCameraTargetControllerNoZForPlayer(player, hero, 0, 0, true)
                            SetCameraFieldForPlayer(player, CAMERA_FIELD_ANGLE_OF_ATTACK, 310, 0)
                            SetCameraFieldForPlayer(player, CAMERA_FIELD_FIELD_OF_VIEW, 1500, 0)
                            SetCameraFieldForPlayer(player, CAMERA_FIELD_ROTATION, this.escaper.getHeroFacing(), 0) // Using the duration argument can bug out the camera and gets it stuck to keep turning..
                            SetCameraFieldForPlayer(player, CAMERA_FIELD_ZOFFSET, offsetZ + (isNormal ? 100 : -200), 0)
                        }
                    }
                })
            }
        } else {
            this.forceCamTimer?.destroy()
            this.forceCamTimer = null
            this.escaper.resetCamera()
        }
    }

    setKeyDownState = (key: IKeys, state: boolean) => {
        this.keyDownState[key] = state
    }

    isKeyDownState = (key: IKeys) => this.keyDownState[key]
}

export const initFirstPerson = () => {
    const keyStates = [
        { keyDown: true, blzKeyDown: bj_KEYEVENTTYPE_DEPRESS },
        { keyDown: false, blzKeyDown: bj_KEYEVENTTYPE_RELEASE },
    ]

    const keys = [
        { key: 'UP' as 'UP', blzKey: bj_KEYEVENTKEY_UP },
        { key: 'DOWN' as 'DOWN', blzKey: bj_KEYEVENTKEY_DOWN },
        { key: 'LEFT' as 'LEFT', blzKey: bj_KEYEVENTKEY_LEFT },
        { key: 'RIGHT' as 'RIGHT', blzKey: bj_KEYEVENTKEY_RIGHT },
    ]

    keyStates.forEach(({ keyDown, blzKeyDown }) => {
        keys.forEach(({ key, blzKey }) => {
            createEvent({
                events: [
                    t =>
                        forRange(Constants.NB_ESCAPERS, i =>
                            TriggerRegisterPlayerKeyEventBJ(t, Natives.UPlayer(i), blzKeyDown, blzKey)
                        ),
                ],
                actions: [
                    () => {
                        getUdgEscapers()
                            .get(GetPlayerId(Natives.UGetTriggerPlayer()))
                            ?.getFirstPersonHandle()
                            .setKeyDownState(key, keyDown)

                        AfkMode.resetAfk(GetPlayerId(Natives.UGetTriggerPlayer()))
                    },
                ],
            })
        })
    })
}
