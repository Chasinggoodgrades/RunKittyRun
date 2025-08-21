import { Kitty } from 'src/Game/Entities/Kitty/Kitty'
import { CameraUtil } from 'src/Utility/CameraUtil'
import { Timer } from 'w3ts'

export class SpinCam {
    public Kitty: Kitty
    public SpinCamSpeed = 0
    public SpinCamRotation = 0 // Should just read current value but it doesn't seem to work :/
    public SpinCamTimer: Timer | undefined
    public WasSpinCamReset = false

    public constructor(kitty: Kitty) {
        this.Kitty = kitty
    }

    public ToggleSpinCam = (speed: number) => {
        this.SpinCamSpeed = speed / 360
        this.WasSpinCamReset = false

        if (this.SpinCamSpeed !== 0) {
            if (!this.SpinCamTimer) {
                this.SpinCamTimer = Timer.create()
                this.SpinCamTimer.start(0.0075, true, this.SpinCamActions)
            }
        } else {
            this.SpinCamTimer?.pause()
            this.SpinCamTimer = null as never
            CameraUtil.UnlockCamera(this.Kitty.Player)
        }
    }

    public IsSpinCamActive() {
        return !!this.SpinCamTimer
    }

    private SpinCamActions = () => {
        if (!this.Kitty.Slider.IsOnSlideTerrain() || !this.Kitty.isAlive()) {
            if (!this.Kitty.isAlive() && !this.WasSpinCamReset) {
                this.WasSpinCamReset = true
                this.SpinCamRotation = 0
                SetCameraFieldForPlayer(this.Kitty.Player.handle, CAMERA_FIELD_ROTATION, 0, 0)
            }

            return
        }

        this.SpinCamRotation = this.Kitty.Slider.ForceAngleBetween0And360(this.SpinCamRotation + this.SpinCamSpeed)
        SetCameraFieldForPlayer(this.Kitty.Player.handle, CAMERA_FIELD_ROTATION, this.SpinCamRotation, 0)
    }
}
