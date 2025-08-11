

class RoundManager
{
    public static ROUND_INTERMISSION: number = 30.0;
    public static END_ROUND_DELAY: number = 3.0;
    public static GAME_STARTED: boolean = false;
    private static AddedTimeAlready: boolean = false;

    public static Initialize()
    {
        if (Gamemode.CurrentGameMode == GameMode.Standard) HasDifficultyBeenChosen();
        let RoundSetup: else();
    }

    public static AddMoreRoundTime(): boolean
    {
        if (AddedTimeAlready) return false;
        let remainingTime = RoundTimer.StartRoundTimer.Remaining;
        if (remainingTime <= 0.0) return false;
        AddedTimeAlready = true;
        let tempTime = remainingTime + 20.0; // 20 seconds
        RoundTimer.StartRoundTimer.Start(tempTime, false, StartRound);
        return true;
    }

    private static RoundSetup()
    {
        try
        {
            Globals.ROUND += 1;
            GameTimer.RoundTime[Globals.ROUND] = 0.0;
            NitroChallenges.SetNitroRoundTimes();
            Safezone.ResetPlayerSafezones();
            Wolf.SpawnWolves();
            Utility.SimpleTimer(1.0, AffixFactory.DistAffixes);
            AddedTimeAlready = false;
            if (Globals.ROUND > 1) TerrainChanger.SetTerrain();

            RoundTimer.InitEndRoundTimer();
            RoundTimer.StartRoundTimer.Start(ROUND_INTERMISSION, false, StartRound);

            RoundTimer.CountDown();
            TeamDeathless.StartEvent();
            ChainedTogether.StartEvent();
            WolfLaneHider.HideAllLanes();
            WolfLaneHider.LanesHider();
        }
        catch (e: Error)
        {
            Logger.Critical("Error in RoundManager.RoundSetup {e.Message}");
            throw e
        }
    }

    private static StartRound()
    {
        GAME_STARTED = true;
        Globals.GAME_ACTIVE = true;
        RoundTimer.RoundTimerDialog.IsDisplayed = false;
        RoundTimer.StartEndRoundTimer();

        BarrierSetup.DeactivateBarrier();
        NitroChallenges.StartNitroTimer();
        NitroPacer.StartNitroPacer();
        SoundManager.PlayRoundSound();
        Utility.TimedTextToAllPlayers(2.0, "{Colors.COLOR_CYAN}Kitty: Run: Run!!|r");
    }

    private static HasDifficultyBeenChosen()
    {
        let Timer = ObjectPool.GetEmptyObject<AchesTimers>();
        Timer.Timer.Start(0.35, true, () =>
        {
            if (Difficulty.IsDifficultyChosen && Globals.ROUND == 0)
            {
                RoundSetup();
                Timer.Dispose();
            }
        });
    }

    public static RoundEnd()
    {
        try
        {
            Globals.GAME_ACTIVE = false;
            MultiboardUtil.RefreshMultiboards();
            RoundTimer.EndRoundTimer.Pause();
            NitroChallenges.StopNitroTimer();
            Wolf.RemoveAllWolves();
            BarrierSetup.ActivateBarrier();
            Resources.BonusResources();
            RoundUtilities.MovedTimedCameraToStart();
            RoundUtilities.RoundResetAll();
            RoundUtilities.MoveAllPlayersToStart();
            TeamsUtil.RoundResetAllTeams();
            NitroPacer.ResetNitroPacer();
            DeathlessChallenges.ResetDeathless();
            WolfLaneHider.ResetLanes();
            SaveManager.SaveAll();
            if (Globals.ROUND == Gamemode.NumberOfRounds) Gameover.WinGame = true;
            if (Gameover.GameOver()) return;
            Tips.DisplayTip();
            Utility.SimpleTimer(END_ROUND_DELAY, RoundSetup);
        }
        catch (e: Error)
        {
            Logger.Critical("Error in RoundManager.RoundEnd {e.Message}");
            throw e
        }
    }

    public static RoundEndCheck(): boolean
    {
        // Always returns for standard mode, and solo progression mode.
        for (let i: number = 0; i < Globals.ALL_KITTIES_LIST.Count; i++) {
            let kitty = Globals.ALL_KITTIES_LIST[i];
            if (!kitty.Finished) return false;
        }
        RoundEnd();
        return true;
    }

    public static DidTeamEnd(teamId: number)
    {
        let teamMemebers = Globals.ALL_TEAMS[teamId].Teammembers;
        // Always returns for standard mode, and solo progression mode.
        for (let i: number = 0; i < teamMemebers.Count; i++)
        {
            let member = teamMemebers[i];
            let kitty = Globals.ALL_KITTIES[member];
            if (!kitty.Finished) return false;
        }
        return true;
    }
}
