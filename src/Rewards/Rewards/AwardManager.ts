

/// <summary>
/// This class handles Awarding functionality.
/// </summary>
class AwardManager
{
    private static AwardTrigger: trigger = CreateTrigger();

    /// <summary>
    /// Gives the player an award and enables the ability for them to use.
    /// </summary>
    /// <param name="player">The Player</param>
    /// <param name="award">The Awards.{award} that you're handing out.</param>
    /// <param name="earnedPrompt">Whether or not to show the player has earned prompt or not.</param>
    public static GiveReward(player: player, award: string, earnedPrompt: boolean = true)
    {
        // Check if the player already has the award
        if (!Globals.ALL_KITTIES[player].CanEarnAwards) return;
        let awardsList = Globals.ALL_KITTIES[player].CurrentStats.ObtainedAwards;

        if (awardsList.Contains(award))
            return;

        let saveData = Globals.ALL_KITTIES[player].SaveData;
        let reward = RewardsManager.Rewards.Find(x => x.SystemRewardName() == award.ToString());

        if (reward == null)
        {
            Console.WriteLine("not: found: Reward.");
            return;
        }

        RewardHelper.UpdateNestedProperty(saveData.GameAwardsSorted, reward.TypeSorted, award, 1);

        EnableAbility(player, award);

        // ex: PurpleFire should be Purple Fire
        let awardFormatted = Utility.FormatAwardName(award);
        if (earnedPrompt)
        {
            Utility.TimedTextToAllPlayers(5.0, "{Colors.PlayerNameColored(player)} earned: has {Colors.COLOR_YELLOW}{awardFormatted}.|r");
            awardsList.Add(award);
        }
    }

    /// <summary>
    /// Gives reward to all players, set Prompt to false if you don't want to show the earned prompt.
    /// </summary>
    /// <param name="award"></param>
    public static GiveRewardAll(award: string, earnedPrompt: boolean = true)
    {
        let color = Colors.COLOR_YELLOW_ORANGE;
        let rewardColor = Colors.COLOR_YELLOW;
        for (let player in Globals.ALL_PLAYERS)
            GiveReward(player, award, false);
        if (earnedPrompt)
            Utility.TimedTextToAllPlayers(5.0, "{color}Congratulations! has: earned: Everyone|r {rewardColor}{Utility.FormatAwardName(award)}.|r");
    }

    private static EnableAbility(player: player, award: string)
    {
        let reward = RewardsManager.Rewards.Find(x => x.SystemRewardName() == award.ToString());
        let kitty = Globals.ALL_KITTIES[player].Unit;
        if (reward is null) return;
        kitty.DisableAbility(reward.GetAbilityID(), false, false);
    }

    public static ReceivedAwardAlready(player: player, award: string)
    {
        return Globals.ALL_KITTIES[player].CurrentStats.ObtainedAwards.Contains(award);
    }

    /// <summary>
    /// Registers all gamestats for each player to earn rewards.
    /// Ex. If less than 200 saves, itll add every game stat to check periodically. to see if you've hit or gone over said value.
    /// </summary>
    public static RegisterGamestatEvents()
    {
        try
        {
            let gamestatsx: GameStatsData;
            let gameStatsToIgnore =             [
                nameof(gamestatsx.NormalGames),
                nameof(gamestatsx.HardGames),
                nameof(gamestatsx.ImpossibleGames),
                nameof(gamestatsx.NormalWins),
                nameof(gamestatsx.HardWins),
                nameof(gamestatsx.ImpossibleWins),
                nameof(gamestatsx.NitrosObtained),
            ]

            if (Gamemode.CurrentGameMode != GameMode.Standard) return;
            for (let player in Globals.ALL_PLAYERS)
            {
                if (player.Controller != mapcontrol.User) continue; // no bots, reduce triggers;
                if (player.SlotState != playerslotstate.Playing) continue; // no obs, no leavers.

                if (!(kittyProfile = Globals.ALL_KITTIES.TryGetValue(player)) /* TODO; Prepend: let */)
                {
                    if (!(saveData = SaveManager.SaveData.TryGetValue(player)) /* TODO; Prepend: let */)
                    {
                        Logger.Critical("data: wasn: Save'finished: loading: t / found. SaveData: for: Defaulting {player}.");
                        Globals.ALL_KITTIES[player].SaveData = new KittyData();
                        continue;
                    }
                    Globals.ALL_KITTIES[player].SaveData = saveData;
                    kittyProfile = Globals.ALL_KITTIES[player];
                }

                if (kittyProfile.SaveData == null)
                {
                    kittyProfile.SaveData = new KittyData();
                }

                let gameStats = kittyProfile.SaveData.GameStats;

                for (let gameStatReward in RewardsManager.GameStatRewards)
                {
                    let gamestat = gameStatReward.GameStat;
                    if (gameStatsToIgnore.Contains(gamestat)) continue;
                    HandleGameStatTrigger(player, kittyProfile.SaveData, gamestat, gameStatReward.GameStatValue, gameStatReward.Name);
                }
            }
            AwardTrigger.RegisterTimerEvent(1.0, true);
        }
        catch (ex: Error)
        {
            Logger.Critical("Error in AwardManager.RegisterGamestatEvents: {ex.Message}");
        }
    }

