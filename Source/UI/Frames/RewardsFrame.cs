﻿using System;
using System.Collections.Generic;
using System.Linq;
using System.Xml.Linq;
using WCSharp.Api;
using static WCSharp.Api.Common;
public static class RewardsFrame
{
    private static framehandle RewardFrame;
    private static framehandle GameUI = originframetype.GameUI.GetOriginFrame(0);
    private static framehandle TempHandle;
    private static Dictionary<string, framehandle> FrameByName = new Dictionary<string, framehandle>();
    private static Dictionary<framehandle, Reward> RewardIcons = new Dictionary<framehandle, Reward>();
    private static int RewardsPerRow = 6;
    private static float FrameX = 0.4f;
    private static float FrameY = 0.35f;
    private static float FrameWidth = 0.30f;
    private static float FrameHeight = 0.25f;
    private static float Padding = 0.01f;
    private static float IconSize = 0.02f;
    private static int FrameCount = 0;
    private static string FrameTitle = $"{Colors.COLOR_YELLOW}Rewards{Colors.COLOR_RESET}";
    public static void Initialize()
    {
        RewardFrame = CreateRewardFrame();
        TempHandle = RewardFrame;
        CountRewardFrames();
        AppendRewardsToFrames();
    }

    private static framehandle CreateRewardFrame()
    {
        RewardFrame = framehandle.Create("BACKDROP", "RewardFrame", GameUI, "QuestButtonPushedBackdropTemplate", 0);
        RewardFrame.SetAbsPoint(framepointtype.Center, FrameX, FrameY);
        RewardFrame.SetSize(FrameWidth, FrameHeight);

        RewardFrame.Visible = false;
        return RewardFrame;
    }

    private static void CountRewardFrames()
    {
        var count = 0;
        var colCount = 0;
        var rewardTypes = Enum.GetValues(typeof(RewardType)).Cast<RewardType>().OrderBy(rt => (int)rt).ToList();

        foreach (var type in rewardTypes)
        {
            var numberOfRewards = CountNumberOfRewards(type);
            if (numberOfRewards == 0) continue;

            colCount = numberOfRewards / RewardsPerRow;
            if (numberOfRewards % RewardsPerRow != 0) colCount++;
            if (colCount == 0) colCount = 1;

            // Create panel based on number of columns
            InitializePanels(Enum.GetName(typeof(RewardType), type), colCount);
            count += colCount;
            FrameCount++;
        }
        Console.WriteLine($"There are {count} types");
    }


    /* Expand upon size of frame depending on count if it's so wished.
    RewardFrame.SetSize(FrameWidth, FrameHeight + (count * 0.02f)); */

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
    private static void InitializePanels(string name, float colCount)
    {
        var y = -Padding;
        var width = (FrameWidth - Padding * 2)/2;
        var height = (colCount == 1) ? 0.03f : 0.03f + ((colCount - 1) * 0.02f);
        CreatePanel(TempHandle, 0, y, width, height, name);
    }

    private static framehandle CreatePanel(framehandle parent, float x, float y, float width, float height, string title)
    {
        var framePoint1 = framepointtype.TopLeft;
        var framePoint2 = framepointtype.BottomLeft;
        if(parent == RewardFrame) framePoint2 = framepointtype.TopLeft;
        if(parent == RewardFrame) x = Padding;
        if(parent == RewardFrame) y = -Padding * 2;
        if (FrameCount == 4)
        {
            parent = RewardFrame;
            framePoint1 = framepointtype.TopRight;
            framePoint2 = framepointtype.TopRight;
            x = -Padding;
            y = -Padding * 2;
        }

        var panel = framehandle.Create("BACKDROP", $"{title}", parent, "QuestButtonDisabledBackdropTemplate", 0);
        panel.SetPoint(framePoint1, x, y, parent, framePoint2);
        panel.SetSize(width, height);

        // title above each panel 
        var panelTitle = framehandle.Create("TEXT", "RewardPanelTitle", panel, "", 0);
        panelTitle.SetPoint(framepointtype.TopLeft, 0, Padding, panel, framepointtype.TopLeft);
        panelTitle.Text = title;

        TempHandle = panel;

        FrameByName.Add(title, panel);

        return panel;
    }

