import { animUtils } from 'Utils/AnimUtils'
import { errorHandler } from '../../../Utils/mapUtils'
import { Natives } from '../../wc3_natives_unsecured/Natives'
import { Escaper } from '../Escaper/Escaper'
import { Hero2Escaper } from '../Escaper/Escaper_functions'
import { Monster } from '../Monster/Monster'
import { MonsterType } from '../Monster/MonsterType'
import { NewImmobileMonster } from '../Monster/Monster_functions'
import { CasterShot } from './CasterShot'
import { CasterType } from './CasterType'

let escaper: Escaper
let caster: Caster | undefined
const PRECISION_TIR = 40
const PRECISION_DIFF_POS_HERO = 20
const ECART_CHECK = 0.05

let x1: number
let y1: number
let angleSlider: number
let sliderSpeed: number
let x2: number
let y2: number
let x3: number
let y3: number
let k1: number
let k2: number
let Xk1: number
let Yk1: number
let Xk2: number
let Yk2: number
let XintersectionDevantHeros: number
let YintersectionDevantHeros: number

const CalculerPointsIntersections = () => {
    if (caster) {
        let decalSurX = 50
        let a: number
        let b: number
        let c: number
        let discriminant: number

        const hero = escaper.getHero()
        if (!hero) return

        if (sliderSpeed >= 0) {
            angleSlider = escaper.getHeroFacing()
        } else {
            angleSlider = escaper.getHeroFacing() + 180
        }

        x2 = x1 + decalSurX
        y2 = y1 + TanBJ(angleSlider) * decalSurX
        a = (x2 - x1) * (x2 - x1) + (y2 - y1) * (y2 - y1)
        b = 2 * ((x2 - x1) * (x1 - x3) + (y2 - y1) * (y1 - y3))
        c = x3 * x3 + y3 * y3 + x1 * x1 + y1 * y1 - 2 * (x3 * x1 + y3 * y1) - caster.getRange() * caster.getRange()
        discriminant = b * b - 4 * a * c
        if (discriminant < 0) {
            k1 = 0
            k2 = 0
        } else {
            k1 = (-b + SquareRoot(b * b - 4 * a * c)) / (2 * a)
            Xk1 = x1 + k1 * (x2 - x1)
            Yk1 = y1 + k1 * (y2 - y1)
            k2 = (-b - SquareRoot(b * b - 4 * a * c)) / (2 * a)
            Xk2 = x1 + k2 * (x2 - x1)
            Yk2 = y1 + k2 * (y2 - y1)
        }
    }
}

const TrouverTempsIdeal = (tempsMax: number): number => {
    let tempsIdeal = 0
    if (caster) {
        let diffTemps = PRECISION_DIFF_POS_HERO / sliderSpeed
        let temps = 0
        let xHero: number
        let yHero: number
        let xBoule: number
        let yBoule: number
        let angleBouleHero: number
        let distHeroBoule: number
        let distHeroBouleMin = 99999999999
        while (true) {
            if (temps >= tempsMax) break
            xHero = x1 + sliderSpeed * CosBJ(angleSlider) * temps
            yHero = y1 + sliderSpeed * SinBJ(angleSlider) * temps
            angleBouleHero = Atan2BJ(yHero - y3, xHero - x3)
            xBoule = x3 + caster.getProjectileSpeed() * CosBJ(angleBouleHero) * temps
            yBoule = y3 + caster.getProjectileSpeed() * SinBJ(angleBouleHero) * temps
            distHeroBoule = SquareRoot((xHero - xBoule) * (xHero - xBoule) + (yHero - yBoule) * (yHero - yBoule))
            if (distHeroBoule < distHeroBouleMin) {
                distHeroBouleMin = distHeroBoule
                tempsIdeal = temps
            }
            temps = temps + diffTemps
        }
        if (distHeroBouleMin > PRECISION_TIR) {
            tempsIdeal = -1
        }
    }
    return tempsIdeal
}

