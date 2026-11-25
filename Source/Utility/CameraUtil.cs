using System.Collections.Generic;
using WCSharp.Api;
using static WCSharp.Api.Common;

public static class CameraUtil
{
    private static List<player> LockedCameras { get; set; } = new List<player>();
    private static List<player> KomotoCamEnabled { get; set; } = new List<player>();

    // Local to this machine, only ever used for camera calls: true while the locked camera follows the async
    // stand-in effect (the unit is hidden and a latency behind it) instead of being locked to the unit.
    private static bool followingEffect;

    // Local, camera calls only: a timed pan (the podium) must not be undone by the follow below on the next tick.
    private static bool followPaused;

    /// <summary>The local camera is about to be panned somewhere on purpose: stop following the effect until the next lock.</summary>
    public static void PauseFollow()
    {
        followPaused = true;
    }

    /// <summary>Locks the local camera to where the Kitty is drawn: its async effect when active, the unit otherwise.</summary>
    private static void LockLocalCamera(Kitty kitty)
    {
        followPaused = false;
        var fx = kitty.AsyncEffect;
        if (fx != null && fx.IsActive)
        {
            followingEffect = true;
            SetCameraPosition(fx.X, fx.Y);
            return;
        }

        followingEffect = false;
        SetCameraTargetController(kitty.Unit, 0, 0, false);
    }

    /// <summary>
    /// Called by the async tick on every machine; only the local one does anything. The camera lock follows the unit, which is a
    /// latency behind the effect the player actually sees, so while the effect stands in the camera is placed on it every tick.
    /// When the effect stands down (death) the lock goes back onto the unit.
    /// </summary>
    public static void FollowAsyncEffect()
    {
        if (followPaused) return;

        var player = AsyncKittySync.LocalPlayer;
        if (!LockedCameras.Contains(player)) return;

        var kitty = Globals.GetKitty(player);
        if (kitty == null || kitty.Unit == null) return;

        var fx = kitty.AsyncEffect;
        if (fx != null && fx.IsActive)
        {
            followingEffect = true;
            SetCameraPosition(fx.X, fx.Y);
        }
        else if (followingEffect)
        {
            followingEffect = false;
            SetCameraTargetController(kitty.Unit, 0, 0, false);
        }
    }

    public static void LockCamera(player player)
    {
        if (LockedCameras.Contains(player)) return;
        var kitty = Globals.ALL_KITTIES[player];
        LockedCameras.Add(player);
        if (!player.IsLocal) return;
        LockLocalCamera(kitty);
    }

    public static void UnlockCamera(player player)
    {
        LockedCameras.Remove(player);
        KomotoCamEnabled.Remove(player);
        FirstPersonCameraManager.SetFirstPerson(player, false);
        if (!player.IsLocal) return;
        followingEffect = false;
        followPaused = false;
        ResetToGameCamera(0);
        SetCameraField(CAMERA_FIELD_TARGET_DISTANCE, 2400.0f, 0.0f);
    }

    public static void RelockCamera(player player)
    {
        var kitty = Globals.ALL_KITTIES[player];
        if (!LockedCameras.Contains(player)) return;
        if (!player.IsLocal) return;
        LockLocalCamera(kitty);
    }

    public static void SetCameraOnKitty(Kitty k)
    {
        if (!k.Player.IsLocal) return;
        PanCameraToTimed(k.Unit.X, k.Unit.Y, 0.0f);
    }

    public static void OverheadCamera(player player, float value)
    {
        if (!player.IsLocal) return;
        SetCameraField(CAMERA_FIELD_ANGLE_OF_ATTACK, value, 0);
    }

    public static void HandleZoomCommand(player p, string[] args)
    {
        if (args[0] == "") return;
        float zoom = float.Parse(args[0]);
        if (!p.IsLocal) return;
        SetCameraField(CAMERA_FIELD_TARGET_DISTANCE, zoom, 1.0f);
    }

    public static void ToggleKomotoCam(player player)
    {
        if (KomotoCamEnabled.Contains(player))
        {
            KomotoCamEnabled.Remove(player);
            player.DisplayTextTo(Colors.COLOR_YELLOW_ORANGE + "KomotoCam disabled!|r");

            UnlockCamera(player);
        }
        else
        {
            KomotoCamEnabled.Add(player);
            player.DisplayTextTo(Colors.COLOR_YELLOW_ORANGE + "KomotoCam enabled!|r");

            UpdateKomotoCam(player, Globals.ALL_KITTIES[player].CurrentSafeZone);
        }
    }

    public static void UpdateKomotoCam(player player, int safezoneIndex)
    {
        if (!KomotoCamEnabled.Contains(player)) return;

        float rotation = ((4 - (safezoneIndex % 4)) * 90.0f) + 90.0f;
        if (!player.IsLocal) return;
        SetCameraField(CAMERA_FIELD_ROTATION, rotation, 0.0f);
    }
}
