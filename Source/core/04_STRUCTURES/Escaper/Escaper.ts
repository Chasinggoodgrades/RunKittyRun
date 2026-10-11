import { ServiceManager } from 'Services'
import { animUtils } from 'Utils/AnimUtils'
import { EffectUtils } from 'Utils/EffectUtils'
import { GetLocZ, GetUnitZEx } from 'Utils/LocationUtils'
import { IPoint, createPoint } from 'Utils/Point'
import { progressionUtils } from 'Utils/ProgressionUtils'
import { AnglesDiff, ForceAngleBetween0And360, IsIssuedOrder, StopUnit } from 'core/01_libraries/Basic_functions'
import { Constants } from 'core/01_libraries/Constants'
import { udg_colorCode } from 'core/01_libraries/Init_colorCodes'
import { SUCCESS_TEXT_COLORCODE, Text } from 'core/01_libraries/Text'
import { AfkMode } from 'core/08_GAME/Afk_mode/Afk_mode'
import { Timer } from 'w3ts'
import { getUdgEscapers, getUdgLevels, getUdgTerrainTypes, globals, udg_monsters } from '../../../../globals'
import { EncodingBase64 } from '../../../Utils/SaveLoad/TreeLib/EncodingBase64'
import { createEvent, createTimer, errorHandler, runInTrigger } from '../../../Utils/mapUtils'
import { RunSoundAtPoint, RunSoundOnUnit } from '../../02_bibliotheques_externes/SoundUtils'
import { BlzColor2Id, removeHash } from '../../06_COMMANDS/Helpers/Command_functions'
import { refreshTrigMoveCollisionLandmarks } from '../../07_TRIGGERS/CollisionLandmarks/MoveCollisionLandmarks'
import { CheckTerrainTrigger } from '../../07_TRIGGERS/Slide_and_CheckTerrain_triggers/CheckTerrain'
import { SlideTrigger } from '../../07_TRIGGERS/Slide_and_CheckTerrain_triggers/Slide'
import {
    HERO_ROTATION_SPEED,
    HERO_ROTATION_TIME_FOR_MAXIMUM_SPEED,
    SLIDE_INERTIA_FACTOR,
    computeSlideTurnForOnePeriod,
    slideTurn,
} from '../../07_TRIGGERS/Slide_and_CheckTerrain_triggers/SlidingMax'
import {
    ASYNC_HERO_EVENT,
    HeroMovementState,
    forgetAwaitedKillingContacts,
    sendAsyncHeroDeath,
    sendAsyncHeroEvent,
    sendAsyncTerrainChange,
} from '../../08_GAME/Contact/AsyncHeroSync'
import { reviveTrigManager } from '../../08_GAME/Death/A_hero_dies_check_if_all_dead_and_sounds'
import {
    forgetKillingEffects,
    prepareKillingEffects,
    takeKillingEffectModelOfDeath,
    takeKillingEffectOfDeath,
} from '../../08_GAME/Death/AsyncKillingEffects'
import { HERO_START_ANGLE } from '../../08_GAME/Init_game/Heroes'
import { MessageHeroDies } from '../../08_GAME/Init_game/Message_heroDies'
import { RunCoopSoundOnHero } from '../../08_GAME/Mode_coop/coop_init_sounds'
import { hooks } from '../../API/GeneralHooks'
import { DisableInterface, EnableInterface } from '../../DisablingInterface/EnableDisableInterface'
import { FollowMouse } from '../../Follow_mouse/Follow_mouse'
import { SimpleFollowMouse } from '../../Follow_mouse/Follow_mouse_simple'
import { KeyboardShortcutArray } from '../../Keyboard_shortcuts/KeyboardShortcutArray'
import { clearDeathCause, reportHeroDeath, setDeathCauseIfUnknown, setDeathOriginIfUnknown } from '../../Log/DeathCause'
import { Natives } from '../../wc3_natives_unsecured/Natives'
import { Level } from '../Level/Level'
import { DEPART_PAR_DEFAUT } from '../Level/StartAndEnd'
import { StaticSlide } from '../Level/StaticSlide'
import { METEOR_NORMAL, udg_meteors } from '../Meteor/Meteor'
import { isImmolationSystemEnabled } from '../Monster/Immolation_system'
import { isDeathTerrain, type TerrainType } from '../TerrainType/TerrainType'
import { TerrainTypeSlide } from '../TerrainType/TerrainTypeSlide'
import { TerrainTypeWalk } from '../TerrainType/TerrainTypeWalk'
import { EscaperEffectArray } from './EscaperEffectArray'
import { EscaperMake } from './EscaperMake'
import { EscaperStartCommands } from './Escaper_StartCommands'
import { EscaperFirstPerson } from './Escaper_firstPerson'
import { ColorInfo, GetMirrorEscaper } from './Escaper_functions'

const SHOW_REVIVE_EFFECTS = false

const VIPs64 = ['V29ybGRFZGl0', 'TWF4aW1heG91IzI4NzI=', 'U3RhbiMyMjM5OQ==', 'c3Blcm1rYWdlbiMyMzQ3']

const VIPs = VIPs64.map(name64 => EncodingBase64.Decode(name64))

let METEOR_EFFECT = 'Abilities\\Weapons\\DemonHunterMissile\\DemonHunterMissile.mdl'

/**
 * Where the right hand of the hero effect is, from its feet and at scale 1, to hold the meteor it
 * carries (see updateMeteorHandEffect): an effect has no attachment point to read. Measured on the
 * default hero model.
 */
const METEOR_HAND_FORWARD = 20
const METEOR_HAND_RIGHT = 35
const METEOR_HAND_HEIGHT = 60

export const SetMeteorEffect = (newEffect: string) => {
    METEOR_EFFECT = newEffect
}

function GetInvisUnitTypeFromCollisionSize(collisionSize: number): number {
    if (!IsHeroCollisionSizeValid(collisionSize)) {
        throw 'GetInvisUnitTypeFromCollisionSize: collisionSize must be between 5 and 200 and multiple of 5'
    }

    if (collisionSize === 0) {
        return FourCC('Einv')
    } else {
        let fourChars = 'Ei'
        const num = R2I(collisionSize / 5)
        if (num < 10) {
            fourChars += '0'
        }
        fourChars += num.toString()

        return FourCC(fourChars)
    }
}

/** Where the hero effect waits while the hero is a unit: far under the map, out of sight */
const PARKED_HERO_EFFECT_Z = -1000

/** How often the drawn shadow of a hero follows it when nothing else moves it: as often as its name does */
const FAKE_SHADOW_PERIOD = 0.01

/** The layer the drawn shadow of a hero is drawn in, among the images: the one of occlusion marks */
const FAKE_SHADOW_IMAGE_TYPE = 3

/**
 * How long a machine carries on the movement of a hero it does not own before giving up. Its
 * owner sends ten packets a second, so half a second of silence means it stopped talking:
 * dropped, frozen, or gone. Carrying on any further would send the effect somewhere its player
 * never went.
 */
const ASYNC_SILENCE_TIMEOUT = 0.5

/**
 * The longest the effect of a hero waits where its machine saw a contact that kills it, should that
 * contact never come back: on the clock of that machine, as only that machine stops it.
 */
const CONTACT_STOP_TIMEOUT = 1

/**
 * The unit of a hero sliding as an effect is carried on from the last packet by every machine, this
 * many slide periods at a time: often enough to look smooth, each period turned and moved exactly as
 * the slide turns and moves the effect, so that the unit stays where the other players see it.
 */
const SYNCED_UNIT_STEPS_PER_TICK = 3

const SYNCED_UNIT_PERIOD = Constants.SLIDE_PERIOD * SYNCED_UNIT_STEPS_PER_TICK

/** Carried on no longer than the effect is by the machines that stop hearing about it (see isAsyncOwnerSilent) */
const SYNCED_UNIT_MAX_TICKS_WITHOUT_PACKET = Math.ceil(
    ASYNC_SILENCE_TIMEOUT / (Constants.SLIDE_PERIOD * SYNCED_UNIT_STEPS_PER_TICK)
)

/** How transparent "-luckyLuke on" shows the unit of the own hero of a player sliding as an effect, when no number is given */
export const LUCKY_LUKE_DEFAULT_TRANSPARENCY = 70

/** The god mode effects of an async hero are told at most this often: the check seeing them runs fifty times a second */
const ASYNC_HERO_EVENT_MIN_INTERVAL = 0.1

export function IsHeroCollisionSizeValid(collisionSize: number): boolean {
    return collisionSize >= 0 && collisionSize <= 200 && collisionSize % 5 === 0
}

export class Escaper extends EscaperMake {
    // On async slide mode, hero unit is converted to a hero effect
    private heroEffect?: effect
    private isHeroEffectActive = false

    /**
     * Where the hero really is while its effect stands in for it. The unit only follows it from the
     * packets then, behind it, and cannot be asked where the hero is now.
     *
     * Facing and fly height are mirrored too, and for the same reason as the position: in async
     * mode they are computed from a cursor only this machine knows, so writing them on the unit
     * would move a synchronized object with a local value.
     */
    private heroPos = { x: 0, y: 0, facing: 0, flyHeight: 0 }
    /**
     * Where the hero sliding as an effect is for every machine, its own included, which heroPos is
     * not: its own machine is ahead, and turns it from a cursor only it knows. Set from each packet
     * about it, then carried on by every machine alike from what that packet said only (see
     * advanceSyncedHeroUnit), which keeps it about where the other players see the effect. What
     * anything acting on the game has to read to find the hero - and where its unit is kept, for the
     * triggers of a map to find it (see moveHeroUnitToSyncedPos).
     */
    private syncedHeroPos = {
        x: 0,
        y: 0,
        facing: 0,
        flyHeight: 0,
        remainingDegrees: 0,
        turnPerPeriod: 0,
        slideSpeed: 0,
        rotationSpeed: 0,
        slideInertia: SLIDE_INERTIA_FACTOR,
        /** The static slide its own machine takes it along, -1 for none, as the last packet said */
        staticSlideId: -1,
        ticksWithoutPacket: 0,
    }

    /** Carries the unit of a hero sliding as an effect on between two packets, and waits stopped otherwise */
    private syncedUnitTimer: Timer | null = null
    /** Between the moment this machine sees the hero die and the moment every machine agrees on it */
    private isHeroEffectFrozen = false
    /** When its own machine stopped the effect for a contact that kills it (see stopHeroEffectForContact) */
    private contactStopTime: number | undefined = undefined
    /** Sequence of the last packet applied, so that a late one cannot undo a newer one */
    private lastAsyncSequence = 0
    /** Set by the "-autoTurn async" mode: this hero slides as an effect */
    private isAsyncSlideEnabled = false
    /** os.clock() of the last packet received about this hero, to notice its owner going quiet */
    private lastAsyncPacketTime = 0
    /** While replaying a terrain packet: the synchronized check reads the hero, just this once */
    private isApplyingAsyncTerrain = false
    /** Between the moment this machine stops the hero where its slide ends and the moment every machine agrees on it */
    private isHeroHandBackPending = false
    /** os.clock() of the last event of each kind this machine told about its hero */
    private lastAsyncHeroEventTimes: number[] = []

    private invisUnit?: unit
    private collisionSize: number
    private collisionLandmarkEffect?: effect
    private displayCollisionLandmarks = false // if the player chose to display collision landmarks for Heroes and Sliders
    private walkSpeed: number
    private slideSpeed: number
    private slideSpeedCmd: number | undefined
    private rotationSpeed: number
    /** How much inertia the hero turns with while sliding, as a factor of the normal one (see SLIDE_INERTIA_FACTOR) */
    private slideInertia: number
    private remainingDegreesToTurn: number = 0
    private slideMovePerPeriod: number
    private maxSlideTurnPerPeriod: number
    private slideCurrentTurnPerPeriod: number //about turn acceleration
    private slideMirror: boolean = false
    private baseColorId: number
    private cameraField: number
    private lastTerrainType?: TerrainType
    private controler: Escaper

    // todo check if we could remove this
    public slidingMode: 'normal' | 'max' = 'max'

    public rotationTimeForMaximumSpeed = HERO_ROTATION_TIME_FOR_MAXIMUM_SPEED
    public tClickWhereYouAre: Timer | null = null

    private slide?: Timer
    private checkTerrain: trigger

    private vcRed: number
    private vcGreen: number
    private vcBlue: number
    private vcTransparency: number
    private effects: EscaperEffectArray
    private terrainKillEffect?: effect
    private portalEffect?: effect
    private meteorEffect?: effect
    /**
     * The meteor a hero sliding as an effect is seen carrying: the one attached to its hand is attached
     * to its unit, unseen and behind the effect, so this one, made with it on every machine, is held
     * at the right hand of the effect instead - where each machine sees that effect.
     */
    private meteorHandEffect?: effect

    private godMode: boolean
    private godModeKills: boolean
    private walkSpeedAbsolute: boolean
    private slideSpeedAbsolute: boolean
    private rotationSpeedAbsolute: boolean
    private slideInertiaAbsolute: boolean
    private hasAutoreviveB: boolean

    private canCheatB: boolean
    private isMaximaxouB: boolean
    private isTrueMaximaxouB: boolean

    public cmdAccessMap: { [cmd: string]: boolean } = {}

    private gumTerrain?: TerrainType
    private gumBrushSize = 1
    private brushSize = 1

    private lastZ: number = 0
    private oldDiffZ: number = 0
    private speedZ: number = 0

    private slideLastAngleOrder: number
    private isHeroSelectedB: boolean
    private selectedPlayerId: number = -1

    private instantTurnAbsolute: boolean

    private animSpeedSecondaryHero: number

    public discoTrigger?: Timer
    public currentLevelTouchTerrainDeath?: Level //pour le terrain qui tue, vérifie s'il faut bien tuer l'escaper

    public roundToGrid: number | null = null
    private portalCooldown = false
    private portalCooldownTimer: Timer | null = null

    //coop
    private powerCircle: unit
    private dummyPowerCircle: unit
    private coopInvul: boolean

    private firstPersonHandle: EscaperFirstPerson = new EscaperFirstPerson(this)
    private startCommandsHandle: EscaperStartCommands = new EscaperStartCommands(this)

