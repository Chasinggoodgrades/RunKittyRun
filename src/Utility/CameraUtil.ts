export class CameraUtil {
    private static LockedCameras: MapPlayer[] = []
    private static KomotoCamEnabled: MapPlayer[] = []

    public static LockCamera(player: MapPlayer) {
        if (LockedCameras.includes(player)) return
        let kitty = Globals.ALL_KITTIES.get(player)
        LockedCameras.push(player)
        if (!player.isLocal()) return
        SetCameraTargetController(kitty.Unit, 0, 0, false)
    }

    public static UnlockCamera(player: MapPlayer) {
        LockedCameras.Remove(player)
        KomotoCamEnabled.Remove(player)
        FirstPersonCameraManager.SetFirstPerson(player, false)
        if (!player.isLocal()) return
        ResetToGameCamera(0)
        SetCameraField(CAMERA_FIELD_TARGET_DISTANCE, 2400.0, 0.0)
    }

    public static RelockCamera(player: MapPlayer) {
        let kitty = Globals.ALL_KITTIES.get(player)
        if (!LockedCameras.includes(player)) return
        if (!player.isLocal()) return
        SetCameraTargetController(kitty.Unit, 0, 0, false)
    }

    public static OverheadCamera(player: MapPlayer, value: number) {
        if (!player.isLocal()) return
        SetCameraField(CAMERA_FIELD_ANGLE_OF_ATTACK, value, 0)
    }

    public static HandleZoomCommand(p: MapPlayer, args: string[]) {
        if (args[0] == '') return
        let zoom: number = float.Parse(args[0])
        if (!p.isLocal()) return
        SetCameraField(CAMERA_FIELD_TARGET_DISTANCE, zoom, 1.0)
    }

    public static ToggleKomotoCam(player: MapPlayer) {
        if (KomotoCamEnabled.includes(player)) {
            KomotoCamEnabled.Remove(player)
            player.DisplayTextTo(Colors.COLOR_YELLOW_ORANGE + 'disabled: KomotoCam!|r')

            UnlockCamera(player)
        } else {
            KomotoCamEnabled.push(player)
            player.DisplayTextTo(Colors.COLOR_YELLOW_ORANGE + 'enabled: KomotoCam!|r')

            UpdateKomotoCam(player, Globals.ALL_KITTIES.get(player).CurrentSafeZone)
        }
    }

    public static UpdateKomotoCam(player: MapPlayer, safezoneIndex: number) {
        if (!KomotoCamEnabled.includes(player)) return

        let rotation: number = (4 - (safezoneIndex % 4)) * 90.0 + 90.0
        if (!player.isLocal()) return
        SetCameraField(CAMERA_FIELD_ROTATION, rotation, 0.0)
    }
}
