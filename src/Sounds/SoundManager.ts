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

export class SoundManager {
    private static KITTY_DEATH_PATH: string = 'Units\\NightElf\\HeroMoonPriestess\\HeroMoonPriistessDeath1.wav'
    private static ROUND_1_PATH: string = 'war3mapImported\\Round01.mp3'
    private static ROUND_2_PATH: string = 'war3mapImported\\Round02.mp3'
    private static ROUND_3_PATH: string = 'war3mapImported\\Round03.mp3'
    private static ROUND_4_PATH: string = 'war3mapImported\\Round04.mp3'
    private static ROUND_5_PATH: string = 'war3mapImported\\FinalRound.mp3'
    private static SPEED_PATH: string = 'war3mapImported\\Speed.mp3'
    private static INVULNERABLE_PATH: string = 'war3mapImported\\Invulnerable.mp3'
    private static KIBBLE_TOME_PATH: string = 'war3mapImported\\Tomes.flac'
    private static LAST_MAN_STANDING_PATH: string = 'war3mapImported\\last_man_standing.mp3'
    private static FIRST_BLOOD_PATH: string = 'war3mapImported\\first_blood.mp3'

    private static KITTY_DEATH_SOUND: Sound
    private static ROUND_1_SOUND: Sound
    private static ROUND_2_SOUND: Sound
    private static ROUND_3_SOUND: Sound
    private static ROUND_4_SOUND: Sound
    private static ROUND_5_SOUND: Sound
    private static SPEED_SOUND: Sound
    private static INVULNERABLE_SOUND: Sound
    private static KIBBLE_TOME_SOUND: Sound
    private static LAST_MAN_STANDING_SOUND: Sound
    private static FIRST_BLOOD_SOUND: Sound

    private static FirstBloodSoundPlayed: boolean = false
    private static LastManStanding = Timer.create()
    private static sounds: Record<string, Sound> = {}

    public static Initialize() {
        SoundManager.sounds = {
            KittyDeathSound: Sound.create(SoundManager.KITTY_DEATH_PATH, false, true, false, 10, 10, '')!,
            Round1Sound: Sound.create(SoundManager.ROUND_1_PATH, false, false, false, 10, 10, '')!,
            Round2Sound: Sound.create(SoundManager.ROUND_2_PATH, false, false, false, 10, 10, '')!,
            Round3Sound: Sound.create(SoundManager.ROUND_3_PATH, false, false, false, 10, 10, '')!,
            Round4Sound: Sound.create(SoundManager.ROUND_4_PATH, false, false, false, 10, 10, '')!,
            Round5Sound: Sound.create(SoundManager.ROUND_5_PATH, false, false, false, 10, 10, '')!,
            SpeedSound: Sound.create(SoundManager.SPEED_PATH, false, false, false, 10, 10, '')!,
            InvulnerableSound: Sound.create(SoundManager.INVULNERABLE_PATH, false, false, false, 10, 10, '')!,
            KibbleTomeSound: Sound.create(SoundManager.KIBBLE_TOME_PATH, false, true, false, 10, 10, '')!,
            LastManStandingSound: Sound.create(SoundManager.LAST_MAN_STANDING_PATH, false, false, false, 10, 10, '')!,
            FirstBloodSound: Sound.create(SoundManager.FIRST_BLOOD_PATH, false, false, false, 10, 10, '')!,
        }
        SoundManager.SetSoundAttributes()
        SoundManager.AssignSounds()
    }

    private static AssignSounds() {
        SoundManager.KITTY_DEATH_SOUND = SoundManager.sounds['KittyDeathSound']
        SoundManager.ROUND_1_SOUND = SoundManager.sounds['Round1Sound']
        SoundManager.ROUND_2_SOUND = SoundManager.sounds['Round2Sound']
        SoundManager.ROUND_3_SOUND = SoundManager.sounds['Round3Sound']
        SoundManager.ROUND_4_SOUND = SoundManager.sounds['Round4Sound']
        SoundManager.ROUND_5_SOUND = SoundManager.sounds['Round5Sound']
        SoundManager.SPEED_SOUND = SoundManager.sounds['SpeedSound']
        SoundManager.INVULNERABLE_SOUND = SoundManager.sounds['InvulnerableSound']
        SoundManager.KIBBLE_TOME_SOUND = SoundManager.sounds['KibbleTomeSound']
        SoundManager.LAST_MAN_STANDING_SOUND = SoundManager.sounds['LastManStandingSound']
        SoundManager.FIRST_BLOOD_SOUND = SoundManager.sounds['FirstBloodSound']
    }