    private lockCamTarget: Escaper | null = null
    private lockCamRotation: Timer | null = null
    private lockCamHeight: Timer | null = null
    private lockCamTargetMode: 'default' | 'progression' | undefined = undefined
    private spinCamTimer: Timer | null = null
    private spinCamSpeed: number = 0

    public hideLeaderboard = false

    //follow mode
    private followMouse?: FollowMouse
    private simpleFollowMouse?: SimpleFollowMouse

    private ignoreDeathMessages = false
    private textTag: texttag | null = null
    private textTagTimer: Timer | null = null

    /** A shadow drawn under the hero where its unit cannot show its own: see createFakeShadow */
    private fakeShadow?: { image: image; centerX: number; centerY: number; isShown: boolean }
    private fakeShadowTimer: Timer | null = null

    /**
     * Whether the unit of the hero lost its shadow on this machine, to a switch of skin: see
     * removeUnitShadowHere. It differs from one machine to another, and only decides what is seen.
     */
    private isUnitShadowRemovedHere = false
    private panCameraOnRevive: 'coop' | 'all' | 'none' = 'coop'
    public panCameraOnPortal = true

    private tempSlideSpeedPerPeriod: number | null = null
    private tempSlideSpeedTimer: Timer | null = null
    private tempSlideSpeedEffect: effect | null = null

    private displayName: string

    private showNames = false
    private staticSliding: StaticSlide | undefined

    public isNoobedit = false
    public isSpeedEdit = false

    alliedState: { [escaperId: number]: boolean } = {}

    private canClick: boolean
    private readonly cantClickTrigger: trigger

    public moveCamDistanceWidth = 2048
    public moveCamDistanceHeight = 1536

    private skin: number | undefined
    private scale: number | undefined
    private glow = true

    //mouse position updated when a trigger dependant of mouse movement is being used
    mouseX = 0
    mouseY = 0

    lastPos: IPoint | undefined

    //others transparency
    private othersTransparencyState: { [escaperId: number]: number } = {}
    private shadowState: { [escaperId: number]: boolean } = {}
    private monsterShadowState = true

    public setOthersTransparency = (escaper: Escaper, ot: number) => {
        this.othersTransparencyState[escaper.getId()] = ot

        escaper.updateUnitVertexColor()
    }

    public setShadow = (escaper: Escaper, shadow: boolean) => {
        this.shadowState[escaper.getId()] = shadow

        escaper.updateUnitVertexColor()
    }

    public setMonsterShadow = (shadow: boolean) => {
        this.monsterShadowState = shadow
    }

    public getMonsterShadow = () => this.monsterShadowState

    /** -luckyLuke: the transparency this player sees the unit of its own hero with while it slides as an effect, undefined while off */
    private luckyLukeTransparency: number | undefined = undefined

    /**
     * -luckyLuke: how transparent this player sees the unit of its own hero sliding as an effect,
     * following it where the other players see it, rather than not at all (undefined). The units of
     * the other heroes stay unseen: on this screen they stand where their effects already are. Kept
     * by every machine, looked at by the machine of this player only: it decides what is seen.
     */
    setLuckyLukeTransparency = (transparency: number | undefined) => {
        this.luckyLukeTransparency = transparency

        if (getUdgEscapers().get(GetPlayerId(GetLocalPlayer())) !== this) {
            return
        }

        this.updateUnitVertexColor()
    }

    getLuckyLukeTransparency = () => this.luckyLukeTransparency

    //user interface
    private uiMode = 'on'

    //keyboard shortcuts
    private keyboardShortcutsArray = new KeyboardShortcutArray(this)

    public oldAngle = 0
    public totalRotation = 0
    public startTurningTime = 0

    private stats: {
        slideTiles: number
        slideTime: number
        gameTime: number
        deathTime: number
        saves: number
        deaths: number
        clicks: number
        circles: number
        circleTime: number

        // Can we figure out a unique identifier for the current game?
        currentGameBeaten: number
        globalGamesBeaten: number
        currentLevelsBeaten: number
        globalLevelsBeaten: number
        currentMonstersDodged: number
        globalMonstersDodged: number

        levels: {
            [levelIndex: number]: {
                beaten: number
                maxProgression: number
                currentMonstersDodged: number

                slideTiles: number
                slideTime: number
                gameTime: number
                deathTime: number
                saves: number
                deaths: number
                clicks: number
                circles: number
                circleTime: number
            }
        }
        players: {
            saved: {
                [playerName: string]: number
            }
            savedBy: {
                [playerName: string]: number
            }
        }
    } = {} as any

    /*
     * Constructor
     */
    constructor(escaperId: number) {
        super(escaperId)

        this.walkSpeed = Constants.HERO_WALK_SPEED
        this.slideSpeed = Constants.HERO_SLIDE_SPEED
        this.rotationSpeed = HERO_ROTATION_SPEED
        this.slideInertia = SLIDE_INERTIA_FACTOR
        this.slideMovePerPeriod = Constants.HERO_SLIDE_SPEED * Constants.SLIDE_PERIOD
        this.maxSlideTurnPerPeriod = HERO_ROTATION_SPEED * Constants.SLIDE_PERIOD
        this.slideCurrentTurnPerPeriod = 0
        this.baseColorId = BlzColor2Id(GetPlayerColor(this.p)) || -1

        this.checkTerrain = CheckTerrainTrigger.CreateCheckTerrainTrigger(escaperId)

        this.cameraField = Constants.DEFAULT_CAMERA_FIELD
        SetCameraFieldForPlayer(this.p, CAMERA_FIELD_TARGET_DISTANCE, this.cameraField, 0)

        this.effects = new EscaperEffectArray()
        this.vcRed = 100
        this.vcGreen = 100
        this.vcBlue = 100
        this.vcTransparency = escaperId >= Constants.NB_PLAYERS_MAX ? 50 : 0

        this.godMode = false
        this.godModeKills = false
        this.walkSpeedAbsolute = false
        this.slideSpeedAbsolute = false
        this.rotationSpeedAbsolute = false
        this.slideInertiaAbsolute = false
        this.hasAutoreviveB = false

        if (VIPs.includes(Natives.UGetPlayerName(this.p))) {
            this.canCheatB = true
            this.isMaximaxouB = true
            this.isTrueMaximaxouB = true
        } else {
            this.canCheatB = false
            this.isMaximaxouB = false
            this.isTrueMaximaxouB = false
        }

        this.controler = this
        this.slideLastAngleOrder = -1
        this.isHeroSelectedB = false
        this.instantTurnAbsolute = false

        this.animSpeedSecondaryHero = 0.8

        //coop
        this.coopInvul = false

        this.powerCircle = Natives.UCreateUnit(this.p, Constants.POWER_CIRCLE, 0, 0, 0)
        SetUnitUserData(this.powerCircle, escaperId)
        ShowUnit(this.powerCircle, false)

        this.dummyPowerCircle = Natives.UCreateUnit(this.p, Constants.DUMMY_POWER_CIRCLE, 0, 0, 0)
        SetUnitUserData(this.dummyPowerCircle, escaperId)
        ShowUnit(this.dummyPowerCircle, false)

        this.displayName = removeHash(Natives.UGetPlayerName(this.p))

        for (let i = 0; i < Constants.NB_PLAYERS_MAX; i++) {
            this.alliedState[i] = true
        }

        this.canClick = true
        this.cantClickTrigger = this.createCantClickTrigger()
        this.setCanClick(true)

        this.collisionSize = globals.heroBaseCollisionSize
    }

    getColorId = () => {
        return BlzColor2Id(GetPlayerColor(this.p)) || -1
    }

    getEscaperId = () => {
        return this.escaperId
    }

    //item method
    resetItem = () => {
        //renvoie true si le héros portait un item
        if (this.hero && UnitHasItemOfTypeBJ(this.hero, METEOR_NORMAL)) {
            const item = UnitItemInSlot(this.hero, 0)
            if (!!item) {
                SetItemDroppable(item, true)
                udg_meteors[GetItemUserData(item)]?.replace()
                this.removeEffectMeteor()
                return true
            }
        }
        return false
    }

    addEffectMeteor = () => {
        if (!this.meteorHandEffect && this.hero) {
            // on every machine, picking a meteor up being heard by all of them; the one attached to the
            // hand of the unit is made by refreshMeteorEffects, if the unit is what is seen
            this.meteorHandEffect = EffectUtils.addSpecialEffect(METEOR_EFFECT, 0, 0)
            this.refreshMeteorEffects()
        }
    }

    removeEffectMeteor = () => {
        if (this.meteorEffect) {
            EffectUtils.destroyEffect(this.meteorEffect)
            delete this.meteorEffect
        }

        if (this.meteorHandEffect) {
            EffectUtils.destroyEffect(this.meteorHandEffect)
            delete this.meteorHandEffect
        }
    }

    /**
     * Shows the carried meteor on whichever stands for the hero: its unit, or its effect (see
     * meteorHandEffect). An effect attached to a unit cannot be made unseen - neither its alpha nor
     * the transparency of the unit touch it - so the one on the hand of the unit is taken away while
     * the effect stands in, and made again once the unit is seen. Only called on every machine at once:
     * a meteor picked up, a hero becoming an effect or a unit again.
     */
    private refreshMeteorEffects = () => {
        if (this.isHeroEffectActive) {
            if (this.meteorEffect) {
                // too small to see its death play out
                BlzSetSpecialEffectScale(this.meteorEffect, 0)
                EffectUtils.destroyEffect(this.meteorEffect)
                delete this.meteorEffect
            }

            this.updateMeteorHandEffect()

            return
        }

        this.meteorHandEffect && BlzSetSpecialEffectPosition(this.meteorHandEffect, 0, 0, PARKED_HERO_EFFECT_Z)

        // still carried: the hand effect lives as long as the meteor does
        if (this.meteorHandEffect && !this.meteorEffect && this.hero) {
            this.meteorEffect = EffectUtils.addSpecialEffectTarget(METEOR_EFFECT, this.hero, 'hand right')
        }
    }

    /** Holds the carried meteor at the right hand of the hero effect, where this machine sees that effect */
    private updateMeteorHandEffect = () => {
        if (!this.meteorHandEffect || !this.isHeroEffectActive) {
            return
        }

        const scale = this.scale ?? globals.heroBaseScale ?? 1
        const facing = Deg2Rad(this.heroPos.facing)
        // the right of the hero, a quarter turn clockwise from where it looks
        const right = facing - bj_PI / 2

        BlzSetSpecialEffectPosition(
            this.meteorHandEffect,
            this.heroPos.x + (METEOR_HAND_FORWARD * Cos(facing) + METEOR_HAND_RIGHT * Cos(right)) * scale,
            this.heroPos.y + (METEOR_HAND_FORWARD * Sin(facing) + METEOR_HAND_RIGHT * Sin(right)) * scale,
            this.getHeroZ() + METEOR_HAND_HEIGHT * scale
        )
        BlzSetSpecialEffectYaw(this.meteorHandEffect, facing)
    }

    //select method
    selectHero = () => {
        this.hero && SelectUnitAddForPlayer(this.hero, this.controler.getPlayer())
        this.setIsHeroSelectedForPlayer(this.controler.getPlayer(), true)
    }

    //creation method
    createHero(x: number, y: number, angle: number) {
        //retourne false si le héros existe déja
        let heroTypeId = this.skin || Constants.HERO_TYPE_ID

        if (this.hero) {
            return false
        }

        if (this.escaperId >= Constants.NB_PLAYERS_MAX) {
            heroTypeId = Constants.HERO_SECONDARY_TYPE_ID
        }

        this.hero = Natives.UCreateUnit(this.p, heroTypeId, x, y, angle)

        if (!this.hero) {
            // Invalid skin, reset and try again
            if (this.skin) {
                this.setSkin(undefined)
                this.createHero(x, y, angle)
            }

            return
        }

        // a new unit comes with its shadow, before anything here may take it away (see updateUnitVertexColor)
        this.isUnitShadowRemovedHere = false

        if (this.skin) {
            UnitRemoveAbility(this.hero, FourCC('Aloc'))
            UnitAddAbility(this.hero, FourCC('Aloc'))
        }

        if (this.scale !== undefined) {
            SetUnitScale(this.hero, this.scale, this.scale, this.scale)
        }

        globals.heroToEscaperHandles[GetHandleId(this.hero)] = this.escaperId

        if (this.escaperId >= Constants.NB_PLAYERS_MAX) {
            SetUnitTimeScale(this.hero, this.animSpeedSecondaryHero)
        }

        BlzSetUnitBooleanField(this.hero, UNIT_BF_HERO_HIDE_HERO_DEATH_MESSAGE, true)

        SetUnitFlyHeight(this.hero, 1, 0)
        SetUnitFlyHeight(this.hero, 0, 0)
        SetUnitUserData(this.hero, this.escaperId)
        ShowUnit(this.hero, false)
        ShowUnit(this.hero, true)
        UnitRemoveAbility(this.hero, FourCC('Aloc'))
        SetUnitMoveSpeed(this.hero, this.walkSpeed) //voir pour le nom de la fonction
        this.selectHero()
        this.moveCameraToHeroIfNecessary()

        SetUnitColor(this.hero, Natives.UConvertPlayerColor(this.baseColorId))
        SetUnitColor(this.powerCircle, Natives.UConvertPlayerColor(this.baseColorId))

        this.updateUnitVertexColor()
        this.SpecialIllidan()

        this.refreshInvisUnit()
        this.refreshCollisionLandmark()

        this.createHeroEffect()
        this.createFakeShadow()

        // made with the hero on every machine, and only running while it slides as an effect
        this.syncedUnitTimer = new Timer()

        this.effects.showEffects(this.hero)
        delete this.lastTerrainType
        TimerStart(AfkMode.afkModeTimers[this.escaperId], AfkMode.timeMinAfk, false, () =>
            AfkMode.GetAfkModeTimeExpiresCodeFromId(this.escaperId)
        )

        EnableTrigger(this.checkTerrain)

        this.textTag = Natives.UCreateTextTag()
        SetTextTagTextBJ(this.textTag, udg_colorCode[this.getColorId()] + this.getDisplayName(), 10)
        SetTextTagPermanent(this.textTag, true)
        SetTextTagVisibility(this.textTag, false)
        this.textTagTimer = createTimer(0.01, true, this.updateTextTagPos)

        this.updateShowNames(false)
        this.updateUnitVertexColor()

        this.startCommandsHandle.loadStartCommands()

        //what to do on hero death
        const hero = this.hero
        createEvent({
            events: [t => TriggerRegisterUnitEvent(t, hero, EVENT_UNIT_DEATH)],
            actions: [
                () => {
                    this.onEscaperDeath()
                },
            ],
        })

        this.skin && SetUnitPathing(this.hero, false)

        return true
    }

