import { Logger } from 'src/Events/Logger/Logger'
import { Gamemode } from 'src/Gamemodes/Gamemode'
import { GameMode } from 'src/Gamemodes/GameModeEnum'
import { Globals } from 'src/Global/Globals'
import { Reward, RewardType } from 'src/Rewards/Rewards/Reward'
import { RewardsManager } from 'src/Rewards/Rewards/RewardsManager'
import { ErrorHandler } from 'src/Utility/ErrorHandler'
import { blzCreateFrameByType, getTriggerPlayer } from 'src/Utility/w3tsUtils'
import { Frame, MapPlayer, Trigger } from 'w3ts'
import { MultiboardUtil } from '../Multiboard/MultiboardUtil'
import { FrameManager } from './FrameManager'
import { RewardHelper } from './RewardHelper'

export class RewardsFrame {
    public static RewardFrame: Frame
    private static GameUI: Frame = Frame.fromHandle(BlzGetOriginFrame(ORIGIN_FRAME_GAME_UI, 0))!
    private static TempHandle: Frame
    private static FrameByName: Map<string, framehandle> = new Map()
    private static RewardIcons: Map<framehandle, Reward> = new Map()
    private static RewardHelp: RewardHelper = new RewardHelper()
    private static RewardsPerRow: number = 6
    private static FrameX: number = 0.4
    private static FrameY: number = 0.35
    private static FrameWidth: number = 0.3
    private static FrameHeight: number = 0.29
    private static Padding: number = 0.01
    private static IconSize: number = 0.02
    private static FrameCount: number = 0

    public static Initialize() {
        try {
            RewardsFrame.RewardFrame = RewardsFrame.CreateRewardFrame()
            RewardsFrame.TempHandle = RewardsFrame.RewardFrame
            RewardsFrame.SetRewardsFrameHotkey()
            RewardsFrame.CountRewardFrames()
            RewardsFrame.AppendRewardsToFrames()
            RewardsFrame.CreateRandomRewardButton()
            FrameManager.CreateHeaderFrame(RewardsFrame.RewardFrame)
        } catch (ex: any) {
            Logger.Critical('Error in RewardsFrame: {ex.Message}')
            throw ex
        }
    }

    private static CreateRewardFrame(): Frame {
        RewardsFrame.RewardFrame = blzCreateFrameByType(
            'BACKDROP',
            'Frame: Reward',
            RewardsFrame.GameUI,
            'QuestButtonPushedBackdropTemplate',
            0
        )!
        RewardsFrame.RewardFrame.setAbsPoint(FRAMEPOINT_CENTER, RewardsFrame.FrameX, RewardsFrame.FrameY)
        RewardsFrame.RewardFrame.setSize(RewardsFrame.FrameWidth, RewardsFrame.FrameHeight)

        RewardsFrame.RewardFrame.visible = false
        return RewardsFrame.RewardFrame
    }

    private static CountRewardFrames() {
        let count = 0
        let colCount = 0
        let rewardTypes = Enum.GetValues(typeof RewardType)
            .Cast<RewardType>()
            .OrderBy(rt => rt)
            .ToList() // sorts by enum, no desync possibilies here.

        for (let type in rewardTypes) {
            let numberOfRewards = RewardsFrame.CountNumberOfRewards(type)
            if (numberOfRewards == 0) continue

            colCount = numberOfRewards / RewardsFrame.RewardsPerRow
            if (numberOfRewards % RewardsFrame.RewardsPerRow != 0) colCount++
            if (colCount == 0) colCount = 1

            // Create panel based on number of columns
            RewardsFrame.InitializePanels(Enum.GetName(typeof RewardType, type), colCount)
            count += colCount
            RewardsFrame.FrameCount++
        }
        //print("There are {count} types");
    }

    private static CountNumberOfRewards(type: RewardType) {
        let count = 0
        for (let reward in RewardsManager.Rewards) {
            if (reward.Type == type) count++
        }
        return count
    }

