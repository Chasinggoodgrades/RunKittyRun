import { Kitty } from 'src/Game/Entities/Kitty/Kitty'
import { Globals } from 'src/Global/Globals'
import { AwardManager } from 'src/Rewards/Rewards/AwardManager'
import { GameAwardsDataSorted } from 'src/SaveSystem2.0/MAKE REWARDS HERE/SaveObjects/GameAwardsDataSorted'
import { CustomStatFrame } from 'src/UI/CustomStatFrame'
import { MultiboardUtil } from 'src/UI/Multiboard/MultiboardUtil'
import { Colors } from 'src/Utility/Colors/Colors'
import { ColorUtils } from 'src/Utility/Colors/ColorUtils'
import { isNullOrEmpty } from 'src/Utility/StringUtils'
import { int, Utility } from 'src/Utility/Utility'
import { MapPlayer } from 'w3ts'
import { GameStatsData } from '../../SaveSystem2.0/MAKE REWARDS HERE/SaveObjects/GameStatsData'
import { PersonalBests } from '../../SaveSystem2.0/MAKE REWARDS HERE/SaveObjects/PersonalBests'
import { RoundTimesData } from '../../SaveSystem2.0/MAKE REWARDS HERE/SaveObjects/RoundTimesData'

export class AwardingCmds {
    /// <summary>
    /// Awards the owning player of the selected <param name="player"/> unit with the given reward input. Use ?award help to see all valid awards. // TODO; Cleanup:     /// Awards the owning player of the selected <paramref name="player"/> unit with the given reward input. Use ?award help to see all valid awards.
    /// </summary>
    /// <param name="player"></param>
    /// <param name="command"></param>
    public static Awarding(player: MapPlayer, args: string[]): void {
        const award = args[0].toLowerCase()
        const selectedUnit = CustomStatFrame.SelectedUnit.get(player)!
        const selectedPlayer = selectedUnit.owner

        if (args[0] === '') return

        if (award.toLowerCase() === 'help') {
            AwardingCmds.AwardingHelp(player)
            return
        }

        if (award.toLowerCase() === 'all') {
            AwardingCmds.AwardAll(player)
            return
        }

        for (const category of Object.keys(Globals.GAME_AWARDS_SORTED)) {
            const subCategory = Globals.GAME_AWARDS_SORTED[category as keyof GameAwardsDataSorted]
            for (const awd of Object.keys(subCategory)) {
                const awardString = awd.toLowerCase()
                const inputAward = award.toLowerCase()

                // Exact match
                if (awardString === inputAward) {
                    AwardManager.GiveReward(selectedPlayer, awd)
                    return
                }
            }
        }

        player.DisplayTimedTextTo(
            3.0,
            `${Colors.COLOR_YELLOW_ORANGE}No valid award found for input: |r${ColorUtils.HighlightString(award)} ${Colors.COLOR_YELLOW_ORANGE}try using ?award help|r`
        )
    }

    private static AwardingHelp(player: MapPlayer) {
        let combined = ''

        for (const category of Object.keys(Globals.GAME_AWARDS_SORTED)) {
            const subCategory = Globals.GAME_AWARDS_SORTED[category as keyof GameAwardsDataSorted]
            for (const awd of Object.keys(subCategory)) {
                combined += awd + ', '
            }
        }

        player.DisplayTimedTextTo(
            15.0,
            `${Colors.COLOR_YELLOW_ORANGE}Valid awards: ${ColorUtils.HighlightString(combined)}`
        )
    }

    private static AwardAll(player: MapPlayer) {
        for (const category of Object.keys(Globals.GAME_AWARDS_SORTED)) {
            const subCategory = Globals.GAME_AWARDS_SORTED[category as keyof GameAwardsDataSorted]
            for (const property of Object.keys(subCategory)) {
                AwardManager.GiveReward(player, property)
            }
        }
    }

