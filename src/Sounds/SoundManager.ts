import { Logger } from 'src/Events/Logger/Logger'
import { Kitty } from 'src/Game/Entities/Kitty/Kitty'
import { Gamemode } from 'src/Gamemodes/Gamemode'
import { GameMode } from 'src/Gamemodes/GameModeEnum'
import { Team } from 'src/Gamemodes/Teams/Team'
import { Globals } from 'src/Global/Globals'
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
        this.sounds = {
            KittyDeathSound: Sound.create(this.KITTY_DEATH_PATH, false, true, false, 10, 10, '')!,
            Round1Sound: Sound.create(this.ROUND_1_PATH, false, false, false, 10, 10, '')!,
            Round2Sound: Sound.create(this.ROUND_2_PATH, false, false, false, 10, 10, '')!,
            Round3Sound: Sound.create(this.ROUND_3_PATH, false, false, false, 10, 10, '')!,
            Round4Sound: Sound.create(this.ROUND_4_PATH, false, false, false, 10, 10, '')!,
            Round5Sound: Sound.create(this.ROUND_5_PATH, false, false, false, 10, 10, '')!,
            SpeedSound: Sound.create(this.SPEED_PATH, false, false, false, 10, 10, '')!,
            InvulnerableSound: Sound.create(this.INVULNERABLE_PATH, false, false, false, 10, 10, '')!,
            KibbleTomeSound: Sound.create(this.KIBBLE_TOME_PATH, false, true, false, 10, 10, '')!,
            LastManStandingSound: Sound.create(this.LAST_MAN_STANDING_PATH, false, false, false, 10, 10, '')!,
            FirstBloodSound: Sound.create(this.FIRST_BLOOD_PATH, false, false, false, 10, 10, '')!,
        }
        this.SetSoundAttributes()
        this.AssignSounds()
    }

    private static AssignSounds() {
        this.KITTY_DEATH_SOUND = this.sounds['KittyDeathSound']
        this.ROUND_1_SOUND = this.sounds['Round1Sound']
        this.ROUND_2_SOUND = this.sounds['Round2Sound']
        this.ROUND_3_SOUND = this.sounds['Round3Sound']
        this.ROUND_4_SOUND = this.sounds['Round4Sound']
        this.ROUND_5_SOUND = this.sounds['Round5Sound']
        this.SPEED_SOUND = this.sounds['SpeedSound']
        this.INVULNERABLE_SOUND = this.sounds['InvulnerableSound']
        this.KIBBLE_TOME_SOUND = this.sounds['KibbleTomeSound']
        this.LAST_MAN_STANDING_SOUND = this.sounds['LastManStandingSound']
        this.FIRST_BLOOD_SOUND = this.sounds['FirstBloodSound']
    }

    private static SetSoundAttributes() {
        for (const key in this.sounds) {
            const sound = this.sounds[key]
            sound.setChannel(0)
            sound.setVolume(127)
            sound.setPitch(1.0)
        }
    }

    public static PlaySpeedSound(): void {
        PlaySoundBJ(this.SPEED_SOUND.handle)
    }

    public static PlayInvulnerableSound(): void {
        PlaySoundBJ(this.INVULNERABLE_SOUND.handle)
    }

    /// <summary>
    /// Plays the POTM death sound ontop of the passed unit.
    /// While playing team mode, only team members of the passed unit will hear the sound.
    /// </summary>
    public static PlayKittyDeathSound(k: Kitty) {
        if (Gamemode.CurrentGameMode == GameMode.TeamTournament) this.TeamKittyDeathSound(k)
        else {
            let s = this.KITTY_DEATH_SOUND
            StopSound(s.handle, false, false)
            AttachSoundToUnit(s.handle, k.Unit.handle)
            PlaySoundBJ(s.handle)
        }
    }

    public static PlayFirstBloodSound() {
        if (this.FirstBloodSoundPlayed) return
        let s = this.FIRST_BLOOD_SOUND
        StopSound(s.handle, false, false)
        PlaySoundBJ(s.handle)
        this.FirstBloodSoundPlayed = true
    }

    public static PlayKibbleTomeSound(Kitty: Unit) {
        let s = this.KIBBLE_TOME_SOUND
        StopSound(s.handle, false, false)
        AttachSoundToUnit(s.handle, Kitty.handle)
        PlaySoundBJ(s.handle)
    }

    private static TeamKittyDeathSound(k: Kitty) {
        let s = this.KITTY_DEATH_SOUND
        AttachSoundToUnit(s.handle, k.Unit.handle)
        let teamID: number = k.TeamID
        let team: Team = Globals.ALL_TEAMS.get(teamID)!
        for (let i: number = 0; i < team.Teammembers.length; i++) {
            let player = team.Teammembers[i]
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
        let currRound = Globals.ROUND
        let sound: Sound | null = null
        switch (currRound) {
            case 1:
                sound = this.ROUND_1_SOUND
                break
            case 2:
                sound = this.ROUND_2_SOUND
                break
            case 3:
                sound = this.ROUND_3_SOUND
                break
            case 4:
                sound = this.ROUND_4_SOUND
                break
            case 5:
                sound = this.ROUND_5_SOUND
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
        this.LastManStanding.start(0.8, false, this.LastManStandingActions)
    }

    private static LastManStandingActions() {
        let count = 0
        let k: Kitty | null = null

        try {
            for (let i: number = 0; i < Globals.ALL_KITTIES_LIST.length; i++) {
                let kitty = Globals.ALL_KITTIES_LIST[i]
                if (kitty.isAlive()) {
                    count += 1
                    k = kitty
                }
                if (count > 1) return
            }

            if (count == 0) return
            if (!k) return
            if (k.ProtectionActive) return // no reason to play if pota is active.

            let s = this.LAST_MAN_STANDING_SOUND
            let e = AddSpecialEffectTarget(
                'Abilities\\Spells\\Human\\Feedback\\FeedbackCaster.mdl',
                k.Unit.handle,
                'chest'
            )
            Utility.TimedTextToAllPlayers(1.0, '{Colors.COLOR_RED}man: standing: Last!{Colors.COLOR_RESET}')
            s.stop(false, false)
            s.start()
            Utility.SimpleTimer(2.0, () => {
                GC.RemoveEffect(Effect.fromHandle(e)!) // TODO; Cleanup:                 GC.RemoveEffect(ref e);
            })
        } catch (e: any) {
            Logger.Warning('Error in SoundManager.PlayLastManStandingSound: {e.Message}')
        }
    }
}
