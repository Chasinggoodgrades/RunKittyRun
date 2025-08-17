import { Logger } from 'src/Events/Logger/Logger'
import { CurrentGameMode } from 'src/Gamemodes/CurrentGameMode'
import { GameMode } from 'src/Gamemodes/GameModeEnum'
import { Globals } from 'src/Global/Globals'
import { Reward, RewardType } from 'src/Rewards/Rewards/Reward'
import { RewardsManager } from 'src/Rewards/Rewards/RewardsManager'
import { Colors } from 'src/Utility/Colors/Colors'
import { blzCreateFrame, blzCreateFrameByType, getTriggerPlayer } from 'src/Utility/w3tsUtils'
import { Frame, MapPlayer, Trigger } from 'w3ts'
import { MultiboardUtil } from '../Multiboard/MultiboardUtil'
import { FrameManager } from './FrameManager'
import { CreateHeaderFrame, HideOtherFrames } from './FrameUtil'
import { RewardHelper } from './RewardHelper'

export class RewardsFrame {
    public static RewardFrame: Frame
    private static GameUI: Frame
    private static TempHandle: Frame
    private static FrameByName: Map<string, Frame> = new Map()
    private static RewardIcons: Map<Frame, Reward> = new Map()
    private static RewardHelp: RewardHelper = new RewardHelper()
    private static RewardsPerRow = 6
    private static FrameX = 0.4
    private static FrameY = 0.35
    private static FrameWidth = 0.3
    private static FrameHeight = 0.29
    private static Padding = 0.01
    private static IconSize = 0.02
    private static FrameCount = 0