    /// <summary>
    /// Sets the specified game stat for the selected player. Use ?gamestats help to see all valid game stats.
    /// </summary>
    /// <param name="player"></param>
    /// <param name="command"></param>
    public static SettingGameStats(player: MapPlayer, args: string[]) {
        let stats = args[0].toLowerCase()
        let selectedUnit = CustomStatFrame.SelectedUnit.get(player)!
        let selectedPlayer = selectedUnit.owner

        if (args[0] === '') return

        if (stats.toLowerCase() === 'help') {
            AwardingCmds.GameStatsHelp(player)
            return
        }

        if (args.length < 2) return

        let value = args[1]

        // Search properties for the name.. If it doesnt exist, say invalid game stat.
        // Then check if the value is actually a proper value.
        for (let prop of Object.keys(Globals.GAME_STATS)) {
            if (prop.toLowerCase() === stats.toLowerCase()) {
                let val: number
                if (!(val = S2I(value)!)) {
                    player.DisplayTimedTextTo(
                        3.0,
                        '{Colors.COLOR_YELLOW_ORANGE}value: Invalid:|r {ColorUtils.HighlightString(value.toString())}'
                    )
                    return
                }

                Globals.ALL_KITTIES.get(selectedPlayer)!.SaveData.GameStats[prop as keyof GameStatsData] = val

                player.DisplayTimedTextTo(
                    3.0,
                    '{Colors.COLOR_YELLOW_ORANGE}Set {ColorUtils.HighlightString(stats)} {Colors.COLOR_YELLOW_ORANGE}to|r {ColorUtils.HighlightString(val.toString())} {Colors.COLOR_YELLOW_ORANGE}for|r {Colors.PlayerNameColored(selectedPlayer)}'
                )
                MultiboardUtil.RefreshMultiboards()
                return
            }
        }
    }

    private static GameStatsHelp(player: MapPlayer) {
        let combined = ''
        for (let property of Object.keys(Globals.GAME_STATS)) {
            combined += property + ', '
        }
        player.DisplayTimedTextTo(
            15.0,
            '{Colors.COLOR_YELLOW_ORANGE}game: stats: Valid: {ColorUtils.HighlightString(combined)}'
        )
    }

    public static SettingGameTimes(player: MapPlayer, args: string[]) {
        let roundTime = args[0].toLowerCase()
        let selectedUnit = CustomStatFrame.SelectedUnit.get(player)!
        let selectedPlayer = selectedUnit.owner

        if (args[0] === '') return

        if (roundTime.toLowerCase() === 'help') {
            AwardingCmds.GameTimesHelp(player)
            return
        }

        if (args.length < 2) return

        let value = args[1]

        // Search properties for the name.. If it doesnt exist, say invalid game stat.
        for (let prop of Object.keys(Globals.GAME_TIMES)) {
            if (prop.toLowerCase() === roundTime.toLowerCase()) {
                let val: number
                if (!(val = S2I(value)!)) {
                    player.DisplayTimedTextTo(
                        3.0,
                        '{Colors.COLOR_YELLOW_ORANGE}value: Invalid:|r {ColorUtils.HighlightString(value.toString())}'
                    )
                    return
                }

                Globals.ALL_KITTIES.get(selectedPlayer)!.SaveData.RoundTimes[prop as keyof RoundTimesData] = val

                player.DisplayTimedTextTo(
                    3.0,
                    '{Colors.COLOR_YELLOW_ORANGE}Set {ColorUtils.HighlightString(roundTime)} {Colors.COLOR_YELLOW_ORANGE}to|r {ColorUtils.HighlightString(val.toString())} {Colors.COLOR_YELLOW_ORANGE}for|r {Colors.PlayerNameColored(selectedPlayer)}{Colors.COLOR_RESET}'
                )
                MultiboardUtil.RefreshMultiboards()
                return
            }
        }
    }

    private static GameTimesHelp(player: MapPlayer) {
        let combined = ''
        for (let property of Object.keys(Globals.GAME_TIMES)) {
            combined += property + ', '
        }
        player.DisplayTimedTextTo(
            15.0,
            '{Colors.COLOR_YELLOW_ORANGE}game: times: Valid: {ColorUtils.HighlightString(combined)}'
        )
    }

    /// <summary>
    /// Gets the game stats of the passed Kitty obj, and displays it to the player.
    /// </summary>
    /// <param name="player"></param>
    /// <param name="kitty"></param>
    public static GetAllGameStats(player: MapPlayer, kitty: Kitty) {
        if (!Globals.ALL_PLAYERS.includes(player)) return
        let combined = ''
        for (let property of Object.keys(Globals.GAME_STATS)) {
            let value = Globals.ALL_KITTIES.get(player)!.SaveData.GameStats[property as keyof GameStatsData]
            combined +=
                '{Colors.COLOR_YELLOW_ORANGE}{Utility.FormatAwardName(property.name)}{Colors.COLOR_RESET}: {value}\n'
        }
        player.DisplayTimedTextTo(
            15.0,
            '{Colors.COLOR_YELLOW}stats: for: Game {Colors.PlayerNameColored(player)}:\n{ColorUtils.HighlightString(combined)}{Colors.COLOR_RESET}'
        )
    }

