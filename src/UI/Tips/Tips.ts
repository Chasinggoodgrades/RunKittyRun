import { Colors } from 'src/Utility/Colors/Colors'
import { Utility } from 'src/Utility/Utility'

export class Tips {
    private static TipsList: string[] = []

    private static RefillTipsList() {
        Tips.TipsList.push("Don't forget, you can buy boots from the kitty shops around the map!")
        Tips.TipsList.push("Use Protection of the Ancients if you think you'll die.")
        Tips.TipsList.push(
            `Upon reaching level 10, you can purchase relics from the shop button! Hotkey: ${Colors.COLOR_RED}"="${Colors.COLOR_RESET}`
        )
        Tips.TipsList.push('This version of RKR has a save system! Complete the challenges to unlock the rewards :)')
        Tips.TipsList.push(
            "Don't forget to upload your stats after the game in discord! You can checkout the leaderboards"
        )
    }

    private static GetTip(): string {
        if (Tips.TipsList.length === 0) Tips.RefillTipsList()
        let tip = Colors.COLOR_GREEN + Tips.TipsList[0] + Colors.COLOR_RESET
        Tips.TipsList.shift()
        return tip
    }

    public static DisplayTip() {
        return Utility.TimedTextToAllPlayers(7.0, Tips.GetTip())
    }
}
