import { ServiceManager } from 'Services'
import { Constants } from 'core/01_libraries/Constants'
import { Text } from 'core/01_libraries/Text'
import { gg_trg_apparition_dialogue_et_fermeture_automatique } from 'core/08_GAME/Mode_coop/creation_dialogue'
import { getUdgCasterTypes, getUdgEscapers, getUdgMonsterTypes, getUdgTerrainTypes, globals } from '../../../../globals'
import { udg_colorCode } from '../../01_libraries/Init_colorCodes'
import { BaseArray } from '../BaseArray'
import { Caster } from '../Caster/Caster'
import type { CasterType } from '../Caster/CasterType'
import { Escaper } from '../Escaper/Escaper'
import type { MeteorArray } from '../Meteor/MeteorArray'
import { Monster } from '../Monster/Monster'
import type { MonsterArray } from '../Monster/MonsterArray'
import { MonsterMultiplePatrols } from '../Monster/MonsterMultiplePatrols'
import { MonsterNoMove } from '../Monster/MonsterNoMove'
import { createMonsterSmartPatrol } from '../Monster/MonsterSimplePatrol'
import { MonsterTeleport } from '../Monster/MonsterTeleport'
import type { MonsterType } from '../Monster/MonsterType'
import type { MonsterSpawnArray } from '../MonsterSpawn/MonsterSpawnArray'
import type { ClearMobArray } from '../Monster_properties/ClearMobArray'
import { isDeathTerrain } from '../TerrainType/TerrainType'
import { Level } from './Level'
import { sameLevelProgression } from './LevelProgression'
import { IsLevelBeingMade } from './Level_functions'
import type { VisibilityModifierArray } from './VisibilityModifierArray'
import { Natives } from '../../wc3_natives_unsecured/Natives'
import { GetRandomAngle, StopUnit } from '../../01_libraries/Basic_functions'
import { errorHandler } from '../../../Utils/mapUtils'

const MIN_TIME_BETWEEN_GOTNL = 0.05

type ILevelProgression = 'all' | 'allied' | 'solo'

export class LevelArray extends BaseArray<Level> {
    private currentLevel: number
    private tLastGoToNextLevel?: timer

    private noobEdit = false
    private speedEdit = false

    private modeState: {
        noobEdit: {
            active: boolean
            lives: number
            autoreviveDelay: number | undefined
            terrains: { [label: string]: { timeToKill: number } }
        }
        speedEdit: { active: boolean }
    } = {
        noobEdit: { active: false, lives: 0, autoreviveDelay: undefined, terrains: {} },
        speedEdit: { active: false },
    }

    private levelProgression: ILevelProgression = 'all'

    levelProgressionState: { [escaperId: number]: number } = {}

    constructor() {
        super(true)
        let x1 = GetRectMinX(gg_rct_departLvl_0)
        let y1 = GetRectMinY(gg_rct_departLvl_0)
        let x2 = GetRectMaxX(gg_rct_departLvl_0)
        let y2 = GetRectMaxY(gg_rct_departLvl_0)

        this.data[0] = new Level()
        this.data[0].id = 0
        this.data[0].newStart(x1, y1, x2, y2)
        this.data[0].setNbLivesEarned(Constants.NB_LIVES_AT_BEGINNING)
        this.lastInstanceId++

        ServiceManager.getService('Lives').initLives()

        this.currentLevel = 0

        for (let i = 0; i < Constants.NB_PLAYERS_MAX; i++) {
            this.levelProgressionState[i] = 0
        }
    }

    hasPlayersInLevel = (lvlId: number) => {
        let j = 0

        for (let i = 0; i < Constants.NB_PLAYERS_MAX; i++) {
            const p = Natives.UPlayer(i)

            if (
                this.levelProgressionState[i] === lvlId &&
                GetPlayerController(p) === MAP_CONTROL_USER &&
                GetPlayerSlotState(p) === PLAYER_SLOT_STATE_PLAYING
            ) {
                j++
            }
        }

        return j > 0
    }

