using System.Collections.Generic;
using WCSharp.Api;
using static WCSharp.Api.Common;

public static class SoundManager
{
    private const string KITTY_DEATH_PATH = "Units\\NightElf\\HeroMoonPriestess\\HeroMoonPriestessDeath1.wav";
    private const string ROUND_1_PATH = "war3mapImported\\Round01.mp3";
    private const string ROUND_2_PATH = "war3mapImported\\Round02.mp3";
    private const string ROUND_3_PATH = "war3mapImported\\Round03.mp3";
    private const string ROUND_4_PATH = "war3mapImported\\Round04.mp3";
    private const string ROUND_5_PATH = "war3mapImported\\FinalRound.mp3";
    private const string SPEED_PATH = "war3mapImported\\Speed.mp3";
    private const string INVULNERABLE_PATH = "war3mapImported\\Invulnerable.mp3";
    private const string KIBBLE_TOME_PATH = "war3mapImported\\Tomes.flac";
    private const string LAST_MAN_STANDING_PATH = "war3mapImported\\last_man_standing.mp3";
    private const string FIRST_BLOOD_PATH = "war3mapImported\\first_blood.mp3";

    private static sound KITTY_DEATH_SOUND;
    private static sound ROUND_1_SOUND;
    private static sound ROUND_2_SOUND;
    private static sound ROUND_3_SOUND;
    private static sound ROUND_4_SOUND;
    private static sound ROUND_5_SOUND;
    private static sound SPEED_SOUND;
    private static sound INVULNERABLE_SOUND;
    private static sound KIBBLE_TOME_SOUND;
    private static sound LAST_MAN_STANDING_SOUND;
    private static sound FIRST_BLOOD_SOUND;

    private static bool FirstBloodSoundPlayed = false;
    private static timer LastManStanding = timer.Create();
    private static Dictionary<string, sound> sounds;

    public static void Initialize()
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

    private static void AssignSounds()
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

    private static void SetSoundAttributes()
    {
        foreach (var sound in sounds)
        {
            sound.Value.SetChannel(0);
            sound.Value.SetVolume(127);
            sound.Value.SetPitch(1.0f);
        }
    }

    public static void PlaySpeedSound() => SPEED_SOUND.Start();

    public static void PlayInvulnerableSound() => INVULNERABLE_SOUND.Start();

    /// <summary>
    /// Plays the POTM death sound ontop of the passed unit.
    /// While playing team mode, only team members of the passed unit will hear the sound.
    /// </summary>
    public static void PlayKittyDeathSound(unit Kitty)
    {
        if (Gamemode.CurrentGameMode == Globals.GAME_MODES[2])
            TeamKittyDeathSound(Kitty);
        else
        {
            var s = KITTY_DEATH_SOUND;
            s.Stop(false, false);
            s.AttachToUnit(Kitty);
            s.Start();
        }
    }

    public static void PlayFirstBloodSound()
    {
        if (FirstBloodSoundPlayed) return;
        var s = FIRST_BLOOD_SOUND;
        s.Stop(false, false);
        s.Start();
        FirstBloodSoundPlayed = true;
    }

    public static void PlayKibbleTomeSound(unit Kitty)
    {
        var s = KIBBLE_TOME_SOUND;
        s.Stop(false, false);
        s.AttachToUnit(Kitty);
        s.Start();
    }

    private static void TeamKittyDeathSound(unit Kitty)
    {
        var s = KITTY_DEATH_SOUND;
        s.AttachToUnit(Kitty);
        foreach (var player in Globals.ALL_TEAMS[Globals.ALL_KITTIES[Kitty.Owner].TeamID].Teammembers)
        {
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
    public static void PlayRoundSound()
    {
        var currRound = Globals.ROUND;
        var sound = currRound switch
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

    public static void PlayLastManStandingSound()
    {
        LastManStanding.Start(0.8f, false, () =>
        {
            var count = 0;
            Kitty k = null;

            try
            {
                for (int i = 0; i < Globals.ALL_PLAYERS.Count; i++)
                {
                    var kitty = Globals.ALL_KITTIES[Globals.ALL_PLAYERS[i]];
                    if (kitty.Alive)
                    {
                        count += 1;
                        k = kitty;
                    }
                    if (count > 1) return;
                }

                if (count == 0) return;
                if (k.ProtectionActive) return; // no reason to play if pota is active.
                var s = LAST_MAN_STANDING_SOUND;
                var e = k.Unit.AddSpecialEffect("TalkToMe.mdx", "head");
                Utility.TimedTextToAllPlayers(1.0f, $"{Colors.COLOR_RED}Last man standing!|r");
                s.Stop(false, false);
                s.Start();
                Utility.SimpleTimer(2.0f, () =>
                {
                    GC.RemoveEffect(ref e);
                });
            }
            catch (System.Exception e)
            {
                Logger.Warning($"Error in SoundManager.PlayLastManStandingSound: {e.Message}");
            }
        });
    }
}