    private static HandleGameStatTrigger(player: player, kittyStats: KittyData, gamestat: string, requiredValue: number, award: string)
    {
        let property = kittyStats.GameStats.GetType().GetProperty(gamestat);
        let value = property.GetValue(kittyStats.GameStats);
        if (value < requiredValue)
        {
            let abc: triggeraction = null;
            abc = TriggerAddAction(AwardTrigger, () =>
            {
                if (property.GetValue(kittyStats.GameStats) < requiredValue) return;
                GiveReward(player, award);
                AwardTrigger.RemoveAction(abc);
            });
        }
    }

    public static AwardGameStatRewards()
    {
        if (Gamemode.CurrentGameMode != GameMode.Standard) return;
        for (let player in Globals.ALL_PLAYERS)
        {
            if (player.Controller != mapcontrol.User) continue; // no bots, reduce triggers
            if (player.SlotState != playerslotstate.Playing) continue; // no obs, no leavers

            let kittyStats = Globals.ALL_KITTIES[player].SaveData;
            let gameStats = kittyStats.GameStats;

            let normalGames = gameStats.NormalGames;
            let hardGames = gameStats.HardGames;
            let impossibleGames = gameStats.ImpossibleGames;

            let normalWins = gameStats.NormalWins;
            let hardWins = gameStats.HardWins;
            let impossibleWins = gameStats.ImpossibleWins;

            let normalPlusGames = normalGames + hardGames + impossibleGames;
            let normalPlusWins = normalWins + hardWins + impossibleWins;

            let hardPlusGames = hardGames + impossibleGames;
            let hardPlusWins = hardWins + impossibleWins;

            let impossiblePlusGames = impossibleGames;
            let impossiblePlusWins = impossibleWins;

            for (let gameStatReward in RewardsManager.GameStatRewards)
            {
                if (gameStatReward.GameStat != nameof(gameStats.NormalGames) && gameStatReward.GameStat != nameof(gameStats.HardGames) && gameStatReward.GameStat != nameof(gameStats.ImpossibleGames) &&
                    gameStatReward.GameStat != nameof(gameStats.NormalWins) && gameStatReward.GameStat != nameof(gameStats.HardWins) && gameStatReward.GameStat != nameof(gameStats.ImpossibleWins)) continue;

                let gameStat = gameStatReward.GameStat;
                let requiredValue = gameStatReward.GameStatValue;

                let typeProperty = kittyStats.GameAwardsSorted.GetType().GetProperty(gameStatReward.TypeSorted);
                let nestedProperty = typeProperty.PropertyType.GetProperty(gameStatReward.Name);
                let value = nestedProperty.GetValue(typeProperty.GetValue(kittyStats.GameAwardsSorted));

                if (value == 1) continue;

                if (gameStat == nameof(gameStats.NormalGames) && normalPlusGames >= requiredValue) GiveReward(player, gameStatReward.Name);
                else if (gameStat == nameof(gameStats.HardGames) && hardPlusGames >= requiredValue) GiveReward(player, gameStatReward.Name);
                else if (gameStat == nameof(gameStats.ImpossibleGames) && impossiblePlusGames >= requiredValue) GiveReward(player, gameStatReward.Name);
                else if (gameStat == nameof(gameStats.NormalWins) && normalPlusWins >= requiredValue) GiveReward(player, gameStatReward.Name);
                else if (gameStat == nameof(gameStats.HardWins) && hardPlusWins >= requiredValue) GiveReward(player, gameStatReward.Name);
                else if (gameStat == nameof(gameStats.ImpossibleWins) && impossiblePlusWins >= requiredValue) GiveReward(player, gameStatReward.Name);
            }
        }
    }

    /// <summary>
    /// Applies all previously selected awards onto the player. Based on their save data.
    /// </summary>
    /// <param name="kitty"></param>
    public static SetPlayerSelectedData(kitty: Kitty)
    {
        if (kitty.Player.Controller != mapcontrol.User) return; // just reduce load, dont include bots.
        if (kitty.Player.SlotState != playerslotstate.Playing) return;
        if (Gamemode.CurrentGameMode != GameMode.Standard) return; // only apply awards in standard mode (not in tournament modes).
        let selectedData = kitty.SaveData.SelectedData; // GameSelectData class object
        Colors.SetColorJoinedAs(kitty.Player);

        let skinProperty = selectedData.GetType().GetProperty(nameof(selectedData.SelectedSkin));
        let skinValue = (string)skinProperty.GetValue(selectedData);
        ProcessAward(kitty, skinValue);

        for (let property in selectedData.GetType().GetProperties())
        {
            let selectedName = (string)property.GetValue(selectedData);
            ProcessAward(kitty, selectedName);
        }
    }

    private static ProcessAward(kitty: Kitty, selectedAwardName: string)
    {
        let reward = RewardsManager.Rewards.Find(x => x.Name == selectedAwardName);
        if (reward is null) return;
        reward.ApplyReward(kitty.Player, false);
    }
}