    private static SetSoundAttributes() {
        for (const [_, sound] of pairs(SoundManager.sounds)) {
            sound.setChannel(0)
            sound.setVolume(127)
            sound.setPitch(1.0)
        }
    }

    public static PlaySpeedSound(): void {
        PlaySoundBJ(SoundManager.SPEED_SOUND.handle)
    }

    public static PlayInvulnerableSound(): void {
        PlaySoundBJ(SoundManager.INVULNERABLE_SOUND.handle)
    }

    /// <summary>
    /// Plays the POTM death sound ontop of the passed unit.
    /// While playing team mode, only team members of the passed unit will hear the sound.
    /// </summary>
    public static PlayKittyDeathSound(k: Kitty) {
        if (CurrentGameMode.active === GameMode.TeamTournament) SoundManager.TeamKittyDeathSound(k)
        else {
            const s = SoundManager.KITTY_DEATH_SOUND
            StopSound(s.handle, false, false)
            AttachSoundToUnit(s.handle, k.Unit.handle)
            PlaySoundBJ(s.handle)
        }
    }

    public static PlayFirstBloodSound() {
        if (SoundManager.FirstBloodSoundPlayed) return
        const s = SoundManager.FIRST_BLOOD_SOUND
        StopSound(s.handle, false, false)
        PlaySoundBJ(s.handle)
        SoundManager.FirstBloodSoundPlayed = true
    }

    public static PlayKibbleTomeSound(Kitty: Unit) {
        const s = SoundManager.KIBBLE_TOME_SOUND
        StopSound(s.handle, false, false)
        AttachSoundToUnit(s.handle, Kitty.handle)
        PlaySoundBJ(s.handle)
    }

    private static TeamKittyDeathSound(k: Kitty) {
        const s = SoundManager.KITTY_DEATH_SOUND
        AttachSoundToUnit(s.handle, k.Unit.handle)
        const teamID: number = k.TeamID
        const team: Team = Globals.ALL_TEAMS.get(teamID)!
        for (let i = 0; i < team.Teammembers.length; i++) {
            const player = team.Teammembers[i]
            if (player.isLocal()) {
                StopSound(s.handle, false, false)
                PlaySoundBJ(s.handle)
            }
        }
    }

    /// <summary>
    /// Plays the round starting sound based on current round.
    /// Only rounds 1-5 are setup.
    /// </summary>
    public static PlayRoundSound() {
        const currRound = Globals.ROUND
        let sound: Sound | null = null
        switch (currRound) {
            case 1:
                sound = SoundManager.ROUND_1_SOUND
                break
            case 2:
                sound = SoundManager.ROUND_2_SOUND
                break
            case 3:
                sound = SoundManager.ROUND_3_SOUND
                break
            case 4:
                sound = SoundManager.ROUND_4_SOUND
                break
            case 5:
                sound = SoundManager.ROUND_5_SOUND
                break
            default:
                sound = null
                break
        }
        if (sound) {
            // Assuming Start() is a method to play the sound, otherwise use PlaySoundBJ(sound);
            // sound.start();
            PlaySoundBJ(sound.handle)
        }
    }

    public static PlayLastManStandingSound() {
        SoundManager.LastManStanding.start(0.8, false, SoundManager.LastManStandingActions)
    }

    private static LastManStandingActions() {
        let count = 0
        let k: Kitty | null = null

        try {
            for (let i = 0; i < Globals.ALL_KITTIES_LIST.length; i++) {
                const kitty = Globals.ALL_KITTIES_LIST[i]
                if (kitty.isAlive()) {
                    count += 1
                    k = kitty
                }
                if (count > 1) return
            }

            if (count === 0) return
            if (!k) return
            if (k.ProtectionActive) return // no reason to play if pota is active.

            const s = SoundManager.LAST_MAN_STANDING_SOUND
            const e = AddSpecialEffectTarget(
                'Abilities\\Spells\\Human\\Feedback\\FeedbackCaster.mdl',
                k.Unit.handle,
                'chest'
            )
            Utility.TimedTextToAllPlayers(1.0, `${Colors.COLOR_RED}Last man standing!${Colors.COLOR_RESET}`)
            s.stop(false, false)
            s.start()
            Utility.SimpleTimer(2.0, () => {
                GC.RemoveEffect(Effect.fromHandle(e)!) // TODO; Cleanup:                 GC.RemoveEffect(ref e);
            })
        } catch (e: any) {
            Logger.Warning(`Error in SoundManager.PlayLastManStandingSound: ${e}`)
        }
    }
}
