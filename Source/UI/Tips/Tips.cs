using System.Collections.Generic;
using WCSharp.Api;
public static class Tips
{
    private static List<string> TipsList = new List<string>();

    private static void RefillTipsList()
    {
        TipsList.Add($"Don't forget, you can buy boots from the kitty shops around the map!");
        TipsList.Add($"Use Protection of the Ancients if you think you'll die.");
        TipsList.Add($"Upon reaching level 10, you can purchase relics from the shop button! Hotkey: {Colors.COLOR_RED}\"=\"{Colors.COLOR_RESET}");
        TipsList.Add($"This version of RKR has a save system! Complete the challenges to unlock the rewards :)");
        TipsList.Add($"Don't forget to upload your stats after the game in discord! You can checkout the leaderboards");
    }

    private static string GetTip()
    {
        if (TipsList.Count == 0) RefillTipsList();
        var tip = Colors.COLOR_GREEN + TipsList[0] + Colors.COLOR_RESET;
        TipsList.RemoveAt(0);
        return tip;
    }

    public static void DisplayTip() => Utility.TimedTextToAllPlayers(7.0f, GetTip());
}