const CasterTryToShoot = () => {
    let xHero: number = 0
    let yHero: number = 0
    let tempsMax: number
    let tempsIdeal: number
    let angleDeTir: number
    let sensPoint1positif: boolean
    let sensPoint2positif: boolean
    let tempsPoint1: number
    let tempsPoint2: number
    let escapersToShoot: Escaper[] = []
    let nbRemainingEscapersToShoot: number
    let i: number
    let tirOk = false
    let estShootable: boolean
    let numEscaper: number

    //récupération du caster et vérification qu'il existe toujours
    caster = Caster.anyTimerId2Caster.get(GetHandleId(Natives.UGetExpiredTimer()))
    if (!caster || !caster.u) {
        return
    }

    //détermination des escapers à viser
    i = 0
    while (i < caster.nbEscapersInRange) {
        escapersToShoot[i] = caster.escapersInRange[i]
        i = i + 1
    }
    nbRemainingEscapersToShoot = caster.nbEscapersInRange

    while (!tirOk && nbRemainingEscapersToShoot > 0) {
        //choix d'un escaper au hasard
        numEscaper = GetRandomInt(0, nbRemainingEscapersToShoot - 1)
        escaper = escapersToShoot[numEscaper]
        const hero = escaper.getHero()

        if (hero) {
            //vérification que l'escaper est shootable (vivant et à portée de tir)
            estShootable = false
            if (escaper.isAlive()) {
                x1 = escaper.getHeroX()
                y1 = escaper.getHeroY()
                x3 = caster.getX()
                y3 = caster.getY()

                //vérification que le héros est à portée de tir
                estShootable = SquareRoot((x1 - x3) * (x1 - x3) + (y1 - y3) * (y1 - y3)) <= caster.getRange()
            }

            if (!estShootable) {
                caster.escaperOutOfRangeOrDead(escaper)
                i = numEscaper
                while (i !== nbRemainingEscapersToShoot - 1) {
                    escapersToShoot[i] = escapersToShoot[i + 1]
                    i = i + 1
                }
                nbRemainingEscapersToShoot = nbRemainingEscapersToShoot - 1
            } else {
                //tir si possible
                if (escaper.isSliding()) {
                    sliderSpeed = escaper.getSlideSpeed()
                } else if (GetUnitCurrentOrder(hero) != 0) {
                    sliderSpeed = escaper.getWalkSpeed()
                } else {
                    sliderSpeed = 0
                }
                if (sliderSpeed === 0) {
                    xHero = x1
                    yHero = y1
                    tirOk = true
                } else {
                    CalculerPointsIntersections()
                    if (sliderSpeed < 0) {
                        sliderSpeed = -sliderSpeed
                    }
                    if (k1 === 0 && k2 === 0) {
                        return
                    }

                    //sens points
                    if (CosBJ(angleSlider) !== 0) {
                        sensPoint1positif = (Xk1 - x1) * CosBJ(angleSlider) > 0
                        sensPoint2positif = (Xk2 - x1) * CosBJ(angleSlider) > 0
                    } else {
                        sensPoint1positif = (Yk1 - y1) * SinBJ(angleSlider) > 0
                        sensPoint2positif = (Yk2 - y1) * SinBJ(angleSlider) > 0
                    }

                    //déterminer lequel des deux points d'intersection est devant le héros
                    if (sensPoint1positif === sensPoint2positif) {
                        //calcul du temps pour chaque point pour trouver le plus éloigné qui est le bon
                        tempsPoint1 = SquareRoot((x1 - Xk1) * (x1 - Xk1) + (y1 - Yk1) * (y1 - Yk1)) / sliderSpeed
                        tempsPoint2 = SquareRoot((x1 - Xk2) * (x1 - Xk2) + (y1 - Yk2) * (y1 - Yk2)) / sliderSpeed
                        if (tempsPoint1 > tempsPoint2) {
                            XintersectionDevantHeros = Xk1
                            YintersectionDevantHeros = Yk1
                            tempsMax = tempsPoint1
                        } else {
                            XintersectionDevantHeros = Xk2
                            YintersectionDevantHeros = Yk2
                            tempsMax = tempsPoint2
                        }
                    } else {
                        if (sensPoint1positif) {
                            XintersectionDevantHeros = Xk1
                            YintersectionDevantHeros = Yk1
                            tempsMax = SquareRoot((x1 - Xk1) * (x1 - Xk1) + (y1 - Yk1) * (y1 - Yk1)) / sliderSpeed
                        } else {
                            XintersectionDevantHeros = Xk2
                            YintersectionDevantHeros = Yk2
                            tempsMax = SquareRoot((x1 - Xk2) * (x1 - Xk2) + (y1 - Yk2) * (y1 - Yk2)) / sliderSpeed
                        }
                    }

                    //trouver temps idéal
                    if (escaper.isHeroOnGround()) {
                        tempsIdeal = TrouverTempsIdeal(tempsMax)
                    } else {
                        tempsIdeal = -1
                    }
                    if (tempsIdeal !== -1) {
                        xHero = x1 + sliderSpeed * CosBJ(angleSlider) * tempsIdeal
                        yHero = y1 + sliderSpeed * SinBJ(angleSlider) * tempsIdeal
                        tirOk = true
                    }
                }

                if (tirOk) {
                    if (caster.isEnabled()) {
                        angleDeTir = Atan2BJ(yHero - y3, xHero - x3)
                        SetUnitFacing(caster.u, angleDeTir)
                        animUtils.setAnimation(caster.u, caster.getAnimation())
                        new CasterShot(
                            caster.getProjectileMonsterType(),
                            x3,
                            y3,
                            angleDeTir,
                            caster.getProjectileSpeed(),
                            caster.getRange()
                        )
                    }
                } else {
                    //on retire l'escaper du pick aléatoire
                    i = numEscaper
                    while (i !== nbRemainingEscapersToShoot - 1) {
                        escapersToShoot[i] = escapersToShoot[i + 1]
                        i = i + 1
                    }
                    nbRemainingEscapersToShoot = nbRemainingEscapersToShoot - 1
                    tirOk = false
                }
            }
        }
        //pas de n = n + 1
    }

    if (tirOk) {
        //on attend que le temps soit écoulé pour un autre tir
        caster.t && TimerStart(caster.t, caster.getLoadTime(), false, errorHandlerCasterTryToShoot)
        caster.canShoot = false
    } else if (caster.nbEscapersInRange == 0) {
        //plus aucun héros à portée, on stoppe tout
        caster.canShoot = true
    } else {
        //héros à portée mais impossible de tirer, on attend un peu et on réessaie
        caster.t && TimerStart(caster.t, ECART_CHECK, false, errorHandlerCasterTryToShoot)
    }
}

