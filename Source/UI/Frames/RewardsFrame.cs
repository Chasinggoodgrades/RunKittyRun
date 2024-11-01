using System;
using System.Collections.Generic;
using WCSharp.Api;
public static class RewardsFrame
{
    private static framehandle RewardFrame;
    private static framehandle GameUI = originframetype.GameUI.GetOriginFrame(0);
    private static framehandle TempHandle;
    private static Dictionary<string, framehandle> FrameByName = new Dictionary<string, framehandle>();
    private static int RewardsPerRow = 10;
    private static float FrameX = 0.4f;
    private static float FrameY = 0.35f;
    private static float FrameWidth = 0.30f;
    private static float FrameHeight = 0.16f;
    private static float Padding = 0.01f;
    private static float PanelWidth = FrameWidth - Padding * 2;
    private static float PanelHeight;
    private static string FrameTitle = $"{Colors.COLOR_YELLOW}Rewards{Colors.COLOR_RESET}";
    public static void Initialize()
    {
        try
        {
            RewardFrame = CreateRewardFrame();
            TempHandle = RewardFrame;
            CountRewardFrames();
        }
        catch (Exception e)
        {
            Console.WriteLine(e);
            throw;
        }
    }

    private static framehandle CreateRewardFrame()
    {
        RewardFrame = framehandle.Create("BACKDROP", "RewardFrame", GameUI, "QuestButtonPushedBackdropTemplate", 0);
        RewardFrame.SetAbsPoint(framepointtype.Center, FrameX, FrameY);
        RewardFrame.SetSize(FrameWidth, FrameHeight);

        var title = framehandle.Create("TEXT", "RewardFrameTitle", RewardFrame, "", 0);
        title.SetPoint(framepointtype.Top, 0, -Padding, RewardFrame, framepointtype.Top);
        title.Text = FrameTitle;

        RewardFrame.Visible = false;
        return RewardFrame;
    }

    private static void CountRewardFrames()
    {
        var count = 0;
        var colCount = 0;
        foreach(var type in Enum.GetValues(typeof(RewardType)))
        {
            var numberOfRewards = CountNumberOfRewards((RewardType)type);
            if (numberOfRewards == 0) continue;
            colCount = numberOfRewards / RewardsPerRow + 1;
            // Create panel based on number of columns
            InitializePanels(Enum.GetName(typeof(RewardType), type), colCount);
            count += colCount;
        }
        Console.WriteLine($"There are {count} types");
        RewardFrame.SetSize(FrameWidth, FrameHeight + (count * 0.02f));
    }

    private static int CountNumberOfRewards(RewardType type)
    {
        var count = 0;
        foreach(var reward in RewardsManager.Rewards)
        {
            if (reward.Type == type) count++;
        }
        Console.WriteLine($"There are {count} rewards of type {type}");
        return count;
    }
    private static void InitializePanels(string name, float colHeight)
    {
        var panelWidth = FrameWidth - Padding * 2;
        CreatePanel(TempHandle, 0, -Padding*2, FrameWidth - Padding * 2, colHeight * 0.04f, name);
    }

    private static framehandle CreatePanel(framehandle parent, float x, float y, float width, float height, string title)
    {
        var framePoint = framepointtype.BottomLeft;
        if(parent == RewardFrame) framePoint = framepointtype.TopLeft;
        if (parent == RewardFrame) x = Padding;

        var panel = framehandle.Create("BACKDROP", $"{title}", parent, "QuestButtonDisabledBackdropTemplate", 0);
        panel.SetPoint(framePoint, x, y, parent, framePoint);
        panel.SetSize(width, height);

        // title above each panel 
        var panelTitle = framehandle.Create("TEXT", "RewardPanelTitle", panel, "", 0);
        panelTitle.SetPoint(framepointtype.TopLeft, 0, Padding, panel, framepointtype.TopLeft);
        panelTitle.Text = title;

        TempHandle = panel;

        FrameByName.Add(title, panel);

        return panel;
    }

    public static void RewardsFrameActions()
    {
        var player = @event.Player;
        if (!player.IsLocal) return;
        RewardFrame.Visible = !RewardFrame.Visible;
        if (RewardFrame.Visible) MultiboardUtil.MinMultiboards(player, true);
        else MultiboardUtil.MinMultiboards(player, false);
    }


}