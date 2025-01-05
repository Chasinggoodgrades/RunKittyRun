using System;
using System.Linq;
using WCSharp.Api;
using static WCSharp.Api.Common;

public class Slider
{
    private player Player;
    private unit SliderUnit;
    private timer SliderTimer;
    private bool Active;

    public Slider(unit unit)
    {
        SliderUnit = unit;
        Player = unit.Owner;
        SliderTimer = timer.Create();
        Active = false;
    }

    public void StartSlider()
    {
        Active = true;
        SliderTimer.Start(0.03f, true, () =>
        {
            Active = DetermineTerrain();
            if (!Active) return;

            var facing = SliderUnit.Facing;
            var moveSpeed = GetUnitMoveSpeed(SliderUnit);
            var x = SliderUnit.X + moveSpeed * 0.03f * Cos(facing * (float)Math.PI / 180);
            var y = SliderUnit.Y + moveSpeed * 0.03f * Sin(facing * (float)Math.PI / 180);
            SliderUnit.SetPosition(x, y);
        });
    }

    public void StopSlider()
    {
        Active = false;
        SliderTimer.Pause();
    }

    private bool DetermineTerrain()
    {
        return TerrainChanger.Terrains.Contains(GetTerrainType(SliderUnit.X, SliderUnit.Y));
    }
}