const errorHandlerCasterTryToShoot = errorHandler(CasterTryToShoot)

export const CasterUnitWithinRange_Actions = () => {
    let escaperInRange = Hero2Escaper(Natives.UGetTriggerUnit())
    if (!escaperInRange) {
        return
    }

    const caster = Caster.anyTriggerWithinRangeId2Caster.get(GetHandleId(Natives.UGetTriggeringTrigger()))
    if (caster) {
        caster.escapersInRange[caster.nbEscapersInRange] = escaperInRange
        caster.nbEscapersInRange++
        if (caster.canShoot) {
            caster.t && TimerStart(caster.t, 0, false, errorHandlerCasterTryToShoot)
        }
    }
}

/**
 * Caster class
 */
export class Caster extends Monster {
    private casterType: CasterType
    private x: number
    private y: number
    private angle: number
    private trg_unitWithinRange?: trigger
    public escapersInRange: Escaper[] = []
    public nbEscapersInRange: number
    public canShoot: boolean
    public t?: timer
    private enabled: boolean

    static anyTriggerWithinRangeId2Caster = new Map<number, Caster>()
    static anyTimerId2Caster = new Map<number, Caster>()

    constructor(casterType: CasterType, x: number, y: number, angle: number, forceId: number | null = null) {
        super(undefined, forceId)

        this.casterType = casterType
        this.x = x
        this.y = y
        this.angle = angle

        this.nbEscapersInRange = 0
        this.canShoot = true
        this.enabled = false
    }

