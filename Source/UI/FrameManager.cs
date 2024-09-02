using WCSharp.Api;
using System;
using static WCSharp.Api.Common;
using System.Collections.Generic;

public static class FrameManager
{
    public static trigger StatsTrigger = CreateTrigger();
    public static trigger ShopTrigger = CreateTrigger();
    public static void Initialize()
    {
        RemoveUnwantedFrames();
        TopCenterBackdrop();
        CreateStatsButton();
        CreateShopButton();
        Utility.SimpleTimer(0.50f, StatsFrame.Initialize);
    }

    private static void RemoveUnwantedFrames()
    {
        BlzFrameSetText(BlzGetFrameByName("ResourceBarSupplyText", 0), "0:00");
        BlzFrameSetVisible(BlzFrameGetChild(BlzFrameGetChild(BlzGetOriginFrame(ORIGIN_FRAME_GAME_UI, 0), 5), 0), false); // Hides time/day display
    }

    private static void CreateStatsButton()
    {
        var statsButton = BlzCreateFrameByType("GLUETEXTBUTTON", "StatsButton", BlzGetOriginFrame(ORIGIN_FRAME_GAME_UI, 0), "DebugButton", 0);
        BlzFrameSetAbsPoint(statsButton, FRAMEPOINT_CENTER, 0.3790f, 0.5823f);
        BlzFrameSetSize(statsButton, 0.043f, 0.022f);
        BlzFrameSetText(statsButton, "Stats");
        StatsTrigger.RegisterFrameEvent(statsButton, FRAMEEVENT_CONTROL_CLICK);
        StatsTrigger.AddAction(StatsFrame.StatsFrameActions);
    }

    private static void CreateShopButton()
    {
        var shopButton = BlzCreateFrameByType("GLUETEXTBUTTON", "ShopButton", BlzGetOriginFrame(ORIGIN_FRAME_GAME_UI, 0), "DebugButton", 0);
        BlzFrameSetAbsPoint(shopButton, FRAMEPOINT_CENTER, 0.4210f, 0.5823f);
        BlzFrameSetSize(shopButton, 0.043f, 0.022f);
        BlzFrameSetText(shopButton, "Shop");
        ShopTrigger.RegisterFrameEvent(shopButton, FRAMEEVENT_CONTROL_CLICK);
        ShopTrigger.AddAction(ShopFrame.ShopFrameActions);
    }

    private static void TopCenterBackdrop()
    {
        var backdrop = BlzCreateFrameByType("BACKDROP", "TopCenterBackdrop", BlzGetOriginFrame(ORIGIN_FRAME_GAME_UI, 0), "QuestButtonDisabledBackdropTemplate", 0);
        BlzFrameSetAbsPoint(backdrop, FRAMEPOINT_CENTER, 0.40f, 0.59f);
        BlzFrameSetSize(backdrop, 0.1f, 0.05f);
    }
}

public static class StatsFrame
{
    private static framehandle StatsFramehandle;
    private static framehandle StatsFrameTitle;
    private static Dictionary<player, Dictionary<int, framehandle>> StatsFrameData = new Dictionary<player, Dictionary<int, framehandle>>();
    private static string[] Headers;
    private static float StatsHeaderX = 0.175f;
    private static float StatsHeaderY = 0.48f;
    public static void Initialize()
    {
        // Parent Backdrop Frame
        StatsFramehandle = BlzCreateFrameByType("BACKDROP", "StatsFrame", BlzGetOriginFrame(ORIGIN_FRAME_GAME_UI, 0), "QuestButtonDisabledBackdropTemplate", 0);
        BlzFrameSetAbsPoint(StatsFramehandle, FRAMEPOINT_CENTER, 0.40f, 0.35f);
        BlzFrameSetSize(StatsFramehandle, 0.6f, 0.4f);

        // Title
        StatsFrameTitle = BlzCreateFrameByType("TEXT", "StatsFrameTitle", StatsFramehandle, "", 0);
        StatsFrameTitle.Text = $"{Colors.COLOR_YELLOW}Overall Stats Chart";
        StatsFrameTitle.SetAbsPoint(FRAMEPOINT_CENTER, 0.4f, 0.51f);
        StatsFrameHeaders();
        StatsFramehandle.Visible = false;
    }

    private static void StatsFrameHeaders()
    {
        Headers = new string[] { "Player", "Saves", "Deaths", "Ratio", "Games", "Wins", "Challenges" };
        // Player, Saves, Deaths ... rest later..
        for (int i = 0; i < Headers.Length; i++)
        {
            var header = BlzCreateFrameByType("TEXT", $"StatsFrameHeader{i}", StatsFramehandle, "", 0);
            header.Text = $"{Colors.COLOR_YELLOW_ORANGE}{Headers[i]}";
            header.SetAbsPoint(FRAMEPOINT_CENTER, StatsHeaderX + (i * 0.075f), StatsHeaderY);
        }
    }

