﻿using System;
using System.Collections.Generic;
using System.Linq;
using WCSharp.Api;
using static WCSharp.Api.Common;

public static class RewardsFrame
{
    public static framehandle RewardFrame;
    private static framehandle GameUI = originframetype.GameUI.GetOriginFrame(0);
    private static framehandle TempHandle;
    private static Dictionary<string, framehandle> FrameByName = new Dictionary<string, framehandle>();
    private static Dictionary<framehandle, Reward> RewardIcons = new Dictionary<framehandle, Reward>();
    private static RewardHelper RewardHelp = new RewardHelper();
    private static int RewardsPerRow = 6;
    private static float FrameX = 0.4f;
    private static float FrameY = 0.35f;
    private static float FrameWidth = 0.30f;
    private static float FrameHeight = 0.29f;
    private static float Padding = 0.01f;
    private static float IconSize = 0.02f;
    private static int FrameCount = 0;

    public static void Initialize()
    {
        try
        {
            RewardFrame = CreateRewardFrame();
            TempHandle = RewardFrame;
            SetRewardsFrameHotkey();
            CountRewardFrames();
            AppendRewardsToFrames();
            CreateRandomRewardButton();
            FrameManager.CreateHeaderFrame(RewardFrame);
        }
        catch (Exception ex)
        {
            Logger.Critical($"Error in RewardsFrame: {ex.Message}");
            throw;
        }
    }

    private static framehandle CreateRewardFrame()
    {
        RewardFrame = framehandle.Create("BACKDROP", "Reward Frame", GameUI, "QuestButtonPushedBackdropTemplate", 0);
        RewardFrame.SetAbsPoint(framepointtype.Center, FrameX, FrameY);
        RewardFrame.SetSize(FrameWidth, FrameHeight);

        RewardFrame.Visible = false;
        return RewardFrame;
    }

    private static void CountRewardFrames()
    {
        var count = 0;
        var colCount = 0;
        var rewardTypes = Enum.GetValues(typeof(RewardType)).Cast<RewardType>().OrderBy(rt => (int)rt).ToList(); // sorts by enum, no desync possibilies here.

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
        //Console.WriteLine($"There are {count} types");
    }

    private static int CountNumberOfRewards(RewardType type)
    {
        var count = 0;
        foreach (var reward in RewardsManager.Rewards)
        {
            if (reward.Type == type) count++;
        }
        return count;
    }

    private static void InitializePanels(string name, float colCount)
    {
        var y = -Padding;
        var width = (FrameWidth - (Padding * 2)) / 2;
        var height = (colCount == 1) ? 0.03f : 0.03f + ((colCount - 1) * 0.02f);
        CreatePanel(TempHandle, 0, y, width, height, name);
    }