    refreshCurrentLevel = () => {
        this.data[this.currentLevel].activate(false)
        this.data[this.currentLevel].activate(true)
    }

    reloadAllLevels = () => {
        let numberOfActivatedLevels = 0

        // For some reason if you start the game the very first level isn't always marked as activated, could also just be the mec dev version though.
        for (const [_, level] of pairs(this.getAll())) {
            if (level.isActivated()) {
                numberOfActivatedLevels++
            }
        }

        let first = true

        for (const [_, level] of pairs(this.getAll())) {
            if (level.isActivated() || (first && numberOfActivatedLevels === 0)) {
                level.activate(false)
                level.activate(true)
            }

            first = false
        }
    }

    deactivateEmptyLevels = () => {
        for (const [levelId] of pairs(this.data)) {
            const hasPlayersInLevel = this.hasPlayersInLevel(levelId)

            if (!IsLevelBeingMade(this.data[levelId]) && !hasPlayersInLevel) {
                this.data[levelId].activate(false)
            }

            if (hasPlayersInLevel && !this.data[levelId].isActivated()) {
                this.data[levelId].activate(true)
            }
        }
    }

    goToLevel = (escaper: Escaper | undefined, finished: boolean, levelId: number): boolean => {
        let i: number
        let previousLevelId = this.getCurrentLevel(escaper)?.id || -1

        if (levelId < 0 || levelId > this.lastInstanceId || levelId === this.currentLevel) {
            return false
        }

        this.currentLevel = levelId

        for (let i = 0; i < Constants.NB_PLAYERS_MAX; i++) {
            if (!escaper || (getUdgEscapers().get(i) && sameLevelProgression(escaper, getUdgEscapers().get(i)!))) {
                this.levelProgressionState[i] = levelId
            }
        }

        this.refreshVisibilities()

        if (
            previousLevelId > -1 &&
            !IsLevelBeingMade(this.data[previousLevelId]) &&
            !this.hasPlayersInLevel(previousLevelId)
        ) {
            getUdgEscapers().destroyMakesIfForSpecificLevel_currentLevel()
            this.data[previousLevelId].activate(false)
            this.deactivateEmptyLevels()
        }

        this.data[this.currentLevel].activate(true)
        this.data[this.currentLevel].checkpointReviveHeroes(escaper, finished)

        // Revive already moves camera
        // this.moveCamToStart(this.data[levelId], finisher)

        return true
    }

    goToNextLevel = (escaper: Escaper, finished?: boolean): boolean => {
        if (this.getCurrentLevel(escaper).id >= this.lastInstanceId) {
            return false
        }

        //check a goToNextLevel wasn't just made
        if (this.tLastGoToNextLevel && TimerGetElapsed(this.tLastGoToNextLevel) < MIN_TIME_BETWEEN_GOTNL) {
            return false
        }

        if (!this.tLastGoToNextLevel) this.tLastGoToNextLevel = CreateTimer()
        TimerStart(this.tLastGoToNextLevel, 10, false, DoNothing)

        this.currentLevel = this.getCurrentLevel(escaper).id + 1

        for (let i = 0; i < Constants.NB_PLAYERS_MAX; i++) {
            if (getUdgEscapers().get(i) && sameLevelProgression(escaper, getUdgEscapers().get(i)!)) {
                this.levelProgressionState[i] = this.currentLevel
            }
        }

        this.refreshVisibilities()

        if (!IsLevelBeingMade(this.data[this.currentLevel - 1]) && !this.hasPlayersInLevel(this.currentLevel - 1)) {
            getUdgEscapers().destroyMakesIfForSpecificLevel_currentLevel()
            this.data[this.currentLevel - 1].activate(false)
            this.deactivateEmptyLevels()
        }

        this.data[this.currentLevel].activate(true)
        this.data[this.currentLevel].checkpointReviveHeroes(escaper, finished)

        // Revive already moves camera
        // this.moveCamToStart(this.data[this.currentLevel], escaper)

        if (finished) {
            Text.A(udg_colorCode[escaper.getColorId()] + 'Good job ' + escaper.getDisplayName() + ' !')
            ServiceManager.getService('Multiboard').onPlayerLevelCompleted(escaper)
        }

        return true
    }

