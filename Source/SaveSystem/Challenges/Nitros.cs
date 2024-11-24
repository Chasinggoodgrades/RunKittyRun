using System;
using System.Collections.Generic;
using WCSharp.Api;
public static class Nitros
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
        SetNitroRoundTimes();
    }

    public static float GetNitroTimeRemaining() => NitroTimer.Remaining;

    private static void SetNitroRoundTimes()
    {
        // Only has rounds up to 5.
        NitroRoundTimes.Add(1, 125);
        NitroRoundTimes.Add(2, 140);
        NitroRoundTimes.Add(3, 160);
        NitroRoundTimes.Add(4, 235);
        NitroRoundTimes.Add(5, 345);
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
        if (NitroTimer.Remaining == 0.00) return;

        AwardingNitroEvents(unit.Owner);
        AwardingDivineLight(unit.Owner);
    }

    private static void AwardingNitroEvents(player player)
    {
        if(NitroCount.TryGetValue(player, out var countx) && countx == Globals.ROUND) return;
        var round = Globals.ROUND;
        switch(round)
        {
            case 1:
                AwardManager.GiveReward(player, Awards.Nitro);
                break;
            case 2:
                AwardManager.GiveReward(player, Awards.Nitro_Blue);
                break;
            case 3:
                AwardManager.GiveReward(player, Awards.Nitro_Red);
                break;
            case 4:
                AwardManager.GiveReward(player, Awards.Nitro_Green);
                Challenges.ButterflyAura(player);
                break;
            case 5:
                AwardManager.GiveReward(player, Awards.Nitro_Purple);
                break;
        }
        PlayNitroSound(player);
        if (NitroCount.TryGetValue(player, out var count)) NitroCount[player] = count + 1;
        else NitroCount.Add(player, 1);
    }

    private static void AwardingDivineLight(player player)
    {
        var requiredCount = 5;
        if(Difficulty.DifficultyValue == (int)DifficultyLevel.Impossible) requiredCount = 3;
        if(Difficulty.DifficultyValue == (int)DifficultyLevel.Hard) requiredCount = 4;

        if (NitroCount.TryGetValue(player, out var count) && count == requiredCount)
            AwardManager.GiveReward(player, Awards.Divine_Light);
    }

    private static void PlayNitroSound(player player)
    {
        if (HitNitroAlready.Contains(player)) return;
        HitNitroAlready.Add(player);
        SoundManager.PlaySpeedSound();
    }


}