    /// <summary>
    /// Gets the best personal bests of the passed Kitty obj, and displays it to the player.
    /// </summary>
    /// <param name="player"></param>
    /// <param name="kitty"></param>
    public static GetAllPersonalBests(player: MapPlayer, kitty: Kitty) {
        if (!Globals.ALL_PLAYERS.includes(kitty.Player)) return
        let combined = ''
        let personalBests = kitty.SaveData.PersonalBests
        for (let property of Object.keys(personalBests)) {
            let value = personalBests[property as keyof PersonalBests]
            combined +=
                '{Colors.COLOR_YELLOW_ORANGE}{Utility.FormatAwardName(property.name)}{Colors.COLOR_RESET}: {value}\n'
        }
        player.DisplayTimedTextTo(
            15.0,
            '{Colors.COLOR_YELLOW}bests: for: Personal {Colors.PlayerNameColored(kitty.Player)}:\n{ColorUtils.HighlightString(combined)}{Colors.COLOR_RESET}'
        )
    }

    /// <summary>
    /// Gets the best game times of the passed Kitty obj, and displays it to the player.
    /// </summary>
    /// <param name="player"></param>
    /// <param name="kitty"></param>
    public static GetAllGameTimes(player: MapPlayer, kitty: Kitty, difficultyArg: string) {
        if (!Globals.ALL_PLAYERS.includes(kitty.Player)) return
        let combined: string = ''

        // Previously this wasn't sorted by round number, so i had to hard code the order with one two three etc.. but ye its sorted now
        let properties = Object.keys(Globals.GAME_TIMES)
            .filter(p => isNullOrEmpty(difficultyArg) || p.toLowerCase().includes(difficultyArg.toLowerCase()))
            .sort((a, b) => AwardingCmds.GetRoundNumber(a) - AwardingCmds.GetRoundNumber(b))

        for (const property of properties) {
            let value = kitty.SaveData.RoundTimes[property as keyof RoundTimesData]

            let color: string = property.includes('Normal')
                ? Colors.COLOR_YELLOW
                : property.includes('Hard')
                  ? Colors.COLOR_RED
                  : property.includes('Impossible')
                    ? Colors.COLOR_DARK_RED
                    : Colors.COLOR_YELLOW_ORANGE // Default fallback

            combined += `${color}${Utility.FormatAwardName(property)}${Colors.COLOR_RESET}: ${Utility.ConvertFloatToTimeInt(value)}\n`
        }

        player.DisplayTimedTextTo(
            15.0,
            `${Colors.COLOR_YELLOW}times: for: Game ${ColorUtils.PlayerNameColored(kitty.Player)}:\n${ColorUtils.HighlightString(combined)}${Colors.COLOR_RESET}`
        )
    }

    private static GetRoundNumber(propertyName: string) {
        if (propertyName.includes('One')) return 1
        if (propertyName.includes('Two')) return 2
        if (propertyName.includes('Three')) return 3
        if (propertyName.includes('Four')) return 4
        if (propertyName.includes('Five')) return 5

        return int.MaxValue
    }

    /// <summary>
    /// Gets the kibble currency of the passed Kitty obj, and displays it to the player.
    /// </summary>
    /// <param name="player"></param>
    /// <param name="kitty"></param>
    public static GetKibbleCurrencyInfo(player: MapPlayer, kitty: Kitty) {
        if (!Globals.ALL_PLAYERS.includes(kitty.Player)) return
        let combined = ''
        const kibbleCurrency = kitty.SaveData.KibbleCurrency
        for (const property of Object.keys(kibbleCurrency)) {
            const value = (property as any).GetValue(kibbleCurrency)
            combined += `${Colors.COLOR_YELLOW_ORANGE}${Utility.FormatAwardName((property as any).name)}${Colors.COLOR_RESET}: ${value}\n`
        }
        const nameColored = ColorUtils.PlayerNameColored(kitty.Player)
        player.DisplayTimedTextTo(
            15.0,
            `${Colors.COLOR_YELLOW}Kibble: Info: Overall|r (${nameColored})\n${ColorUtils.HighlightString(combined)}\n${Colors.COLOR_YELLOW}Game: Info: Current:|r (${nameColored})\n${AwardingCmds.CurrentKibbleInfo(kitty)}${Colors.COLOR_RESET}`
        )
    }

    private static CurrentKibbleInfo(kitty: Kitty) {
        let combined: string = ''
        combined += '{Colors.COLOR_YELLOW_ORANGE}Collected:|r {kitty.CurrentStats.CollectedKibble}\n'
        combined += '{Colors.COLOR_YELLOW_ORANGE}Jackpots:|r {kitty.CurrentStats.CollectedJackpots}\n'
        combined += '{Colors.COLOR_YELLOW_ORANGE}Jackpots: Super:|r {kitty.CurrentStats.CollectedSuperJackpots}\n'
        return combined
    }
}