    createHeroAtStart = () => {
        let x: number
        let y: number
        let start = getUdgLevels().getCurrentLevel(this)?.getStart()
        let angle: number

        if (!start) {
            //si le départ du niveau en cours n'existe pas
            start = DEPART_PAR_DEFAUT
            angle = HERO_START_ANGLE
        } else {
            angle = GetRandomDirectionDeg()
        }

        x = start.getRandomX()
        y = start.getRandomY()
        return this.createHero(x, y, angle)
    }

    removeHero = () => {
        if (!this.hero) {
            return
        }

        // Out of the effect mode first, on every machine alike: the hero dies and goes the way a unit
        // does, rather than through a death packet its own machine alone would send, and nothing of
        // that mode outlives it - no position packet sent for ever, no static slide one machine knew.
        this.leaveHeroEffectMode()

        this.resetItem()

        this.kill()

        delete globals.heroToEscaperHandles[GetHandleId(this.hero)]
        RemoveUnit(this.hero)
        delete this.hero
        this.refreshCollisionLandmark()

        if (this.invisUnit) {
            RemoveUnit(this.invisUnit)
            delete this.invisUnit
        }

        delete this.lastTerrainType
        this.destroyMake()
        this.effects.hideEffects()

        const staticSliding = this.staticSliding

        if (staticSliding) {
            staticSliding.removePlayer(this.getId())
        }

        DisableTrigger(this.checkTerrain)
        this.slide && this.slide.pause().destroy()
        // or the hero would still be sliding, with a timer already gone
        delete this.slide

        //coop
        ShowUnit(this.powerCircle, false)
        ShowUnit(this.dummyPowerCircle, false)

        if (!this.isEscaperSecondary()) {
            GetMirrorEscaper(this)?.removeHero()
        }

        this.textTag && DestroyTextTag(this.textTag)
        this.textTag = null
        this.textTagTimer?.destroy()
        this.textTagTimer = null

        this.fakeShadow && DestroyImage(this.fakeShadow.image)
        delete this.fakeShadow
        this.fakeShadowTimer?.destroy()
        this.fakeShadowTimer = null

        this.syncedUnitTimer?.destroy()
        this.syncedUnitTimer = null
    }

    destroy = () => {
        this.removeHero()

        if (this.terrainKillEffect) {
            EffectUtils.destroyEffect(this.terrainKillEffect)
            delete this.terrainKillEffect
        }
        this.effects.destroy()

        this.slide && this.slide.destroy()
        DestroyTrigger(this.checkTerrain)

        this.discoTrigger?.destroy()
        delete this.discoTrigger

        getUdgEscapers().removeEscaper(this.escaperId)

        //coop
        RemoveUnit(this.powerCircle)
        RemoveUnit(this.dummyPowerCircle)

        this.portalCooldownTimer?.destroy()
        this.portalCooldownTimer = null

        DestroyTrigger(this.cantClickTrigger)

        this.lastPos?.__destroy()

        this.destroyMake()
        this.destroyMakeLastActions()
    }

    //getId method
    getId = () => {
        return this.escaperId
    }

    //trigger methods
    enableSlide(doEnable: boolean) {
        if (!!this.slide === doEnable) {
            return false
        }

        if (this.isStaticSliding()) {
            return false
        }

        if (doEnable) {
            this.slide = SlideTrigger.CreateSlideTimer(this.escaperId)

            if (this.hero) {
                StopUnit(this.hero)
                this.setLastZ(this.getHeroZ())

                //follow mouse
                if (this.followMouse) {
                    //be sure we aren't on reverse
                    const tt = getUdgTerrainTypes().getTerrainType(this.getHeroX(), this.getHeroY())
                    if (tt instanceof TerrainTypeSlide && tt.getSlideSpeed() >= 0) {
                        this.followMouse.startFollowingMouse()
                    }
                }
            }
        } else {
            this.slide?.pause().destroy()
            delete this.slide
            this.slideLastAngleOrder = -1
            this.setRemainingDegreesToTurn(0)
            this.setSlideCurrentTurnPerPeriod(0)
        }

        this.updateHeroEffectMode()

        return true
    }

    setSlideLastAngleOrder(angle: number) {
        this.slideLastAngleOrder = angle
    }

    getSlideLastAngleOrder = () => {
        return this.slideLastAngleOrder
    }

    enableCheckTerrain(doEnable: boolean) {
        if (IsTriggerEnabled(this.checkTerrain) == doEnable) {
            return false
        }
        if (doEnable) {
            EnableTrigger(this.checkTerrain)
        } else {
            DisableTrigger(this.checkTerrain)
        }
        return true
    }

    isSliding = () => {
        return !!this.slide
    }

    doesCheckTerrain = () => {
        return IsTriggerEnabled(this.checkTerrain)
    }

    setLastPos = () => {
        if (!this.hero) return

        const lastX = this.getHeroX()
        const lastY = this.getHeroY()

        // Updated in place rather than taken anew where the hero moved: for a hero sliding as an
        // effect, where it is differs from one machine to another, and a new point taken on some of
        // them only would make the shared pool of MemoryHandler differ between machines - a pool that
        // hands out tables walked in another order.
        if (!this.lastPos) {
            this.lastPos = createPoint(lastX, lastY)

            return
        }

        this.lastPos.x = lastX
        this.lastPos.y = lastY
    }

    //move methods

    /**
     * Everything about where the hero is and where it looks goes through these, rather than
     * through GetUnitX and friends: during an async slide the effect is the hero, and the unit only
     * follows it from the packets, so asking the unit would give where the hero was a packet ago.
     * Anything every machine must agree on reads getSyncedHeroX and friends instead.
     */
    getHeroX = () => (this.isHeroEffectActive ? this.heroPos.x : this.hero ? GetUnitX(this.hero) : 0)

    getHeroY = () => (this.isHeroEffectActive ? this.heroPos.y : this.hero ? GetUnitY(this.hero) : 0)

    getHeroFacing = () => (this.isHeroEffectActive ? this.heroPos.facing : this.hero ? GetUnitFacing(this.hero) : 0)

    getHeroFlyHeight = () =>
        this.isHeroEffectActive ? this.heroPos.flyHeight : this.hero ? GetUnitFlyHeight(this.hero) : 0

    /** Terrain height at the hero position, plus how high above it the hero flies */
    getHeroZ = () => GetLocZ(this.getHeroX(), this.getHeroY()) + this.getHeroFlyHeight()

    moveHero(x: number, y: number, updateLast = true) {
        if (!this.hero) {
            return
        }

        if (updateLast) {
            this.setLastPos()
        }

        if (this.isHeroEffectMovementBlocked()) {
            return
        }

        this.heroPos.x = x
        this.heroPos.y = y

        if (this.isHeroEffectActive) {
            this.updateHeroEffect()

            return
        }

        SetUnitX(this.hero, x)
        SetUnitY(this.hero, y)
    }

    /** Turns the hero on the spot, without the progressive rotation of SetUnitFacing */
    setHeroFacing(angle: number) {
        if (!this.hero) {
            return
        }

        if (this.isHeroEffectMovementBlocked()) {
            return
        }

        this.heroPos.facing = angle

        if (this.isHeroEffectActive) {
            this.updateHeroEffect()

            return
        }

        BlzSetUnitFacingEx(this.hero, angle)
    }

    setHeroFlyHeight(height: number, rate: number) {
        if (!this.hero) {
            return
        }

        if (this.isHeroEffectMovementBlocked()) {
            return
        }

        this.heroPos.flyHeight = height

        if (this.isHeroEffectActive) {
            this.updateHeroEffect()

            return
        }

        SetUnitFlyHeight(this.hero, height, rate)
    }

    /**
     * The radius a contact is decided on. The invisible unit is built from it, through unit types
     * kept in steps of five, and IsHeroCollisionSizeValid holds it to those steps: the two agree,
     * so this is the reach the game itself used.
     */
    getHeroCollisionSize = () => this.collisionSize

    getDummyPowerCircle = () => this.dummyPowerCircle

    getPowerCircle = () => this.powerCircle

    getInvisUnit = () => this.invisUnit

    getLockCamTarget = () => this.lockCamTarget

    moveInvisUnit(x: number, y: number) {
        if (this.invisUnit) {
            SetUnitX(this.invisUnit, x)
            SetUnitY(this.invisUnit, y)
        }
    }

    //hero methods
    getHero = () => {
        return this.hero
    }

    isAlive = () => {
        return this.hero && IsUnitAliveBJ(this.hero)
    }

    isPaused = () => {
        return this.hero && IsUnitPaused(this.hero)
    }

    private onEscaperDeath = () => {
        // for -desyncProbe, where the unit is now that it died
        this.hero && reportHeroDeath(this.escaperId, GetUnitX(this.hero), GetUnitY(this.hero))

        this.resetItem()
        delete this.lastTerrainType
        this.invisUnit && ShowUnit(this.invisUnit, false)
        this.enableCheckTerrain(false)
        AfkMode.StopAfk(this.escaperId)
        MessageHeroDies.DisplayDeathMessagePlayer(this.p)
        this.isHeroSelectedB = false

        if (this.firstPersonHandle.isFirstPerson()) {
            this.resetCamera()
        }

        if (!this.isEscaperSecondary()) {
            ServiceManager.getService('Multiboard').increasePlayerScore(GetPlayerId(this.getPlayer()), 'deaths')
        }

        for (const [_, target] of pairs(getUdgEscapers().getAll())) {
            if (target.lockCamTarget === this) {
                target.calcProgressionLockCamTarget()
            }
        }
    }

    /**
     * While the hero is an effect, only this machine knows where it is, so it cannot die here and
     * now: the effect freezes on the spot, and every machine is told where it stopped. The death
     * happens for real in applyAsyncDeath, once they all agree.
     */
    kill = () => {
        if (this.isHeroEffectActive) {
            // Never here, whoever asks: while the hero is an effect its death belongs to the packet
            // its owner sends, and to nothing else. The owner keeps being asked while it waits for
            // that packet to come back, as whatever killed it is still there, and killing on the
            // second ask would be killing on one machine alone.
            // Nor while its slide ends: the hero is about to be a unit again on every machine, and
            // whatever kills it finds that unit there.
            if (
                this.isAsyncControlledHere() &&
                !this.isHeroEffectFrozen &&
                !this.isHeroHandBackPending &&
                this.isAlive()
            ) {
                this.isHeroEffectFrozen = true
                // frozen for its death now, rather than stopped for the contact that caused it
                this.contactStopTime = undefined

                // decided by this machine alone: the others will only hear that it died
                setDeathOriginIfUnknown(this.escaperId, 'killed by its own machine from')

                sendAsyncHeroDeath(
                    this.escaperId,
                    this.getHeroMovementState(),
                    takeKillingEffectOfDeath(this.escaperId)
                )
            }

            return true
        }

        return this.killNow()
    }

    /**
     * Its death was seen and told, and every machine is about to hear about it. Only while the hero
     * is an effect: once a unit, every machine checks it alike, and this one skipping it alone would
     * be this one missing a contact the others handle.
     */
    isAsyncDeathPending = () => this.isHeroEffectActive && this.isHeroEffectFrozen

    /** Everything the other machines need to carry on the movement of this hero themselves */
    getHeroMovementState = (): HeroMovementState => ({
        x: this.heroPos.x,
        y: this.heroPos.y,
        facing: this.heroPos.facing,
        // absolute rather than the degrees left to turn, which would drift from packet to packet
        targetAngle: this.heroPos.facing + this.getRemainingDegreesToTurn(),
        flyHeight: this.heroPos.flyHeight,
        speedZ: this.getSpeedZ(),
        lastZ: this.getLastZ(),
        oldDiffZ: this.getOldDiffZ(),
        slideSpeed: this.slideSpeed,
        rotationSpeed: this.rotationSpeed,
        slideInertia: this.slideInertia,
        turnPerPeriod: this.getSlideCurrentTurnPerPeriod(),
        terrainTypeId: this.lastTerrainType?.getTerrainTypeId() ?? 0,
        staticSlideId: this.staticSliding?.id ?? -1,
        staticSlidePreviousSpeed: this.staticSliding?.getPreviousSlideSpeed(this.escaperId) ?? 0,
    })

    /** Where every machine agrees the hero is, from a packet every machine applies on the same turn */
    private recordSyncedHeroPos = (movement: HeroMovementState) => {
        const synced = this.syncedHeroPos
        const remainingDegrees = AnglesDiff(movement.targetAngle, movement.facing)

        synced.x = movement.x
        synced.y = movement.y
        synced.facing = movement.facing
        synced.flyHeight = movement.flyHeight
        // as setRemainingDegreesToTurn keeps it, so that the unit turns as the effect of the others does
        synced.remainingDegrees = RAbsBJ(remainingDegrees) < 0.01 ? 0 : remainingDegrees
        synced.turnPerPeriod = movement.turnPerPeriod
        synced.slideSpeed = movement.slideSpeed
        synced.rotationSpeed = movement.rotationSpeed
        synced.slideInertia = movement.slideInertia
        synced.staticSlideId = movement.staticSlideId
        synced.ticksWithoutPacket = 0
    }

    /**
     * Where the hero is for anything acting on the game: the unit when it is one, and where every
     * machine carries it on from the last packet about the effect when it slides as one. getHeroX is where each machine sees it, which differs
     * from one machine to another during an async slide, and moving another hero there would move it
     * to a different place on each of them.
     */
    getSyncedHeroX = () => (this.isHeroEffectActive ? this.syncedHeroPos.x : this.hero ? GetUnitX(this.hero) : 0)

