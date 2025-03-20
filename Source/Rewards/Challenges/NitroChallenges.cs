using System.Collections.Generic;
using WCSharp.Api;

public static class NitroChallenges
{
    private static Dictionary<int, int> NitroRoundTimes;
    private static timer NitroTimer = timer.Create();
    private static timerdialog NitroDialog = timerdialog.Create(NitroTimer);

    public static void Initialize()
    {
        NitroRoundTimes = new Dictionary<int, int>();
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
        NitroRoundTimes.Add(5, 330); // 5:30
    }

    private static void SetHardNitroRoundTimes()
    {
        NitroRoundTimes.Add(1, 125); // 2:05
        NitroRoundTimes.Add(2, 145); // 2:25
        NitroRoundTimes.Add(3, 170); // 2:50
        NitroRoundTimes.Add(4, 215); // 3:35
        NitroRoundTimes.Add(5, 330); // 5:30
    }

    private static void SetImpossibleNitroRoundTimes()
    {
        NitroRoundTimes.Add(1, 125); // 2:05
        NitroRoundTimes.Add(2, 150); // 2:30
        NitroRoundTimes.Add(3, 175); // 2:55
        NitroRoundTimes.Add(4, 215); // 3:35
        NitroRoundTimes.Add(5, 330); // 5:30
    }

    public static void StartNitroTimer()
    {
        NitroDialog.SetTitle("Nitro: ");
        NitroDialog.SetTitleColor(0, 255, 50);
        NitroDialog.IsDisplayed = true;
        NitroTimer.Start(NitroRoundTimes[Globals.ROUND], false, ErrorHandler.Wrap(StopNitroTimer));
    }

    public static void StopNitroTimer()
    {
        NitroDialog.IsDisplayed = false;
        NitroTimer.Pause();
    }

    public static void CompletedNitro(Kitty kitty)
    {
        if (NitroTimer.Remaining <= 0.00) return;
        if (Safezone.CountHitSafezones(kitty.Player) <= 12)
        {
            kitty.Player.DisplayTimedTextTo(6.0f, $"{Colors.COLOR_RED}You didn't hit enough safezones on your own to obtain nitro.");
            return;
        }

        AwardingNitroEvents(kitty);
        AwardingDivineLight(kitty);
    }

    private static void AwardingNitroEvents(Kitty kitty)
    {
        var nitroCount = kitty.CurrentStats.NitroCount;
        var player = kitty.Player;
        if (nitroCount == Globals.ROUND) return; // already awarded
        if (NitroTimer == null || NitroTimer.Remaining <= 0.00 || !NitroDialog.IsDisplayed) return;
        var round = Globals.ROUND;

        switch (round)
        {
            case 1:
                AwardManager.GiveReward(player, nameof(Globals.GAME_AWARDS_SORTED.Nitros.Nitro));
                if (Difficulty.DifficultyValue == (int)DifficultyLevel.Impossible)
                    AwardManager.GiveReward(player, nameof(Globals.GAME_AWARDS_SORTED.Nitros.DivineLight));
                break;

            case 2:
                AwardManager.GiveReward(player, nameof(Globals.GAME_AWARDS_SORTED.Nitros.NitroBlue));
                if (Difficulty.DifficultyValue == (int)DifficultyLevel.Impossible)
                    AwardManager.GiveReward(player, nameof(Globals.GAME_AWARDS_SORTED.Nitros.AzureLight));
                break;

            case 3:
                AwardManager.GiveReward(player, nameof(Globals.GAME_AWARDS_SORTED.Nitros.NitroRed));
                if (Difficulty.DifficultyValue == (int)DifficultyLevel.Impossible)
                    AwardManager.GiveReward(player, nameof(Globals.GAME_AWARDS_SORTED.Nitros.CrimsonLight));
                break;

            case 4:
                AwardManager.GiveReward(player, nameof(Globals.GAME_AWARDS_SORTED.Nitros.NitroGreen));
                Challenges.ButterflyAura(player);
                if (Difficulty.DifficultyValue == (int)DifficultyLevel.Impossible)
                    AwardManager.GiveReward(player, nameof(Globals.GAME_AWARDS_SORTED.Nitros.EmeraldLight));
                break;

            case 5:
                AwardManager.GiveReward(player, nameof(Globals.GAME_AWARDS_SORTED.Nitros.NitroPurple));
                if (Difficulty.DifficultyValue == (int)DifficultyLevel.Impossible)
                    AwardManager.GiveReward(player, nameof(Globals.GAME_AWARDS_SORTED.Nitros.VioletLight));
                break;

            default:
                break;
        }

        PlayNitroSound(player);

        var currentStats = kitty.CurrentStats;
        if (!currentStats.ObtainedNitros.Contains(round))
            currentStats.ObtainedNitros.Add(round);

        currentStats.NitroCount += 1;
        kitty.SaveData.GameStats.NitrosObtained += 1;
    }

    private static void AwardingDivineLight(Kitty kitty)
    {
        if (Difficulty.DifficultyValue == (int)DifficultyLevel.Impossible) return;
        var requiredCount = 5;
        if (Difficulty.DifficultyValue == (int)DifficultyLevel.Hard) requiredCount = 4;

        if (kitty.CurrentStats.NitroCount == requiredCount)
            AwardManager.GiveReward(kitty.Player, nameof(Globals.GAME_AWARDS_SORTED.Nitros.DivineLight));
    }

    private static void PlayNitroSound(player player)
    {
        if (Globals.ALL_KITTIES[player].CurrentStats.NitroObtained) return; // first time
        Globals.ALL_KITTIES[player].CurrentStats.NitroObtained = true;
        SoundManager.PlaySpeedSound();
    }
}
