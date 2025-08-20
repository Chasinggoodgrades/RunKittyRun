import { Logger } from 'src/Events/Logger/Logger'
import { Kitty } from 'src/Game/Entities/Kitty/Kitty'
import { CurrentGameMode } from 'src/Gamemodes/CurrentGameMode'
import { GameMode } from 'src/Gamemodes/GameModeEnum'
import { Team } from 'src/Gamemodes/Teams/Team'
import { Globals } from 'src/Global/Globals'
import { Colors } from 'src/Utility/Colors/Colors'
import { GC } from 'src/Utility/GC'
import { Utility } from 'src/Utility/Utility'
import { Effect, Sound, Timer, Unit } from 'w3ts'

interface SoundConfig {
    path: string
    is3D: boolean
    stopWhenOutOfRange: boolean
    fadeIn: boolean
    minDist: number
    maxDist: number
}

export class SoundManager {
    // Sound configurations
    private static readonly SOUND_CONFIGS: Record<string, SoundConfig> = {
        KittyDeath: {
            path: 'Units\\NightElf\\HeroMoonPriestess\\HeroMoonPriestessDeath1.wav',
            is3D: false,
            stopWhenOutOfRange: true,
            fadeIn: false,
            minDist: 10,
            maxDist: 10,
        },
        Round1: {
            path: 'war3mapImported\\Round01.mp3',
            is3D: false,
            stopWhenOutOfRange: false,
            fadeIn: false,
            minDist: 10,
            maxDist: 10,
        },
        Round2: {
            path: 'war3mapImported\\Round02.mp3',
            is3D: false,
            stopWhenOutOfRange: false,
            fadeIn: false,
            minDist: 10,
            maxDist: 10,
        },
        Round3: {
            path: 'war3mapImported\\Round03.mp3',
            is3D: false,
            stopWhenOutOfRange: false,
            fadeIn: false,
            minDist: 10,
            maxDist: 10,
        },
        Round4: {
            path: 'war3mapImported\\Round04.mp3',
            is3D: false,
            stopWhenOutOfRange: false,
            fadeIn: false,
            minDist: 10,
            maxDist: 10,
        },
        Round5: {
            path: 'war3mapImported\\FinalRound.mp3',
            is3D: false,
            stopWhenOutOfRange: false,
            fadeIn: false,
            minDist: 10,
            maxDist: 10,
        },
        Speed: {
            path: 'war3mapImported\\Speed.mp3',
            is3D: false,
            stopWhenOutOfRange: false,
            fadeIn: false,
            minDist: 10,
            maxDist: 10,
        },
        Invulnerable: {
            path: 'war3mapImported\\Invulnerable.mp3',
            is3D: false,
            stopWhenOutOfRange: false,
            fadeIn: false,
            minDist: 10,
            maxDist: 10,
        },
        KibbleTome: {
            path: 'war3mapImported\\Tomes.flac',
            is3D: false,
            stopWhenOutOfRange: true,
            fadeIn: false,
            minDist: 10,
            maxDist: 10,
        },
        LastManStanding: {
            path: 'war3mapImported\\last_man_standing.mp3',
            is3D: false,
            stopWhenOutOfRange: false,
            fadeIn: false,
            minDist: 10,
            maxDist: 10,
        },
        FirstBlood: {
            path: 'war3mapImported\\first_blood.mp3',
            is3D: false,
            stopWhenOutOfRange: false,
            fadeIn: false,
            minDist: 10,
            maxDist: 10,
        },
    }

    // Sound instances
    private static sounds: Map<string, Sound> = new Map()
    private static roundSounds: Map<number, Sound> = new Map()

    // State tracking
    private static firstBloodPlayed: boolean = false
    private static lastManStandingTimer = Timer.create()

    public static Initialize = () => {
        try {
            SoundManager.createSounds()
            SoundManager.configureSounds()
            SoundManager.mapRoundSounds()
        } catch (e) {
            Logger.Critical(`Failed to initialize SoundManager: ${e}`)
        }
    }

    private static createSounds = () => {
        SoundManager.sounds.clear()

        for (const [name, config] of Object.entries(SoundManager.SOUND_CONFIGS)) {
            const sound = Sound.create(
                config.path,
                config.is3D,
                config.stopWhenOutOfRange,
                config.fadeIn,
                config.minDist,
                config.maxDist,
                ''
            )

            if (sound) {
                SoundManager.sounds.set(name, sound)
            } else {
                Logger.Warning(`Failed to create sound: ${name} at path: ${config.path}`)
            }
        }
    }

    private static configureSounds = () => {
        const defaultChannel = 0
        const defaultVolume = 127
        const defaultPitch = 1.0

        SoundManager.sounds.forEach(sound => {
            sound.setChannel(defaultChannel)
            sound.setVolume(defaultVolume)
            sound.setPitch(defaultPitch)
        })
    }