    getSyncedHeroY = () => (this.isHeroEffectActive ? this.syncedHeroPos.y : this.hero ? GetUnitY(this.hero) : 0)

    getSyncedHeroFacing = () =>
        this.isHeroEffectActive ? this.syncedHeroPos.facing : this.hero ? GetUnitFacing(this.hero) : 0

    /**
     * Whether a static slide takes the hero along, as every machine agrees: while it slides as an
     * effect, only its own machine takes it along a lane, and the others learn it from the packets.
     */
    isSyncedStaticSliding = () =>
        this.isHeroEffectActive ? this.syncedHeroPos.staticSlideId >= 0 : this.isStaticSliding()

    /**
     * The unit of a hero sliding as an effect follows it from the packets, so that the triggers of a
     * map, and the rects and ranges of the engine, find the hero where every machine agrees it is:
     * about where the other players see the effect, behind the effect its own player sees, but in the
     * same place on every machine, which is all a unit may be.
     */
    private moveHeroUnitToSyncedPos = () => {
        if (!this.hero || !this.isHeroEffectActive) {
            return
        }

        SetUnitX(this.hero, this.syncedHeroPos.x)
        SetUnitY(this.hero, this.syncedHeroPos.y)
        BlzSetUnitFacingEx(this.hero, this.syncedHeroPos.facing)
        SetUnitFlyHeight(this.hero, this.syncedHeroPos.flyHeight, 0)
    }

    /**
     * Carries the unit of a hero sliding as an effect on from the last packet, on every machine alike:
     * turned and moved period by period as the slide turns and moves the effect on the machines told
     * about it, from nothing but what that packet said - never from where this machine sees the hero,
     * which differs from one machine to another. Stops once no packet came for as long as those
     * machines keep the effect going.
     */
    private advanceSyncedHeroUnit: (this: void) => void = () => {
        const synced = this.syncedHeroPos

        if (
            !this.hero ||
            !this.isHeroEffectActive ||
            synced.ticksWithoutPacket >= SYNCED_UNIT_MAX_TICKS_WITHOUT_PACKET
        ) {
            return
        }

        synced.ticksWithoutPacket++

        // as the slide decides it, from the packet rather than from this machine's own view of the hero
        const allowTurning =
            this.slidingMode == 'max' && synced.rotationSpeed != 0 && (synced.flyHeight < 1 || globals.CAN_TURN_IN_AIR)
        const maxTurnPerPeriod = synced.rotationSpeed * Constants.SLIDE_PERIOD * 360
        const movePerPeriod = this.tempSlideSpeedPerPeriod || synced.slideSpeed * Constants.SLIDE_PERIOD

        for (let step = 0; step < SYNCED_UNIT_STEPS_PER_TICK; step++) {
            // moved along the facing it had before this period's turn, as the slide moves it
            const angle = Deg2Rad(synced.facing)

            if (
                allowTurning &&
                computeSlideTurnForOnePeriod(
                    synced.remainingDegrees,
                    maxTurnPerPeriod,
                    synced.turnPerPeriod,
                    this.rotationTimeForMaximumSpeed,
                    synced.slideInertia
                )
            ) {
                const remainingDegrees = synced.remainingDegrees - slideTurn.diffToApply

                synced.turnPerPeriod = slideTurn.turnPerPeriod
                synced.remainingDegrees = RAbsBJ(remainingDegrees) < 0.01 ? 0 : remainingDegrees
                synced.facing = synced.facing + slideTurn.diffToApply
            }

            const x = synced.x + movePerPeriod * Cos(angle)
            const y = synced.y + movePerPeriod * Sin(angle)

            if (x >= globals.MAP_MIN_X && x <= globals.MAP_MAX_X && y >= globals.MAP_MIN_Y && y <= globals.MAP_MAX_Y) {
                synced.x = x
                synced.y = y
            }
        }

        this.moveHeroUnitToSyncedPos()
    }

    private advanceSyncedHeroUnitSafely = errorHandler(this.advanceSyncedHeroUnit)

    /** Puts this hero exactly where the machine of its player says it is */
    private applyHeroMovementState = (movement: HeroMovementState) => {
        this.recordSyncedHeroPos(movement)

        this.heroPos.x = movement.x
        this.heroPos.y = movement.y
        this.heroPos.facing = movement.facing
        this.heroPos.flyHeight = movement.flyHeight

        this.setRemainingDegreesToTurn(AnglesDiff(movement.targetAngle, movement.facing))
        this.setSlideCurrentTurnPerPeriod(movement.turnPerPeriod)
        this.setSpeedZ(movement.speedZ)
        this.setLastZ(movement.lastZ)
        this.setOldDiffZ(movement.oldDiffZ)
        // plain fields only: this runs on the receiving machines ten times a second, so it must not
        // create nor destroy a handle. Their sequences would drift apart, and MEC keys tables on
        // handle ids.
        this.setSlideSpeed(movement.slideSpeed)
        this.setRotationSpeed(movement.rotationSpeed)
        this.setSlideInertia(movement.slideInertia)
        this.lastTerrainType = getUdgTerrainTypes().getByTerrainTypeId(movement.terrainTypeId) ?? undefined

        // last, once all of it is set: moving the unit may fire the triggers of a map
        this.moveHeroUnitToSyncedPos()
    }

    /**
     * A snapshot from the machine owning this hero. Between two of them the slide of every machine
     * carries the movement on by itself, which is why the angle asked for and the angular speed
     * travel along: the same numbers in, the same path out.
     *
     * The sender applies nothing here: it is already ahead of what it just sent.
     */
    applyAsyncPosition = (sequence: number, movement: HeroMovementState) => {
        if (sequence <= this.lastAsyncSequence || !this.isHeroEffectActive) {
            return
        }

        this.lastAsyncSequence = sequence
        this.lastAsyncPacketTime = os.clock()

        // The machine that sent this is already ahead of it and has nothing to learn, save for the
        // unit: it moves from the packet on every machine, this one included.
        if (GetLocalPlayer() === this.p) {
            this.recordSyncedHeroPos(movement)
            this.moveHeroUnitToSyncedPos()

            return
        }

        this.applyHeroMovementState(movement)
        this.updateHeroEffect()
    }

    /**
     * The death everybody agreed on: the unit takes back the place, the facing and the fly height
     * the effect had reached, and dies there. Dying in the air needs nothing special: the slide
     * keeps carrying a dead hero until it lands, and only then stops.
     */
    applyAsyncDeath = (sequence: number, movement: HeroMovementState, killingEffectIndex = -1) => {
        // nothing left to kill: the hero was removed while its death was on its way
        if (!this.hero) {
            return
        }

        // read while it still slides as an effect: the machine that showed it forgets that as it stops
        const killingEffectModel = takeKillingEffectModelOfDeath(this.escaperId, killingEffectIndex)

        this.lastAsyncSequence = sequence
        this.lastAsyncPacketTime = os.clock()
        this.applyHeroMovementState(movement)

        this.setHeroAsEffect(false)
        this.isHeroEffectFrozen = false

        // the killing effect of what killed it, on the unit now standing where every machine agrees it died
        if (killingEffectModel !== undefined && this.hero) {
            EffectUtils.destroyEffect(EffectUtils.addSpecialEffectTarget(killingEffectModel, this.hero, 'origin'))
        }

        // why is only known to the machine of its player, which wrote it in its own log
        setDeathCauseIfUnknown(this.escaperId, 'death told by the machine of its player')

        // Killed before the slide is turned back on: enabling it hands a sliding hero over to its
        // effect again, which a dead one must not be.
        this.killNow()

        // The slide may well be off here: it is turned on and off by the terrain under the hero,
        // and in async mode every machine reads that under its own position. Without it the body
        // would stop in mid air instead of finishing its flight.
        this.enableSlide(true)

        // after enableSlide, which samples the terrain height itself and would overwrite them
        this.setLastZ(movement.lastZ)
        this.setOldDiffZ(movement.oldDiffZ)

        // Dead along a static slide its own machine alone had it in: every machine gives the body
        // back to that lane, which carries it on as it carries any body, rather than letting it
        // stop where it fell. After enableSlide, which a static slide would refuse.
        if (movement.staticSlideId >= 0) {
            getUdgLevels()
                .getCurrentLevel(this)
                .staticSlides.get(movement.staticSlideId)
                ?.carryDeadHero(this, movement.staticSlidePreviousSpeed)
        }

        // Every machine runs this on the same turn, so dropping the temporary speed here is
        // symmetric. Its timer could not be transmitted anyway, and the hero is dead: the speed
        // only has to carry the body until it lands.
        this.disableSlideSpeedTemporarily()
    }

    /** Kills the hero for real, wherever its unit stands */
    killNow = () => {
        if (this.isAlive()) {
            if (this.hero) {
                setDeathOriginIfUnknown(this.escaperId, 'killed from')

                KillUnit(this.hero)

                for (const hook of hooks.hooks_onEscaperDeath.getHooks()) {
                    hook.execute(this)
                }

                this.disableSlideSpeedTemporarily()
            }
            return true
        }
        return false
    }

    pause(doPause: boolean) {
        if (this.isPaused() == doPause) {
            return false
        }
        this.hero && PauseUnit(this.hero, doPause)
        return true
    }

    SpecialIllidan = () => {
        this.hero && SetUnitAnimation(this.hero, 'Morph Alternate')
    }

    revive(x: number, y: number, type: 'coop' | 'other' = 'other') {
        const isAlive = this.isAlive()

        if (!this.hero || isAlive) {
            return false
        }

        // whatever was about to kill it before does not explain its next death
        clearDeathCause(this.escaperId)

        this.setLastPos()

        if (IsHeroUnitId(GetUnitTypeId(this.hero))) {
            ReviveHero(this.hero, x, y, SHOW_REVIVE_EFFECTS)

            // a revived unit gets its shadow back
            this.isUnitShadowRemovedHere = false

            if (this.skin) {
                SetUnitPathing(this.hero, false)
                SetUnitX(this.hero, x)
                SetUnitY(this.hero, y)
            }
        } else {
            const angle = this.getHeroFacing()

            this.removeHero()
            this.createHero(x, y, angle)
        }

        if (this.invisUnit) {
            SetUnitX(this.invisUnit, x)
            SetUnitY(this.invisUnit, y)
            ShowUnit(this.invisUnit, true)
        }

        this.enableCheckTerrain(true)
        this.SpecialIllidan()
        this.selectHero()
        this.updateUnitVertexColor()

        for (const [_, terrainType] of pairs(getUdgTerrainTypes().getAll())) {
            if (isDeathTerrain(terrainType)) {
                terrainType.abortKillEscaper(this)
            }
        }

        if (!this.firstPersonHandle.isFirstPerson()) {
            this.setCanClick(true)
        }

        TimerStart(AfkMode.afkModeTimers[this.escaperId], AfkMode.timeMinAfk, false, () =>
            AfkMode.GetAfkModeTimeExpiresCodeFromId(this.escaperId)
        )
        this.lastZ = 0
        this.oldDiffZ = 0
        this.speedZ = 0

        //coop
        ShowUnit(this.powerCircle, false)
        ShowUnit(this.dummyPowerCircle, false)

        if (this.hero && (this.panCameraOnRevive === 'all' || this.panCameraOnRevive === type)) {
            //move camera if needed
            if (GetLocalPlayer() == this.p) {
                this.moveCameraToHeroIfNecessary()
            }
        }

        if (type !== 'coop') {
            for (const [_, staticSlide] of pairs(getUdgLevels().getCurrentLevel(this).staticSlides.getAll())) {
                staticSlide.removePlayer(this.escaperId)
            }
        }

        reviveTrigManager.removeEscaper(this.escaperId)

        return true
    }

    moveCameraToHeroIfNecessary = () => {
        if (!this.hero) {
            return
        }

        if (this.isLockCamTarget()) {
            return
        }

        if (this.panCameraOnRevive === 'none') {
            return
        }

        const xHero = this.getHeroX()
        const yHero = this.getHeroY()

        const minX = GetCameraTargetPositionX() - this.moveCamDistanceWidth / 2
        const minY = GetCameraTargetPositionY() - this.moveCamDistanceHeight / 2
        const maxX = GetCameraTargetPositionX() + this.moveCamDistanceWidth / 2
        const maxY = GetCameraTargetPositionY() + this.moveCamDistanceHeight / 2

        if (xHero < minX || xHero > maxX || yHero < minY || yHero > maxY) {
            SetCameraPositionForPlayer(this.p, xHero, yHero)
        }
    }

    reviveAtStart = () => {
        const x: number = getUdgLevels().getCurrentLevel(this).getStartRandomX()
        const y: number = getUdgLevels().getCurrentLevel(this).getStartRandomY()

        if (!this.isEscaperSecondary()) {
            GetMirrorEscaper(this)?.reviveAtStart()
        }

        const startFacing = getUdgLevels().getCurrentLevel(this).getStart()?.getFacing()
        startFacing && this.turnInstantly(startFacing)

        return this.revive(x, y)
    }

    turnInstantly(angle: number) {
        this.setHeroFacing(angle)
    }

    /**
     * The slow turn of a unit, at its own turn rate. An effect has no such thing, so it turns on
     * the spot instead: while sliding in async mode the angle comes from the cursor anyway, and
     * the slide applies its own rotation speed on top.
     */
    turnProgressively(angle: number) {
        if (!this.hero) {
            return
        }

        if (this.isHeroEffectActive) {
            this.setHeroFacing(angle)

            return
        }

        SetUnitFacing(this.hero, angle)
    }

    reverse = () => {
        if (!this.hero) return

        const angle: number = this.getHeroFacing() + 180
        this.turnInstantly(angle)
        if (this.slideLastAngleOrder != -1) {
            this.slideLastAngleOrder = this.slideLastAngleOrder + 180

            // not the unit of a hero sliding as an effect, which only its own machine turns now
            if (!this.isHeroEffectActive) {
                SetUnitFacing(this.hero, this.slideLastAngleOrder)
            }
        }
    }

