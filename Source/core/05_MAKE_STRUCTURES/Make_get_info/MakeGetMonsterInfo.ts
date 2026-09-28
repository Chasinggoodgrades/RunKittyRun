import { Constants } from 'core/01_libraries/Constants'
import { Make } from 'core/05_MAKE_STRUCTURES/Make/Make'
import { Ascii2String } from '../../01_libraries/Ascii'
import { udg_colorCode } from '../../01_libraries/Init_colorCodes'
import { Text } from '../../01_libraries/Text'
import { MonsterSpawn } from '../../04_STRUCTURES/MonsterSpawn/MonsterSpawn'
import { MONSTER_NEAR_DIFF_MAX } from '../../04_STRUCTURES/Monster/MonsterArray'

export class MakeGetMonsterInfo extends Make {
    constructor(maker: unit) {
        super(maker, 'getMonsterInfo', false)
    }

    doActions = () => {
        if (super.doBaseActions()) {
            const level = this.escaper.getMakingLevel()
            const monster = level.monsters.getMonsterNear(this.orderX, this.orderY)

            if (!monster || !monster.u) {
                if (!this.findAndDisplayMonsterSpawnInfo()) {
                    Text.erP(
                        this.makerOwner,
                        'No monster found near click location (max range: ' + MONSTER_NEAR_DIFF_MAX + ')'
                    )
                }
                return
            }

            const monsterType = monster.getMonsterType()
            const xMob = GetUnitX(monster.u)
            const yMob = GetUnitY(monster.u)
            const distance = R2I(SquareRoot((this.orderX - xMob) ** 2 + (this.orderY - yMob) ** 2))

            Text.DisplayLineToPlayer(this.makerOwner)
            Text.P_timed(
                this.makerOwner,
                Constants.TERRAIN_DATA_DISPLAY_TIME,
                udg_colorCode[Constants.TEAL] + '--- Monster Info ---'
            )

            // Monster Type Info
            if (monsterType) {
                const space = '   '
                let display = udg_colorCode[Constants.RED] + 'Type: ' + monsterType.label
                if (monsterType.theAlias) {
                    display += ' (' + monsterType.theAlias + ')'
                }
                Text.P_timed(this.makerOwner, Constants.TERRAIN_DATA_DISPLAY_TIME, display)

                display = udg_colorCode[Constants.GREY] + 'Unit: ' + Ascii2String(monsterType.getUnitTypeId())
                display += space + 'Speed: ' + I2S(R2I(monsterType.getUnitMoveSpeed()))
                display += space + 'Immolation: ' + monsterType.getImmolationRadiusStr()
                Text.P_timed(this.makerOwner, Constants.TERRAIN_DATA_DISPLAY_TIME, display)

                const monsterSkin = monster.getMonsterSkin()
                if (monsterSkin !== undefined) {
                    const skinDisplay = udg_colorCode[Constants.GREY] + 'Skin: ' + Ascii2String(monsterSkin)
                    Text.P_timed(this.makerOwner, Constants.TERRAIN_DATA_DISPLAY_TIME, skinDisplay)
                }

                const scale = monsterType.getScale()
                const height = monsterType.getHeight()
                display = udg_colorCode[Constants.GREY] + 'Scale: ' + (scale === -1 ? 'default' : R2S(scale))
                display += space + 'Height: ' + (height === -1 ? 'default' : I2S(R2I(height)))
                if (monsterType.isClickable()) {
                    display += space + 'Clickable: ' + I2S(monsterType.getMaxLife() / 10000)
                }
                if (monsterType.isWanderable()) {
                    display += space + 'Wanderable'
                }
                Text.P_timed(this.makerOwner, Constants.TERRAIN_DATA_DISPLAY_TIME, display)
            }

            // Monster Instance Info
            let instanceInfo = udg_colorCode[Constants.GREY] + 'ID: ' + I2S(monster.getId())
            instanceInfo += '   Life: ' + I2S(monster.getLife())
            instanceInfo += '   Distance: ' + I2S(distance)
            Text.P_timed(this.makerOwner, Constants.TERRAIN_DATA_DISPLAY_TIME, instanceInfo)

            // Attack Ground Info
            if (monster.hasAttackGroundPos()) {
                const attackDelay = monster.getAttackGroundDelay()
                const attackDelayInfo = udg_colorCode[Constants.GREY] + 'Attack Ground Delay: ' + R2S(attackDelay) + 's'
                Text.P_timed(this.makerOwner, Constants.TERRAIN_DATA_DISPLAY_TIME, attackDelayInfo)
            }

            // Position
            const posInfo = udg_colorCode[Constants.GREY] + 'Position: (' + I2S(R2I(xMob)) + ', ' + I2S(R2I(yMob)) + ')'
            Text.P_timed(this.makerOwner, Constants.TERRAIN_DATA_DISPLAY_TIME, posInfo)

            // Monster properties
            const clearMob = monster.getClearMob()
            const portalMob = monster.getPortalMob()
            const circleMob = monster.getCircleMob()
            const jumpPad = monster.getJumpPad()

            if (clearMob || portalMob || circleMob || jumpPad) {
                let propertiesInfo = udg_colorCode[Constants.TEAL] + 'Properties: '
                const props: string[] = []
                if (clearMob) props.push('ClearMob')
                if (portalMob) props.push('PortalMob')
                if (circleMob) props.push('CircleMob')
                if (jumpPad) props.push('JumpPad')
                propertiesInfo += props.join(', ')
                Text.P_timed(this.makerOwner, Constants.TERRAIN_DATA_DISPLAY_TIME, propertiesInfo)

                if (clearMob) {
                    const disableDuration = clearMob.getDisableDuration()
                    const clearMobEffect = clearMob.getClearMobSpecialEffect()
                    const blockMobEffect = clearMob.getBlockMobSpecialEffect()

                    // Display disable duration if set
                    if (disableDuration !== 0) {
                        const clearMobInfo =
                            udg_colorCode[Constants.GREY] + '  Disable Duration: ' + R2S(disableDuration) + 's'
                        Text.P_timed(this.makerOwner, Constants.TERRAIN_DATA_DISPLAY_TIME, clearMobInfo)
                    }

                    if (clearMobEffect || blockMobEffect) {
                        if (clearMobEffect) {
                            const effectInfo = udg_colorCode[Constants.GREY] + '  Clear Effect: ' + clearMobEffect
                            Text.P_timed(this.makerOwner, Constants.TERRAIN_DATA_DISPLAY_TIME, effectInfo)
                        }

                        if (blockMobEffect) {
                            const effectInfo = udg_colorCode[Constants.GREY] + '  Block Effect: ' + blockMobEffect
                            Text.P_timed(this.makerOwner, Constants.TERRAIN_DATA_DISPLAY_TIME, effectInfo)
                        }
                    }
                }

                if (jumpPad !== undefined) {
                    const jumpPadEffect = monster.getJumpPadEffect()
                    let jumpPadInfo = udg_colorCode[Constants.GREY] + '  Jump Height: ' + R2S(jumpPad)

                    if (jumpPadEffect) {
                        jumpPadInfo += '   Effect: ' + jumpPadEffect
                    }

                    Text.P_timed(this.makerOwner, Constants.TERRAIN_DATA_DISPLAY_TIME, jumpPadInfo)
                }

                if (portalMob) {
                    const portalEffect = portalMob.getPortalEffect()
                    const portalEffectDuration = portalMob.getPortalEffectDuration()
                    const freezeDuration = portalMob.getFreezeDuration()

                    let portalInfo = udg_colorCode[Constants.GREY] + '  Freeze Duration: ' + R2S(freezeDuration) + 's'
                    Text.P_timed(this.makerOwner, Constants.TERRAIN_DATA_DISPLAY_TIME, portalInfo)

                    if (portalEffect) {
                        const effectInfo =
                            udg_colorCode[Constants.GREY] +
                            '  Portal Effect: ' +
                            portalEffect +
                            '   Duration: ' +
                            R2S(portalEffectDuration) +
                            's'
                        Text.P_timed(this.makerOwner, Constants.TERRAIN_DATA_DISPLAY_TIME, effectInfo)
                    }
                }
            }

            // Monster class
            const className = udg_colorCode[Constants.GREY] + 'Class: ' + monster.constructor.name
            Text.P_timed(this.makerOwner, Constants.TERRAIN_DATA_DISPLAY_TIME, className)
        }
    }

    findAndDisplayMonsterSpawnInfo = () => {
        const monsterUnit = this.escaper
            .getMakingLevel()
            .monsterSpawns.getActiveMonsterUnitNear(this.orderX, this.orderY)
        if (monsterUnit) {
            const monsterSpawn = MonsterSpawn.anyMonsterUnitId2MonsterSpawn.get(GetHandleId(monsterUnit))
            if (monsterSpawn) {
                Text.P_timed(
                    this.makerOwner,
                    Constants.TERRAIN_DATA_DISPLAY_TIME,
                    udg_colorCode[Constants.TEAL] + '--- Monster belongs to a monster spawn ---'
                )

                monsterSpawn.displayForPlayer(this.makerOwner, true)
                return true
            }
        }

        return false
    }
}
