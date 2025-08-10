

class SoundManager
{
    private KITTY_DEATH_PATH: string = "Units\\NightElf\\HeroMoonPriestess\\HeroMoonPriestessDeath1.wav";
    private ROUND_1_PATH: string = "war3mapImported\\Round01.mp3";
    private ROUND_2_PATH: string = "war3mapImported\\Round02.mp3";
    private ROUND_3_PATH: string = "war3mapImported\\Round03.mp3";
    private ROUND_4_PATH: string = "war3mapImported\\Round04.mp3";
    private ROUND_5_PATH: string = "war3mapImported\\FinalRound.mp3";
    private SPEED_PATH: string = "war3mapImported\\Speed.mp3";
    private INVULNERABLE_PATH: string = "war3mapImported\\Invulnerable.mp3";
    private KIBBLE_TOME_PATH: string = "war3mapImported\\Tomes.flac";
    private LAST_MAN_STANDING_PATH: string = "war3mapImported\\last_man_standing.mp3";
    private FIRST_BLOOD_PATH: string = "war3mapImported\\first_blood.mp3";

    private static KITTY_DEATH_SOUND: sound;
    private static ROUND_1_SOUND: sound;
    private static ROUND_2_SOUND: sound;
    private static ROUND_3_SOUND: sound;
    private static ROUND_4_SOUND: sound;
    private static ROUND_5_SOUND: sound;
    private static SPEED_SOUND: sound;
    private static INVULNERABLE_SOUND: sound;
    private static KIBBLE_TOME_SOUND: sound;
    private static LAST_MAN_STANDING_SOUND: sound;
    private static FIRST_BLOOD_SOUND: sound;

    private static FirstBloodSoundPlayed: boolean = false;
    private static LastManStanding: timer = timer.Create();
    private static Dictionary<string, sound> sounds;

    public static Initialize()
    {
        sounds = new Dictionary<string, sound>
        {
            { "KittyDeathSound", CreateSound(KITTY_DEATH_PATH, false, true, false, 10, 10, "") },
            { "Round1Sound", CreateSound(ROUND_1_PATH, false, false, false, 10, 10, "") },
            { "Round2Sound", CreateSound(ROUND_2_PATH, false, false, false, 10, 10, "") },
            { "Round3Sound", CreateSound(ROUND_3_PATH, false, false, false, 10, 10, "") },
            { "Round4Sound", CreateSound(ROUND_4_PATH, false, false, false, 10, 10, "") },
            { "Round5Sound", CreateSound(ROUND_5_PATH, false, false, false, 10, 10, "") },
            { "SpeedSound", CreateSound(SPEED_PATH, false, false, false, 10, 10, "") },
            { "InvulnerableSound", CreateSound(INVULNERABLE_PATH, false, false, false, 10, 10, "") },
            { "KibbleTomeSound", CreateSound(KIBBLE_TOME_PATH, false, true, false, 10, 10, "") },
            { "LastManStandingSound", CreateSound(LAST_MAN_STANDING_PATH, false, false, false, 10, 10, "") },
            { "FirstBloodSound", CreateSound(FIRST_BLOOD_PATH, false, false, false, 10, 10, "") }
        };
        SetSoundAttributes();
        AssignSounds();
    }

    private static AssignSounds()
    {
        KITTY_DEATH_SOUND = sounds["KittyDeathSound"];
        ROUND_1_SOUND = sounds["Round1Sound"];
        ROUND_2_SOUND = sounds["Round2Sound"];
        ROUND_3_SOUND = sounds["Round3Sound"];
        ROUND_4_SOUND = sounds["Round4Sound"];
        ROUND_5_SOUND = sounds["Round5Sound"];
        SPEED_SOUND = sounds["SpeedSound"];
        INVULNERABLE_SOUND = sounds["InvulnerableSound"];
        KIBBLE_TOME_SOUND = sounds["KibbleTomeSound"];
        LAST_MAN_STANDING_SOUND = sounds["LastManStandingSound"];
        FIRST_BLOOD_SOUND = sounds["FirstBloodSound"];
    }