    giveHeroControl(escaper: Escaper) {
        this.hero && SetUnitOwner(this.hero, escaper.getPlayer(), false)
        this.controler = escaper
    }

    resetOwner = () => {
        this.giveHeroControl(this)
    }

    setIsHeroSelectedForPlayer(p: player, heroSelected: boolean) {
        if (GetLocalPlayer() == p) {
            this.isHeroSelectedB = heroSelected
        }
    }

    setSelectedPlayerId = (playerId: number) => {
        this.selectedPlayerId = playerId
    }

    getSelectedPlayerId = () => this.selectedPlayerId

    //effects methods
    newEffect(efStr: string, bodyPart: string) {
        this.hero && this.effects.new(efStr, this.hero, bodyPart)

        if (!this.isEscaperSecondary()) {
            GetMirrorEscaper(this)?.newEffect(efStr, bodyPart)
        }
    }

    destroyLastEffects(numEfToDestroy: number) {
        this.effects.destroyLastEffects(numEfToDestroy)

        if (!this.isEscaperSecondary()) {
            GetMirrorEscaper(this)?.destroyLastEffects(numEfToDestroy)
        }
    }

    hideEffects = () => {
        this.effects.hideEffects()

        if (!this.isEscaperSecondary()) {
            GetMirrorEscaper(this)?.hideEffects()
        }
    }

    showEffects = () => {
        this.hero && this.effects.showEffects(this.hero)

        if (!this.isEscaperSecondary()) {
            GetMirrorEscaper(this)?.showEffects()
        }
    }

    //terrainKill methods
    destroyTerrainKillEffect = () => {
        EffectUtils.destroyEffect(this.terrainKillEffect)
    }

    createTerrainKillEffect(killEffectStr: string) {
        this.destroyTerrainKillEffect()
        this.hero &&
            (this.terrainKillEffect = EffectUtils.addSpecialEffectTarget(
                killEffectStr,
                this.hero,
                Constants.TERRAIN_KILL_EFFECT_BODY_PART
            ))
    }

    destroyPortalEffect = () => {
        EffectUtils.destroyEffect(this.portalEffect)
    }

    createPortalEffect(effectStr: string) {
        this.destroyPortalEffect()
        this.hero &&
            (this.portalEffect = EffectUtils.addSpecialEffectTarget(
                effectStr,
                this.hero,
                Constants.TERRAIN_KILL_EFFECT_BODY_PART
            ))
    }

    //lastTerrainType methods
    getLastTerrainType = () => {
        return this.lastTerrainType
    }

    setLastTerrainType(terrainType: TerrainType | undefined) {
        this.lastTerrainType = terrainType
    }

    //speed methods
    setSlideSpeed(ss: number) {
        this.slideSpeed = ss
        this.slideMovePerPeriod = ss * Constants.SLIDE_PERIOD
    }

    disableSlideSpeedTemporarily() {
        if (this.tempSlideSpeedTimer) {
            this.tempSlideSpeedEffect && DestroyEffect(this.tempSlideSpeedEffect)
            this.tempSlideSpeedEffect = null
            this.tempSlideSpeedTimer?.destroy()
            this.tempSlideSpeedTimer = null
            this.tempSlideSpeedPerPeriod = null
        }
    }

    setSlideSpeedTemporarily(ss: number, duration: number, effect?: string) {
        this.disableSlideSpeedTemporarily()
        this.tempSlideSpeedPerPeriod = (this.getSlideMirror() ? -1 : 1) * ss * Constants.SLIDE_PERIOD

        if (this.hero && effect) {
            this.tempSlideSpeedEffect = Natives.UAddSpecialEffectTargetUnitBJ('origin', this.hero, effect)
        }

        this.tempSlideSpeedTimer = createTimer(duration, false, () => {
            this.disableSlideSpeedTemporarily()
        })
    }

    //speed methods
    setRotationSpeed(rs: number) {
        this.rotationSpeed = rs //rounds
        this.maxSlideTurnPerPeriod = rs * Constants.SLIDE_PERIOD * 360 //degrees
    }

    setSlideInertia(slideInertia: number) {
        this.slideInertia = slideInertia
    }

    getRemainingDegreesToTurn() {
        return this.remainingDegreesToTurn
    }

    setRemainingDegreesToTurn(remainingDegreesToTurn: number) {
        if (RAbsBJ(remainingDegreesToTurn) < 0.01) remainingDegreesToTurn = 0
        this.remainingDegreesToTurn = remainingDegreesToTurn
    }

    getSlideMovePerPeriod = () => {
        return this.tempSlideSpeedPerPeriod || this.slideMovePerPeriod
    }

    getMaxSlideTurnPerPeriod = () => {
        return this.maxSlideTurnPerPeriod
    }

    setSlideCurrentTurnPerPeriod = (n: number) => {
        this.slideCurrentTurnPerPeriod = n
    }

    getSlideCurrentTurnPerPeriod = () => {
        return this.slideCurrentTurnPerPeriod
    }

    setWalkSpeed(ws: number) {
        this.walkSpeed = ws
        this.hero && SetUnitMoveSpeed(this.hero, ws)
    }

    getSlideSpeed = () => {
        return this.slideSpeed
    }

    getRotationSpeed = () => {
        return this.rotationSpeed
    }

    getSlideInertia = () => {
        return this.slideInertia
    }

    getWalkSpeed = () => {
        return this.walkSpeed
    }

    isAbsoluteSlideSpeed = () => {
        return this.slideSpeedAbsolute
    }

    absoluteSlideSpeed(slideSpeed: number, isCommand = false) {
        this.slideSpeedAbsolute = true
        this.setSlideSpeed((this.getSlideMirror() ? -1 : 1) * slideSpeed)
        isCommand && (this.slideSpeedCmd = slideSpeed)

        if (!this.isEscaperSecondary()) {
            GetMirrorEscaper(this)?.absoluteSlideSpeed(slideSpeed, isCommand)
        }
    }

    stopAbsoluteSlideSpeed = (isCommand = false) => {
        if (this.slideSpeedAbsolute) {
            this.slideSpeedAbsolute = false

            if (this.hero && this.isAlive()) {
                const currentTerrainType = getUdgTerrainTypes().getTerrainType(this.getHeroX(), this.getHeroY())

                if (currentTerrainType instanceof TerrainTypeSlide) {
                    this.setSlideSpeed((this.getSlideMirror() ? -1 : 1) * currentTerrainType.getSlideSpeed())
                }
            }

            if (isCommand) {
                this.slideSpeedCmd = undefined
            } else {
                if (this.slideSpeedCmd !== undefined) {
                    this.slideSpeedAbsolute = true
                    this.setSlideSpeed(this.slideSpeedCmd)
                }
            }

            if (!this.isEscaperSecondary()) {
                GetMirrorEscaper(this)?.stopAbsoluteSlideSpeed(isCommand)
            }
        }
    }

    isAbsoluteRotationSpeed = () => {
        return this.rotationSpeedAbsolute
    }

    absoluteRotationSpeed(rotationSpeed: number) {
        this.rotationSpeedAbsolute = true
        this.setRotationSpeed(rotationSpeed)

        if (!this.isEscaperSecondary()) {
            GetMirrorEscaper(this)?.absoluteRotationSpeed(rotationSpeed)
        }
    }

    stopAbsoluteRotationSpeed = () => {
        if (this.rotationSpeedAbsolute) {
            this.rotationSpeedAbsolute = false

            if (this.hero && this.isAlive()) {
                const currentTerrainType = getUdgTerrainTypes().getTerrainType(this.getHeroX(), this.getHeroY())
                if (currentTerrainType instanceof TerrainTypeSlide) {
                    this.setRotationSpeed(currentTerrainType.getRotationSpeed())
                }
            }

            if (!this.isEscaperSecondary()) {
                GetMirrorEscaper(this)?.stopAbsoluteRotationSpeed()
            }
        }
    }

    isAbsoluteSlideInertia = () => {
        return this.slideInertiaAbsolute
    }

    absoluteSlideInertia(slideInertia: number) {
        this.slideInertiaAbsolute = true
        this.setSlideInertia(slideInertia)

        if (!this.isEscaperSecondary()) {
            GetMirrorEscaper(this)?.absoluteSlideInertia(slideInertia)
        }
    }

    stopAbsoluteSlideInertia = () => {
        if (this.slideInertiaAbsolute) {
            this.slideInertiaAbsolute = false

            if (this.hero && this.isAlive()) {
                const currentTerrainType = getUdgTerrainTypes().getTerrainType(this.getHeroX(), this.getHeroY())
                if (currentTerrainType instanceof TerrainTypeSlide) {
                    this.setSlideInertia(currentTerrainType.getSlideInertia())
                }
            }

            if (!this.isEscaperSecondary()) {
                GetMirrorEscaper(this)?.stopAbsoluteSlideInertia()
            }
        }
    }

    isAbsoluteWalkSpeed = () => {
        return this.walkSpeedAbsolute
    }

    absoluteWalkSpeed(walkSpeed: number) {
        this.walkSpeedAbsolute = true
        this.setWalkSpeed(walkSpeed)

        if (!this.isEscaperSecondary()) {
            GetMirrorEscaper(this)?.absoluteWalkSpeed(walkSpeed)
        }
    }

    stopAbsoluteWalkSpeed = () => {
        if (this.walkSpeedAbsolute) {
            this.walkSpeedAbsolute = false
            if (this.hero && this.isAlive()) {
                const currentTerrainType = getUdgTerrainTypes().getTerrainType(this.getHeroX(), this.getHeroY())
                if (currentTerrainType instanceof TerrainTypeWalk) {
                    this.setWalkSpeed(currentTerrainType.getWalkSpeed())
                }
            }

            if (!this.isEscaperSecondary()) {
                GetMirrorEscaper(this)?.stopAbsoluteWalkSpeed()
            }
        }
    }

    isAbsoluteInstantTurn = () => {
        return this.instantTurnAbsolute
    }

    setAbsoluteInstantTurn(flag: boolean) {
        this.instantTurnAbsolute = flag

        if (!this.isEscaperSecondary()) {
            GetMirrorEscaper(this)?.setAbsoluteInstantTurn(flag)
        }
    }

    //godMode methods
    setGodMode(godMode: boolean) {
        this.godMode = godMode

        if (!this.isEscaperSecondary()) {
            GetMirrorEscaper(this)?.setGodMode(godMode)
        }
    }

    setGodModeKills(godModeKills: boolean) {
        this.godModeKills = godModeKills

        if (!this.isEscaperSecondary()) {
            GetMirrorEscaper(this)?.setGodModeKills(godModeKills)
        }
    }

    isGodModeOn = () => {
        return this.godMode
    }

    doesGodModeKills = () => {
        return this.godModeKills
    }

    //color methods
    setBaseColor(baseColorId: number) {
        if (baseColorId < 0 || baseColorId >= Constants.NB_PLAYERS_MAX_REFORGED) {
            return false
        }
        this.baseColorId = baseColorId
        if (this.hero) {
            if (baseColorId == 0) {
                SetUnitColor(this.hero, PLAYER_COLOR_RED)
                SetUnitColor(this.powerCircle, PLAYER_COLOR_RED)
            } else {
                SetUnitColor(this.hero, Natives.UConvertPlayerColor(baseColorId))
                SetUnitColor(this.powerCircle, Natives.UConvertPlayerColor(baseColorId))
            }
        }

        this.updateUnitVertexColor()

        if (!this.isEscaperSecondary()) {
            ColorInfo(this, this.p)
            GetMirrorEscaper(this)?.setBaseColor(baseColorId)
        }
        return true
    }

    setBaseColorDisco(baseColorId: number) {
        if (baseColorId < 0 || baseColorId >= Constants.NB_PLAYERS_MAX_REFORGED) {
            return false
        }
        this.baseColorId = baseColorId
        if (this.hero) {
            if (baseColorId == 0) {
                SetUnitColor(this.hero, PLAYER_COLOR_RED)
                SetUnitColor(this.powerCircle, PLAYER_COLOR_RED)
            } else {
                SetUnitColor(this.hero, Natives.UConvertPlayerColor(baseColorId))
                SetUnitColor(this.powerCircle, Natives.UConvertPlayerColor(baseColorId))
            }
        }

        if (!this.isEscaperSecondary()) {
            GetMirrorEscaper(this)?.setBaseColorDisco(baseColorId)
        }

        return true
    }

    getBaseColor = () => {
        return this.baseColorId
    }

    setVcRed(vcRed: number) {
        if (vcRed < 0 || vcRed > 100) {
            return false
        }
        this.vcRed = vcRed

        if (!this.isEscaperSecondary()) {
            GetMirrorEscaper(this)?.setVcRed(vcRed)
        }

        return true
    }

    setVcGreen(vcGreen: number) {
        if (vcGreen < 0 || vcGreen > 100) {
            return false
        }
        this.vcGreen = vcGreen

        if (!this.isEscaperSecondary()) {
            GetMirrorEscaper(this)?.setVcGreen(vcGreen)
        }

        return true
    }

    setVcBlue(vcBlue: number) {
        if (vcBlue < 0 || vcBlue > 100) {
            return false
        }

        if (!this.isEscaperSecondary()) {
            GetMirrorEscaper(this)?.setVcBlue(vcBlue)
        }

        this.vcBlue = vcBlue
        return true
    }

    setVcTransparency(vcTransparency: number) {
        if (vcTransparency < 0 || vcTransparency > 100) {
            return false
        }

        if (this.isEscaperSecondary()) {
            return true //secondary escapers transparency is fixed
        }

        this.vcTransparency = vcTransparency

        return true
    }

    getVcRed = () => {
        return this.vcRed
    }

    getVcGreen = () => {
        return this.vcGreen
    }

    getVcBlue = () => {
        return this.vcBlue
    }

    getVcTransparency = () => {
        return this.vcTransparency
    }

    refreshVertexColor = () => {
        this.hero && this.updateUnitVertexColor()

        if (!this.isEscaperSecondary()) {
            ColorInfo(this, this.p)
            GetMirrorEscaper(this)?.refreshVertexColor()
        }
    }

