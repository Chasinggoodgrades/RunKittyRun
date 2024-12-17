using System.Collections.Generic;
using WCSharp.Api;
public static class NoKittyLeftBehind
{
    private static int ItemID;
    private static List<int> CompletedRounds;
    private static int CompletedCount { get; set; } = 0;
    private static int LastCheckedRound = 0;
    private static int RequiredCount = 3;

    public static void Initialize()
    {
        ItemID = Constants.ITEM_CAT_FIGURINE;
        CompletedRounds = new List<int>();
    }

    public static void CheckChallenge()
    {
        if(Gamemode.CurrentGameMode != "Standard") return;
        if (!NoOneLeftBehind()) return;
        IncrementCompletedCount();
        SendMessage();
    }

    private static void IncrementCompletedCount()
    {
        var round = Globals.ROUND;
        if (CompletedRounds.Contains(round)) return;
        CompletedRounds.Add(round);
        CompletedCount++;
        SendMessage();
    }

    private static void SendMessage()
    {
        foreach(var kitty in Globals.ALL_KITTIES.Values)
        {
            if (!Utility.UnitHasItem(kitty.Unit, ItemID)) continue;
            if (AwardManager.ReceivedAwardAlready(kitty.Player, Awards.WW_Swift)) continue;
            kitty.Player.DisplayTimedTextTo(5.0f, $"{Colors.COLOR_LAVENDER}No Kitty Left Behind|r {Colors.COLOR_YELLOW_ORANGE}({CompletedCount}/{RequiredCount})|r");
            if(CompletedCount >= RequiredCount) AwardManager.GiveReward(kitty.Player, Awards.WW_Swift);
        }
    }

    private static bool NoOneLeftBehind()
    {
        var region = RegionList.SafeZones[RegionList.SafeZones.Length - 1].Region;
        foreach (var kitty in Globals.ALL_KITTIES.Values)
        {
            if (!region.Contains(kitty.Unit)) return false;
        }
        return true;
    }

}