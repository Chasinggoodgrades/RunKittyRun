using System.Collections.Generic;
using WCSharp.Api;
public static class NoKittyLeftBehind
{
    private static int ItemID;
    private static List<int> CompletedRounds;
    private static int CompletedCount { get; set; } = 0;
    private static int RequiredCount = 3;

    public static void Initialize()
    {
        ItemID = Constants.ITEM_EASTER_EGG_CAT_FIGURINE;
        CompletedRounds = new List<int>();
    }

    public static void CheckChallenge()
    {
        if (Gamemode.CurrentGameMode != "Standard") return;
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
        foreach (var kitty in Globals.ALL_KITTIES)
        {
            if (!Utility.UnitHasItem(kitty.Value.Unit, ItemID)) continue;
            if (AwardManager.ReceivedAwardAlready(kitty.Value.Player, nameof(kitty.Value.SaveData.GameAwardsSorted.Windwalks.WWSwift))) continue;
            kitty.Value.Player.DisplayTimedTextTo(5.0f, $"{Colors.COLOR_LAVENDER}No Kitty Left Behind|r {Colors.COLOR_YELLOW_ORANGE}({CompletedCount}/{RequiredCount})|r");
            if (CompletedCount >= RequiredCount)
            {
                AwardManager.GiveReward(kitty.Value.Player, nameof(kitty.Value.SaveData.GameAwardsSorted.Windwalks.WWSwift));
            }
        }
    }

    private static bool NoOneLeftBehind()
    {
        var region = RegionList.SafeZones[RegionList.SafeZones.Length - 1].Region;
        foreach (var kitty in Globals.ALL_KITTIES)
        {
            if (!region.Contains(kitty.Value.Unit)) return false;
        }
        return true;
    }


}