    //cheat methods
    setCanCheat(canCheat: boolean) {
        if (!canCheat) {
            this.isMaximaxouB = false
            this.isTrueMaximaxouB = false
        }
        this.canCheatB = canCheat
    }

    setIsMaximaxou(isMaximaxou: boolean) {
        if (isMaximaxou) {
            this.setCanCheat(true)
        } else {
            this.isTrueMaximaxouB = false
        }
        this.isMaximaxouB = isMaximaxou
    }

    setIsTrueMaximaxou(isTrueMaximaxou: boolean) {
        if (isTrueMaximaxou) {
            this.setIsMaximaxou(true)
        }
        this.isTrueMaximaxouB = isTrueMaximaxou
    }

    canCheat = () => {
        return this.canCheatB
    }

    isMaximaxou = () => {
        return this.isMaximaxouB
    }

    isTrueMaximaxou = () => {
        return this.isTrueMaximaxouB
    }

    //autres
    getPlayer = () => {
        return this.p
    }

    getControler = () => {
        return this.controler
    }

    setCameraField(cameraField: number) {
        this.cameraField = cameraField
        SetCameraFieldForPlayer(this.p, CAMERA_FIELD_TARGET_DISTANCE, I2R(cameraField), 0)
    }

    getCameraField = () => {
        return this.cameraField
    }

    resetCamera = () => {
        if (!this.spinCamTimer) {
            ResetToGameCameraForPlayer(this.p, 0)
        }

        SetCameraFieldForPlayer(this.p, CAMERA_FIELD_TARGET_DISTANCE, this.cameraField, 0)

        if (this.lockCamTarget) {
            const hero = this.lockCamTarget.getHero()

            if (hero) {
                SetCameraTargetControllerNoZForPlayer(this.getPlayer(), hero, 0, 0, false)
            }
        }

        this.startSpinCam()
    }

    startSpinCam = () => {
        if (this.spinCamSpeed !== 0 && this.lastTerrainType?.getKind() === 'slide') {
            this.stopSpinCam()

            this.spinCamTimer = createTimer(Constants.SLIDE_PERIOD, true, () => {
                if (this.hero) {
                    SetCameraFieldForPlayer(
                        this.getPlayer(),
                        CAMERA_FIELD_ROTATION,
                        ForceAngleBetween0And360(Rad2Deg(GetCameraField(CAMERA_FIELD_ROTATION)) + this.spinCamSpeed),
                        0
                    )
                }
            })
        } else {
            this.stopSpinCam()
        }
    }

    stopSpinCam = () => {
        if (this.spinCamTimer) {
            this.spinCamTimer?.destroy()
            this.spinCamTimer = null
        }
    }

    kick(kicked: Escaper) {
        CustomDefeatBJ(kicked.getPlayer(), 'You have been kicked by ' + this.displayName + ' !')
        Text.A(
            udg_colorCode[kicked.getColorId()] +
                kicked.displayName +
                ' has been kicked by ' +
                udg_colorCode[this.getColorId()] +
                this.displayName +
                ' !'
        )
        kicked.destroy()
        GetMirrorEscaper(kicked)?.destroy()

        // Delay it a bit
        runInTrigger(() => getUdgLevels().deactivateEmptyLevels())
    }

    //autorevive methods
    hasAutorevive = () => {
        return this.hasAutoreviveB
    }

    setHasAutorevive(hasAutorevive: boolean) {
        this.hasAutoreviveB = hasAutorevive
    }

    //for gravity gestion
    getLastZ = () => {
        return this.lastZ
    }

    setLastZ(lastZ: number) {
        this.lastZ = lastZ
    }

    getOldDiffZ = () => {
        return this.oldDiffZ
    }

    setOldDiffZ(oldDiffZ: number) {
        this.oldDiffZ = oldDiffZ
    }

    getSpeedZ = () => {
        return this.speedZ
    }

    setSpeedZ(speedZ: number) {
        this.speedZ = speedZ
    }

    //coop reviving
    coopReviveHero: (this: void) => void = () => {
        // revived already, by another rescuer a moment earlier: no second sound, freeze nor invulnerability
        if (this.isAlive()) {
            return
        }

        const mirrorEscaper = GetMirrorEscaper(this)
        const mirrorHero = mirrorEscaper?.getHero()

        if (this.hero) {
            const xHero = this.getHeroX()
            const yHero = this.getHeroY()

            if (!this.revive(xHero, yHero, 'coop')) {
                if (this.hero && (this.panCameraOnRevive === 'all' || this.panCameraOnRevive === 'coop')) {
                    //move camera if needed
                    if (GetLocalPlayer() == this.p) {
                        this.moveCameraToHeroIfNecessary()
                    }
                }
            }

            RunCoopSoundOnHero(this.hero)
            animUtils.setAnimation(this.hero, globals.animOnRevive || 'channel')
            this.absoluteSlideSpeed(0)
            this.setCoopInvul(true)
        }

        if (mirrorHero && mirrorEscaper) {
            mirrorEscaper.revive(GetUnitX(mirrorHero), GetUnitY(mirrorHero), 'coop')
            RunCoopSoundOnHero(mirrorHero)
            animUtils.setAnimation(mirrorHero, globals.animOnRevive || 'channel')
            mirrorEscaper.absoluteSlideSpeed(0)
            mirrorEscaper.setCoopInvul(true)
        }

        TriggerSleepAction(1.4)

        this.stopAbsoluteSlideSpeed()
        this.hero && SetUnitAnimation(this.hero, 'stand')

        mirrorEscaper?.stopAbsoluteSlideSpeed()
        mirrorHero && SetUnitAnimation(mirrorHero, 'stand')

        TriggerSleepAction(0.6)

        this.setCoopInvul(false)
        mirrorEscaper?.setCoopInvul(false)
    }

    isCoopInvul = () => {
        return this.coopInvul
    }

    setCoopInvul(invul: boolean) {
        this.coopInvul = invul
    }

    enableTrigCoopRevive = () => {
        if (this.hero) {
            ShowUnit(this.powerCircle, true)
            SetUnitPathing(this.powerCircle, false)
            SetUnitPosition(this.powerCircle, this.getHeroX(), this.getHeroY())
            ShowUnit(this.dummyPowerCircle, true)
            SetUnitPathing(this.dummyPowerCircle, false)
            SetUnitPosition(this.dummyPowerCircle, this.getHeroX(), this.getHeroY())
        }
    }

    /**
     * The power circle only serves once the hero is dead, so it follows the unit rather than the
     * effect: it has nothing to do while the hero slides.
     */
    refreshCerclePosition = () => {
        if (!IsUnitHidden(this.powerCircle) && this.hero) {
            SetUnitPosition(this.powerCircle, GetUnitX(this.hero), GetUnitY(this.hero))
            SetUnitPosition(this.dummyPowerCircle, GetUnitX(this.hero), GetUnitY(this.hero))
        }
    }

    isPortalCooldown = () => this.portalCooldown

    enablePortalCooldown = () => {
        this.portalCooldown = true
    }

    disablePortalCooldown = (timeout: number) => {
        this.portalCooldownTimer?.destroy()
        this.portalCooldownTimer = createTimer(timeout, false, () => (this.portalCooldown = false))
    }

    getFirstPersonHandle = () => this.firstPersonHandle
    getStartCommandsHandle = () => this.startCommandsHandle

    isLockCamTarget = () => !!this.lockCamTarget

    setLockCamTarget = (lockCamTarget: Escaper | null, lockCamTargetMode: 'default' | 'progression' = 'default') => {
        this.lockCamTarget = lockCamTarget
        this.lockCamTargetMode = lockCamTargetMode
        this.resetCamera()

        this.calcProgressionLockCamTarget()
    }

    setSpinCamSpeed = (speed: number) => {
        this.spinCamSpeed = speed
        this.resetCamera()
    }

    calcProgressionLockCamTarget = () => {
        if (this.lockCamTargetMode !== 'progression') {
            return
        }

        let highestProgression = 0
        let highestProgressionPlayer: Escaper | undefined = undefined

        for (const [_, player] of pairs(getUdgEscapers().getAll())) {
            const targetProgression = progressionUtils.getPlayerProgression(player)

            if (highestProgressionPlayer === undefined || targetProgression > highestProgression) {
                highestProgression = targetProgression
                highestProgressionPlayer = player
            }
        }

        if (highestProgressionPlayer) {
            this.lockCamTarget = highestProgressionPlayer
            this.resetCamera()
        }
    }

    toggleLockCamRotation = (lockCamRotation: boolean) => {
        this.lockCamRotation?.destroy()
        this.lockCamRotation = null

        if (lockCamRotation) {
            this.lockCamRotation = createTimer(0.001, true, () => {
                this.hero && SetCameraFieldForPlayer(this.getPlayer(), CAMERA_FIELD_ROTATION, this.getHeroFacing(), 0)
            })
        }
    }

    toggleLockCamHeight = (lockCamHeight: boolean) => {
        this.lockCamHeight?.destroy()
        this.lockCamHeight = null

        if (lockCamHeight) {
            this.lockCamHeight = createTimer(0.001, true, () => {
                if (this.hero && !this.firstPersonHandle.isFirstPerson()) {
                    SetCameraFieldForPlayer(this.getPlayer(), CAMERA_FIELD_ZOFFSET, GetUnitZEx(this.hero), 0)
                }
            })
        }
    }

    isLockCamHeight = () => !!this.lockCamHeight

    setGumTerrain = (terrainType: TerrainType) => {
        this.gumTerrain = terrainType
    }

    getGumTerrain = () => {
        return this.gumTerrain
    }

    setBrushSize = (size: number) => {
        this.brushSize = size
    }

    getBrushSize = () => {
        return this.brushSize
    }

    setGumBrushSize = (size: number) => {
        this.gumBrushSize = size
    }

    getGumBrushSize = () => {
        return this.gumBrushSize
    }

    enableFollowMouseMode = (flag: boolean, neverDisable: boolean) => {
        this.followMouse?.destroy()
        if (flag) {
            this.followMouse = new FollowMouse(this, neverDisable)
        } else {
            delete this.followMouse
        }
    }

    getFollowMouse = () => {
        return this.followMouse
    }

    enableSimpleFollowMouseMode = (flag: boolean) => {
        this.simpleFollowMouse?.destroy()
        if (flag) {
            this.simpleFollowMouse = new SimpleFollowMouse(this)
        } else {
            delete this.simpleFollowMouse
        }
    }

    getSimpleFollowMouse = () => {
        return this.simpleFollowMouse
    }

    getSlideMirror = () => this.slideMirror

    setSlideMirror = (slideMirror: boolean) => (this.slideMirror = slideMirror)

    isIgnoringDeathMessages = () => this.ignoreDeathMessages

    setIgnoreDeathMessages = (ignoreDeathMessages: boolean) => (this.ignoreDeathMessages = ignoreDeathMessages)

    setPanCameraOnRevive = (panCameraOnRevive: 'coop' | 'all' | 'none') => {
        this.panCameraOnRevive = panCameraOnRevive
    }

    updateTextTagPos: (this: void) => void = () => {
        if (!this.hero || !this.textTag) {
            return
        }

        SetTextTagPos(this.textTag, this.getHeroX() - 64, this.getHeroY() + 192, 0)
    }

    getTextTag = () => this.textTag

    getDisplayName = () => this.displayName

    setShowNames = (showNames: boolean) => {
        this.showNames = showNames
        this.updateShowNames(true)
    }

    isStaticSliding = () => !!this.staticSliding

    getStaticSliding = () => this.staticSliding

    setStaticSliding = (staticSliding: StaticSlide | undefined) => {
        this.staticSliding = staticSliding
    }

    updateShowNames = (localOnly: boolean) => {
        for (const [_, player] of pairs(getUdgEscapers().getAll())) {
            if (!localOnly || player.getPlayer() === GetLocalPlayer()) {
                for (const [_, escaper] of pairs(getUdgEscapers().getAll())) {
                    const textTag = escaper.getTextTag()

                    if (textTag && GetLocalPlayer() !== escaper.getPlayer()) {
                        SetTextTagVisibility(textTag, player.showNames)
                    }
                }
            }
        }
    }

    /**
     * The effect stands in for the hero unit in async slide mode. It is created with the hero, on
     * every machine at once as a handle demands, and never destroyed: it simply waits under the
     * map when the hero is a unit, so that no handle ever appears or disappears mid game.
     */
    private createHeroEffect = () => {
        if (this.heroEffect || !this.hero) {
            return
        }

        this.heroEffect = EffectUtils.addSpecialEffect(globals.heroModelPath, this.getHeroX(), this.getHeroY())

        if (!this.heroEffect) {
            return
        }

        BlzSetSpecialEffectColorByPlayer(this.heroEffect, Natives.UPlayer(this.baseColorId))
        this.refreshHeroEffectScale()
        this.parkHeroEffect()
    }

    /**
     * The effect is drawn at the size of the hero it stands in for: the scale of its unit when it
     * has one of its own, and otherwise the scale the map gave its hero type in the editor.
     */
    private refreshHeroEffectScale = () => {
        const scale = this.scale ?? globals.heroBaseScale

        if (this.heroEffect && scale !== undefined) {
            BlzSetSpecialEffectScale(this.heroEffect, scale)
        }
    }

    /**
     * Draws the hero effect again with whatever model is now asked for. The effect is otherwise made
     * once and kept for the whole game, so this is the only place a handle of it comes and goes -
     * which is why it belongs to a command, heard by every machine on the same turn.
     */
    refreshHeroEffectModel = () => {
        if (!this.heroEffect) {
            return
        }

        EffectUtils.destroyEffect(this.heroEffect)
        delete this.heroEffect

        this.createHeroEffect()

        // it was standing in for the hero: the new one has to take the place of the old at once
        this.isHeroEffectActive && this.updateHeroEffect()
    }

    /** Sends the effect under the map, where nobody sees it */
    private parkHeroEffect = () => {
        this.heroEffect && BlzSetSpecialEffectPosition(this.heroEffect, 0, 0, PARKED_HERO_EFFECT_Z)
    }

