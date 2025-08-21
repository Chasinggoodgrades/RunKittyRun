import { Kitty } from 'src/Game/Entities/Kitty/Kitty'
import { Globals } from 'src/Global/Globals'
import { Difficulty } from 'src/Init/Difficulty/Difficulty'
import { DifficultyLevel } from 'src/Init/Difficulty/DifficultyOption'
import { DateTimeManager } from 'src/Seasonal/DateTimeManager'
import { ColorUtils } from 'src/Utility/Colors/ColorUtils'
import { isNullOrEmpty } from '../Utility/StringUtils'

export class GameoverUtil {
    public static SetBestGameStats = () => {
        for (const [_, kitty] of Globals.ALL_KITTIES) {
            switch (Difficulty.DifficultyValue) {
                case DifficultyLevel.Normal:
                    GameoverUtil.SetNormalGameStats(kitty)
                    break

                case DifficultyLevel.Hard:
                    GameoverUtil.SetHardGameStats(kitty)
                    break

                case DifficultyLevel.Impossible:
                    GameoverUtil.SetImpossibleGameStats(kitty)
                    break
                case DifficultyLevel.Nightmare:
                    GameoverUtil.SetNightmareGameStats(kitty)
                    break
            }
        }
    }

    public static SetColorData = () => {
        for (const [_, kitty] of Globals.ALL_KITTIES) {
            ColorUtils.PopulateColorsData(kitty) // make sure its populated
            ColorUtils.UpdateColors(kitty) //
            ColorUtils.GetMostPlayedColor(kitty)
        }
    }

    public static SetFriendData = () => {
        const friendDict: Map<string, number> = new Map()

        for (const [_, kitty] of Globals.ALL_KITTIES) {
            const friendsPlayedWith = kitty.SaveData.FriendsData.FriendsPlayedWith

            friendDict.clear()

            // Splitting / Parsing the data of playerName:count pairs
            if (!isNullOrEmpty(friendsPlayedWith)) {
                for (const entry of friendsPlayedWith.split(',').filter(v => !!v)) {
                    const parts = entry.split(':')
                    let count
                    if (parts.length === 2 && (count = S2I(parts[1].trim()))) {
                        friendDict.set(parts[0].trim(), count)
                    }
                }
            }

            // takes all in-game kitties, increments count if they're present in dictionary else set to 1
            for (const [_, other] of Globals.ALL_KITTIES) {
                if (other === kitty) continue
                const friendName = other.Player.name // Get their full battle tag

                if (friendDict.has(friendName)) {
                    friendDict.set(friendName, (friendDict.get(friendName) || 0) + 1)
                } else {
                    friendDict.set(friendName, 1)
                }
            }

            // Yoshi said if this wasn't sorted she was gonna hurt me, SO HERE IT IS .. Order By DESC!!
            kitty.SaveData.FriendsData.FriendsPlayedWith = Array.from(friendDict.entries())
                .sort((a, b) => b[1] - a[1])
                .map(([key, value]) => `${key}:${value}`)
                .join(', ')
        }
    }

    private static SetNormalGameStats = (kitty: Kitty) => {
        const stats = kitty.SaveData.BestGameTimes.NormalGameTime
        if (Globals.GAME_TIMER.remaining > stats.Time && stats.Time !== 0) return
        stats.Time = Globals.GAME_TIMER.remaining
        stats.Date = DateTimeManager.DateTime.toString()
        stats.TeamMembers = GameoverUtil.GetTeamMembers()
    }

    private static SetHardGameStats = (kitty: Kitty) => {
        const stats = kitty.SaveData.BestGameTimes.HardGameTime
        if (Globals.GAME_TIMER.remaining > stats.Time && stats.Time !== 0) return
        stats.Time = Globals.GAME_TIMER.remaining
        stats.Date = DateTimeManager.DateTime.toString()
        stats.TeamMembers = GameoverUtil.GetTeamMembers()
    }

    private static SetImpossibleGameStats = (kitty: Kitty) => {
        const stats = kitty.SaveData.BestGameTimes.ImpossibleGameTime
        if (Globals.GAME_TIMER.remaining > stats.Time && stats.Time !== 0) return
        stats.Time = Globals.GAME_TIMER.remaining
        stats.Date = DateTimeManager.DateTime.toString()
        stats.TeamMembers = GameoverUtil.GetTeamMembers()
    }

    private static SetNightmareGameStats = (kitty: Kitty) => {
        const stats = kitty.SaveData.BestGameTimes.NightmareGameTime
        if (Globals.GAME_TIMER.remaining > stats.Time && stats.Time !== 0) return
        stats.Time = Globals.GAME_TIMER.remaining
        stats.Date = DateTimeManager.DateTime.toString()
        stats.TeamMembers = GameoverUtil.GetTeamMembers()
    }

    private static GetTeamMembers(): string {
        return Globals.ALL_PLAYERS.filter(player => player.controller !== MAP_CONTROL_COMPUTER)
            .map(player => player.name)
            .join(', ')
    }
}