    private static framehandle CreatePanel(framehandle parent, float x, float y, float width, float height, string title)
    {
        var framePoint1 = framepointtype.TopLeft;
        var framePoint2 = framepointtype.BottomLeft;
        if (parent == RewardFrame) framePoint2 = framepointtype.TopLeft;
        if (parent == RewardFrame) x = Padding;
        if (parent == RewardFrame) y = -Padding * 2;
        if (FrameCount == 5)
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

    private static void CreateRandomRewardButton()
    {
        // Create the random rewards button at the bottom right of the rewards frame.
        const float ButtonSize = 0.025f;
        const float TooltipWidth = 0.25f;
        const float BackgroundPadding = 0.01f;
        const float TooltipYOffset = 0.01f;
        var dice = "ReplaceableTextures\\CommandButtons\\BTNDice.blp";

        var button = framehandle.Create("Button", "RandomRewardButton", RewardFrame, "ScoreScreenTabButtonTemplate", 0);
        button.SetPoint(framepointtype.BottomRight, -Padding, Padding, RewardFrame, framepointtype.BottomRight);
        button.SetSize(ButtonSize, ButtonSize);

        var icon = framehandle.Create("BACKDROP", "RandomRewardButtonIcon", button, "", 0);
        icon.SetPoints(button);

        var background = framehandle.Create("QuestButtonBaseTemplate", GameUI, 0, 0);
        var tooltipText = framehandle.Create("TEXT", "RandomRewardTooltip", background, "", 0);
        tooltipText.SetSize(TooltipWidth, 0);
        background.SetPoint(framepointtype.BottomLeft, -BackgroundPadding, -BackgroundPadding, tooltipText, framepointtype.BottomLeft);
        background.SetPoint(framepointtype.TopRight, BackgroundPadding, BackgroundPadding, tooltipText, framepointtype.TopRight);

        button.SetTooltip(background);
        tooltipText.SetPoint(framepointtype.Bottom, 0, TooltipYOffset, button, framepointtype.Top);
        tooltipText.Enabled = false;

        icon.SetTexture(dice, 0, false);

        tooltipText.Text = $"{Colors.COLOR_YELLOW}Randomize Rewards{Colors.COLOR_RESET}\n{Colors.COLOR_ORANGE}Picks from your rewards list, applying random cosmetics.{Colors.COLOR_RESET}";

        var t = trigger.Create();
        t.RegisterFrameEvent(button, frameeventtype.Click);
        t.AddAction(RandomRewardsButtonActions);
    }

    private static void RandomRewardsButtonActions()
    {
        var player = @event.Player;
        var frame = @event.Frame;
        try
        {
            RewardHelp.ClearRewards();

            foreach (var reward in RewardsManager.Rewards)
            {
                var stats = Globals.ALL_KITTIES[player].SaveData;
                var value = RewardHelper.GetAwardNestedValue(stats.GameAwardsSorted, reward.TypeSorted, reward.Name);
                if (value <= 0) continue;

                RewardHelp.AddReward(reward);
            }

            Reward selectedHat = (RewardHelp.Hats.Count > 0) ? RewardHelp.Hats[GetRandomInt(0, RewardHelp.Hats.Count - 1)] : null;
            Reward selectedWings = (RewardHelp.Wings.Count > 0) ? RewardHelp.Wings[GetRandomInt(0, RewardHelp.Wings.Count - 1)] : null;
            Reward selectedTrail = (RewardHelp.Trails.Count > 0) ? RewardHelp.Trails[GetRandomInt(0, RewardHelp.Trails.Count - 1)] : null;
            Reward selectedAura = (RewardHelp.Auras.Count > 0) ? RewardHelp.Auras[GetRandomInt(0, RewardHelp.Auras.Count - 1)] : null;

            selectedHat?.ApplyReward(player);
            selectedWings?.ApplyReward(player);
            selectedTrail?.ApplyReward(player);
            selectedAura?.ApplyReward(player);

            if (!player.IsLocal) return;
            FrameManager.RefreshFrame(frame);
        }
        catch (Exception e)
        {
            Logger.Warning($"Error in RandomRewardsButtonActions: {e.Message}");
        }
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
            var rows = (CountNumberOfRewards(reward.Type) / cols) + 1;
            var col = (count[reward.Type] - 1) % cols;
            var row = (count[reward.Type] - 1) / cols;
            if (!FrameByName.TryGetValue(Enum.GetName(typeof(RewardType), reward.Type), out var panel))
            {
                continue;
            }
            var rewardButton = framehandle.Create("Button", reward.Name.ToString(), panel, "ScoreScreenTabButtonTemplate", 0);
            if (col == 0)
                rewardButton.SetPoint(framepointtype.TopLeft, Padding, (-row * IconSize) - (Padding / 2), panel, framepointtype.TopLeft);
            else
                rewardButton.SetPoint(framepointtype.TopLeft, (col * IconSize) + Padding, (-row * IconSize) - (Padding / 2), panel, framepointtype.TopLeft);
            rewardButton.SetSize(IconSize, IconSize);

            var icon = framehandle.Create("BACKDROP", reward.Name.ToString() + "icon", rewardButton, "", 0);
            icon.SetPoints(rewardButton);
            RewardTooltip(rewardButton, reward);

            RewardIcons.Add(icon, reward);

            var Trigger = trigger.Create();
            Trigger.RegisterFrameEvent(rewardButton, frameeventtype.Click);
            Trigger.AddAction(() => RewardButtonActions(reward));
        }

        GC.RemoveDictionary(ref count);
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
        var frame = @event.Frame;
        var stats = Globals.ALL_KITTIES[player].SaveData;
        var value = RewardHelper.GetAwardNestedValue(stats.GameAwardsSorted, reward.TypeSorted, reward.Name);
        if (value <= 0) return; // Doesnt have the reward , dont apply.
        reward.ApplyReward(player);
        if (!player.IsLocal) return;
        FrameManager.RefreshFrame(frame);
    }

    private static void UnavilableRewardIcons(player player)
    {
        var stats = Globals.ALL_KITTIES[player].SaveData;
        var unavailablePath = "ReplaceableTextures\\CommandButtons\\BTNSelectHeroOn";
        foreach (var reward in RewardIcons)
        {
            var value = RewardHelper.GetAwardNestedValue(stats.GameAwardsSorted, reward.Value.TypeSorted, reward.Value.Name);
            if (value <= 0) // Doesnt have reward
                reward.Key.SetTexture(unavailablePath, 0, false);
            else
                reward.Key.SetTexture(BlzGetAbilityIcon(reward.Value.AbilityID), 0, false);
        }
    }

    private static void SetRewardsFrameHotkey()
    {
        var rewardsHotKey = trigger.Create();
        foreach (var player in Globals.ALL_PLAYERS)
        {
            rewardsHotKey.RegisterPlayerKeyEvent(player, OSKEY_OEM_MINUS, 0, true);
        }
        rewardsHotKey.AddAction(ErrorHandler.Wrap(() =>
        {
            RewardsFrameActions();
        }));
    }

    public static void RewardsFrameActions()
    {
        var player = @event.Player;
        if (!player.IsLocal) return;
        // if (ShopUtil.IsPlayerInWolfLane(player)) return;
        FrameManager.RewardsButton.Visible = false;
        FrameManager.RewardsButton.Visible = true;
        FrameManager.HideOtherFrames(RewardFrame);
        RewardFrame.Visible = !RewardFrame.Visible;
        if (RewardFrame.Visible)
        {
            UnavilableRewardIcons(player);
            MultiboardUtil.MinMultiboards(player, true);
        }
    }
}