    tpToEndOfLevel(escaper: Escaper) {
        if (!escaper.isAlive()) {
            return
        }

        const end = this.getCurrentLevel(escaper).getEnd()

        if (end) {
            const x = end.getCenterX()
            const y = end.getCenterY()
            let facingAngle = GetRandomAngle()

            // Determine the angle towards the next level start
            const nextLevel = this.data[this.getCurrentLevel(escaper).id + 1]
            if (!!nextLevel) {
                const xNextStart = nextLevel.getStart()?.getCenterX() ?? 0
                const yNextStart = nextLevel.getStart()?.getCenterY() ?? 0
                facingAngle = Math.atan2(yNextStart - y, xNextStart - x) * (180 / Math.PI)
            }

            // Move the hero
            escaper.turnInstantly(facingAngle)
            escaper.moveHero(x, y, true)
            const hero = escaper.getHero()
            hero && StopUnit(hero)

            // Move the camera
            SetCameraPositionForPlayer(escaper.getPlayer(), x, y)
        }
    }

    /**
     * Applies the visibilities of the current level, recursively activating all previous levels' visibilities as well.
     */
    refreshVisibilities = () => {
        const highestLevelBeingPlayedOrMade = this.getHighestLevelBeingPlayedOrMade()

        let blackMaskActivated = false
        this.forAllReversed((level: Level, levelId: number) => {
            if (IsLevelBeingMade(level) || this.hasPlayersInLevel(levelId)) {
                level.activateVisibilities(true)
                blackMaskActivated = level.getResetVisiblitiesAtStart()
            } else if (levelId > highestLevelBeingPlayedOrMade.id || blackMaskActivated) {
                level.activateVisibilities(false)
            } else if (levelId <= highestLevelBeingPlayedOrMade.id) {
                level.activateVisibilities(true)
                if (level.getResetVisiblitiesAtStart()) {
                    blackMaskActivated = true
                }
            }
        })
    }

    getHighestLevelBeingPlayedOrMade = () => {
        let highestLevelId = -1

        for (let levelId = 0; levelId <= this.lastInstanceId; levelId++) {
            const level = this.data[levelId]

            if (IsLevelBeingMade(level) || this.hasPlayersInLevel(levelId)) {
                highestLevelId = levelId
            }
        }

        return highestLevelId === -1 ? this.data[0] : this.data[highestLevelId]
    }

    // moveCamToStart(level: Level, finisher: Escaper | undefined) {
    //     const start = level.getStart()

    //     if (start) {
    //         const xCam = start.getCenterX()
    //         const yCam = start.getCenterY()

    //         if (finisher) {
    //             let x = xCam
    //             let y = yCam

    //             if (GetLocalPlayer() === finisher.getPlayer()) {
    //                 x = GetCameraTargetPositionX()
    //                 y = GetCameraTargetPositionY()
    //             }

    //             for (const [_, escaper] of pairs(getUdgEscapers().getAll())) {
    //                 if (!finisher || sameLevelProgression(finisher, escaper)) {
    //                     SetCameraPositionForPlayer(escaper.getPlayer(), x, y)
    //                 }
    //             }
    //         } else {
    //             for (const [_, escaper] of pairs(getUdgEscapers().getAll())) {
    //                 if (!finisher || sameLevelProgression(finisher, escaper)) {
    //                     SetCameraPositionForPlayer(escaper.getPlayer(), xCam, yCam)
    //                 }
    //             }
    //         }

    //         for (const [_, escaper] of pairs(getUdgEscapers().getAll())) {
    //             if (!finisher || sameLevelProgression(finisher, escaper)) {
    //                 if (escaper.isLockCamTarget()) {
    //                     escaper.resetCamera()
    //                 }
    //             }
    //         }

