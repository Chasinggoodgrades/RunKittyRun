﻿using WCSharp.Api;
using static WCSharp.Api.Common;

public class SoloDeathTimer
{
    private const float TIME_TO_REVIVE = 6.0f;
    private const float TextTagHeight = 0.018f;
    private const float Y_OFFSET = 5.0f;
    public AchesTimers ReviveTimer;
    public AchesTimers UpdateTextTimer;
    public player Player;
    public texttag FloatingTimer;

    public SoloDeathTimer(player player)
    {
        Player = player;
        ReviveTimer = ObjectPool.GetEmptyObject<AchesTimers>();
        UpdateTextTimer = ObjectPool.GetEmptyObject<AchesTimers>();
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
        ReviveTimer.Timer.Start(TIME_TO_REVIVE, false, Revive);
        UpdateTextTimer.Timer.Start(0.03f, true, UpdateFloatingText);
    }

    private void UpdateFloatingText()
    {
        FloatingTimer.SetText($"{Colors.GetStringColorOfPlayer(Player.Id + 1)}{ReviveTimer.Timer.Remaining.ToString("F2")}|r", TextTagHeight);
    }

    private void Revive()
    {
        try
        {
            var kitty = Globals.ALL_KITTIES[Player];
            var lastCheckpoint = Globals.SAFE_ZONES[kitty.CurrentSafeZone];
            var x = lastCheckpoint.Rect_.CenterX;
            var y = lastCheckpoint.Rect_.CenterY;
            kitty.ReviveKitty();
            kitty.Unit.SetPosition(x, y);
            if (Player.IsLocal) PanCameraToTimed(x, y, 0.00f);
            CameraUtil.RelockCamera(Player);
            Dispose();
        }
        catch (System.Exception e)
        {
            Logger.Warning($"Error in SoloDeathTimer.Revive: {e.Message}");
            Dispose();
        }
    }

    private void Dispose()
    {
        ReviveTimer.Dispose();
        UpdateTextTimer.Dispose();
        FloatingTimer.Dispose();
        FloatingTimer = null;
    }
}
