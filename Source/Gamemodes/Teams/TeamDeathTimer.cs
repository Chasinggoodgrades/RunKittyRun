using System.Collections.Generic;
using WCSharp.Api;
using static WCSharp.Api.Common;

/// <summary>
/// Handles auto-reviving an entire team after all members have died.
/// Revives everyone at the lowest checkpoint reached amongst the team.
/// </summary>
public class TeamDeathTimer
{
    private const float TIME_TO_REVIVE = 6.0f;
    private const float TextTagHeight = 0.018f;
    private const float Y_OFFSET = 5.0f;
    public timer ReviveTimer;
    public timer UpdateTextTimer;
    public Team Team;
    public List<texttag> FloatingTimers;

    public TeamDeathTimer(Team team)
    {
        Team = team;
        ReviveTimer = timer.Create();
        UpdateTextTimer = timer.Create();
        FloatingTimers = CreateFloatingTimers();
        StartTimers();
    }

    private List<texttag> CreateFloatingTimers()
    {
        var tags = new List<texttag>();
        for (int i = 0; i < Team.Teammembers.Count; i++)
        {
            var circle = Globals.ALL_CIRCLES[Team.Teammembers[i]];
            var floatText = texttag.Create();
            floatText.SetPosition(circle.Unit.X, circle.Unit.Y - Y_OFFSET, 0);
            floatText.SetVisibility(true);
            tags.Add(floatText);
        }
        return tags;
    }

    private void StartTimers()
    {
        ReviveTimer.Start(TIME_TO_REVIVE, false, Revive);
        UpdateTextTimer.Start(0.03f, true, UpdateFloatingText);
    }

    private void UpdateFloatingText()
    {
        var timeText = ReviveTimer.Remaining.ToString("F2");
        for (int i = 0; i < Team.Teammembers.Count; i++)
        {
            var player = Team.Teammembers[i];
            FloatingTimers[i].SetText($"{Colors.GetColorNameByTeamID(Team.TeamID)}{timeText}|r", TextTagHeight);
        }
    }

    private int GetLowestCheckpointOnTeam()
    {
        var minSafeZone = int.MaxValue;
        for (int i = 0; i < Team.Teammembers.Count; i++)
        {
            if (!Globals.ALL_KITTIES.TryGetValue(Team.Teammembers[i], out var kitty)) continue;
            if (kitty.CurrentSafeZone < minSafeZone) minSafeZone = kitty.CurrentSafeZone;
        }
        return minSafeZone == int.MaxValue ? 0 : minSafeZone;
    }

    private void Revive()
    {
        try
        {
            var minSafeZone = GetLowestCheckpointOnTeam();
            var checkpoint = Globals.SAFE_ZONES[minSafeZone];
            var x = checkpoint.Rect_.CenterX;
            var y = checkpoint.Rect_.CenterY;

            for (int i = 0; i < Team.Teammembers.Count; i++)
            {
                var player = Team.Teammembers[i];
                if (!Globals.ALL_KITTIES.TryGetValue(player, out var kitty)) continue;

                kitty.CurrentSafeZone = minSafeZone;
                kitty.ReviveKitty();
                kitty.Unit.SetPosition(x, y);
                if (player.IsLocal) PanCameraToTimed(x, y, 0.00f);
                CameraUtil.RelockCamera(player);
            }

            Team.Finished = false;
            Dispose();
        }
        catch (System.Exception e)
        {
            Logger.Warning($"Error in TeamDeathTimer.Revive: {e.Message}");
            Dispose();
        }
    }

    private void Dispose()
    {
        ReviveTimer.Dispose();
        UpdateTextTimer.Dispose();
        for (int i = 0; i < FloatingTimers.Count; i++)
        {
            FloatingTimers[i].Dispose();
        }
        FloatingTimers = null;
    }
}
