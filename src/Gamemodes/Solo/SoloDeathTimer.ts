import { Logger } from 'src/Events/Logger/Logger'
import { Globals } from 'src/Global/Globals'
import { CameraUtil } from 'src/Utility/CameraUtil'
import { ColorUtils } from 'src/Utility/Colors/ColorUtils'
import { AchesTimers } from 'src/Utility/MemoryHandler/AchesTimers'
import { MemoryHandler } from 'src/Utility/MemoryHandler/MemoryHandler'
import { MapPlayer, TextTag } from 'w3ts'

export class SoloDeathTimer {
    private TIME_TO_REVIVE: number = 6.0
    private TextTagHeight: number = 0.018
    private Y_OFFSET: number = 5.0
    public ReviveTimer: AchesTimers
    public UpdateTextTimer: AchesTimers
    public Player: MapPlayer
    public FloatingTimer: TextTag

    constructor(player: MapPlayer) {
        this.SoloDeathTimer(player)
    }

    public SoloDeathTimer(player: MapPlayer) {
        this.Player = player
        this.ReviveTimer = MemoryHandler.getEmptyObject<AchesTimers>()
        this.UpdateTextTimer = MemoryHandler.getEmptyObject<AchesTimers>()
        this.FloatingTimer = this.CreateFloatingTimer()
        this.StartTimers()
    }

    private CreateFloatingTimer(): TextTag {
        let circle = Globals.ALL_CIRCLES.get(this.Player)
        let floatText = TextTag.create()
        if (!circle || !floatText) return floatText! // xd
        floatText.setPos(circle.Unit.x, circle.Unit.y - this.Y_OFFSET, 0)
        floatText.setVisible(true)
        return floatText
    }

    private StartTimers() {
        this.ReviveTimer.start(this.TIME_TO_REVIVE, false, this.Revive)
        this.UpdateTextTimer.start(0.03, true, this.UpdateFloatingText)
    }

    private UpdateFloatingText() {
        SetTextTagText(
            this.FloatingTimer.handle,
            `${ColorUtils.GetStringColorOfPlayer(this.Player.id + 1)}${this.ReviveTimer.remaining().toFixed(2)}|r`,
            this.TextTagHeight
        )
    }

    private Revive() {
        try {
            let kitty = Globals.ALL_KITTIES.get(this.Player)!
            let lastCheckpoint = Globals.SAFE_ZONES[kitty.CurrentSafeZone]
            let x = lastCheckpoint.Rectangle.centerX
            let y = lastCheckpoint.Rectangle.centerY
            kitty.ReviveKitty()
            kitty.Unit.setPosition(x, y)
            if (this.Player.isLocal()) PanCameraToTimed(x, y, 0.0)
            CameraUtil.RelockCamera(this.Player)
            this.Dispose()
        } catch (e: any) {
            Logger.Warning(`Error in SoloDeathTimer.Revive: ${e.Message}`)
            this.Dispose()
        }
    }

    private Dispose() {
        this.ReviveTimer.dispose()
        this.UpdateTextTimer.dispose()
        this.FloatingTimer.destroy()
    }
}