    //         return true
    //     } else {
    //         return false
    //     }
    // }

    restartTheGame = () => {
        if (this.currentLevel === 0) {
            this.currentLevel = -1 //to assure level changing
            this.data[0].activate(false)
        }
        this.goToLevel(undefined, false, 0)
        ServiceManager.getService('Lives').setNb(this.data[0].getNbLives())

        const start = this.data[0].getStart()
        start && SetCameraPosition(start.getCenterX(), start.getCenterY())

        for (const [_, escaper] of pairs(getUdgEscapers().getAll())) {
            if (escaper.isLockCamTarget()) {
                escaper.resetCamera()
            }
        }

        //coop
        TriggerExecute(gg_trg_apparition_dialogue_et_fermeture_automatique)
    }

    restartCurrentLevel = (escaper: Escaper) => {
        const currentLevel = this.currentLevel

        this.currentLevel = -1 //to assure level changing
        this.data[currentLevel].activate(false)

        this.goToLevel(escaper, false, currentLevel)
        ServiceManager.getService('Lives').setNb(this.data[currentLevel].getNbLives())

        const start = this.data[currentLevel].getStart()
        start && SetCameraPosition(start.getCenterX(), start.getCenterY())

        for (const [_, escaper] of pairs(getUdgEscapers().getAll())) {
            if (escaper.isLockCamTarget()) {
                escaper.resetCamera()
            }
        }
    }

    new = () => {
        const lvl = new Level()
        const id = this._new(lvl)
        lvl.id = id
        return lvl
    }

    newFromJson = (levelsJson: { [x: string]: any }[], preventDestroyLastLevel = false, forceNewIds = false) => {
        if (levelsJson.length > 0 && !preventDestroyLastLevel) {
            this.destroyLastLevel(true)
        }

        for (let levelJson of levelsJson) {
            const level = this.new()

            //start message
            if (levelJson.startMessage) {
                level.setStartMessage(levelJson.startMessage)
            }

            //nb lives earned
            if (levelJson.nbLives) {
                level.setNbLivesEarned(levelJson.nbLives)
            }

            //start
            if (levelJson.start) {
                level.newStartFromJson(levelJson.start)
            } else if (levelJson.id == 0) {
                const x1 = GetRectMinX(gg_rct_departLvl_0)
                const y1 = GetRectMinY(gg_rct_departLvl_0)
                const x2 = GetRectMaxX(gg_rct_departLvl_0)
                const y2 = GetRectMaxY(gg_rct_departLvl_0)
                level.newStart(x1, y1, x2, y2)
            }

            //end
            if (levelJson.end) {
                level.newEndFromJson(levelJson.end)
            }

            //tp for end
            if (levelJson.tpForEnd) {
                level.newTpForEndFromJson(levelJson.tpForEnd)
            }

            //visibilities
            if (levelJson.visibilities) {
                level.visibilities.newFromJson(levelJson.visibilities)
            }
            level.setResetVisiblitiesAtStart(levelJson.resetVisiblitiesAtStart ?? false)

            //monsters
            if (levelJson.monsters) {
                for (let m of levelJson.monsters) {
                    this.newFromJsonMonster(m, level, false, forceNewIds)
                }
            }

            //monster spawns
            if (levelJson.monsterSpawns) {
                errorHandler(() => level.monsterSpawns.newFromJson(levelJson.monsterSpawns))()
            }

            //meteors
            if (levelJson.meteors) {
                level.meteors.newFromJson(levelJson.meteors)
            }

            //clearMobs
            if (levelJson.clearMobs) {
                level.clearMobs.newFromJson(levelJson.clearMobs)
            }

            //portalMobs
            if (levelJson.portalMobs) {
                level.portalMobs.newFromJson(levelJson.portalMobs)
            }

            //circles
            if (levelJson.circleMobs) {
                level.circleMobs.newFromJson(levelJson.circleMobs)
            }

            //staticSlides
            if (levelJson.staticSlides) {
                level.staticSlides.newFromJson(levelJson.staticSlides)
            }

            //regions
            if (levelJson.regions) {
                level.regions.newFromJson(levelJson.regions)
            }
        }
    }

