export class SpinCam {
    public Kitty: Kitty
    public SpinCamSpeed: number = 0
    public SpinCamRotation: number = 0 // Should just read current value but it doesn't seem to work :/
    public SpinCamTimer: timer
    public WasSpinCamReset: boolean = false

    public SpinCam(kitty: Kitty) {
        this.Kitty = kitty
    }

    public ToggleSpinCam(speed: number) {
        this.SpinCamSpeed = speed / 360
        this.WasSpinCamReset = false

        if (this.SpinCamSpeed != 0) {
            if (SpinCamTimer == null) {
                SpinCamTimer = timer.Create()
                SpinCamTimer.start(0.0075, true, SpinCamActions)
            }
        } else {
            SpinCamTimer?.pause()
            SpinCamTimer = null
            CameraUtil.UnlockCamera(Kitty.Player)
        }
    }

    public IsSpinCamActive(): boolean {
        return SpinCamTimer != null
    }

    private SpinCamActions() {
        if (!this.Kitty.Slider.IsOnSlideTerrain() || !Kitty.Alive) {
            if (!this.Kitty.Alive && !this.WasSpinCamReset) {
                this.WasSpinCamReset = true
                this.SpinCamRotation = 0
                SetCameraFieldForPlayer(Kitty.Player, CAMERA_FIELD_ROTATION, 0, 0)
            }

            return
        }

        SpinCamRotation = this.Kitty.Slider.ForceAngleBetween0And360(SpinCamRotation + this.SpinCamSpeed)
        SetCameraFieldForPlayer(Kitty.Player, CAMERA_FIELD_ROTATION, SpinCamRotation, 0)
    }
}
