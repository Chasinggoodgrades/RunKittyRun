using System;
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
    private static float FrameY = 0.34f;
    private static float FrameWidth = 0.35f;
    private static float FrameHeight = 0.395f;
    private static float Padding = 0.01f;
    private static float IconSize = 0.0225f;
    private static float IconPitch = 0.0245f;
    private static float PanelGap = 0.015f; // room for the panel title between two panels
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
            FrameManager.CreateHeaderFrame(RewardFrame, "Rewards");
        }
        catch (Exception ex)
        {
            Logger.Critical($"Error in RewardsFrame: {ex.Message}");
            throw;
        }
    }

    private static framehandle CreateRewardFrame()
    {
        RewardFrame = BlzCreateFrame("ShopWindowSquareBackdrop", GameUI, 0, 0);
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
        var y = -PanelGap;
        var width = (FrameWidth - (Padding * 2)) / 2;
        var height = 0.014f + (colCount * IconPitch);
        CreatePanel(TempHandle, 0, y, width, height, name);
    }

    private static framehandle CreatePanel(framehandle parent, float x, float y, float width, float height, string title)
    {
        var framePoint1 = framepointtype.TopLeft;
        var framePoint2 = framepointtype.BottomLeft;
        if (parent == RewardFrame) framePoint2 = framepointtype.TopLeft;
        if (parent == RewardFrame) x = Padding;
        if (parent == RewardFrame) y = -PanelGap - Padding;
        if (FrameCount == 5)
        {
            parent = RewardFrame;
            framePoint1 = framepointtype.TopRight;
            framePoint2 = framepointtype.TopRight;
            x = -Padding;
            y = -PanelGap - Padding;
        }

        var panel = BlzCreateFrame("ShopPanelBackdrop", parent, 0, 0);
        panel.SetPoint(framePoint1, x, y, parent, framePoint2);
        panel.SetSize(width, height);

        // title above each panel
        var panelTitle = BlzCreateFrame("ShopPanelTitleText", panel, 0, 0);
        panelTitle.SetSize(width, 0.014f);
        panelTitle.SetPoint(framepointtype.BottomLeft, 0.003f, 0.002f, panel, framepointtype.TopLeft);
        panelTitle.SetTextAlignment(textaligntype.Left, textaligntype.Center);
        panelTitle.Text = title;

        TempHandle = panel;

        FrameByName.Add(title, panel);

        return panel;
    }

    private static void CreateRandomRewardButton()
    {
        // Create the random rewards button at the bottom right of the rewards frame.
        const float ButtonSize = 0.028f;
        const float TooltipWidth = 0.25f;
        const float BackgroundPadding = 0.01f;
        const float TooltipYOffset = 0.01f;
        var dice = "ReplaceableTextures\\CommandButtons\\BTNDice.blp";

        var button = FrameManager.CreateSlotButton(RewardFrame, out var icon);
        button.SetPoint(framepointtype.BottomRight, -Padding, Padding, RewardFrame, framepointtype.BottomRight);
        button.SetSize(ButtonSize, ButtonSize);


        var tooltipText = FrameManager.CreateThemedTooltip(TooltipWidth, BackgroundPadding, out var background);

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
            var rewardButton = FrameManager.CreateSlotButton(panel, out var icon);
            if (col == 0)
                rewardButton.SetPoint(framepointtype.TopLeft, Padding, (-row * IconPitch) - 0.006f, panel, framepointtype.TopLeft);
            else
                rewardButton.SetPoint(framepointtype.TopLeft, (col * IconPitch) + Padding, (-row * IconPitch) - 0.006f, panel, framepointtype.TopLeft);
            rewardButton.SetSize(IconSize, IconSize);

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
        var tooltipText = FrameManager.CreateThemedTooltip(0.25f, 0.01f, out var background);

        parent.SetTooltip(background);
        tooltipText.SetPoint(framepointtype.Bottom, 0, 0.01f, parent, framepointtype.Top);
        tooltipText.Enabled = false;

        var name = reward.DisplayName ?? reward.GetRewardName() ?? "Unknown Reward";
        var desc = reward.Description ?? "No description available.";

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
        try
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
        catch (Exception e)
        {
            Logger.Warning($"Error in UnavilableRewardIcons: {e}");
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
        if (Gamemode.CurrentGameMode != GameMode.Standard)
        {
            player.DisplayTimedTextTo(3.0f, $"{Colors.COLOR_RED}Rewards are only available in Standard Mode{Colors.COLOR_RESET}");
            return; // Let's not activate rewards in tournament.
        }
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