    newFromJsonMonster = (m: any, level: Level, createUnit: boolean, forceNewIds = false) => {
        let monster: Monster | null = null

        if (!m.angle) {
            m.angle = -1
        }

        // Generate new ID if forceNewIds is true, otherwise use existing ID
        const monsterId = forceNewIds ? null : m.id

        if (m.monsterClassName == 'Caster') {
            const ct = getUdgCasterTypes().getByLabel(m.casterTypeLabel)

            if (!ct) {
                Text.erA(`Caster type "${m.casterTypeLabel}" unknown`)
            } else {
                monster = new Caster(ct, m.x, m.y, m.angle, monsterId)
            }
        } else {
            const mt = getUdgMonsterTypes().getByLabel(m.monsterTypeLabel)

            if (!mt) {
                Text.erA(`Monster label "${m.monsterTypeLabel}" unknown`)
            } else {
                if (m.monsterClassName == 'MonsterNoMove') {
                    monster = new MonsterNoMove(mt, m.x, m.y, m.angle, monsterId)
                } else if (m.monsterClassName == 'MonsterSimplePatrol') {
                    monster = createMonsterSmartPatrol(mt, m.x1, m.y1, m.x2, m.y2, monsterId)
                } else if (m.monsterClassName == 'MonsterMultiplePatrols') {
                    for (const [n, x] of pairs(m.xArr)) {
                        const y = m.yArr[n]
                        MonsterMultiplePatrols.storeNewLoc(x, y)
                    }
                    monster = new MonsterMultiplePatrols(mt, m.mode, monsterId)
                } else if (m.monsterClassName == 'MonsterTeleport') {
                    for (const [n, x] of pairs(m.xArr)) {
                        const y = m.yArr[n]
                        MonsterTeleport.storeNewLoc(x, y)
                    }
                    monster = new MonsterTeleport(mt, m.period, m.angle, m.mode, monsterId)
                }
            }
        }

        if (monster) {
            m.jumpPad && monster.setJumpPad(m.jumpPad)
            m.jumpPadEffect && monster.setJumpPadEffect(m.jumpPadEffect)

            if (m.attackGroundX && m.attackGroundY) {
                monster.setAttackGroundPos(m.attackGroundX, m.attackGroundY, m.attackGroundDelay || 0)
            }

            level.monsters.new(monster, createUnit)
        }

        return monster
    }

    destroyLastLevel = (forceDelete0: boolean = false): boolean => {
        const maxLevelIdToDelete = forceDelete0 ? 0 : 1
        if (this.lastInstanceId < maxLevelIdToDelete) {
            return false
        }
        this.data[this.lastInstanceId].destroy()
        delete this.data[this.lastInstanceId]
        this.lastInstanceId = this.lastInstanceId - 1
        return true
    }

    getCurrentLevel = (escaper?: Escaper): Level => {
        if (this.levelProgression === 'all' || !escaper) {
            return this.data[this.currentLevel]
        } else {
            return this.data[this.levelProgressionState[escaper.getId()]]
        }
    }

    getLevelFromMonsterArray = (ma: MonsterArray) => {
        return ma.getLevel()
    }

    getLevelFromMonsterSpawnArray = (msa: MonsterSpawnArray) => {
        let i = 0
        while (true) {
            if (i > this.lastInstanceId || this.data[i].monsterSpawns == msa) break
            i = i + 1
        }
        if (i > this.lastInstanceId) {
            return null
        }
        return this.data[i]
    }

    getLevelFromMeteorArray = (ma: MeteorArray) => {
        let i = 0
        while (true) {
            if (i > this.lastInstanceId || this.data[i].meteors == ma) break
            i = i + 1
        }
        if (i > this.lastInstanceId) {
            return null
        }
        return this.data[i]
    }