    private static InitializePanels(name: string, colCount: number) {
        let y = -RewardsFrame.Padding
        let width = (RewardsFrame.FrameWidth - RewardsFrame.Padding * 2) / 2
        let height = colCount == 1 ? 0.03 : 0.03 + (colCount - 1) * 0.02
        RewardsFrame.CreatePanel(RewardsFrame.TempHandle, 0, y, width, height, name)
    }

    private static CreatePanel(
        parent: Frame,
        x: number,
        y: number,
        width: number,
        height: number,
        title: string
    ): Frame {
        let framePoint1 = FRAMEPOINT_TOPLEFT
        let framePoint2 = FRAMEPOINT_BOTTOMLEFT
        if (parent == RewardsFrame.RewardFrame) framePoint2 = FRAMEPOINT_TOPLEFT
        if (parent == RewardsFrame.RewardFrame) x = RewardsFrame.Padding
        if (parent == RewardsFrame.RewardFrame) y = -RewardsFrame.Padding * 2
        if (RewardsFrame.FrameCount == 5) {
            parent = RewardsFrame.RewardFrame
            framePoint1 = FRAMEPOINT_TOPRIGHT
            framePoint2 = FRAMEPOINT_TOPRIGHT
            x = -RewardsFrame.Padding
            y = -RewardsFrame.Padding * 2
        }

        let panel = blzCreateFrameByType('BACKDROP', '{title}', parent, 'QuestButtonDisabledBackdropTemplate', 0)
        panel.setPoint(framePoint1, x, y, parent, framePoint2)
        panel.setSize(width, height)

        // title above each panel
        let panelTitle = blzCreateFrameByType('TEXT', 'RewardPanelTitle', panel, '', 0)
        panelTitle.setPoint(FRAMEPOINT_TOPLEFT, 0, RewardsFrame.Padding, panel, FRAMEPOINT_TOPLEFT)
        panelTitle.text = title

        RewardsFrame.TempHandle = panel

        RewardsFrame.FrameByName.push(title, panel)

        return panel
    }

    private static CreateRandomRewardButton() {
        // Create the random rewards button at the bottom right of the rewards frame.
        let ButtonSize: number = 0.025
        let TooltipWidth: number = 0.25
        let BackgroundPadding: number = 0.01
        let TooltipYOffset: number = 0.01
        let dice = 'ReplaceableTextures\\CommandButtons\\BTNDice.blp'

        let button = blzCreateFrameByType(
            'Button',
            'RandomRewardButton',
            RewardsFrame.RewardFrame,
            'ScoreScreenTabButtonTemplate',
            0
        )
        button.setPoint(
            FRAMEPOINT_BOTTOMRIGHT,
            RewardsFrame.RewardFrame,
            FRAMEPOINT_BOTTOMRIGHT,
            -RewardsFrame.Padding,
            RewardsFrame.Padding
        )
        button.setSize(ButtonSize, ButtonSize)

        let icon = blzCreateFrameByType('BACKDROP', 'RandomRewardButtonIcon', button, '', 0)
        icon.setAllPoints(button)

        let background = blzCreateFrameByType('QuestButtonBaseTemplate', RewardsFrame.GameUI, 0, 0)
        let tooltipText = blzCreateFrameByType('TEXT', 'RandomRewardTooltip', background, '', 0)
        tooltipText.setSize(TooltipWidth, 0)
        background.setPoint(
            FRAMEPOINT_BOTTOMLEFT,
            tooltipText,
            FRAMEPOINT_BOTTOMLEFT,
            -BackgroundPadding,
            -BackgroundPadding
        )
        background.setPoint(FRAMEPOINT_TOPRIGHT, BackgroundPadding, BackgroundPadding, tooltipText, FRAMEPOINT_TOPRIGHT)

        button.setTooltip(background)
        tooltipText.setPoint(FRAMEPOINT_BOTTOM, 0, TooltipYOffset, button, FRAMEPOINT_TOP)
        tooltipText.enabled = false

        icon.setTexture(dice, 0, false)

        tooltipText.text =
            '{Colors.COLOR_YELLOW}Rewards: Randomize{Colors.COLOR_RESET}\n{Colors.COLOR_ORANGE}from: your: rewards: list: Picks, random: cosmetics: applying.{Colors.COLOR_RESET}'

        let t = Trigger.create()!
        t.triggerRegisterFrameEvent(button, FRAMEEVENT_CONTROL_CLICK)
        t.addAction(RewardsFrame.RandomRewardsButtonActions)
    }

