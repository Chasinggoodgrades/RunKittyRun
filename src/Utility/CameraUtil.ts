class CameraUtil {
    private static LockedCameras: player[] = []
    private static KomotoCamEnabled: player[] = []

    public static LockCamera(player: player) {
        if (LockedCameras.Contains(player)) return
        let kitty = Globals.ALL_KITTIES[player]
        LockedCameras.Add(player)
        if (!player.IsLocal) return
        SetCameraTargetController(kitty.Unit, 0, 0, false)
    }

    public static UnlockCamera(player: player) {
        LockedCameras.Remove(player)
        KomotoCamEnabled.Remove(player)
        FirstPersonCameraManager.SetFirstPerson(player, false)
        if (!player.IsLocal) return
        ResetToGameCamera(0)
        SetCameraField(CAMERA_FIELD_TARGET_DISTANCE, 2400.0, 0.0)
    }

    public static RelockCamera(player: player) {
        let kitty = Globals.ALL_KITTIES[player]
        if (!LockedCameras.Contains(player)) return
        if (!player.IsLocal) return
        SetCameraTargetController(kitty.Unit, 0, 0, false)
    }

    public static OverheadCamera(player: player, value: number) {
        if (!player.IsLocal) return
        SetCameraField(CAMERA_FIELD_ANGLE_OF_ATTACK, value, 0)
    }

    public static HandleZoomCommand(p: player, args: string[]) {
        if (args[0] == '') return
        let zoom: number = float.Parse(args[0])
        if (!p.IsLocal) return
        SetCameraField(CAMERA_FIELD_TARGET_DISTANCE, zoom, 1.0)
    }

    public static ToggleKomotoCam(player: player) {
        if (KomotoCamEnabled.Contains(player)) {
            KomotoCamEnabled.Remove(player)
            player.DisplayTextTo(Colors.COLOR_YELLOW_ORANGE + 'disabled: KomotoCam!|r')

            UnlockCamera(player)
        } else {
            KomotoCamEnabled.Add(player)
            player.DisplayTextTo(Colors.COLOR_YELLOW_ORANGE + 'enabled: KomotoCam!|r')

            UpdateKomotoCam(player, Globals.ALL_KITTIES[player].CurrentSafeZone)
        }
    }

    public static UpdateKomotoCam(player: player, safezoneIndex: number) {
        if (!KomotoCamEnabled.Contains(player)) return

        let rotation: number = (4 - (safezoneIndex % 4)) * 90.0 + 90.0
        if (!player.IsLocal) return
        SetCameraField(CAMERA_FIELD_ROTATION, rotation, 0.0)
    }
}