    private static SetSoundAttributes()
    {
        for (let sound in sounds)
        {
            sound.Value.SetChannel(0);
            sound.Value.SetVolume(127);
            sound.Value.SetPitch(1.0);
        }
    }

    public static PlaySpeedSound()  { return SPEED_SOUND.Start(); }

    public static PlayInvulnerableSound()  { return INVULNERABLE_SOUND.Start(); }

    /// <summary>
    /// Plays the POTM death sound ontop of the passed unit.
    /// While playing team mode, only team members of the passed unit will hear the sound.
    /// </summary>
    public static PlayKittyDeathSound(k: Kitty)
    {
        if (Gamemode.CurrentGameMode == GameMode.TeamTournament)
            TeamKittyDeathSound(k);
        else
        {
            let s = KITTY_DEATH_SOUND;
            s.Stop(false, false);
            s.AttachToUnit(k.Unit);
            s.Start();
        }
    }

    public static PlayFirstBloodSound()
    {
        if (FirstBloodSoundPlayed) return;
        let s = FIRST_BLOOD_SOUND;
        s.Stop(false, false);
        s.Start();
        FirstBloodSoundPlayed = true;
    }

    public static PlayKibbleTomeSound(Kitty: unit)
    {
        let s = KIBBLE_TOME_SOUND;
        s.Stop(false, false);
        s.AttachToUnit(Kitty);
        s.Start();
    }

    private static TeamKittyDeathSound(k: Kitty)
    {
        let s = KITTY_DEATH_SOUND;
        s.AttachToUnit(k.Unit);
        let teamID: number = k.TeamID;
        let team: Team = Globals.ALL_TEAMS[teamID];
        for (let i: number = 0; i < team.Teammembers.Count; i++)
        {
            let player = team.Teammembers[i];
            if (player.IsLocal)
            {
                s.Stop(false, false);
                s.Start();
            }
        }
    }

    /// <summary>
    /// Plays the round starting sound based on current round.
    /// Only rounds 1-5 are setup.
    /// </summary>
    public static PlayRoundSound()
    {
        let currRound = Globals.ROUND;
        let sound = currRound switch
        {
            1 => ROUND_1_SOUND,
            2 => ROUND_2_SOUND,
            3 => ROUND_3_SOUND,
            4 => ROUND_4_SOUND,
            5 => ROUND_5_SOUND,
            _ => null
        };
        sound?.Start();
    }

    public static PlayLastManStandingSound()
    {
        LastManStanding.Start(0.8, false, LastManStandingActions);
    }

    private static LastManStandingActions()
    {
        let count = 0;
        let k: Kitty = null;

        try
        {
            for (let i: number = 0; i < Globals.ALL_KITTIES_LIST.Count; i++)
            {
                let kitty = Globals.ALL_KITTIES_LIST[i];
                if (kitty.Alive)
                {
                    count += 1;
                    k = kitty;
                }
                if (count > 1) return;
            }

            if (count == 0) return;
            if (k.ProtectionActive) return; // no reason to play if pota is active.
            let s = LAST_MAN_STANDING_SOUND;
            let e = k.Unit.AddSpecialEffect("TalkToMe.mdx", "head");
            Utility.TimedTextToAllPlayers(1.0, "{Colors.COLOR_RED}man: standing: Last!{Colors.COLOR_RESET}");
            s.Stop(false, false);
            s.Start();
            Utility.SimpleTimer(2.0, () =>
            {
                GC.RemoveEffect( e); // TODO; Cleanup:                 GC.RemoveEffect(ref e);
            });
        }
        catch (e: Error)
        {
            Logger.Warning("Error in SoundManager.PlayLastManStandingSound: {e.Message}");
        }
    }
}
