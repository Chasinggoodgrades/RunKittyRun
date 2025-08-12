class SoundManager {
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

    private static KITTY_DEATH_SOUND: sound
    private static ROUND_1_SOUND: sound
    private static ROUND_2_SOUND: sound
    private static ROUND_3_SOUND: sound
    private static ROUND_4_SOUND: sound
    private static ROUND_5_SOUND: sound
    private static SPEED_SOUND: sound
    private static INVULNERABLE_SOUND: sound
    private static KIBBLE_TOME_SOUND: sound
    private static LAST_MAN_STANDING_SOUND: sound
    private static FIRST_BLOOD_SOUND: sound

    private static FirstBloodSoundPlayed: boolean = false
    private static LastManStanding: timer = CreateTimer()
    private static sounds: Record<string, sound> = {}

    public static Initialize() {
        this.sounds = {
            KittyDeathSound: CreateSound(this.KITTY_DEATH_PATH, false, true, false, 10, 10, '') as sound,
            Round1Sound: CreateSound(this.ROUND_1_PATH, false, false, false, 10, 10, '') as sound,
            Round2Sound: CreateSound(this.ROUND_2_PATH, false, false, false, 10, 10, '') as sound,
            Round3Sound: CreateSound(this.ROUND_3_PATH, false, false, false, 10, 10, '') as sound,
            Round4Sound: CreateSound(this.ROUND_4_PATH, false, false, false, 10, 10, '') as sound,
            Round5Sound: CreateSound(this.ROUND_5_PATH, false, false, false, 10, 10, '') as sound,
            SpeedSound: CreateSound(this.SPEED_PATH, false, false, false, 10, 10, '') as sound,
            InvulnerableSound: CreateSound(this.INVULNERABLE_PATH, false, false, false, 10, 10, '') as sound,
            KibbleTomeSound: CreateSound(this.KIBBLE_TOME_PATH, false, true, false, 10, 10, '') as sound,
            LastManStandingSound: CreateSound(this.LAST_MAN_STANDING_PATH, false, false, false, 10, 10, '') as sound,
            FirstBloodSound: CreateSound(this.FIRST_BLOOD_PATH, false, false, false, 10, 10, '') as sound,
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
            SetSoundChannel(sound, 0)
            SetSoundVolume(sound, 127)
            SetSoundPitch(sound, 1.0)
        }
    }

    public static PlaySpeedSound(): void {
        PlaySoundBJ(this.SPEED_SOUND)
    }

    public static PlayInvulnerableSound(): void {
        PlaySoundBJ(this.INVULNERABLE_SOUND)
    }

    /// <summary>
    /// Plays the POTM death sound ontop of the passed unit.
    /// While playing team mode, only team members of the passed unit will hear the sound.
    /// </summary>
    public static PlayKittyDeathSound(k: Kitty) {
        if (Gamemode.CurrentGameMode == GameMode.TeamTournament) this.TeamKittyDeathSound(k)
        else {
            let s = this.KITTY_DEATH_SOUND
            StopSound(s, false, false)
            AttachSoundToUnit(s, k.Unit)
            PlaySoundBJ(s)
        }
    }

    public static PlayFirstBloodSound() {
        if (this.FirstBloodSoundPlayed) return
        let s = this.FIRST_BLOOD_SOUND
        StopSound(s, false, false)
        PlaySoundBJ(s)
        this.FirstBloodSoundPlayed = true
    }

    public static PlayKibbleTomeSound(Kitty: unit) {
        let s = this.KIBBLE_TOME_SOUND
        StopSound(s, false, false)
        AttachSoundToUnit(s, Kitty)
        PlaySoundBJ(s)
    }

    private static TeamKittyDeathSound(k: Kitty) {
        let s = this.KITTY_DEATH_SOUND
        AttachSoundToUnit(s, k.Unit)
        let teamID: number = k.TeamID
        let team: Team = Globals.ALL_TEAMS[teamID]
        for (let i: number = 0; i < team.Teammembers.length; i++) {
            let player = team.Teammembers[i]
            if (player == GetLocalPlayer()) {
                StopSound(s, false, false)
                PlaySoundBJ(s)
            }
        }
    }

    /// <summary>
    /// Plays the round starting sound based on current round.
    /// Only rounds 1-5 are setup.
    /// </summary>
    public static PlayRoundSound() {
        let currRound = Globals.ROUND
        let sound: sound | null = null
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
            // sound.Start();
            PlaySoundBJ(sound)
        }
    }

    public static PlayLastManStandingSound() {
        TimerStart(this.LastManStanding, 0.8, false, this.LastManStandingActions)
    }

    private static LastManStandingActions() {
        let count = 0
        let k: Kitty = null

        try {
            for (let i: number = 0; i < Globals.ALL_KITTIES_LIST.Count; i++) {
                let kitty = Globals.ALL_KITTIES_LIST[i]
                if (kitty.Alive) {
                    count += 1
                    k = kitty
                }
                if (count > 1) return
            }

            if (count == 0) return
            if (k.ProtectionActive) return // no reason to play if pota is active.
            let s = this.LAST_MAN_STANDING_SOUND
            let e = AddSpecialEffectTarget('Abilities\\Spells\\Human\\Feedback\\FeedbackCaster.mdl', k.Unit, 'chest')
            Utility.TimedTextToAllPlayers(1.0, '{Colors.COLOR_RED}man: standing: Last!{Colors.COLOR_RESET}')
            s.Stop(false, false)
            s.Start()
            Utility.SimpleTimer(2.0, () => {
                GC.RemoveEffect(e) // TODO; Cleanup:                 GC.RemoveEffect(ref e);
            })
        } catch (e: Error) {
            Logger.Warning('Error in SoundManager.PlayLastManStandingSound: {e.Message}')
        }
    }
}