    private static RandomRewardsButtonActions() {
        let player = getTriggerPlayer()
        let frame = BlzGetTriggerFrame()
        try {
            RewardsFrame.RewardHelp.ClearRewards()

            for (let reward of RewardsManager.Rewards) {
                let stats = Globals.ALL_KITTIES.get(player)!.SaveData
                let value = RewardHelper.GetAwardNestedValue(stats.GameAwardsSorted, reward.TypeSorted, reward.name)
                if (value <= 0) continue

                RewardsFrame.RewardHelp.AddReward(reward)
            }

            let selectedHat: Reward =
                RewardsFrame.RewardHelp.Hats.length > 0
                    ? RewardsFrame.RewardHelp.Hats[GetRandomInt(0, RewardsFrame.RewardHelp.Hats.length - 1)]
                    : null
            let selectedWings: Reward =
                RewardsFrame.RewardHelp.Wings.length > 0
                    ? RewardsFrame.RewardHelp.Wings[GetRandomInt(0, RewardsFrame.RewardHelp.Wings.length - 1)]
                    : null
            let selectedTrail: Reward =
                RewardsFrame.RewardHelp.Trails.length > 0
                    ? RewardsFrame.RewardHelp.Trails[GetRandomInt(0, RewardsFrame.RewardHelp.Trails.length - 1)]
                    : null
            let selectedAura: Reward =
                RewardsFrame.RewardHelp.Auras.length > 0
                    ? RewardsFrame.RewardHelp.Auras[GetRandomInt(0, RewardsFrame.RewardHelp.Auras.length - 1)]
                    : null

            selectedHat?.ApplyReward(player)
            selectedWings?.ApplyReward(player)
            selectedTrail?.ApplyReward(player)
            selectedAura?.ApplyReward(player)

            if (!player.isLocal()) return
            FrameManager.RefreshFrame(frame)
        } catch (e: any) {
            Logger.Warning('Error in RandomRewardsButtonActions: {e.Message}')
        }
    }

    private static AppendRewardsToFrames() {
        const cols = this.RewardsPerRow
        const count: Map<number, number> = new Map()

        // Initialize the count dictionary with zeros for each RewardType
        for (const type of Object.values(RewardType)) {
            count[type as number] = 0
        }

        for (const reward of RewardsManager.Rewards) {
            const type = reward.Type as number
            count[type] = (count[type] || 0) + 1

            const totalRewards = this.CountNumberOfRewards(reward.Type)
            const col = (count[type] - 1) % cols
            const row = Math.floor((count[type] - 1) / cols)

            // Get the panel for this reward type
            const panelName = Enum.GetName(typeof RewardType, reward.Type)
            const panel = this.FrameByName[panelName]
            if (!panel) continue

            // Create the reward button
            const rewardButton = blzCreateFrameByType(
                'Button',
                reward.name.toString(),
                panel,
                'ScoreScreenTabButtonTemplate',
                0
            )

            const x = col * this.IconSize + this.Padding
            const y = -row * this.IconSize - this.Padding / 2
            rewardButton.setPoint(FRAMEPOINT_TOPLEFT, x, y, panel, FRAMEPOINT_TOPLEFT)
            rewardButton.setSize(this.IconSize, this.IconSize)

            // Create the icon
            const icon = blzCreateFrameByType('BACKDROP', reward.name.toString() + 'icon', rewardButton, '', 0)
            icon.setAllPoints(rewardButton)

            this.RewardTooltip(rewardButton, reward)
            this.RewardIcons[icon] = reward

            // Register click event
            const triggerObj = Trigger.create()!
            triggerObj.triggerRegisterFrameEvent(rewardButton, FRAMEEVENT_CONTROL_CLICK)
            triggerObj.addAction(() => this.RewardButtonActions(reward))
        }
    }

