using System;
using System.Collections.Generic;
using WCSharp.Api;
public static class NitroChallenges
{
    private static Dictionary<int, int> NitroRoundTimes;
    private static timer NitroTimer = timer.Create();
    private static timerdialog NitroDialog = timerdialog.Create(NitroTimer);
    private static List<player> HitNitroAlready = new List<player>();
    private static Dictionary<player, int> NitroCount;
    public static void Initialize()
    {
        NitroRoundTimes = new Dictionary<int, int>();
        NitroCount = new Dictionary<player, int>();
    }

    public static float GetNitroTimeRemaining() => NitroTimer.Remaining;

    public static void SetNitroRoundTimes()
    {
        NitroRoundTimes.Clear();
        switch (Difficulty.DifficultyValue)
        {
            case (int)DifficultyLevel.Normal:
                SetNormalNitroRoundTimes();
                break;
            case (int)DifficultyLevel.Hard:
                SetHardNitroRoundTimes();
                break;
            case (int)DifficultyLevel.Impossible:
                SetImpossibleNitroRoundTimes();
                break;
            default:
                // Gamemode being solo / team;
                SetNormalNitroRoundTimes();
                break;
        }
    }
    private static void SetNormalNitroRoundTimes()
    {
        NitroRoundTimes.Add(1, 125); // 2:05
        NitroRoundTimes.Add(2, 140); // 2:20
        NitroRoundTimes.Add(3, 160); // 2:40
        NitroRoundTimes.Add(4, 215); // 3:35
        NitroRoundTimes.Add(5, 345); // 5:45
    }

    private static void SetHardNitroRoundTimes()
    {
        NitroRoundTimes.Add(1, 125); // 2:05
        NitroRoundTimes.Add(2, 145); // 2:25
        NitroRoundTimes.Add(3, 170); // 2:50
        NitroRoundTimes.Add(4, 230); // 3:50
        NitroRoundTimes.Add(5, 360); // 6:00
    }

    private static void SetImpossibleNitroRoundTimes()
    {
        NitroRoundTimes.Add(1, 125); // 2:05
        NitroRoundTimes.Add(2, 150); // 2:30
        NitroRoundTimes.Add(3, 175); // 2:55
        NitroRoundTimes.Add(4, 230); // 3:50
        NitroRoundTimes.Add(5, 360); // 6:00
    }

    public static void StartNitroTimer()
    {
        NitroDialog.SetTitle("Nitro: ");
        NitroDialog.SetTitleColor(0, 255, 50);
        NitroDialog.IsDisplayed = true;
        NitroTimer.Start(NitroRoundTimes[Globals.ROUND], false, StopNitroTimer);
    }

    public static void StopNitroTimer()
    {
        NitroDialog.IsDisplayed = false;
        NitroTimer.Pause();
    }

    public static void CompletedNitro(unit unit)
    {
        if (NitroTimer.Remaining <= 0.00) return;
        if (Safezone.CountHitSafezones(unit.Owner) <= 12)
        {
            unit.Owner.DisplayTimedTextTo(6.0f, $"{Colors.COLOR_RED}You didn't hit enough safezones on your own to obtain nitro.");
            return;
        }

        AwardingNitroEvents(unit.Owner);
        AwardingDivineLight(unit.Owner);
    }

    private static void AwardingNitroEvents(player player)
    {
        if (NitroCount.TryGetValue(player, out var countx) && countx == Globals.ROUND) return;
        if (NitroTimer.Remaining <= 0.00 || NitroTimer == null) return;
        var round = Globals.ROUND;

        switch (round)
        {
            case 1:
                AwardManager.GiveReward(player, nameof(Globals.GAME_AWARDS.Nitro));
                if (Difficulty.DifficultyValue == (int)DifficultyLevel.Impossible) AwardManager.GiveReward(player, nameof(Globals.GAME_AWARDS.DivineLight));
                break;
            case 2:
                AwardManager.GiveReward(player, nameof(Globals.GAME_AWARDS.NitroBlue));
                if (Difficulty.DifficultyValue == (int)DifficultyLevel.Impossible) AwardManager.GiveReward(player, nameof(Globals.GAME_AWARDS.AzureLight));
                break;
            case 3:
                AwardManager.GiveReward(player, nameof(Globals.GAME_AWARDS.NitroRed));
                if (Difficulty.DifficultyValue == (int)DifficultyLevel.Impossible) AwardManager.GiveReward(player, nameof(Globals.GAME_AWARDS.CrimsonLight));
                break;
            case 4:
                AwardManager.GiveReward(player, nameof(Globals.GAME_AWARDS.NitroGreen));
                Challenges.ButterflyAura(player);
                if (Difficulty.DifficultyValue == (int)DifficultyLevel.Impossible) AwardManager.GiveReward(player, nameof(Globals.GAME_AWARDS.EmeraldLight));
                break;
            case 5:
                AwardManager.GiveReward(player, nameof(Globals.GAME_AWARDS.NitroPurple));
                if (Difficulty.DifficultyValue == (int)DifficultyLevel.Impossible) AwardManager.GiveReward(player, nameof(Globals.GAME_AWARDS.VioletLight));
                break;
            default:
                break;
        }

        PlayNitroSound(player);
        if (!Globals.ALL_KITTIES[player].CurrentStats.ObtainedNitros.Contains(round))
            Globals.ALL_KITTIES[player].CurrentStats.ObtainedNitros.Add(round);
        if (NitroCount.TryGetValue(player, out var count))
            NitroCount[player] = count + 1;
        else
            NitroCount.Add(player, 1);
    }

    private static void AwardingDivineLight(player player)
    {
        if(Difficulty.DifficultyValue == (int)DifficultyLevel.Impossible) return;
        var requiredCount = 5;
        if(Difficulty.DifficultyValue == (int)DifficultyLevel.Hard) requiredCount = 4;

        if (NitroCount.TryGetValue(player, out var count) && count == requiredCount) 
            AwardManager.GiveReward(player, nameof(Globals.GAME_AWARDS.DivineLight));
    }

    private static void PlayNitroSound(player player)
    {
        if (HitNitroAlready.Contains(player)) return;
        HitNitroAlready.Add(player);
        SoundManager.PlaySpeedSound();
    }


}