    private static mapRoundSounds = () => {
        SoundManager.roundSounds.clear()
        SoundManager.roundSounds.set(1, SoundManager.getSound('Round1'))
        SoundManager.roundSounds.set(2, SoundManager.getSound('Round2'))
        SoundManager.roundSounds.set(3, SoundManager.getSound('Round3'))
        SoundManager.roundSounds.set(4, SoundManager.getSound('Round4'))
        SoundManager.roundSounds.set(5, SoundManager.getSound('Round5'))
    }

    private static getSound(name: string): Sound {
        const sound = SoundManager.sounds.get(name)
        if (!sound) {
            throw new Error(`Sound not found: ${name}`)
        }
        return sound
    }

    private static playSound(sound: Sound): void {
        if (!sound) {
            Logger.Warning('Attempted to play null sound')
            return
        }
        sound.stop(false, false)
        sound.start()
    }

    private static playSoundAttachedToUnit(sound: Sound, unit: Unit): void {
        if (!sound || !unit) {
            Logger.Warning('Attempted to play sound with null sound or unit')
            return
        }

        sound.stop(false, false)
        sound.setPosition(unit.x, unit.y, unit.z)
        sound.start()
    }

    // Public API methods
    public static PlaySpeedSound(): void {
        const sound = SoundManager.getSound('Speed')
        SoundManager.playSound(sound)
    }

    public static PlayInvulnerableSound(): void {
        const sound = SoundManager.getSound('Invulnerable')
        SoundManager.playSound(sound)
    }

    /**
     * Plays the POTM death sound on top of the passed unit.
     * While playing team mode, only team members of the passed unit will hear the sound.
     */
    public static PlayKittyDeathSound(k: Kitty): void {
        if (CurrentGameMode.active === GameMode.TeamTournament) {
            SoundManager.TeamKittyDeathSound(k)
        } else {
            const sound = SoundManager.getSound('KittyDeath')
            SoundManager.playSoundAttachedToUnit(sound, k.Unit)
        }
    }

    public static PlayFirstBloodSound = () => {
        if (SoundManager.firstBloodPlayed) return

        const sound = SoundManager.getSound('FirstBlood')
        SoundManager.playSound(sound)
        SoundManager.firstBloodPlayed = true
    }

    public static PlayKibbleTomeSound(kitty: Unit): void {
        const sound = SoundManager.getSound('KibbleTome')
        SoundManager.playSoundAttachedToUnit(sound, kitty)
    }

    private static TeamKittyDeathSound(k: Kitty): void {
        const sound = SoundManager.getSound('KittyDeath')
        AttachSoundToUnit(sound.handle, k.Unit.handle)

        const teamID: number = k.TeamID
        const team: Team = Globals.ALL_TEAMS.get(teamID)!

        for (const player of team.Teammembers) {
            if (player.isLocal()) {
                SoundManager.playSound(sound)
                break // Only need to play once for local player
            }
        }
    }

    /**
     * Plays the round starting sound based on current round.
     * Only rounds 1-5 are setup.
     */
    public static PlayRoundSound = () => {
        const currRound = Globals.ROUND
        const sound = SoundManager.roundSounds.get(currRound)

        if (sound) {
            SoundManager.playSound(sound)
        } else {
            Logger.Warning(`No sound found for round ${currRound}`)
        }
    }

    public static PlayLastManStandingSound = () => {
        SoundManager.lastManStandingTimer.start(0.8, false, SoundManager.LastManStandingActions)
    }

    private static LastManStandingActions = () => {
        let count = 0
        let k: Kitty | null = null

        try {
            // Count alive kitties and get the last one
            for (const kitty of Globals.ALL_KITTIES_LIST) {
                if (kitty.isAlive()) {
                    count += 1
                    k = kitty
                }
                if (count > 1) return // More than one alive, exit early
            }

            // Validation checks
            if (count === 0 || !k || k.ProtectionActive) return

            const sound = SoundManager.getSound('LastManStanding')
            const effect = AddSpecialEffectTarget(
                'Abilities\\Spells\\Human\\Feedback\\FeedbackCaster.mdl',
                k.Unit.handle,
                'chest'
            )

            Utility.TimedTextToAllPlayers(1.0, `${Colors.COLOR_RED}Last man standing!${Colors.COLOR_RESET}`)

            sound.stop(false, false)
            sound.start()

            // Clean up effect after 2 seconds
            Utility.SimpleTimer(2.0, () => {
                GC.RemoveEffect(Effect.fromHandle(effect)!)
            })
        } catch (e) {
            Logger.Warning(`Error in SoundManager.LastManStandingActions: ${e}`)
        }
    }
}