    public static Initialize = () => {
        try {
            RewardsFrame.GameUI = Frame.fromHandle(BlzGetOriginFrame(ORIGIN_FRAME_GAME_UI, 0))!
            RewardsFrame.RewardFrame = RewardsFrame.CreateRewardFrame()
            RewardsFrame.TempHandle = RewardsFrame.RewardFrame
            RewardsFrame.SetRewardsFrameHotkey()
            RewardsFrame.CountRewardFrames()
            RewardsFrame.AppendRewardsToFrames()
            RewardsFrame.CreateRandomRewardButton()
            CreateHeaderFrame(RewardsFrame.RewardFrame)
        } catch (ex: any) {
            Logger.Critical(`Error in RewardsFrame: ${ex}`)
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

    private static CountRewardFrames = () => {
        let count = 0
        let colCount = 0
        const rewardTypes = Object.values(RewardType)
            .filter((v): v is RewardType => typeof v === 'number')
            .sort((a, b) => a - b)

        // sorts by enum, no desync possibilies here.

        for (const type of rewardTypes) {
            const numberOfRewards = RewardsFrame.CountNumberOfRewards(type)
            if (numberOfRewards === 0) continue

            colCount = numberOfRewards / RewardsFrame.RewardsPerRow
            if (numberOfRewards % RewardsFrame.RewardsPerRow !== 0) colCount++
            if (colCount === 0) colCount = 1

            // Create panel based on number of columns
            RewardsFrame.InitializePanels(RewardType[type], colCount)
            count += colCount
            RewardsFrame.FrameCount++
        }
        //print(`There are ${count} types`);
    }

    private static CountNumberOfRewards(type: RewardType) {
        let count = 0
        for (const reward of RewardsManager.Rewards) {
            if (reward.Type === type) count++
        }
        return count
    }

    private static InitializePanels(name: string, colCount: number) {
        const y = -RewardsFrame.Padding
        const width = (RewardsFrame.FrameWidth - RewardsFrame.Padding * 2) / 2
        const height = colCount === 1 ? 0.03 : 0.03 + (colCount - 1) * 0.02
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
        if (parent === RewardsFrame.RewardFrame) framePoint2 = FRAMEPOINT_TOPLEFT
        if (parent === RewardsFrame.RewardFrame) x = RewardsFrame.Padding
        if (parent === RewardsFrame.RewardFrame) y = -RewardsFrame.Padding * 2
        if (RewardsFrame.FrameCount === 5) {
            parent = RewardsFrame.RewardFrame
            framePoint1 = FRAMEPOINT_TOPRIGHT
            framePoint2 = FRAMEPOINT_TOPRIGHT
            x = -RewardsFrame.Padding
            y = -RewardsFrame.Padding * 2
        }

        const panel = blzCreateFrameByType('BACKDROP', `${title}`, parent, 'QuestButtonDisabledBackdropTemplate', 0)
        panel.setPoint(framePoint1, parent, framePoint2, x, y)
        panel.setSize(width, height)

        // title above each panel
        const panelTitle = blzCreateFrameByType('TEXT', 'RewardPanelTitle', panel, '', 0)
        panelTitle.setPoint(FRAMEPOINT_TOPLEFT, panel, FRAMEPOINT_TOPLEFT, 0, RewardsFrame.Padding)
        panelTitle.text = title

        RewardsFrame.TempHandle = panel

        RewardsFrame.FrameByName.set(title, panel)

        return panel
    }

    private static CreateRandomRewardButton = () => {
        // Create the random rewards button at the bottom right of the rewards frame.
        const ButtonSize = 0.025
        const TooltipWidth = 0.25
        const BackgroundPadding = 0.01
        const TooltipYOffset = 0.01
        const dice = 'ReplaceableTextures\\CommandButtons\\BTNDice.blp'

        const button = blzCreateFrameByType(
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

        const icon = blzCreateFrameByType('BACKDROP', 'RandomRewardButtonIcon', button, '', 0)
        icon.setAllPoints(button)

        const background = blzCreateFrame('QuestButtonBaseTemplate', RewardsFrame.GameUI, 0, 0)
        const tooltipText = blzCreateFrameByType('TEXT', 'RandomRewardTooltip', background, '', 0)
        tooltipText.setSize(TooltipWidth, 0)
        background.setPoint(
            FRAMEPOINT_BOTTOMLEFT,
            tooltipText,
            FRAMEPOINT_BOTTOMLEFT,
            -BackgroundPadding,
            -BackgroundPadding
        )
        background.setPoint(FRAMEPOINT_TOPRIGHT, tooltipText, FRAMEPOINT_TOPRIGHT, BackgroundPadding, BackgroundPadding)

        button.setTooltip(background)
        tooltipText.setPoint(FRAMEPOINT_BOTTOM, button, FRAMEPOINT_TOP, 0, TooltipYOffset)
        tooltipText.enabled = false

        icon.setTexture(dice, 0, false)

        tooltipText.text = `${Colors.COLOR_YELLOW}Randomize Rewards${Colors.COLOR_RESET}\n${Colors.COLOR_ORANGE}Picks random cosmetics from your rewards list, applying them.${Colors.COLOR_RESET}`

        const t = Trigger.create()!
        t.triggerRegisterFrameEvent(button, FRAMEEVENT_CONTROL_CLICK)
        t.addAction(RewardsFrame.RandomRewardsButtonActions)
    }

    private static RandomRewardsButtonActions = () => {
        const player = getTriggerPlayer()
        const frame = Frame.fromHandle(BlzGetTriggerFrame())!
        try {
            RewardsFrame.RewardHelp.ClearRewards()

            for (const reward of RewardsManager.Rewards) {
                const stats = Globals.ALL_KITTIES.get(player)!.SaveData
                const value = RewardHelper.GetAwardNestedValue(stats.GameAwardsSorted, reward.TypeSorted, reward.name)
                if (value <= 0) continue

                RewardsFrame.RewardHelp.AddReward(reward)
            }

            const selectedHat =
                RewardsFrame.RewardHelp.Hats.length > 0
                    ? RewardsFrame.RewardHelp.Hats[GetRandomInt(0, RewardsFrame.RewardHelp.Hats.length - 1)]
                    : null
            const selectedWings =
                RewardsFrame.RewardHelp.Wings.length > 0
                    ? RewardsFrame.RewardHelp.Wings[GetRandomInt(0, RewardsFrame.RewardHelp.Wings.length - 1)]
                    : null
            const selectedTrail =
                RewardsFrame.RewardHelp.Trails.length > 0
                    ? RewardsFrame.RewardHelp.Trails[GetRandomInt(0, RewardsFrame.RewardHelp.Trails.length - 1)]
                    : null
            const selectedAura =
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
            Logger.Warning(`Error in RandomRewardsButtonActions: ${e}`)
        }
    }

    private static AppendRewardsToFrames = () => {
        const cols = RewardsFrame.RewardsPerRow
        const count: Map<number, number> = new Map()

        for (const reward of RewardsManager.Rewards) {
            const type = reward.Type
            count.set(type, (count.get(type) || 0) + 1)

            const totalRewards = RewardsFrame.CountNumberOfRewards(reward.Type)
            const col = ((count.get(type) || 0) - 1) % cols
            const row = Math.floor(((count.get(type) || 0) - 1) / cols)

            // Get the panel for RewardsFrame reward type
            const panelName = RewardType[reward.Type]
            const panel = RewardsFrame.FrameByName.get(panelName)
            if (!panel) continue

            // Create the reward button
            const rewardButton = blzCreateFrameByType(
                'Button',
                reward.name.toString(),
                panel,
                'ScoreScreenTabButtonTemplate',
                0
            )

            const x = col * RewardsFrame.IconSize + RewardsFrame.Padding
            const y = -row * RewardsFrame.IconSize - RewardsFrame.Padding / 2
            rewardButton.setPoint(FRAMEPOINT_TOPLEFT, panel, FRAMEPOINT_TOPLEFT, x, y)
            rewardButton.setSize(RewardsFrame.IconSize, RewardsFrame.IconSize)

            // Create the icon
            const icon = blzCreateFrameByType('BACKDROP', reward.name.toString() + 'icon', rewardButton, '', 0)
            icon.setAllPoints(rewardButton)

            RewardsFrame.RewardTooltip(rewardButton, reward)
            RewardsFrame.RewardIcons.set(icon, reward)

            // Register click event
            const triggerObj = Trigger.create()!
            triggerObj.triggerRegisterFrameEvent(rewardButton, FRAMEEVENT_CONTROL_CLICK)
            triggerObj.addAction(() => RewardsFrame.RewardButtonActions(reward))
        }
    }

    private static RewardTooltip(parent: Frame, reward: Reward) {
        const background = blzCreateFrame('QuestButtonBaseTemplate', RewardsFrame.GameUI, 0, 0)
        const tooltipText = blzCreateFrameByType('TEXT', `${reward.name}Tooltip`, background, '', 0)

        tooltipText.setSize(0.25, 0)
        background.setPoint(FRAMEPOINT_BOTTOMLEFT, tooltipText, FRAMEPOINT_BOTTOMLEFT, -0.01, -0.01)
        background.setPoint(FRAMEPOINT_TOPRIGHT, tooltipText, FRAMEPOINT_TOPRIGHT, 0.01, 0.01)

        parent.setTooltip(background)
        tooltipText.setPoint(FRAMEPOINT_BOTTOM, parent, FRAMEPOINT_TOP, 0, 0.01)
        tooltipText.enabled = false

        const name = BlzGetAbilityTooltip(reward.AbilityID, 0)
        const desc = BlzGetAbilityExtendedTooltip(reward.AbilityID, 0)

        tooltipText.text = `${name}\n${desc}`
    }

    private static RewardButtonActions(reward: Reward) {
        const player = getTriggerPlayer()
        const frame = Frame.fromEvent()
        const stats = Globals.ALL_KITTIES.get(player)!.SaveData
        const value = RewardHelper.GetAwardNestedValue(stats.GameAwardsSorted, reward.TypeSorted, reward.name)
        if (value <= 0) return // Doesnt have the reward , dont apply.
        reward.ApplyReward(player)
        if (!player.isLocal()) return
        if (!frame) return
        FrameManager.RefreshFrame(frame)
    }

    private static UnavilableRewardIcons(player: MapPlayer) {
        try {
            const stats = Globals.ALL_KITTIES.get(player)!.SaveData
            const unavailablePath = 'ReplaceableTextures\\CommandButtons\\BTNSelectHeroOn'
            for (const [frame, reward] of RewardsFrame.RewardIcons) {
                const value = RewardHelper.GetAwardNestedValue(stats.GameAwardsSorted, reward.TypeSorted, reward.name)
                if (value <= 0)
                    // Doesnt have reward
                    frame.setTexture(unavailablePath, 0, false)
                else frame.setTexture(BlzGetAbilityIcon(reward.AbilityID)!, 0, false)
            }
        } catch (e: any) {
            Logger.Warning(`Error in UnavilableRewardIcons: ${e}`)
        }
    }

    private static SetRewardsFrameHotkey = () => {
        const rewardsHotKey = Trigger.create()!
        for (const player of Globals.ALL_PLAYERS) {
            rewardsHotKey.registerPlayerKeyEvent(player, OSKEY_OEM_MINUS, 0, true)
        }
        rewardsHotKey.addAction(RewardsFrame.RewardsFrameActions)
    }

    public static RewardsFrameActions = () => {
        const player = getTriggerPlayer()
        if (!player.isLocal()) return
        if (CurrentGameMode.active !== GameMode.Standard) {
            player.DisplayTimedTextTo(
                3.0,
                `${Colors.COLOR_RED}Rewards are only available in Standard Mode${Colors.COLOR_RESET}`
            )
            return // Let's not activate rewards in tournament.
        }
        // if (ShopUtil.IsPlayerInWolfLane(player)) return;
        FrameManager.RewardsButton.visible = false
        FrameManager.RewardsButton.visible = true
        HideOtherFrames(RewardsFrame.RewardFrame)
        RewardsFrame.RewardFrame.visible = !RewardsFrame.RewardFrame.visible
        if (RewardsFrame.RewardFrame.visible) {
            RewardsFrame.UnavilableRewardIcons(player)
            MultiboardUtil.MinMultiboards(player, true)
        }
    }
}