    /// <summary>
    /// Applies columns of data to the stats frame, use only once for initialization.
    /// </summary>
    public static void PopulateStatsFrameData()
    {
        Console.WriteLine("PopulateStatsFrameData");
        try
        {
            var players = Globals.ALL_KITTIES;
            var kittyCount = 0;
            foreach (var kitty in players)
            {
                var player = kitty.Value.Player;
                var data = kitty.Value.SaveData;
                var stats = PlayerStats(player);
                if (!StatsFrameData.ContainsKey(player))
                    StatsFrameData.Add(player, new Dictionary<int, framehandle>());
                for (int i = 0; i < stats.Count; i++)
                {
                    var name = $"StatsFrameDataInfo{kittyCount}";
                    Console.WriteLine(name);
                    var dataFrame = BlzCreateFrameByType("TEXT", name, StatsFramehandle, "", 0);
                    dataFrame.Text = stats[i];
                    dataFrame.SetAbsPoint(FRAMEPOINT_CENTER, StatsHeaderX + (i * 0.075f), StatsHeaderY - (0.02f * (kittyCount + 1)));
                    StatsFrameData[player][i] = dataFrame;
                }
                kittyCount++;
                stats.Clear();
            }
        }
        catch (Exception e)
        {
            Console.WriteLine(e.Message);
        }
    }
    /// <summary>
    /// Updates the stats frame for all players. Call this whenever u want to refresh the frame.
    /// </summary>
    public static void RefreshStatsFrameData()
    {
        var players = Globals.ALL_KITTIES;
        var kittyCount = 0;
        foreach (var kitty in players)
        {
            var player = kitty.Value.Player;
            var data = kitty.Value.SaveData;
            var stats = PlayerStats(player);
            for (int i = 0; i < stats.Count; i++)
            {
                var dataFrame = StatsFrameData[player][i];
                dataFrame.Text = stats[i];
                dataFrame.SetAbsPoint(FRAMEPOINT_CENTER, StatsHeaderX + (i * 0.075f), StatsHeaderY - (0.02f * (kittyCount + 1)));
            }
            kittyCount++;
            stats.Clear();
        }
    }
    /// <summary>
    /// Updates the specificed players stats on the stats frame.
    /// </summary>
    /// <param name="player"></param>
    public static void RefreshStatsFrameData(player player)
    {
        var stats = PlayerStats(player);
        for (int i = 0; i < stats.Count; i++)
        {
            var dataFrame = StatsFrameData[player][i];
            dataFrame.Text = stats[i];
        }
        stats.Clear();
    }

    /// <summary>
    /// Removes the player from stats frame and dispose of the frame.
    /// </summary>
    /// <param name="player"></param>
    public static void RemovePlayerFromStatsFrame(player player)
    {
        if (StatsFrameData.ContainsKey(player))
        {
            foreach (var frame in StatsFrameData[player])
            {
                frame.Value.Visible = false;
                frame.Value.Dispose();
            }
            StatsFrameData.Remove(player);
        }
    }

    /// <summary>
    /// Returns the specified player's stats in a list of strings.
    /// </summary>
    /// <param name="Player"></param>
    /// <returns></returns>
    private static List<string> PlayerStats(player Player)
    {
        var stats = new List<string>();
        var kitty = Globals.ALL_KITTIES[Player];
        var data = kitty.SaveData;

        Console.WriteLine("Updating for Player: " + Player.Name);
        // Header Order... (Name, Saves, Deaths, Ratio, Games, Wins, Challenges)
        stats.Add(Colors.PlayerNameColored(Player));
        stats.Add(data.Saves.ToString());
        stats.Add(data.Deaths.ToString());
        stats.Add(data.Saves == 0 ? "0.00" : (data.Saves / data.Deaths).ToString("F2"));
        stats.Add((data.NormalGames + data.HardGames + data.ImpossibleGames).ToString());
        stats.Add(data.Wins.ToString());
        stats.Add(data.Saves.ToString());
        return stats;
    }

    /// <summary>
    /// Whenever the player presses the stats button, this function shows the frame for that player using local player. 
    /// </summary>
    public static void StatsFrameActions()
    {
        var player = GetTriggerPlayer();
        if (player.IsLocal)
        {
            StatsFramehandle.Visible = !StatsFramehandle.Visible;
        }
    }
}

public static class ShopFrame
{

    public static void ShopFrameActions()
    {

    }

}