    getLevelFromVisibilityModifierArray = (vma: VisibilityModifierArray) => {
        let i = 0
        while (true) {
            if (i > this.lastInstanceId || this.data[i].visibilities == vma) break
            i = i + 1
        }
        if (i > this.lastInstanceId) {
            return null
        }
        return this.data[i]
    }

    getLevelFromClearMobArray = (clearMobArray: ClearMobArray) => {
        let i = 0
        while (true) {
            if (i > this.lastInstanceId || this.data[i].clearMobs == clearMobArray) break
            i = i + 1
        }
        if (i > this.lastInstanceId) {
            return null
        }
        return this.data[i]
    }

    clearMonstersOfType = (mt: MonsterType) => {
        let i = 0
        while (i <= this.lastInstanceId) {
            this.data[i].clearMonstersOfType(mt)
            i = i + 1
        }
    }

    removeCastersOfType = (ct: CasterType) => {
        for (let i = 0; i <= this.lastInstanceId; i++) {
            this.data[i].removeCastersOfType(ct)
        }
    }

    getLastLevelId = (): number => {
        return this.lastInstanceId
    }

    getNbMonsters = (mode: string): number => {
        //modes : all, moving, not moving
        let nb = 0
        let i = 0
        while (true) {
            if (i > this.lastInstanceId) break
            nb = nb + this.data[i].getNbMonsters(mode)
            i = i + 1
        }
        return nb
    }

    isNoobEdit = () => this.noobEdit
    setIsNoobEdit = (isNoobEdit: boolean) => {
        if (this.modeState.noobEdit.active === isNoobEdit) {
            return
        }

        this.modeState.noobEdit.active = isNoobEdit

        if (isNoobEdit) {
            this.modeState.noobEdit.lives = ServiceManager.getService('Lives').get()
            this.modeState.noobEdit.autoreviveDelay = globals.autoreviveDelay

            ServiceManager.getService('Lives').setNb(9999)
            globals.autoreviveDelay = 0.3

            for (let i = 0; i < Constants.NB_ESCAPERS; i++) {
                getUdgEscapers().get(i)?.setHasAutorevive(true)
            }

            for (const [_, terrain] of pairs(getUdgTerrainTypes().getAll())) {
                if (isDeathTerrain(terrain)) {
                    this.modeState.noobEdit.terrains[terrain.label] = { timeToKill: terrain.getTimeToKill() }
                    terrain.setTimeToKill(0.3)
                }
            }
        } else {
            ServiceManager.getService('Lives').setNb(this.modeState.noobEdit.lives)
            globals.autoreviveDelay = this.modeState.noobEdit.autoreviveDelay

            for (let i = 0; i < Constants.NB_ESCAPERS; i++) {
                getUdgEscapers().get(i)?.setHasAutorevive(false)
            }

            for (const [_, terrain] of pairs(getUdgTerrainTypes().getAll())) {
                if (isDeathTerrain(terrain)) {
                    terrain.setTimeToKill(this.modeState.noobEdit.terrains[terrain.label].timeToKill)
                }
            }
        }

        // If noobedit gets disabled we'll still show the noobedit tag on the leaderboard.
        if (!this.noobEdit) {
            this.noobEdit = true
            ServiceManager.getService('Multiboard').reinitBoards()
        }
    }

    isSpeedEdit = () => this.speedEdit
    setIsSpeedEdit = (isSpeedEdit: boolean) => {
        if (this.modeState.speedEdit.active === isSpeedEdit) {
            return
        }

        this.modeState.speedEdit.active = isSpeedEdit

        // If speedEdit gets disabled we'll still show the speedEdit tag on the leaderboard.
        if (!this.speedEdit) {
            this.speedEdit = true
            ServiceManager.getService('Multiboard').reinitBoards()
        }
    }

    getLevelProgression = () => this.levelProgression
    setLevelProgression = (levelProgression: ILevelProgression) => {
        this.levelProgression = levelProgression
        ServiceManager.getService('Multiboard').setLevelEnabled(levelProgression !== 'all')
    }
}
