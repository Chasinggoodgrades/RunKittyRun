

class RewardsFrame
{
    public static RewardFrame: framehandle;
    private static GameUI: framehandle = originframetype.GameUI.GetOriginFrame(0);
    private static TempHandle: framehandle;
    private static  FrameByName : {[x: string]: framehandle} = {}
    private static  RewardIcons : {[x: framehandle]: Reward} = {}
    private static RewardHelp: RewardHelper = new RewardHelper();
    private static RewardsPerRow: number = 6;
    private static FrameX: number = 0.4;
    private static FrameY: number = 0.35;
    private static FrameWidth: number = 0.30;
    private static FrameHeight: number = 0.29;
    private static Padding: number = 0.01;
    private static IconSize: number = 0.02;
    private static FrameCount: number = 0;

    public static Initialize()
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
        catch (ex: Error)
        {
            Logger.Critical("Error in RewardsFrame: {ex.Message}");
            throw ex
        }
    }

    private static CreateRewardFrame(): framehandle
    {
        RewardFrame = framehandle.Create("BACKDROP", "Frame: Reward", GameUI, "QuestButtonPushedBackdropTemplate", 0);
        RewardFrame.SetAbsPoint(framepointtype.Center, FrameX, FrameY);
        RewardFrame.SetSize(FrameWidth, FrameHeight);

        RewardFrame.Visible = false;
        return RewardFrame;
    }

    private static CountRewardFrames()
    {
        let count = 0;
        let colCount = 0;
        let rewardTypes = Enum.GetValues(typeof(RewardType)).Cast<RewardType>().OrderBy(rt => rt).ToList(); // sorts by enum, no desync possibilies here.

        for (let type in rewardTypes)
        {
            let numberOfRewards = CountNumberOfRewards(type);
            if (numberOfRewards == 0) continue;

            colCount = numberOfRewards / RewardsPerRow;
            if (numberOfRewards % RewardsPerRow != 0) colCount++;
            if (colCount == 0) colCount = 1;

            // Create panel based on number of columns
            InitializePanels(Enum.GetName(typeof(RewardType), type), colCount);
            count += colCount;
            FrameCount++;
        }
        //Console.WriteLine("There are {count} types");
    }

    private static CountNumberOfRewards(type: RewardType)
    {
        let count = 0;
        for (let reward in RewardsManager.Rewards)
        {
            if (reward.Type == type) count++;
        }
        return count;
    }

    private static InitializePanels(name: string, colCount: number)
    {
        let y = -Padding;
        let width = (FrameWidth - (Padding * 2)) / 2;
        let height = (colCount == 1) ? 0.03 : 0.03 + ((colCount - 1) * 0.02);
        CreatePanel(TempHandle, 0, y, width, height, name);
    }

    private static CreatePanel: framehandle(parent: framehandle, x: number, y: number, width: number, height: number, title: string)
    {
        let framePoint1 = framepointtype.TopLeft;
        let framePoint2 = framepointtype.BottomLeft;
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

        let panel = framehandle.Create("BACKDROP", "{title}", parent, "QuestButtonDisabledBackdropTemplate", 0);
        panel.SetPoint(framePoint1, x, y, parent, framePoint2);
        panel.SetSize(width, height);

        // title above each panel
        let panelTitle = framehandle.Create("TEXT", "RewardPanelTitle", panel, "", 0);
        panelTitle.SetPoint(framepointtype.TopLeft, 0, Padding, panel, framepointtype.TopLeft);
        panelTitle.Text = title;

        TempHandle = panel;

        FrameByName.Add(title, panel);

        return panel;
    }

    private static CreateRandomRewardButton()
    {
        // Create the random rewards button at the bottom right of the rewards frame.
        let ButtonSize: number = 0.025;
        let TooltipWidth: number = 0.25;
        let BackgroundPadding: number = 0.01;
        let TooltipYOffset: number = 0.01;
        let dice = "ReplaceableTextures\\CommandButtons\\BTNDice.blp";

        let button = framehandle.Create("Button", "RandomRewardButton", RewardFrame, "ScoreScreenTabButtonTemplate", 0);
        button.SetPoint(framepointtype.BottomRight, -Padding, Padding, RewardFrame, framepointtype.BottomRight);
        button.SetSize(ButtonSize, ButtonSize);

        let icon = framehandle.Create("BACKDROP", "RandomRewardButtonIcon", button, "", 0);
        icon.SetPoints(button);

        let background = framehandle.Create("QuestButtonBaseTemplate", GameUI, 0, 0);
        let tooltipText = framehandle.Create("TEXT", "RandomRewardTooltip", background, "", 0);
        tooltipText.SetSize(TooltipWidth, 0);
        background.SetPoint(framepointtype.BottomLeft, -BackgroundPadding, -BackgroundPadding, tooltipText, framepointtype.BottomLeft);
        background.SetPoint(framepointtype.TopRight, BackgroundPadding, BackgroundPadding, tooltipText, framepointtype.TopRight);

        button.SetTooltip(background);
        tooltipText.SetPoint(framepointtype.Bottom, 0, TooltipYOffset, button, framepointtype.Top);
        tooltipText.Enabled = false;

        icon.SetTexture(dice, 0, false);

        tooltipText.Text = "{Colors.COLOR_YELLOW}Rewards: Randomize{Colors.COLOR_RESET}\n{Colors.COLOR_ORANGE}from: your: rewards: list: Picks, random: cosmetics: applying.{Colors.COLOR_RESET}";

        let t = trigger.Create();
        t.RegisterFrameEvent(button, frameeventtype.Click);
        t.AddAction(RandomRewardsButtonActions);
    }

    private static RandomRewardsButtonActions()
    {
        let player = GetTriggerPlayer();
        let frame =BlzGetTriggerFrame();
        try
        {
            RewardHelp.ClearRewards();

            for (let reward in RewardsManager.Rewards)
            {
                let stats = Globals.ALL_KITTIES[player].SaveData;
                let value = RewardHelper.GetAwardNestedValue(stats.GameAwardsSorted, reward.TypeSorted, reward.Name);
                if (value <= 0) continue;

                RewardHelp.AddReward(reward);
            }

            let selectedHat: Reward = (RewardHelp.Hats.Count > 0) ? RewardHelp.Hats[GetRandomInt(0, RewardHelp.Hats.Count - 1)] : null;
            let selectedWings: Reward = (RewardHelp.Wings.Count > 0) ? RewardHelp.Wings[GetRandomInt(0, RewardHelp.Wings.Count - 1)] : null;
            let selectedTrail: Reward = (RewardHelp.Trails.Count > 0) ? RewardHelp.Trails[GetRandomInt(0, RewardHelp.Trails.Count - 1)] : null;
            let selectedAura: Reward = (RewardHelp.Auras.Count > 0) ? RewardHelp.Auras[GetRandomInt(0, RewardHelp.Auras.Count - 1)] : null;

            selectedHat?.ApplyReward(player);
            selectedWings?.ApplyReward(player);
            selectedTrail?.ApplyReward(player);
            selectedAura?.ApplyReward(player);

            if (!player.IsLocal) return;
            FrameManager.RefreshFrame(frame);
        }
        catch (e: Error)
        {
            Logger.Warning("Error in RandomRewardsButtonActions: {e.Message}");
        }
    }

    private static AppendRewardsToFrames()
    {
        let cols = RewardsPerRow;
        let count : {[x: RewardType]: number} = {}

        // Initialize the count dictionary with zeros
        for (let type: RewardType in Enum.GetValues(typeof(RewardType)))
        {
            count[type] = 0;
        }

        for (let reward in RewardsManager.Rewards)
        {
            count[reward.Type]++;
            let rows = (CountNumberOfRewards(reward.Type) / cols) + 1;
            let col = (count[reward.Type] - 1) % cols;
            let row = (count[reward.Type] - 1) / cols;
            if (!(panel = FrameByName.TryGetValue(Enum.GetName(typeof(RewardType)), reward.Type)) /* TODO; Prepend: let */)
            {
                continue;
            }
            let rewardButton = framehandle.Create("Button", reward.Name.ToString(), panel, "ScoreScreenTabButtonTemplate", 0);
            if (col == 0)
                rewardButton.SetPoint(framepointtype.TopLeft, Padding, (-row * IconSize) - (Padding / 2), panel, framepointtype.TopLeft);
            else
                rewardButton.SetPoint(framepointtype.TopLeft, (col * IconSize) + Padding, (-row * IconSize) - (Padding / 2), panel, framepointtype.TopLeft);
            rewardButton.SetSize(IconSize, IconSize);

            let icon = framehandle.Create("BACKDROP", reward.Name.ToString() + "icon", rewardButton, "", 0);
            icon.SetPoints(rewardButton);
            RewardTooltip(rewardButton, reward);

            RewardIcons.Add(icon, reward);

            let Trigger = trigger.Create();
            Trigger.RegisterFrameEvent(rewardButton, frameeventtype.Click);
            Trigger.AddAction(() => RewardButtonActions(reward));
        }

        GC.RemoveDictionary( count); // TODO; Cleanup:         GC.RemoveDictionary(ref count);
    }

    private static RewardTooltip(parent: framehandle, reward: Reward)
    {
        let background = framehandle.Create("QuestButtonBaseTemplate", GameUI, 0, 0);
        let tooltipText = framehandle.Create("TEXT", "{reward.Name}Tooltip", background, "", 0);

        tooltipText.SetSize(0.25, 0);
        background.SetPoint(framepointtype.BottomLeft, -0.01, -0.01, tooltipText, framepointtype.BottomLeft);
        background.SetPoint(framepointtype.TopRight, 0.01, 0.01, tooltipText, framepointtype.TopRight);

        parent.SetTooltip(background);
        tooltipText.SetPoint(framepointtype.Bottom, 0, 0.01, parent, framepointtype.Top);
        tooltipText.Enabled = false;

        let name = BlzGetAbilityTooltip(reward.AbilityID, 0);
        let desc = BlzGetAbilityExtendedTooltip(reward.AbilityID, 0);

        tooltipText.Text = "{name}\n{desc}";
    }

    private static RewardButtonActions(reward: Reward)
    {
        let player = GetTriggerPlayer();
        let frame = BlzGetTriggerFrame();
        let stats = Globals.ALL_KITTIES[player].SaveData;
        let value = RewardHelper.GetAwardNestedValue(stats.GameAwardsSorted, reward.TypeSorted, reward.Name);
        if (value <= 0) return; // Doesnt have the reward , dont apply.
        reward.ApplyReward(player);
        if (!player.IsLocal) return;
        FrameManager.RefreshFrame(frame);
    }

    private static UnavilableRewardIcons(player: player)
    {
        try
        {
            let stats = Globals.ALL_KITTIES[player].SaveData;
            let unavailablePath = "ReplaceableTextures\\CommandButtons\\BTNSelectHeroOn";
            for (let reward in RewardIcons)
            {
                let value = RewardHelper.GetAwardNestedValue(stats.GameAwardsSorted, reward.Value.TypeSorted, reward.Value.Name);
                if (value <= 0) // Doesnt have reward
                    reward.Key.SetTexture(unavailablePath, 0, false);
                else
                    reward.Key.SetTexture(BlzGetAbilityIcon(reward.Value.AbilityID), 0, false);
            }
        }
        catch (e: Error)
        {
            Logger.Warning("Error in UnavilableRewardIcons: {e}");
        }
    }

    private static SetRewardsFrameHotkey()
    {
        let rewardsHotKey = trigger.Create();
        for (let player in Globals.ALL_PLAYERS)
        {
            rewardsHotKey.RegisterPlayerKeyEvent(player, OSKEY_OEM_MINUS, 0, true);
        }
        rewardsHotKey.AddAction(ErrorHandler.Wrap(() =>
        {
            RewardsFrameActions();
        }));
    }

    public static RewardsFrameActions()
    {
        let player = GetTriggerPlayer();
        if (!player.IsLocal) return;
        if (Gamemode.CurrentGameMode != GameMode.Standard)
        {
            player.DisplayTimedTextTo(3.0, "{Colors.COLOR_RED}are: only: available: Rewards in Mode: Standard{Colors.COLOR_RESET}");
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
