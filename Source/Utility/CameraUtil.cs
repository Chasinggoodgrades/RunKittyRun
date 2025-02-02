using System.Collections.Generic;
using WCSharp.Api;
using static WCSharp.Api.Common;
public static class CameraUtil
{
    private static List<player> LockedCameras { get; set; } = new List<player>();

    public static void LockCamera(player player)
    {
        var kitty = Globals.ALL_KITTIES[player];
        LockedCameras.Add(player);
        if (!player.IsLocal) return;
        SetCameraTargetController(kitty.Unit, 0, 0, false);
    }

    public static void UnlockCamera(player player)
    {
        LockedCameras.Remove(player);
        if(!player.IsLocal) return;
        ResetToGameCamera(0);
        SetCameraField(CAMERA_FIELD_TARGET_DISTANCE, 2400.0f, 0.0f);
    }

    public static void RelockCamera(player player)
    {
        var kitty = Globals.ALL_KITTIES[player];
        if (!LockedCameras.Contains(player)) return;
        if (!player.IsLocal) return;
        SetCameraTargetController(kitty.Unit, 0, 0, false);
    }

    public static void OverheadCamera(player player, float value)
    {
        if(!player.IsLocal) return;
        SetCameraField(CAMERA_FIELD_ANGLE_OF_ATTACK, value, 0);
    }

    public static void HandleZoomCommand(player p, string[] args)
    {
        if (args.Length < 2)
        {
            p.DisplayTextTo(Colors.COLOR_YELLOW_ORANGE + "Incorrect usage: -zoom (xxxx) or -cam (xxxx)|r");
            return;
        }

        float zoom = float.Parse(args[1]);
        if (!p.IsLocal) return;
        SetCameraField(CAMERA_FIELD_TARGET_DISTANCE, zoom, 1.0f);
    }
}