export class SoloDeathTimer {
    private TIME_TO_REVIVE: number = 6.0
    private TextTagHeight: number = 0.018
    private Y_OFFSET: number = 5.0
    public ReviveTimer: AchesTimers
    public UpdateTextTimer: AchesTimers
    public Player: MapPlayer
    public FloatingTimer: texttag

    public SoloDeathTimer(player: MapPlayer) {
        Player = player
        ReviveTimer = MemoryHandler.getEmptyObject<AchesTimers>()
        UpdateTextTimer = MemoryHandler.getEmptyObject<AchesTimers>()
        FloatingTimer = CreateFloatingTimer()
        StartTimers()
    }

    private CreateFloatingTimer(): texttag {
        let circle = Globals.ALL_CIRCLES[Player]
        let floatText = CreateTextTag()!
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
            this.FloatingTimer,
            '{Colors.GetStringColorOfPlayer(Player.Id + 1)}' + this.ReviveTimer.Remaining().toFixed(2) + '|r',
            this.TextTagHeight
        )
    }

    private Revive() {
        try {
            let kitty = Globals.ALL_KITTIES[Player]
            let lastCheckpoint = Globals.SAFE_ZONES[kitty.CurrentSafeZone]
            let x = lastCheckpoint.Rect_.CenterX
            let y = lastCheckpoint.Rect_.CenterY
            kitty.ReviveKitty()
            kitty.Unit.setPos(x, y)
            if (Player.isLocal()) PanCameraToTimed(x, y, 0.0)
            CameraUtil.RelockCamera(Player)
            Dispose()
        } catch (e) {
            Logger.Warning('Error in SoloDeathTimer.Revive: {e.Message}')
            Dispose()
        }
    }

    private Dispose() {
        ReviveTimer.Dispose()
        UpdateTextTimer.Dispose()
        FloatingTimer.Dispose()
        FloatingTimer = null
    }
}
