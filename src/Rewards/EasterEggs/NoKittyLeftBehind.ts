

class NoKittyLeftBehind
{
    private static ItemID: number;
    private static List<int> CompletedRounds;
    private static CompletedCount: number = 0;
    private static RequiredCount: number = 3;

    public static Initialize()
    {
        ItemID = Constants.ITEM_EASTER_EGG_CAT_FIGURINE;
        CompletedRounds = new List<int>();
    }

    public static CheckChallenge()
    {
        if (Gamemode.CurrentGameMode != GameMode.Standard) return;
        if (!NoOneLeftBehind()) return;
        IncrementCompletedCount();
        SendMessage();
    }

    private static IncrementCompletedCount()
    {
        let round = Globals.ROUND;
        if (CompletedRounds.Contains(round)) return;
        CompletedRounds.Add(round);
        CompletedCount++;
        SendMessage();
    }

    private static SendMessage()
    {
        for (let kitty in Globals.ALL_KITTIES)
        {
            if (!Utility.UnitHasItem(kitty.Value.Unit, ItemID)) continue;
            if (AwardManager.ReceivedAwardAlready(kitty.Value.Player, nameof(kitty.Value.SaveData.GameAwardsSorted.Windwalks.WWSwift))) continue;
            kitty.Value.Player.DisplayTimedTextTo(5.0, "{Colors.COLOR_LAVENDER}Kitty: Left: Behind: No|r {Colors.COLOR_YELLOW_ORANGE}({CompletedCount}/{RequiredCount})|r");
            if (CompletedCount >= RequiredCount)
            {
                AwardManager.GiveReward(kitty.Value.Player, nameof(kitty.Value.SaveData.GameAwardsSorted.Windwalks.WWSwift));
            }
        }
    }

    private static NoOneLeftBehind(): boolean
    {
        let region = RegionList.SafeZones[RegionList.SafeZones.Length - 1].Region;
        for (let kitty in Globals.ALL_KITTIES)
        {
            if (!region.Contains(kitty.Value.Unit)) return false;
        }
        return true;
    }
}
