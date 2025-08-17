import { Globals } from 'src/Global/Globals'
import { FirstPersonCameraManager } from 'src/Misc/FirstPersonCameraManager'
import { MapPlayer } from 'w3ts'
import { safeArraySplice } from './ArrayUtils'
import { Colors } from './Colors/Colors'

export class CameraUtil {
    private static LockedCameras: MapPlayer[] = []
    private static KomotoCamEnabled: MapPlayer[] = []

    public static LockCamera(player: MapPlayer) {
        if (CameraUtil.LockedCameras.includes(player)) return
        const kitty = Globals.ALL_KITTIES.get(player)!
        CameraUtil.LockedCameras.push(player)
        if (!player.isLocal()) return
        SetCameraTargetController(kitty.Unit.handle, 0, 0, false)
    }

    public static UnlockCamera(player: MapPlayer) {
        safeArraySplice(CameraUtil.LockedCameras, p => p === player)
        safeArraySplice(CameraUtil.KomotoCamEnabled, p => p === player)
        FirstPersonCameraManager.SetFirstPerson(player, false)
        if (!player.isLocal()) return
        ResetToGameCamera(0)
        SetCameraField(CAMERA_FIELD_TARGET_DISTANCE, 2400.0, 0.0)
    }

    public static RelockCamera(player: MapPlayer) {
        const kitty = Globals.ALL_KITTIES.get(player)!
        if (!CameraUtil.LockedCameras.includes(player)) return
        if (!player.isLocal()) return
        SetCameraTargetController(kitty.Unit.handle, 0, 0, false)
    }

    public static OverheadCamera(player: MapPlayer, value: number) {
        if (!player.isLocal()) return
        SetCameraField(CAMERA_FIELD_ANGLE_OF_ATTACK, value, 0)
    }

    public static HandleZoomCommand(p: MapPlayer, args: string[]) {
        if (args[0] === '') return
        const zoom: number = S2I(args[0])
        if (!p.isLocal()) return
        SetCameraField(CAMERA_FIELD_TARGET_DISTANCE, zoom, 1.0)
    }

    public static ToggleKomotoCam(player: MapPlayer) {
        if (CameraUtil.KomotoCamEnabled.includes(player)) {
            safeArraySplice(CameraUtil.KomotoCamEnabled, p => p === player)
            player.DisplayTextTo(Colors.COLOR_YELLOW_ORANGE + 'disabled: KomotoCam!|r')

            CameraUtil.UnlockCamera(player)
        } else {
            CameraUtil.KomotoCamEnabled.push(player)
            player.DisplayTextTo(Colors.COLOR_YELLOW_ORANGE + 'enabled: KomotoCam!|r')

            CameraUtil.UpdateKomotoCam(player, Globals.ALL_KITTIES.get(player)!.CurrentSafeZone)
        }
    }

    public static UpdateKomotoCam(player: MapPlayer, safezoneIndex: number) {
        if (!CameraUtil.KomotoCamEnabled.includes(player)) return

        const rotation: number = (4 - (safezoneIndex % 4)) * 90.0 + 90.0
        if (!player.isLocal()) return
        SetCameraField(CAMERA_FIELD_ROTATION, rotation, 0.0)
    }
}
