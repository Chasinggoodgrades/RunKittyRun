import { Logger } from 'src/Events/Logger/Logger'
import { Kitty } from 'src/Game/Entities/Kitty/Kitty'
import { Gamemode } from 'src/Gamemodes/Gamemode'
import { GameMode } from 'src/Gamemodes/GameModeEnum'
import { Globals } from 'src/Global/Globals'
import { KittyData } from 'src/SaveSystem2.0/MAKE REWARDS HERE/KittyData'
import { SaveManager } from 'src/SaveSystem2.0/SaveManager'
import { RewardHelper } from 'src/UI/Frames/RewardHelper'
import { Colors } from 'src/Utility/Colors/Colors'
import { Utility } from 'src/Utility/Utility'
import { MapPlayer, Trigger } from 'w3ts'
import { RewardsManager } from './RewardsManager'

/// <summary>
/// This class handles Awarding functionality.
/// </summary>

export class AwardManager {
    private static AwardTrigger: Trigger = Trigger.create()!

    /// <summary>
    /// Gives the player an award and enables the ability for them to use.
    /// </summary>
    /// <param name="player">The Player</param>
    /// <param name="award">The Awards.{award} that you're handing out.</param>
    /// <param name="earnedPrompt">Whether or not to show the player has earned prompt or not.</param>
    public static GiveReward(player: MapPlayer, award: string, earnedPrompt: boolean = true) {
        // Check if the player already has the award
        if (!Globals.ALL_KITTIES.get(player)!.CanEarnAwards) return
        let awardsList = Globals.ALL_KITTIES.get(player)!.CurrentStats.ObtainedAwards

        if (awardsList.includes(award)) return

        let saveData = Globals.ALL_KITTIES.get(player)!.SaveData
        let reward = RewardsManager.Rewards.find(x => x.SystemRewardName() == award.toString())

        if (reward == null) {
            print('not: found: Reward.')
            return
        }

        RewardHelper.UpdateNestedProperty(saveData.GameAwardsSorted, reward.TypeSorted, award, 1)

        AwardManager.EnableAbility(player, award)

        // ex: PurpleFire should be Purple Fire
        let awardFormatted = Utility.FormatAwardName(award)
        if (earnedPrompt) {
            Utility.TimedTextToAllPlayers(
                5.0,
                '{Colors.PlayerNameColored(player)} earned: has {Colors.COLOR_YELLOW}{awardFormatted}.|r'
            )
            awardsList.push(award)
        }
    }

    /// <summary>
    /// Gives reward to all players, set Prompt to false if you don't want to show the earned prompt.
    /// </summary>
    /// <param name="award"></param>
    public static GiveRewardAll(award: string, earnedPrompt: boolean = true) {
        let color = Colors.COLOR_YELLOW_ORANGE
        let rewardColor = Colors.COLOR_YELLOW
        for (let player of Globals.ALL_PLAYERS) AwardManager.GiveReward(player, award, false)
        if (earnedPrompt)
            Utility.TimedTextToAllPlayers(
                5.0,
                '{color}Congratulations! has: earned: Everyone|r {rewardColor}{Utility.FormatAwardName(award)}.|r'
            )
    }

    private static EnableAbility(player: MapPlayer, award: string) {
        let reward = RewardsManager.Rewards.find(x => x.SystemRewardName() == award.toString())
        let kitty = Globals.ALL_KITTIES.get(player)!.Unit
        if (reward === null) return
        kitty.disableAbility(reward.GetAbilityID(), false, false)
    }

    public static ReceivedAwardAlready(player: MapPlayer, award: string) {
        return Globals.ALL_KITTIES.get(player)!.CurrentStats.ObtainedAwards.includes(award)
    }

    /// <summary>
    /// Registers all gamestats for each player to earn rewards.
    /// Ex. If less than 200 saves, itll add every game stat to check periodically. to see if you've hit or gone over said value.
    /// </summary>
    public static RegisterGamestatEvents() {
        try {
            let gameStatsToIgnore = [
                'NormalGames',
                'HardGames',
                'ImpossibleGames',
                'NormalWins',
                'HardWins',
                'ImpossibleWins',
                'NitrosObtained',
            ]

            if (Gamemode.CurrentGameMode != GameMode.Standard) return
            for (let player of Globals.ALL_PLAYERS) {
                if (player.controller != MAP_CONTROL_USER) continue // no bots, reduce triggers;
                if (player.slotState != PLAYER_SLOT_STATE_PLAYING) continue // no obs, no leavers.

                if (!(kittyProfile = Globals.ALL_KITTIES.TryGetValue(player)) /* TODO; Prepend: let */) {
                    if (!(saveData = SaveManager.SaveData.TryGetValue(player)) /* TODO; Prepend: let */) {
                        Logger.Critical(
                            "data: wasn: Save'finished: loading: t / found. SaveData: for: Defaulting {player}."
                        )
                        Globals.ALL_KITTIES.get(player)!.SaveData = new KittyData()
                        continue
                    }
                    Globals.ALL_KITTIES.get(player)!.SaveData = saveData
                    kittyProfile = Globals.ALL_KITTIES.get(player)!
                }

                if (kittyProfile.SaveData == null) {
                    kittyProfile.SaveData = new KittyData()
                }

                let gameStats = kittyProfile.SaveData.GameStats

                for (let gameStatReward in RewardsManager.GameStatRewards) {
                    let gamestat = gameStatReward.GameStat
                    if (gameStatsToIgnore.includes(gamestat)) continue
                    AwardManager.HandleGameStatTrigger(
                        player,
                        kittyProfile.SaveData,
                        gamestat,
                        gameStatReward.GameStatValue,
                        gameStatReward.name
                    )
                }
            }
            TriggerRegisterTimerEvent(AwardManager.AwardTrigger, 1.0, true)
        } catch (ex: any) {
            Logger.Critical('Error in AwardManager.RegisterGamestatEvents: {ex.Message}')
        }
    }