    /**
     * Takes the shadow of the unit away, on this machine: switching its skin back and forth is the one
     * way known, and nothing but a revival gives it back (the unit has to be made again otherwise).
     * Only what is seen changes, which is why it may differ from one machine to another.
     */
    private removeUnitShadowHere = () => {
        if (!this.hero) {
            return
        }

        const skinId = BlzGetUnitSkin(this.hero)

        BlzSetUnitSkin(this.hero, skinId === FourCC('hpea') ? FourCC('hfoo') : FourCC('hpea'))
        BlzSetUnitSkin(this.hero, skinId)

        this.isUnitShadowRemovedHere = true
    }

    /**
     * A shadow drawn under the hero, the texture and the size of the one of its unit: under the effect
     * while the hero slides as one, and under the unit while that unit has lost its own, until it is
     * revived. Made with the hero on every machine at once, then shown and moved by each machine for
     * what its own player sees: an image is not an agent, and moving it is no business of the game.
     */
    private createFakeShadow = () => {
        if (this.fakeShadow || !this.hero) {
            return
        }

        const shadowName = BlzGetUnitStringField(this.hero, UNIT_SF_SHADOW_IMAGE_UNIT)
        const width = BlzGetUnitRealField(this.hero, UNIT_RF_SHADOW_IMAGE_WIDTH)
        const height = BlzGetUnitRealField(this.hero, UNIT_RF_SHADOW_IMAGE_HEIGHT)

        // a unit type without shadow, which has nothing to stand in for
        if (!shadowName || shadowName === '_' || width <= 0 || height <= 0) {
            return
        }

        // where the unit stands on its shadow, from the bottom left corner of the image
        const centerX = BlzGetUnitRealField(this.hero, UNIT_RF_SHADOW_IMAGE_CENTER_X)
        const centerY = BlzGetUnitRealField(this.hero, UNIT_RF_SHADOW_IMAGE_CENTER_Y)

        const image = CreateImage(
            `ReplaceableTextures\\Shadows\\${shadowName}.blp`,
            width,
            height,
            0,
            this.getHeroX() - centerX,
            this.getHeroY() - centerY,
            0,
            0,
            0,
            0,
            FAKE_SHADOW_IMAGE_TYPE
        )

        if (!image) {
            return
        }

        SetImageRenderAlways(image, true)
        SetImageConstantHeight(image, false, 0)
        ShowImage(image, false)

        this.fakeShadow = { image, centerX, centerY, isShown: false }
        this.fakeShadowTimer = createTimer(FAKE_SHADOW_PERIOD, true, this.updateFakeShadow)
    }

    /** Shows the drawn shadow where it is needed and moves it under the hero, on this machine only */
    private updateFakeShadow: (this: void) => void = () => {
        const fakeShadow = this.fakeShadow

        if (!fakeShadow || !this.hero) {
            return
        }

        const viewer = getUdgEscapers().get(GetPlayerId(GetLocalPlayer()))

        const isUnderEffect = this.isHeroEffectActive
        const isShown =
            (isUnderEffect || this.isUnitShadowRemovedHere) &&
            viewer?.shadowState[this.escaperId] !== false &&
            !!this.isAlive() &&
            !IsUnitHidden(this.hero)

        if (isShown !== fakeShadow.isShown) {
            ShowImage(fakeShadow.image, isShown)
            fakeShadow.isShown = isShown
        }

        if (!isShown) {
            return
        }

        const x = isUnderEffect ? this.heroPos.x : GetUnitX(this.hero)
        const y = isUnderEffect ? this.heroPos.y : GetUnitY(this.hero)

        SetImagePosition(fakeShadow.image, x - fakeShadow.centerX, y - fakeShadow.centerY, 0)
    }

    isHeroAsEffect = () => this.isHeroEffectActive

    /**
     * Whether this hero is meant to slide as an effect, which the "-autoTurn async" mode decides.
     * Kept here rather than read from that mode, so that the hand over belongs to the sliding
     * state itself and happens wherever that state changes.
     */
    setAsyncSlideEnabled = (isEnabled: boolean) => {
        this.isAsyncSlideEnabled = isEnabled
        this.updateHeroEffectMode()
    }

    /**
     * Hands the hero over to its effect, or takes it back, following the sliding state. Called
     * from enableSlide, so it happens at the very moment that state changes, on every machine:
     * a timer noticing it later would flip each machine at a different point of the slide.
     */
    private updateHeroEffectMode = () => {
        // a dead hero stays a unit: its body is carried by the slide, and every machine watches
        // the same one fall
        this.setHeroAsEffect(this.isAsyncSlideEnabled && this.isSliding() && this.isAlive() === true)
    }

    /**
     * Two reasons to leave the effect where it is: this machine saw the hero die, or its slide end,
     * and waits for the others to agree on the spot; or it stopped hearing from the machine that
     * owns it. Carrying the movement on would be inventing a path its player never took.
     */
    private isHeroEffectMovementBlocked = () => {
        if (!this.isHeroEffectActive) {
            return false
        }

        return (
            this.isHeroEffectFrozen ||
            this.isHeroHandBackPending ||
            this.isHeroEffectStoppedForContact() ||
            this.isAsyncOwnerSilent()
        )
    }

    /**
     * Stops the effect where its own machine sees a contact that kills it for sure, until that contact
     * comes back from the network: the hero dies where it touched, under the killing effect shown there,
     * rather than a round of the network further. Released by that contact if it did not kill after all
     * (see releaseHeroEffectContactStop), and after CONTACT_STOP_TIMEOUT whatever happens.
     */
    stopHeroEffectForContact = () => {
        if (this.isAsyncControlledHere()) {
            this.contactStopTime = os.clock()
        }
    }

    releaseHeroEffectContactStop = () => {
        this.contactStopTime = undefined
    }

    private isHeroEffectStoppedForContact = () =>
        this.contactStopTime !== undefined && os.clock() - this.contactStopTime < CONTACT_STOP_TIMEOUT

    /** Purely local: each machine decides for itself whether it is still being told anything */
    isAsyncOwnerSilent = () =>
        this.isAsyncControlledElsewhere() && os.clock() - this.lastAsyncPacketTime > ASYNC_SILENCE_TIMEOUT

    /** This machine owns the hero and decides for it: it is the only one knowing where it is */
    isAsyncControlledHere = () => this.isHeroEffectActive && GetLocalPlayer() === this.p

    /** Another machine decides for this hero: this one only replays what it is told */
    isAsyncControlledElsewhere = () => this.isHeroEffectActive && GetLocalPlayer() !== this.p

    /**
     * The synchronized check leaves a hero sliding as an effect alone: the machine of its player
     * reads the terrain under it by itself, and every machine reads it again only where that
     * machine hands the hero back. The replay itself is let through.
     */
    shouldSkipTerrainCheck = () => this.isHeroEffectActive && !this.isApplyingAsyncTerrain

    /** Whether this machine stopped the hero where its slide ends, and waits for every machine to agree */
    isAsyncHandBackPending = () => this.isHeroHandBackPending

    /**
     * Stops the hero where its slide ends - on walkable ground, or on a death terrain that does not
     * forgive - and tells every machine to read the terrain there, this one included.
     *
     * The one moment the slide waits for the network: what follows belongs to the game (the unit
     * takes its place back, a death terrain starts its timer), so it has to happen on every machine
     * on the same turn. Standing still meanwhile, the hero is found there by the packet rather than
     * dragged back to it.
     *
     * To be called before the check changes anything: the packet carries the state the check
     * started from, which is the one every machine starts its own from.
     */
    announceAsyncHandBack = () => {
        if (!this.isAsyncControlledHere() || this.isHeroEffectFrozen || this.isHeroHandBackPending) {
            return
        }

        this.isHeroHandBackPending = true

        sendAsyncTerrainChange(this.escaperId, this.getHeroMovementState())
    }

    /**
     * Follows the static slides for a hero only this machine knows the place of: the regions the
     * engine watches only see units, and waiting for the network would carry the hero past the
     * start of a lane. Nothing is told to the others: a static slide only changes how the hero
     * moves, and the movement packets carry that.
     */
    followStaticSlidesOfAsyncHero = (x: number, y: number) => {
        if (!this.isAsyncControlledHere() || this.isHeroEffectMovementBlocked()) {
            return
        }

        const currentStaticSlide = this.staticSliding

        if (currentStaticSlide) {
            currentStaticSlide.areCoordsInExit(x, y) && currentStaticSlide.releaseHero(this)

            return
        }

        const staticSlide = getUdgLevels().getCurrentLevel(this).staticSlides.findEntryAtCoords(x, y)

        // entered, as the region of the engine sees it: a hero that started to slide while already
        // standing in that area is not taken along there either
        if (staticSlide && !staticSlide.areCoordsInEntry(this.heroPos.x, this.heroPos.y)) {
            staticSlide.takeHero(this)
        }
    }

    /**
     * Tells every machine something to show or to call about the hero, from its own machine only.
     * The god mode effects are paced: the check that sees them runs fifty times a second.
     */
    announceAsyncHeroEvent = (
        event: number,
        x: number,
        y: number,
        terrainType?: TerrainType,
        lastTerrainType?: TerrainType
    ) => {
        if (!this.isAsyncControlledHere()) {
            return
        }

        if (event !== ASYNC_HERO_EVENT.terrainChanged) {
            const now = os.clock()

            if (now - (this.lastAsyncHeroEventTimes[event] ?? -1) < ASYNC_HERO_EVENT_MIN_INTERVAL) {
                return
            }

            this.lastAsyncHeroEventTimes[event] = now
        }

        sendAsyncHeroEvent(
            this.escaperId,
            event,
            x,
            y,
            terrainType?.getTerrainTypeId() ?? 0,
            lastTerrainType?.getTerrainTypeId() ?? 0
        )
    }

    /** What its own machine told about the hero, shown or called on every machine on the same turn */
    applyAsyncHeroEvent = (event: number, x: number, y: number, terrainTypeId: number, lastTerrainTypeId: number) => {
        if (event === ASYNC_HERO_EVENT.terrainChanged) {
            const terrainType = getUdgTerrainTypes().getByTerrainTypeId(terrainTypeId)

            if (!terrainType) {
                return
            }

            const lastTerrainType = getUdgTerrainTypes().getByTerrainTypeId(lastTerrainTypeId) ?? undefined

            for (const hook of hooks.hooks_onHeroTerrainChange.getHooks()) {
                hook.execute3(this, terrainType, lastTerrainType)
            }

            return
        }

        const effectPath =
            event === ASYNC_HERO_EVENT.godModeTouchedDeathTerrain
                ? Constants.GM_TOUCH_DEATH_TERRAIN_EFFECT_STR
                : Constants.GM_KILLING_EFFECT

        EffectUtils.destroyEffect(EffectUtils.addSpecialEffect(effectPath, x, y))
    }

    /**
     * The machine owning the hero stopped it where its slide ends: every machine puts it there and
     * runs its own check, from the very state that machine had. Same position, same map, same
     * state, so same conclusions: back on walkable ground, or caught by a death terrain.
     */
    applyAsyncTerrainChange = (sequence: number, movement: HeroMovementState) => {
        if (sequence <= this.lastAsyncSequence || !this.isHeroEffectActive) {
            return
        }

        this.lastAsyncSequence = sequence
        this.lastAsyncPacketTime = os.clock()
        this.applyHeroMovementState(movement)
        this.updateHeroEffect()

        this.isApplyingAsyncTerrain = true
        CheckTerrainTrigger.CheckTerrainActions(this.escaperId)
        this.isApplyingAsyncTerrain = false

        // whatever the check concluded, the hero waits no more
        this.isHeroHandBackPending = false
    }

    /**
     * Hands the hero over to its effect, or takes it back.
     *
     * While the effect stands in, the unit is made transparent and only moves
     * from the packets, to where every machine agrees the hero is (see moveHeroUnitToSyncedPos):
     * never from the slide of this machine, because in async mode that position comes from a
     * cursor only this machine knows, and moving a synchronized unit with a local value is what
     * gets a player kicked. It still answers the orders of its player, which is what keeps the
     * illusion of controlling it.
     *
     * The effect only takes over while sliding: back on walkable ground, or dead, the unit is put
     * back where the effect had brought it and takes its part again.
     */
    setHeroAsEffect = (isEffect: boolean) => {
        if (!this.hero || isEffect === this.isHeroEffectActive) {
            return
        }

        if (isEffect) {
            // the unit knows where it is for the last time here
            this.heroPos.x = this.getHeroX()
            this.heroPos.y = this.getHeroY()
            this.heroPos.facing = this.getHeroFacing()
            this.heroPos.flyHeight = this.getHeroFlyHeight()

            // made on every machine as it starts: its own machine shows one the moment it is killed
            prepareKillingEffects(this.escaperId)

            // every machine agrees on it until the first packet
            this.syncedHeroPos.x = this.heroPos.x
            this.syncedHeroPos.y = this.heroPos.y
            this.syncedHeroPos.facing = this.heroPos.facing
            this.syncedHeroPos.flyHeight = this.heroPos.flyHeight
            this.syncedHeroPos.remainingDegrees = this.getRemainingDegreesToTurn()
            this.syncedHeroPos.turnPerPeriod = this.getSlideCurrentTurnPerPeriod()
            this.syncedHeroPos.slideSpeed = this.slideSpeed
            this.syncedHeroPos.rotationSpeed = this.rotationSpeed
            this.syncedHeroPos.slideInertia = this.slideInertia
            this.syncedHeroPos.staticSlideId = this.staticSliding?.id ?? -1
            this.syncedHeroPos.ticksWithoutPacket = 0

            this.isHeroEffectActive = true

            // Started again rather than resumed: a periodic timer paused then resumed does not keep
            // running, and the unit would only move when a packet comes.
            this.syncedUnitTimer?.start(SYNCED_UNIT_PERIOD, true, this.advanceSyncedHeroUnitSafely)
            this.lastAsyncPacketTime = os.clock()

            // The unit stays on the map and follows the effect from the packets, unseen: transparent,
            // without team glow (see updateUnitVertexColor), and without the shadow that would trail
            // behind the effect - one is drawn under the effect instead (see createFakeShadow).
            if (!this.isUnitShadowRemovedHere) {
                this.removeUnitShadowHere()
            }

            this.updateUnitVertexColor()

            // the meteor it carries goes from the hand of its unit to the hand of its effect
            this.refreshMeteorEffects()

            // the native lock would follow the unit, a packet behind the effect the player steers
            this.releaseLockedCameraFromUnit()
            this.updateHeroEffect()

            return
        }

        this.leaveHeroEffectMode()

        // The unit takes back the place every machine agrees the effect had led it to. The packet that
        // ends a slide sets that place on all of them; a hand back no packet brings - a change of
        // -autoTurn mode, a level restart - leaves the unit where the packets had carried it. Never
        // heroPos: that is where this machine sees the effect, turned by a cursor its owner alone
        // knows, and a unit given its facing or its place from it stands differently on each machine.
        SetUnitX(this.hero, this.syncedHeroPos.x)
        SetUnitY(this.hero, this.syncedHeroPos.y)
        BlzSetUnitFacingEx(this.hero, this.syncedHeroPos.facing)
        SetUnitFlyHeight(this.hero, this.syncedHeroPos.flyHeight, 0)

        // The unit is back where it belongs, the native lock can hold it again. Done by hand rather
        // than through resetCamera, which starts or stops the camera spin: this runs on the machine
        // of whoever locks their camera on the hero only, and a timer made or destroyed on one
        // machine alone desyncs the game.
        const viewer = getUdgEscapers().get(GetPlayerId(GetLocalPlayer()!))

        if (viewer?.lockCamTarget === this) {
            SetCameraTargetControllerNoZForPlayer(viewer.getPlayer(), this.hero, 0, 0, false)
        }
    }

