using WCSharp.Api;
using static WCSharp.Api.Common;
public class SpinCam
{
    public Kitty Kitty { get; set; }
    public float SpinCamSpeed { get; set; } = 0;
    public float SpinCamRotation { get; set; } = 0; // Should just read current value but it doesn't seem to work :/
    public timer SpinCamTimer { get; set; }
    public bool WasSpinCamReset { get; set; } = false;

    public SpinCam(Kitty kitty)
    {
        this.Kitty = kitty;
    }

    public void ToggleSpinCam(float speed)
    {
        this.SpinCamSpeed = speed / 360;
        this.WasSpinCamReset = false;

        if (this.SpinCamSpeed != 0)
        {
            if (SpinCamTimer == null)
            {
                SpinCamTimer = timer.Create();
                SpinCamTimer.Start(0.0075f, true, SpinCamActions);
            }
        }
        else
        {
            SpinCamTimer?.Pause();
            SpinCamTimer = null;
            CameraUtil.UnlockCamera(Kitty.Player);
        }
    }

    public bool IsSpinCamActive()
    {
        return SpinCamTimer != null;
    }

    private void SpinCamActions()
    {
        if (!this.Kitty.Slider.IsOnSlideTerrain() || !Kitty.Alive)
        {
            if (!this.Kitty.Alive && !this.WasSpinCamReset)
            {
                this.WasSpinCamReset = true;
                this.SpinCamRotation = 0;
                Blizzard.SetCameraFieldForPlayer(Kitty.Player, CAMERA_FIELD_ROTATION, 0, 0);
            }

            return;
        }

        SpinCamRotation = this.Kitty.Slider.ForceAngleBetween0And360(SpinCamRotation + this.SpinCamSpeed);
        Blizzard.SetCameraFieldForPlayer(Kitty.Player, CAMERA_FIELD_ROTATION, SpinCamRotation, 0);
    }
}
