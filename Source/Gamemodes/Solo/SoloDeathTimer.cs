using WCSharp.Api;
using static WCSharp.Api.Common;
public class SoloDeathTimer
{
    private const float TIME_TO_REVIVE = 6.0f;
    private const float TextTagHeight = 0.018f;
    private const float Y_OFFSET = 5.0f;
    public timer ReviveTimer;
    public timer UpdateTextTimer;
    public player Player;
    public texttag FloatingTimer;

    public SoloDeathTimer(player player)
    {
        Player = player;
        ReviveTimer = timer.Create();
        UpdateTextTimer = timer.Create();
        FloatingTimer = CreateFloatingTimer();
        StartTimers();
    }

    private texttag CreateFloatingTimer()
    {
        var circle = Globals.ALL_CIRCLES[Player];
        var floatText = texttag.Create();
        floatText.SetPosition(circle.Unit.X, circle.Unit.Y - Y_OFFSET, 0);
        floatText.SetVisibility(true);
        return floatText;
    }

    private void StartTimers()
    {
        ReviveTimer.Start(TIME_TO_REVIVE, false, Revive);
        UpdateTextTimer.Start(0.03f, true, UpdateFloatingText);
    }

    private void UpdateFloatingText()
    {
        FloatingTimer.SetText($"{Colors.GetStringColorOfPlayer(Player.Id + 1)}{ReviveTimer.Remaining.ToString("F2")}|r", TextTagHeight);
    }

    private void Revive()
    {
        var kitty = Globals.ALL_KITTIES[Player];
        var lastCheckpoint = Globals.PLAYERS_CURRENT_SAFEZONE[Player];
        var x = Globals.SAFE_ZONES[lastCheckpoint].Rect_.CenterX;
        var y = Globals.SAFE_ZONES[lastCheckpoint].Rect_.CenterY;
        kitty.ReviveKitty();
        kitty.Unit.SetPosition(x, y);
        if (Player.IsLocal) PanCameraToTimed(x, y, 0.00f);
        CameraUtil.RelockCamera(Player);
        Dispose();
    }

    private void Dispose()
    {
        GC.RemoveTimer(ref ReviveTimer);
        GC.RemoveTimer(ref UpdateTextTimer);
        FloatingTimer.Dispose();
        FloatingTimer = null;
    }
}