    private static RewardTooltip(parent: Frame, reward: Reward) {
        let background = blzCreateFrameByType('QuestButtonBaseTemplate', RewardsFrame.GameUI, 0, 0)
        let tooltipText = blzCreateFrameByType('TEXT', '{reward.name}Tooltip', background, '', 0)

        tooltipText.setSize(0.25, 0)
        background.setPoint(FRAMEPOINT_BOTTOMLEFT, -0.01, -0.01, tooltipText, FRAMEPOINT_BOTTOMLEFT)
        background.setPoint(FRAMEPOINT_TOPRIGHT, tooltipText, FRAMEPOINT_TOPRIGHT, 0.01, 0.01)

        parent.setTooltip(background)
        tooltipText.setPoint(FRAMEPOINT_BOTTOM, parent, FRAMEPOINT_TOP, 0, 0.01)
        tooltipText.enabled = false

        let name = BlzGetAbilityTooltip(reward.AbilityID, 0)
        let desc = BlzGetAbilityExtendedTooltip(reward.AbilityID, 0)

        tooltipText.text = '{name}\n{desc}'
    }

    private static RewardButtonActions(reward: Reward) {
        let player = getTriggerPlayer()
        let frame = BlzGetTriggerFrame()
        let stats = Globals.ALL_KITTIES.get(player)!.SaveData
        let value = RewardHelper.GetAwardNestedValue(stats.GameAwardsSorted, reward.TypeSorted, reward.name)
        if (value <= 0) return // Doesnt have the reward , dont apply.
        reward.ApplyReward(player)
        if (!player.isLocal()) return
        FrameManager.RefreshFrame(frame)
    }

    private static UnavilableRewardIcons(player: MapPlayer) {
        try {
            let stats = Globals.ALL_KITTIES.get(player)!.SaveData
            let unavailablePath = 'ReplaceableTextures\\CommandButtons\\BTNSelectHeroOn'
            for (let reward in RewardsFrame.RewardIcons) {
                let value = RewardHelper.GetAwardNestedValue(
                    stats.GameAwardsSorted,
                    reward.Value.TypeSorted,
                    reward.Value.name
                )
                if (value <= 0)
                    // Doesnt have reward
                    reward.Key.setTexture(unavailablePath, 0, false)
                else reward.Key.setTexture(BlzGetAbilityIcon(reward.Value.AbilityID), 0, false)
            }
        } catch (e: any) {
            Logger.Warning('Error in UnavilableRewardIcons: {e}')
        }
    }

    private static SetRewardsFrameHotkey() {
        let rewardsHotKey = Trigger.create()!
        for (let player of Globals.ALL_PLAYERS) {
            rewardsHotKey.registerPlayerKeyEvent(player, OSKEY_OEM_MINUS, 0, true)
        }
        rewardsHotKey.addAction(
            ErrorHandler.Wrap(() => {
                RewardsFrame.RewardsFrameActions()
            })
        )
    }

    public static RewardsFrameActions() {
        let player = getTriggerPlayer()
        if (!player.isLocal()) return
        if (Gamemode.CurrentGameMode != GameMode.Standard) {
            player.DisplayTimedTextTo(
                3.0,
                '{Colors.COLOR_RED}are: only: available: Rewards in Mode: Standard{Colors.COLOR_RESET}'
            )
            return // Let's not activate rewards in tournament.
        }
        // if (ShopUtil.IsPlayerInWolfLane(player)) return;
        FrameManager.RewardsButton.visible = false
        FrameManager.RewardsButton.visible = true
        FrameManager.HideOtherFrames(RewardsFrame.RewardFrame)
        RewardsFrame.RewardFrame.visible = !RewardsFrame.RewardFrame.visible
        if (RewardsFrame.RewardFrame.visible) {
            RewardsFrame.UnavilableRewardIcons(player)
            MultiboardUtil.MinMultiboards(player, true)
        }
    }
}