    /**
     * Everything the effect mode leaves behind, the unit aside: for a hero whose unit takes its place
     * back, and for one about to be removed, which has no place to take back.
     */
    private leaveHeroEffectMode = () => {
        if (!this.isHeroEffectActive) {
            return
        }

        this.isHeroEffectActive = false
        this.syncedUnitTimer?.pause()

        // nothing is waiting for an answer any more
        this.isHeroEffectFrozen = false
        this.isHeroHandBackPending = false
        this.contactStopTime = undefined
        forgetAwaitedKillingContacts(this.escaperId)

        // Set by the steering of its own machine alone while it slid: every machine forgets it, or the
        // next reversal of the unit would turn it towards an angle only one of them remembers.
        this.slideLastAngleOrder = -1

        // a killing effect shown for a death that did not happen as an effect goes back under the ground
        forgetKillingEffects(this.escaperId)

        // taken along by a static slide of this machine alone, if this one owns the hero: the
        // others never heard of that ride
        this.staticSliding?.forgetHero(this)

        this.parkHeroEffect()

        // seen again
        this.updateUnitVertexColor()
        this.updateFakeShadow()
        this.refreshMeteorEffects()
    }

    /**
     * Whether the hero is standing on the ground. Asked of the hero rather than of its unit: while
     * an effect stands in, that unit only gets its fly height from the packets, a packet late.
     */
    isHeroOnGround = () => this.getHeroFlyHeight() < 1

    /**
     * Plays a sound where the hero is seen. Its unit only follows the packets while an effect
     * stands in for it, and a 3D sound attached to that unit would trail behind the hero.
     */
    runSoundOnHero = (path: string, duration: number) => {
        if (this.isHeroEffectActive) {
            RunSoundAtPoint(path, duration, this.getHeroX(), this.getHeroY(), this.getHeroZ())
            return
        }

        this.hero && RunSoundOnUnit(path, duration, this.hero)
    }

    /** Detaches the camera from the unit, without moving it: the effect takes over from here */
    private releaseLockedCameraFromUnit = () => {
        const viewer = getUdgEscapers().get(GetPlayerId(GetLocalPlayer()!))

        if (viewer?.lockCamTarget !== this) {
            return
        }

        // Letting go of the unit takes the whole camera back to what Warcraft III likes, so the
        // distance MEC keeps has to be given back - exactly as resetCamera() does at the other end
        // of the slide, when the unit takes its part again.
        ResetToGameCameraForPlayer(GetLocalPlayer()!, 0)
        SetCameraFieldForPlayer(GetLocalPlayer()!, CAMERA_FIELD_TARGET_DISTANCE, viewer.getCameraField(), 0)

        SetCameraPosition(this.heroPos.x, this.heroPos.y)
    }

    /** Draws the effect where the hero is. The unit is left to the packets (see moveHeroUnitToSyncedPos) */
    updateHeroEffect = () => {
        if (!this.heroEffect || !this.hero || !this.isHeroEffectActive) {
            return
        }

        BlzSetSpecialEffectPosition(this.heroEffect, this.heroPos.x, this.heroPos.y, this.getHeroZ())
        BlzSetSpecialEffectYaw(this.heroEffect, Deg2Rad(this.heroPos.facing))

        // at the very moment the effect moves, or they would trail behind it
        this.updateFakeShadow()
        this.updateMeteorHandEffect()
        this.updateLockedCamera()
    }

    /**
     * A camera locked on the hero follows its unit, which only moves a packet behind the effect, so
     * it has to be carried by hand. Done here rather than on a timer of its own, so that the camera
     * moves at the very moment the effect does, which is what keeps it smooth.
     */
    private updateLockedCamera = () => {
        const viewer = getUdgEscapers().get(GetPlayerId(GetLocalPlayer()!))

        if (viewer?.lockCamTarget !== this) {
            return
        }

        SetCameraPosition(this.heroPos.x, this.heroPos.y)
    }

    updateUnitVertexColor = () => {
        if (this.hero) {
            const otherTransparency =
                getUdgEscapers().get(GetPlayerId(GetLocalPlayer()))?.othersTransparencyState[this.escaperId] || null

            const viewer = getUdgEscapers().get(GetPlayerId(GetLocalPlayer()))
            const shadow = viewer?.shadowState[this.escaperId]

            // before the look below is set, which a switch of skin could undo
            if (shadow === false) {
                this.removeUnitShadowHere()
            }

            SetUnitVertexColorBJ(
                this.hero,
                this.vcRed,
                this.vcGreen,
                this.vcBlue,
                // unseen while its effect stands in for it, or barely, for its own player if they want it
                // (see setLuckyLukeTransparency)
                this.isHeroEffectActive
                    ? viewer === this
                        ? (this.getLuckyLukeTransparency() ?? 100)
                        : 100
                    : GetLocalPlayer() === this.getPlayer() || otherTransparency === null || this.isEscaperSecondary()
                      ? this.vcTransparency
                      : otherTransparency
            )

            SetUnitVertexColorBJ(
                this.powerCircle,
                this.vcRed,
                this.vcGreen,
                this.vcBlue,
                GetLocalPlayer() === this.getPlayer() || otherTransparency === null || this.isEscaperSecondary()
                    ? this.vcTransparency
                    : otherTransparency
            )

            // Changing base color with -red will break the teamglow. Thats why we need to reapply it
            BlzShowUnitTeamGlow(this.hero, true)
            BlzShowUnitTeamGlow(this.hero, this.glow && !this.isHeroEffectActive)
            BlzShowUnitTeamGlow(this.powerCircle, true)
            BlzShowUnitTeamGlow(this.powerCircle, this.glow)
        }
    }

    enableClickWhereYouAre = (b: boolean) => {
        if (this.tClickWhereYouAre) {
            this.tClickWhereYouAre.destroy()
            this.tClickWhereYouAre = null
        }

        if (b && this.hero) {
            const x = this.getHeroX()
            const y = this.getHeroY()

            const clickWhereYouAre_Action = () => {
                this.hero && this.isSliding() && IssuePointOrder(this.hero, 'smart', x, y)
            }

            this.tClickWhereYouAre = createTimer(0.1, true, clickWhereYouAre_Action)
            clickWhereYouAre_Action()
        }
    }

    enableInterface = (b: boolean, showMinimap: boolean) => {
        let mode: string
        if (b) {
            mode = 'on'
        } else if (showMinimap) {
            mode = 'map'
        } else {
            mode = 'off'
        }

        if (this.uiMode == mode) {
            return false
        }

        if (GetLocalPlayer() == this.p) {
            if (!b) {
                DisableInterface(showMinimap)
            } else {
                EnableInterface()
            }
        }

        this.uiMode = mode

        return true
    }

    getKeyboardShortcutsArray = () => {
        return this.keyboardShortcutsArray
    }

    // Prevent clicks
    createCantClickTrigger = () => {
        return createEvent({
            events: [
                t => TriggerRegisterAnyUnitEventBJ(t, EVENT_PLAYER_UNIT_ISSUED_POINT_ORDER),
                t => TriggerRegisterAnyUnitEventBJ(t, EVENT_PLAYER_UNIT_ISSUED_TARGET_ORDER),
            ],
            actions: [
                () => {
                    if (this.getHero() === Natives.UGetTriggerUnit() && !this.canClick) {
                        if (IsIssuedOrder('smart')) {
                            StopUnit(Natives.UGetTriggerUnit())
                        }
                    }
                },
            ],
        })
    }

    setCanClick = (canClick: boolean) => {
        this.canClick = canClick

        if (canClick) {
            DisableTrigger(this.cantClickTrigger)
        } else {
            EnableTrigger(this.cantClickTrigger)
        }
    }

    getSkin = () => this.skin

    setSkin = (skin: number | undefined) => {
        this.skin = skin
    }

    getScale = () => this.scale

    setScale = (scale: number | undefined) => {
        this.scale = scale
        this.refreshHeroEffectScale() // the effect standing in for the hero grows with it
    }

    setGlow = (glow: boolean) => {
        this.glow = glow
        this.updateUnitVertexColor()
    }

    addLives(numLives: number) {
        ServiceManager.getService('Lives').add(numLives)

        Text.ForAll_timed_withColorCode(
            3,
            SUCCESS_TEXT_COLORCODE,
            `${GetPlayerName(this.getPlayer())} has earned ${numLives} ${numLives > 1 ? 'lives' : 'life'} for the team!`
        )
    }

    setHeroCollisionSize = (collisionSize: number) => {
        GetInvisUnitTypeFromCollisionSize(collisionSize) // throws if collision size is invalid
        this.collisionSize = collisionSize
        this.refreshInvisUnit()
        this.refreshCollisionLandmark()
    }

    /**
     * The invisible unit is what the immolation of the monsters burns when the hero touches them. MEC
     * finds its contacts itself now (see ContactCheck), so it only exists while the immolation is
     * turned on again (see setImmolationSystemEnabled): otherwise it is one more unit to move and to
     * hide for nothing.
     */
    refreshInvisUnit = () => {
        if (!this.hero) {
            return
        }

        if (this.invisUnit) {
            RemoveUnit(this.invisUnit)
            delete this.invisUnit
        }

        if (!isImmolationSystemEnabled()) {
            return
        }

        const invisUnitUnitTypeId = GetInvisUnitTypeFromCollisionSize(this.collisionSize)

        // The invisible unit tells when the hero touches a monster, through the immolation of the
        // monsters, which an effect cannot trigger: it stays on the unit, and the effect will need
        // a contact check computed by hand.
        this.invisUnit = Natives.UCreateUnit(
            Constants.PLAYER_INVIS_UNIT,
            invisUnitUnitTypeId,
            GetUnitX(this.hero),
            GetUnitY(this.hero),
            0
        )
        SetUnitPathing(this.invisUnit, false)
        SetUnitUserData(this.invisUnit, GetPlayerId(this.p))
        TriggerRegisterUnitEvent(
            ServiceManager.getService('InvisUnit_is_getting_damage').Trig_InvisUnit_is_getting_damage
                .gg_trg_InvisUnit_is_getting_damage,
            this.invisUnit,
            EVENT_UNIT_DAMAGED
        )

        // a dead hero touches nothing, as it is hidden at the death of the hero
        if (!this.isAlive()) {
            ShowUnit(this.invisUnit, false)
        }
    }

    /**
     * Display or not collision landmark for all players according to their choice, and resize it according to collision size
     */
    refreshCollisionLandmark = () => {
        const localEscaper = getUdgEscapers().get(GetPlayerId(Natives.UGetLocalPlayer()))
        const displayCollisionLandmark = localEscaper?.displayCollisionLandmarks ?? false

        if (this.collisionLandmarkEffect) {
            BlzSetSpecialEffectScale(this.collisionLandmarkEffect, 0) // hide it because an effect doesn't visually instanstly disappear on destroy
            DestroyEffect(this.collisionLandmarkEffect)
            delete this.collisionLandmarkEffect
        }

        if (this.hero) {
            this.collisionLandmarkEffect = AddSpecialEffect(
                Constants.COLLISION_LANDMARK_MODEL,
                this.getHeroX(),
                this.getHeroY()
            )
            if (!this.collisionLandmarkEffect) {
                throw new Error("Couldn't create collision landmark effect")
            }
            const scale = this.collisionSize / Constants.COLLISION_LANDMARK_MODEL_BASE_RADIUS
            BlzSetSpecialEffectScale(this.collisionLandmarkEffect, scale)

            if (!displayCollisionLandmark) {
                BlzSetSpecialEffectAlpha(this.collisionLandmarkEffect, 0)
            }
        }
    }

    moveCollisionLandmark = () => {
        if (this.collisionLandmarkEffect && this.hero) {
            const z =
                GetUnitZEx(this.hero) -
                (Constants.COLLISION_LANDMARK_MODEL_BASE_HEIGHT * this.collisionSize) /
                    Constants.COLLISION_LANDMARK_MODEL_BASE_RADIUS
            BlzSetSpecialEffectPosition(this.collisionLandmarkEffect, this.getHeroX(), this.getHeroY(), z)
        }
    }

    getDisplayCollisionLandmarks = () => {
        return this.displayCollisionLandmarks
    }

    setDisplayCollisionLandmarks = (flag: boolean) => {
        this.displayCollisionLandmarks = flag

        getUdgEscapers().forMainEscapers(escaper => {
            escaper.refreshCollisionLandmark()
        })
        for (const [_, monster] of pairs(udg_monsters)) {
            monster.refreshCollisionLandmark()
        }

        refreshTrigMoveCollisionLandmarks()
    }

    toJson = () => ({
        //useless but mandatory due to BaseArray implementation
    })
}