    private static HandleGameStatTrigger(
        player: MapPlayer,
        kittyStats: KittyData,
        gamestat: string,
        requiredValue: number,
        award: string
    ) {
        let property = kittyStats.GameStats.GetType().GetProperty(gamestat)
        let value = property.GetValue(kittyStats.GameStats)
        if (value < requiredValue) {
            let abc: triggeraction = null
            abc = TriggerAddAction(AwardManager.AwardTrigger, () => {
                if (property.GetValue(kittyStats.GameStats) < requiredValue) return
                AwardManager.GiveReward(player, award)
                AwardManager.AwardTrigger.RemoveAction(abc)
            })
        }
    }

    public static AwardGameStatRewards() {
        if (Gamemode.CurrentGameMode != GameMode.Standard) return
        for (let player of Globals.ALL_PLAYERS) {
            if (player.controller != MAP_CONTROL_USER) continue // no bots, reduce triggers
            if (player.slotState != PLAYER_SLOT_STATE_PLAYING) continue // no obs, no leavers

            let kittyStats = Globals.ALL_KITTIES.get(player)!.SaveData
            let gameStats = kittyStats.GameStats

            let normalGames = gameStats.NormalGames
            let hardGames = gameStats.HardGames
            let impossibleGames = gameStats.ImpossibleGames

            let normalWins = gameStats.NormalWins
            let hardWins = gameStats.HardWins
            let impossibleWins = gameStats.ImpossibleWins

            let normalPlusGames = normalGames + hardGames + impossibleGames
            let normalPlusWins = normalWins + hardWins + impossibleWins

            let hardPlusGames = hardGames + impossibleGames
            let hardPlusWins = hardWins + impossibleWins

            let impossiblePlusGames = impossibleGames
            let impossiblePlusWins = impossibleWins

            for (let gameStatReward of RewardsManager.GameStatRewards) {
                if (
                    gameStatReward.GameStat != 'NormalGames' &&
                    gameStatReward.GameStat != 'HardGames' &&
                    gameStatReward.GameStat != 'ImpossibleGames' &&
                    gameStatReward.GameStat != 'NormalWins' &&
                    gameStatReward.GameStat != 'HardWins' &&
                    gameStatReward.GameStat != 'ImpossibleWins'
                )
                    continue

                let gameStat = gameStatReward.GameStat
                let requiredValue = gameStatReward.GameStatValue

                let typeProperty = kittyStats.GameAwardsSorted.GetType().GetProperty(gameStatReward.TypeSorted)
                let nestedProperty = typeProperty.PropertyType.GetProperty(gameStatReward.name)
                let value = nestedProperty.GetValue(typeProperty.GetValue(kittyStats.GameAwardsSorted))

                if (value == 1) continue

                if (gameStat == 'NormalGames' && normalPlusGames >= requiredValue)
                    AwardManager.GiveReward(player, gameStatReward.name)
                else if (gameStat == 'HardGames' && hardPlusGames >= requiredValue)
                    AwardManager.GiveReward(player, gameStatReward.name)
                else if (gameStat == 'ImpossibleGames' && impossiblePlusGames >= requiredValue)
                    AwardManager.GiveReward(player, gameStatReward.name)
                else if (gameStat == 'NormalWins' && normalPlusWins >= requiredValue)
                    AwardManager.GiveReward(player, gameStatReward.name)
                else if (gameStat == 'HardWins' && hardPlusWins >= requiredValue)
                    AwardManager.GiveReward(player, gameStatReward.name)
                else if (gameStat == 'ImpossibleWins' && impossiblePlusWins >= requiredValue)
                    AwardManager.GiveReward(player, gameStatReward.name)
            }
        }
    }

    /// <summary>
    /// Applies all previously selected awards onto the player. Based on their save data.
    /// </summary>
    /// <param name="kitty"></param>
    public static SetPlayerSelectedData(kitty: Kitty) {
        if (kitty.Player.controller != MAP_CONTROL_USER) return // just reduce load, dont include bots.
        if (kitty.Player.slotState != PLAYER_SLOT_STATE_PLAYING) return
        if (Gamemode.CurrentGameMode != GameMode.Standard) return // only apply awards in standard mode (not in tournament modes).
        let selectedData = kitty.SaveData.SelectedData // GameSelectData class object
        Colors.SetColorJoinedAs(kitty.Player)

        const skinValue = (selectedData as any)['SelectedSkin'] as string
        AwardManager.ProcessAward(kitty, skinValue)

        for (const key in selectedData) {
            if (Object.prototype.hasOwnProperty.call(selectedData, key)) {
                const selectedName = (selectedData as any)[key] as string
                AwardManager.ProcessAward(kitty, selectedName)
            }
        }
    }

    private static ProcessAward(kitty: Kitty, selectedAwardName: string) {
        let reward = RewardsManager.Rewards.find(x => x.name == selectedAwardName)
        if (reward === null) return
        reward.ApplyReward(kitty.Player, false)
    }
}
