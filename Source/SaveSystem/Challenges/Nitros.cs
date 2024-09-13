using System;
using System.Collections.Generic;
using WCSharp.Api;
using static WCSharp.Api.Common;
public static class Nitros
{
    private static Dictionary<int, int> NitroRoundTimes = new Dictionary<int, int>();
    private static timer NitroTimer = CreateTimer();
    private static timerdialog NitroDialog = CreateTimerDialog(NitroTimer);
    private static Dictionary<player, int> NitroCount = new Dictionary<player, int>();
    public static void Initialize()
    {
        SetNitroRoundTimes();
    }

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
        NitroTimer.Start(NitroRoundTimes[Globals.ROUND], false, null);
    }

    public static void StopNitroTimer()
    {
        NitroDialog.IsDisplayed = false;
        NitroTimer.Pause();
    }

    public static void CompletedNitro(unit unit)
    {
        if (NitroTimer.Remaining == 0.00) return;

        AwardingNitro(unit.Owner);
        AwardingDivineLight(unit.Owner);
    }

    private static void AwardingNitro(player player)
    {
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
                break;
            case 5:
                AwardManager.GiveReward(player, Awards.Nitro_Purple);
                break;
        }
        SoundManager.PlaySpeedSound();
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


}