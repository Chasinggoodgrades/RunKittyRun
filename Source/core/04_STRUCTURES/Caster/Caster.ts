import { animUtils } from 'Utils/AnimUtils'
import { getUdgEscapers, udg_monsters } from '../../../../globals'
import { errorHandler } from '../../../Utils/mapUtils'
import { sendAsyncCasterAim, setAsyncCasterAimHandler } from '../../08_GAME/Contact/AsyncHeroSync'
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

/**
 * How long a caster waits for the machine of a hero sliding as an effect to tell what to do about it
 * (see requestAsyncAim). Past that, its player is most likely gone, and the caster looks for a target again.
 */
const ASYNC_AIM_TIMEOUT = 2

/** What a caster does about a hero: the same numbers travel in the answer of the machine of an async hero */
const AIM = { outOfRange: 0, noShot: 1, shoot: 2, noIntersection: 3 }

/** What computeAim found, reused rather than made at every attempt */
const aim = { result: AIM.outOfRange, angle: 0 }

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

/**
 * What `caster` does about the hero of `escaper`, from where this machine sees that hero: out of its
 * range (or dead), no shot that can reach it, or a shot at aim.angle. Changes nothing of the game:
 * for a hero sliding as an effect, only the machine of that hero runs it, and tells the others.
 */
const computeAim = () => {
    let xHero: number
    let yHero: number
    let tempsMax: number
    let tempsIdeal: number
    let sensPoint1positif: boolean
    let sensPoint2positif: boolean
    let tempsPoint1: number
    let tempsPoint2: number

    aim.result = AIM.outOfRange
    aim.angle = 0

    const hero = escaper.getHero()

    //vérification que l'escaper est shootable (vivant et à portée de tir)
    if (!caster || !hero || !escaper.isAlive()) {
        return
    }

    x1 = escaper.getHeroX()
    y1 = escaper.getHeroY()
    x3 = caster.getX()
    y3 = caster.getY()

    //vérification que le héros est à portée de tir
    if (SquareRoot((x1 - x3) * (x1 - x3) + (y1 - y3) * (y1 - y3)) > caster.getRange()) {
        return
    }

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
    } else {
        CalculerPointsIntersections()
        if (sliderSpeed < 0) {
            sliderSpeed = -sliderSpeed
        }
        if (k1 === 0 && k2 === 0) {
            aim.result = AIM.noIntersection
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
        if (tempsIdeal === -1) {
            aim.result = AIM.noShot
            return
        }

        xHero = x1 + sliderSpeed * CosBJ(angleSlider) * tempsIdeal
        yHero = y1 + sliderSpeed * SinBJ(angleSlider) * tempsIdeal
    }

    aim.result = AIM.shoot
    aim.angle = Atan2BJ(yHero - y3, xHero - x3)
}

/** The shot itself, made by every machine on the same turn */
const shoot = (shooter: Caster, angle: number) => {
    if (!shooter.isEnabled() || !shooter.u) {
        return
    }

    SetUnitFacing(shooter.u, angle)
    animUtils.setAnimation(shooter.u, shooter.getAnimation())
    new CasterShot(
        shooter.getProjectileMonsterType(),
        shooter.getX(),
        shooter.getY(),
        angle,
        shooter.getProjectileSpeed(),
        shooter.getRange()
    )
}

/**
 * A hero sliding as an effect is only seen where it really is by its own machine, and the caster aims
 * at that effect: so that machine alone works the shot out, and tells every machine, which all shoot
 * or not on the same turn (see applyAsyncCasterAim). Worked out by each machine from where it sees the
 * effect, the shot was made on some of them only, and the reload differed. The caster waits meanwhile.
 */
const requestAsyncAim = (shooter: Caster, target: Escaper) => {
    shooter.asyncAimRequest++
    shooter.isAsyncAimPending = true
    // busy: a hero coming in range does not start it again while it waits
    shooter.canShoot = false

    // looked for a target again if no answer comes
    shooter.t && TimerStart(shooter.t, ASYNC_AIM_TIMEOUT, false, errorHandlerCasterTryToShoot)

    if (GetLocalPlayer() === target.getPlayer()) {
        caster = shooter
        escaper = target
        computeAim()

        sendAsyncCasterAim(shooter.getId(), shooter.asyncAimRequest, target.getId(), aim.result, aim.angle)
    }
}

const CasterTryToShoot = () => {
    let escapersToShoot: Escaper[] = []
    let nbRemainingEscapersToShoot: number
    let i: number
    let tirOk = false
    let numEscaper: number

    //récupération du caster et vérification qu'il existe toujours
    caster = Caster.anyTimerId2Caster.get(GetHandleId(Natives.UGetExpiredTimer()))
    if (!caster || !caster.u) {
        return
    }

    // an answer that did not come in time is given up, and ignored if it comes late
    caster.isAsyncAimPending = false

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
            // where it really is, only its own machine knows: that machine decides, and tells the others
            if (escaper.isHeroAsEffect() && escaper.isAlive()) {
                requestAsyncAim(caster, escaper)
                return
            }

            computeAim()

            if (aim.result === AIM.noIntersection) {
                return
            }

            if (aim.result === AIM.shoot) {
                tirOk = true
                shoot(caster, aim.angle)
            } else {
                if (aim.result === AIM.outOfRange) {
                    caster.escaperOutOfRangeOrDead(escaper)
                }

                //on retire l'escaper du pick aléatoire
                i = numEscaper
                while (i !== nbRemainingEscapersToShoot - 1) {
                    escapersToShoot[i] = escapersToShoot[i + 1]
                    i = i + 1
                }
                nbRemainingEscapersToShoot = nbRemainingEscapersToShoot - 1
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

    /** The attempt waiting for the machine of a hero sliding as an effect to answer (see requestAsyncAim) */
    public asyncAimRequest = 0
    public isAsyncAimPending = false

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
        this.isAsyncAimPending = false

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

/**
 * What the machine of a hero sliding as an effect told about a shot of that caster at it, applied by
 * every machine on the same turn, the sender included.
 */
const applyAsyncCasterAim = (casterId: number, request: number, escaperId: number, result: number, angle: number) => {
    const shooter = udg_monsters[casterId]

    // an answer to an attempt given up since, or for a caster gone meanwhile
    if (
        !(shooter instanceof Caster) ||
        !shooter.isAsyncAimPending ||
        request !== shooter.asyncAimRequest ||
        !shooter.u ||
        !shooter.t
    ) {
        return
    }

    shooter.isAsyncAimPending = false

    if (result === AIM.shoot) {
        shoot(shooter, angle)
        TimerStart(shooter.t, shooter.getLoadTime(), false, errorHandlerCasterTryToShoot)
        shooter.canShoot = false
        return
    }

    if (result === AIM.outOfRange) {
        const target = getUdgEscapers().get(escaperId)
        target && shooter.escaperOutOfRangeOrDead(target)
    }

    if (shooter.nbEscapersInRange === 0) {
        PauseTimer(shooter.t)
        shooter.canShoot = true
    } else {
        TimerStart(shooter.t, result === AIM.outOfRange ? 0 : ECART_CHECK, false, errorHandlerCasterTryToShoot)
    }
}

setAsyncCasterAimHandler(applyAsyncCasterAim)
