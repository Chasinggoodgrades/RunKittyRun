using System;
using System.Collections.Generic;
using System.Drawing;
using WCSharp.Api;
using WCSharp.Events;
using WCSharp.Shared;
using WCSharp.Shared.Data;
using WCSharp.Sync;
using static WCSharp.Api.Common;

public static class SoundManager
{
    private const string KITTY_DEATH_PATH = "Units\\NightElf\\HeroMoonPriestess\\HeroMoonPriestessDeath1.wav";
    private const string ROUND_1_PATH = "war3mapImported\\Round01.mp3";
    private const string ROUND_2_PATH = "war3mapImported\\Round02.mp3";
    private const string ROUND_3_PATH = "war3mapImported\\Round03.mp3";
    private const string ROUND_4_PATH = "war3mapImported\\Round04.mp3";
    private const string ROUND_5_PATH = "war3mapImported\\FinalRound.mp3";

    private static sound KITTY_DEATH_SOUND;
    private static sound ROUND_1_SOUND;
    private static sound ROUND_2_SOUND;
    private static sound ROUND_3_SOUND;
    private static sound ROUND_4_SOUND;
    private static sound ROUND_5_SOUND;
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
            { "Round5Sound", CreateSound(ROUND_5_PATH, false, false, false, 10, 10, "") }
        };
        SetSoundAttributes();
        AssignSounds();
    }

    private static void SetSoundAttributes()
    {
        foreach (var sound in sounds.Values)
        {
            sound.SetChannel(0);
            sound.SetVolume(127);
            sound.SetPitch(1.0f);
        }
    }

    private static void AssignSounds()
    {
        KITTY_DEATH_SOUND = sounds["KittyDeathSound"];
        ROUND_1_SOUND = sounds["Round1Sound"];
        ROUND_2_SOUND = sounds["Round2Sound"];
        ROUND_3_SOUND = sounds["Round3Sound"];
        ROUND_4_SOUND = sounds["Round4Sound"];
        ROUND_5_SOUND = sounds["Round5Sound"];
    }

    private static void TeamKittyDeathSound(unit Kitty)
    {
        var s = KITTY_DEATH_SOUND;
        s.AttachToUnit(Kitty);
        foreach(var player in Globals.ALL_TEAMS[Globals.ALL_KITTIES[GetOwningPlayer(Kitty)].TeamID].Teammembers)
        {
            if(player == GetLocalPlayer())
                s.Start();
        }
    }

    /// <summary>
    /// Plays the POTM death sound ontop of the passed unit.
    /// While playing team mode, only team members of the passed unit will hear the sound.
    /// </summary>
    public static void PlayKittyDeathSound(unit Kitty)
    {

        if (Gamemode.CurrentGameMode == Globals.GAME_MODES[2]) TeamKittyDeathSound(Kitty);
        else
        {
            var s = KITTY_DEATH_SOUND;
            s.AttachToUnit(Kitty);
            s.Start();
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
        sound.Start();
    }
}
