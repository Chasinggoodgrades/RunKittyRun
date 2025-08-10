

class SoloDeathTimer
{
    private TIME_TO_REVIVE: number = 6.0;
    private TextTagHeight: number = 0.018;
    private Y_OFFSET: number = 5.0;
    public ReviveTimer: AchesTimers;
    public UpdateTextTimer: AchesTimers;
    public Player: player;
    public FloatingTimer: texttag;

    public SoloDeathTimer(player: player)
    {
        Player = player;
        ReviveTimer = ObjectPool.GetEmptyObject<AchesTimers>();
        UpdateTextTimer = ObjectPool.GetEmptyObject<AchesTimers>();
        FloatingTimer = CreateFloatingTimer();
        StartTimers();
    }

    private CreateFloatingTimer(): texttag
    {
        let circle = Globals.ALL_CIRCLES[Player];
        let floatText = texttag.Create();
        floatText.SetPosition(circle.Unit.X, circle.Unit.Y - Y_OFFSET, 0);
        floatText.SetVisibility(true);
        return floatText;
    }

    private StartTimers()
    {
        ReviveTimer.Timer.Start(TIME_TO_REVIVE, false, Revive);
        UpdateTextTimer.Timer.Start(0.03, true, UpdateFloatingText);
    }

    private UpdateFloatingText()
    {
        FloatingTimer.SetText("{Colors.GetStringColorOfPlayer(Player.Id + 1)}{ReviveTimer.Timer.Remaining.ToString("F2")}|r", TextTagHeight);
    }

    private Revive()
    {
        try
        {
            let kitty = Globals.ALL_KITTIES[Player];
            let lastCheckpoint = Globals.SAFE_ZONES[kitty.CurrentSafeZone];
            let x = lastCheckpoint.Rect_.CenterX;
            let y = lastCheckpoint.Rect_.CenterY;
            kitty.ReviveKitty();
            kitty.Unit.SetPosition(x, y);
            if (Player.IsLocal) PanCameraToTimed(x, y, 0.00);
            CameraUtil.RelockCamera(Player);
            Dispose();
        }
        catch (e: Error)
        {
            Logger.Warning("Error in SoloDeathTimer.Revive: {e.Message}");
            Dispose();
        }
    }

    private Dispose()
    {
        ReviveTimer.Dispose();
        UpdateTextTimer.Dispose();
        FloatingTimer.Dispose();
        FloatingTimer = null;
    }
}