    isEnabled = (): boolean => {
        return this.enabled
    }

    getX = (): number => {
        return this.x
    }

    getY = (): number => {
        return this.y
    }

    getRange = (): number => {
        return this.casterType.getRange()
    }

    getProjectileSpeed = (): number => {
        return this.casterType.getProjectileSpeed()
    }

    getCasterUnit = () => {
        return this.u
    }

    getProjectileMonsterType = (): MonsterType => {
        return this.casterType.getProjectileMonsterType()
    }

    getLoadTime = (): number => {
        return this.casterType.getLoadTime()
    }

    getCasterType = (): CasterType => {
        return this.casterType
    }

    getAnimation = (): string => {
        return this.casterType.getAnimation()
    }

    /**
     * A caster has no monster type of its own, but its unit is built from the one its caster type
     * shoots from - immolation included. Anything asking what this unit is has to hear that one, or
     * a hero touching a caster dies by the immolation of the engine and by nothing else.
     */
    getMonsterType = () => {
        return this.casterType.getCasterMonsterType()
    }

    createUnit = () => {
        this.nbEscapersInRange = 0
        this.canShoot = true

        super.createUnit(() => NewImmobileMonster(this.casterType.getCasterMonsterType(), this.x, this.y, this.angle))

        this.trg_unitWithinRange = CreateTrigger()
        this.u && TriggerRegisterUnitInRangeSimple(this.trg_unitWithinRange, this.casterType.getRange(), this.u)
        TriggerAddAction(this.trg_unitWithinRange, errorHandler(CasterUnitWithinRange_Actions))
        Caster.anyTriggerWithinRangeId2Caster.set(GetHandleId(this.trg_unitWithinRange), this)

        this.t = CreateTimer()
        Caster.anyTimerId2Caster.set(GetHandleId(this.t), this)

        this.enabled = true
    }

    destroyTriggers = () => {
        if (this.trg_unitWithinRange) {
            Caster.anyTriggerWithinRangeId2Caster.delete(GetHandleId(this.trg_unitWithinRange))
            DestroyTrigger(this.trg_unitWithinRange)
            delete this.trg_unitWithinRange
        }

        if (this.t) {
            Caster.anyTimerId2Caster.delete(GetHandleId(this.t))
            DestroyTimer(this.t)
            delete this.t
        }
    }

    removeUnit = () => {
        super.removeUnit()
        this.destroyTriggers()
    }

    killUnit = () => {
        this.u && KillUnit(this.u)
        this.destroyTriggers()
    }

    refresh = () => {
        if (this.u) {
            this.removeUnit()
            this.createUnit()
        }
    }

    destroy = () => {
        super.destroy()
        this.destroyTriggers()
    }

    escaperOutOfRangeOrDead = (escaper: Escaper) => {
        let i = 0
        while (escaper !== this.escapersInRange[i] && i !== this.nbEscapersInRange) {
            i++
        }

        if (i < this.nbEscapersInRange) {
            while (i !== this.nbEscapersInRange - 1) {
                this.escapersInRange[i] = this.escapersInRange[i + 1]
                i = i + 1
            }
            this.nbEscapersInRange = this.nbEscapersInRange - 1
        }
    }

    toJson() {
        const output = super.toJson()
        if (output) {
            output['casterTypeLabel'] = this.casterType.label
            output['x'] = R2I(this.x)
            output['y'] = R2I(this.y)
            output['angle'] = R2I(this.angle)
        }
        return output
    }
}