    private static void AppendRewardsToFrames()
    {
        var cols = RewardsPerRow;
        var count = new Dictionary<RewardType, int>();

        // Initialize the count dictionary with zeros
        foreach (RewardType type in Enum.GetValues(typeof(RewardType)))
        {
            count[type] = 0;
        }

        foreach (var reward in RewardsManager.Rewards)
        {
            count[reward.Type]++;
            var rows = CountNumberOfRewards(reward.Type) / cols + 1;
            var col = (count[reward.Type] - 1) % cols;
            var row = (count[reward.Type] - 1) / cols;
            var panel = FrameByName[Enum.GetName(typeof(RewardType), reward.Type)];
            var rewardButton = framehandle.Create("Button", reward.Name.ToString(), panel, "ScoreScreenTabButtonTemplate", 0);
            if(col == 0) 
                rewardButton.SetPoint(framepointtype.TopLeft, Padding, (-row * IconSize)  - Padding/2, panel, framepointtype.TopLeft);
            else
                rewardButton.SetPoint(framepointtype.TopLeft, col * IconSize + Padding, (-row * IconSize) -Padding/2, panel, framepointtype.TopLeft);
            rewardButton.SetSize(IconSize, IconSize);

            var icon = framehandle.Create("BACKDROP", reward.Name.ToString() + "icon", rewardButton, "", 0);
            var iconPath = BlzGetAbilityIcon(reward.AbilityID);
            //icon.SetTexture(iconPath, 0, false);
            icon.SetPoints(rewardButton);
            RewardTooltip(rewardButton, reward);

            RewardIcons.Add(icon, reward);

            var Trigger = trigger.Create();
            Trigger.RegisterFrameEvent(rewardButton, frameeventtype.Click);
            Trigger.AddAction(() => RewardButtonActions(reward));

        }
    }

    private static void RewardTooltip(framehandle parent, Reward reward)
    {
        var background = framehandle.Create("QuestButtonBaseTemplate", GameUI, 0, 0);
        var tooltipText = framehandle.Create("TEXT", $"{reward.Name}Tooltip", background, "", 0);

        tooltipText.SetSize(0.25f, 0);
        background.SetPoint(framepointtype.BottomLeft, -0.01f, -0.01f, tooltipText, framepointtype.BottomLeft);
        background.SetPoint(framepointtype.TopRight, 0.01f, 0.01f, tooltipText, framepointtype.TopRight);

        parent.SetTooltip(background);
        tooltipText.SetPoint(framepointtype.Bottom, 0, 0.01f, parent, framepointtype.Top);
        tooltipText.Enabled = false;

        var name = BlzGetAbilityTooltip(reward.AbilityID, 0);
        var desc = BlzGetAbilityExtendedTooltip(reward.AbilityID, 0);

        tooltipText.Text = $"{name}\n{desc}";
    }

    private static void RewardButtonActions(Reward reward)
    {
        var player = @event.Player;
        var stats = Globals.ALL_KITTIES[player].SaveData;
        if (stats.GameAwards[reward.Name] == 0) return; // Doesnt have the reward.
        reward.ApplyReward(player);
    }

    private static void UnavilableRewardIcons(player player)
    {
        var stats = Globals.ALL_KITTIES[player].SaveData;
        var unavailablePath = "ReplaceableTextures\\CommandButtons\\BTNSelectHeroOn";
        foreach(var reward in RewardIcons)
        {
            if (stats.GameAwards[reward.Value.Name] == 0)
                reward.Key.SetTexture(unavailablePath, 0, false);
            else
                reward.Key.SetTexture(BlzGetAbilityIcon(reward.Value.AbilityID), 0, false);
        }
    }


    public static void RewardsFrameActions()
    {
        var player = @event.Player;
        if (!player.IsLocal) return;
        FrameManager.RewardsButton.Visible = false;
        FrameManager.RewardsButton.Visible = true;
        RewardFrame.Visible = !RewardFrame.Visible;
        if (RewardFrame.Visible)
        {
            UnavilableRewardIcons(player);
            MultiboardUtil.MinMultiboards(player, true);
        }
        else MultiboardUtil.MinMultiboards(player, false);
    }


}