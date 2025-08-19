import { Logger } from 'src/Events/Logger/Logger'
import { Globals } from 'src/Global/Globals'
import { CameraUtil } from 'src/Utility/CameraUtil'
import { ColorUtils } from 'src/Utility/Colors/ColorUtils'
import { AchesTimers, createAchesTimer } from 'src/Utility/MemoryHandler/AchesTimers'
import { MapPlayer, TextTag } from 'w3ts'

export class SoloDeathTimer {
    private TIME_TO_REVIVE = 6.0
    private TextTagHeight = 0.018
    private Y_OFFSET = 5.0
    public ReviveTimer: AchesTimers
    public UpdateTextTimer: AchesTimers
    public Player: MapPlayer
    public FloatingTimer: TextTag

    public constructor(player: MapPlayer) {
        this.Player = player
        this.ReviveTimer = createAchesTimer()
        this.UpdateTextTimer = createAchesTimer()
        this.FloatingTimer = this.CreateFloatingTimer()
        this.StartTimers()
    }

    private CreateFloatingTimer(): TextTag {
        const circle = Globals.ALL_CIRCLES.get(this.Player)
        const floatText = TextTag.create()
        if (!circle || !floatText) return floatText! // xd
        floatText.setPos(circle.Unit.x, circle.Unit.y - this.Y_OFFSET, 0)
        floatText.setVisible(true)
        return floatText
    }

    private StartTimers = () => {
        this.ReviveTimer.start(this.TIME_TO_REVIVE, false, this.Revive)
        this.UpdateTextTimer.start(0.03, true, this.UpdateFloatingText)
    }

    private UpdateFloatingText = () => {
        SetTextTagText(
            this.FloatingTimer.handle,
            `${ColorUtils.GetStringColorOfPlayer(this.Player.id + 1)}${this.ReviveTimer.remaining().toFixed(2)}|r`,
            this.TextTagHeight
        )
    }

    private Revive = () => {
        try {
            const kitty = Globals.ALL_KITTIES.get(this.Player)!
            const lastCheckpoint = Globals.SAFE_ZONES[kitty.CurrentSafeZone]
            const x = lastCheckpoint.Rectangle.centerX
            const y = lastCheckpoint.Rectangle.centerY
            kitty.ReviveKitty()
            kitty.Unit.setPosition(x, y)
            if (this.Player.isLocal()) PanCameraToTimed(x, y, 0.0)
            CameraUtil.RelockCamera(this.Player)
            this.Dispose()
        } catch (e) {
            Logger.Warning(`Error in SoloDeathTimer.Revive: ${e}`)
            this.Dispose()
        }
    }

    private Dispose = () => {
        this.ReviveTimer.dispose()
        this.UpdateTextTimer.dispose()
        this.FloatingTimer.destroy()
    }
}
