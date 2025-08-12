class SoloDeathTimer {
    private TIME_TO_REVIVE: number = 6.0
    private TextTagHeight: number = 0.018
    private Y_OFFSET: number = 5.0
    public ReviveTimer: AchesTimers
    public UpdateTextTimer: AchesTimers
    public Player: player
    public FloatingTimer: texttag

    public SoloDeathTimer(player: player) {
        Player = player
        ReviveTimer = ObjectPool.GetEmptyObject<AchesTimers>()
        UpdateTextTimer = ObjectPool.GetEmptyObject<AchesTimers>()
        FloatingTimer = CreateFloatingTimer()
        StartTimers()
    }

    private CreateFloatingTimer(): texttag {
        let circle = Globals.ALL_CIRCLES[Player]
        let floatText = CreateTextTag()!
        floatText.SetPosition(GetUnitX(circle.Unit), GetUnitY(circle.Unit) - this.Y_OFFSET, 0)
        floatText.SetVisibility(true)
        return floatText
    }

    private StartTimers() {
        this.ReviveTimer.Start(this.TIME_TO_REVIVE, false, this.Revive)
        this.UpdateTextTimer.Start(0.03, true, this.UpdateFloatingText)
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
            kitty.Unit.SetPosition(x, y)
            if (Player.IsLocal) PanCameraToTimed(x, y, 0.0)
            CameraUtil.RelockCamera(Player)
            Dispose()
        } catch (e: Error) {
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
