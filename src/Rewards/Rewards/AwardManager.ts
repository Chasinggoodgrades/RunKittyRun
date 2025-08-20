import { Logger } from 'src/Events/Logger/Logger'
import { Kitty } from 'src/Game/Entities/Kitty/Kitty'
import { CurrentGameMode } from 'src/Gamemodes/CurrentGameMode'
import { GameMode } from 'src/Gamemodes/GameModeEnum'
import { Globals } from 'src/Global/Globals'
import { KittyData } from 'src/SaveSystem2.0/MAKE REWARDS HERE/KittyData'
import { SaveManager } from 'src/SaveSystem2.0/SaveManager'
import { RewardHelper } from 'src/UI/Frames/RewardHelper'
import { Colors } from 'src/Utility/Colors/Colors'
import { ColorUtils } from 'src/Utility/Colors/ColorUtils'
import { Utility } from 'src/Utility/Utility'
import { MapPlayer, Trigger } from 'w3ts'
import { GameAwardsDataSorted } from '../../SaveSystem2.0/MAKE REWARDS HERE/SaveObjects/GameAwardsDataSorted'
import { GameSelectedData } from '../../SaveSystem2.0/MAKE REWARDS HERE/SaveObjects/GameSelectedData'
import { GameStatsData } from '../../SaveSystem2.0/MAKE REWARDS HERE/SaveObjects/GameStatsData'
import { GameStatRewards } from './GameStatRewards'
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
    public static GiveReward = (player: MapPlayer, award: string, earnedPrompt: boolean = true) => {
        // Check if the player already has the award
        if (!Globals.ALL_KITTIES.get(player)!.CanEarnAwards) return
        const awardsList = Globals.ALL_KITTIES.get(player)!.CurrentStats.ObtainedAwards

        if (awardsList.includes(award)) return

        const saveData = Globals.ALL_KITTIES.get(player)!.SaveData
        const reward = RewardsManager.Rewards.find(x => x.SystemRewardName() === award.toString())

        if (!reward) {
            print('Reward not found.')
            return
        }

        RewardHelper.UpdateNestedProperty(saveData.GameAwardsSorted, reward.TypeSorted, award, 1)

        AwardManager.EnableAbility(player, award)

        // ex: PurpleFire should be Purple Fire
        const awardFormatted = Utility.FormatAwardName(award)
        if (earnedPrompt) {
            Utility.TimedTextToAllPlayers(
                5.0,
                `${ColorUtils.PlayerNameColored(player)} has earned ${Colors.COLOR_YELLOW}${awardFormatted}.|r`
            )
            awardsList.push(award)
        }
    }

    /// <summary>
    /// Gives reward to all players, set Prompt to false if you don't want to show the earned prompt.
    /// </summary>
    /// <param name="award"></param>
    public static GiveRewardAll = (award: string, earnedPrompt: boolean = true) => {
        const color = Colors.COLOR_YELLOW_ORANGE
        const rewardColor = Colors.COLOR_YELLOW
        for (const player of Globals.ALL_PLAYERS) AwardManager.GiveReward(player, award, false)
        if (earnedPrompt)
            Utility.TimedTextToAllPlayers(
                5.0,
                `${color}Congratulations! Everyone has earned|r ${rewardColor}${Utility.FormatAwardName(award)}.|r`
            )
    }

    private static EnableAbility = (player: MapPlayer, award: string) => {
        const reward = RewardsManager.Rewards.find(x => x.SystemRewardName() === award.toString())!
        const kitty = Globals.ALL_KITTIES.get(player)!.Unit
        if (!reward) return
        kitty.disableAbility(reward.GetAbilityID(), false, false)
    }

    public static ReceivedAwardAlready = (player: MapPlayer, award: string) => {
        return Globals.ALL_KITTIES.get(player)!.CurrentStats.ObtainedAwards.includes(award)
    }

    /// <summary>
    /// Registers all gamestats for each player to earn rewards.
    /// Ex. If less than 200 saves, itll add every game stat to check periodically. to see if you've hit or gone over said value.
    /// </summary>
    public static RegisterGamestatEvents = () => {
        try {
            const gameStatsToIgnore = [
                'NormalGames',
                'HardGames',
                'ImpossibleGames',
                'NormalWins',
                'HardWins',
                'ImpossibleWins',
                'NitrosObtained',
            ]

            if (CurrentGameMode.active !== GameMode.Standard) return
            for (const player of Globals.ALL_PLAYERS) {
                if (player.controller !== MAP_CONTROL_USER) continue // no bots, reduce triggers;
                if (player.slotState !== PLAYER_SLOT_STATE_PLAYING) continue // no obs, no leavers.

                let kittyProfile
                if (!(kittyProfile = Globals.ALL_KITTIES.get(player)) /* TODO; Prepend: let */) {
                    let saveData
                    if (!(saveData = SaveManager.SaveData.get(player)) /* TODO; Prepend: let */) {
                        Logger.Critical(
                            `Save data wasn't finished loading / SaveData not found. Defaulting for ${player}.`
                        )
                        Globals.ALL_KITTIES.get(player)!.SaveData = new KittyData()
                        continue
                    }
                    Globals.ALL_KITTIES.get(player)!.SaveData = saveData
                    kittyProfile = Globals.ALL_KITTIES.get(player)!
                }

                if (kittyProfile.SaveData === null) {
                    kittyProfile.SaveData = new KittyData()
                }

                const gameStats = kittyProfile.SaveData.GameStats

                for (const gameStatReward of GameStatRewards) {
                    const gamestat = gameStatReward.GameStat
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
            AwardManager.AwardTrigger.registerTimerEvent(1.0, true)
        } catch (e) {
            Logger.Critical(`Error in AwardManager.RegisterGamestatEvents: ${e}`)
        }
    }

    private static HandleGameStatTrigger = (
        player: MapPlayer,
        kittyStats: KittyData,
        gamestat: string,
        requiredValue: number,
        award: string
    ) => {
        const value = kittyStats.GameStats[gamestat as keyof GameStatsData]
        if (value < requiredValue) {
            const abc = AwardManager.AwardTrigger.addAction(() => {
                if (kittyStats.GameStats[gamestat as keyof GameStatsData] < requiredValue) return
                AwardManager.GiveReward(player, award)
                AwardManager.AwardTrigger.removeAction(abc)
            })
        }
    }

    public static AwardGameStatRewards = () => {
        if (CurrentGameMode.active !== GameMode.Standard) return
        for (const player of Globals.ALL_PLAYERS) {
            if (player.controller !== MAP_CONTROL_USER) continue // no bots, reduce triggers
            if (player.slotState !== PLAYER_SLOT_STATE_PLAYING) continue // no obs, no leavers

            const kittyStats = Globals.ALL_KITTIES.get(player)!.SaveData
            const gameStats = kittyStats.GameStats

            const normalGames = gameStats.NormalGames
            const hardGames = gameStats.HardGames
            const impossibleGames = gameStats.ImpossibleGames

            const normalWins = gameStats.NormalWins
            const hardWins = gameStats.HardWins
            const impossibleWins = gameStats.ImpossibleWins

            const normalPlusGames = normalGames + hardGames + impossibleGames
            const normalPlusWins = normalWins + hardWins + impossibleWins

            const hardPlusGames = hardGames + impossibleGames
            const hardPlusWins = hardWins + impossibleWins

            const impossiblePlusGames = impossibleGames
            const impossiblePlusWins = impossibleWins

            for (const gameStatReward of GameStatRewards) {
                if (
                    gameStatReward.GameStat !== 'NormalGames' &&
                    gameStatReward.GameStat !== 'HardGames' &&
                    gameStatReward.GameStat !== 'ImpossibleGames' &&
                    gameStatReward.GameStat !== 'NormalWins' &&
                    gameStatReward.GameStat !== 'HardWins' &&
                    gameStatReward.GameStat !== 'ImpossibleWins'
                )
                    continue

                const gameStat = gameStatReward.GameStat
                const requiredValue = gameStatReward.GameStatValue

                const typeProperty =
                    kittyStats.GameAwardsSorted[gameStatReward.TypeSorted as keyof GameAwardsDataSorted]
                const nestedProperty = (typeProperty as any)[gameStatReward.name]
                const value = nestedProperty

                if (value === 1) continue

                if (gameStat === 'NormalGames' && normalPlusGames >= requiredValue)
                    AwardManager.GiveReward(player, gameStatReward.name)
                else if (gameStat === 'HardGames' && hardPlusGames >= requiredValue)
                    AwardManager.GiveReward(player, gameStatReward.name)
                else if (gameStat === 'ImpossibleGames' && impossiblePlusGames >= requiredValue)
                    AwardManager.GiveReward(player, gameStatReward.name)
                else if (gameStat === 'NormalWins' && normalPlusWins >= requiredValue)
                    AwardManager.GiveReward(player, gameStatReward.name)
                else if (gameStat === 'HardWins' && hardPlusWins >= requiredValue)
                    AwardManager.GiveReward(player, gameStatReward.name)
                else if (gameStat === 'ImpossibleWins' && impossiblePlusWins >= requiredValue)
                    AwardManager.GiveReward(player, gameStatReward.name)
            }
        }
    }

    /// <summary>
    /// Applies all previously selected awards onto the player. Based on their save data.
    /// </summary>
    /// <param name="kitty"></param>
    public static SetPlayerSelectedData = (kitty: Kitty) => {
        if (kitty.Player.controller !== MAP_CONTROL_USER) return // just reduce load, dont include bots.
        if (kitty.Player.slotState !== PLAYER_SLOT_STATE_PLAYING) return
        if (CurrentGameMode.active !== GameMode.Standard) return // only apply awards in standard mode (not in tournament modes).
        const selectedData = kitty.SaveData.SelectedData // GameSelectData class object
        ColorUtils.SetColorJoinedAs(kitty.Player)

        AwardManager.ProcessAward(kitty, selectedData.SelectedSkin)

        for (const key of Object.keys(selectedData)) {
            if (selectedData[key as keyof GameSelectedData]) {
                const selectedName = selectedData[key as keyof GameSelectedData]
                AwardManager.ProcessAward(kitty, selectedName)
            }
        }
    }

    private static ProcessAward = (kitty: Kitty, selectedAwardName: string) => {
        const reward = RewardsManager.Rewards.find(x => x.name === selectedAwardName)
        if (!reward) return
        reward.ApplyReward(kitty.Player, false)
    }
}
