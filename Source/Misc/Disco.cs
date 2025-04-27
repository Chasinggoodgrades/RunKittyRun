using System;
using WCSharp.Api;
using static WCSharp.Api.Common;
public class Disco : IDisposable
{
    public timer DiscoTimer { get; set; }
    public bool Enabled { get; set; } = false;
    public unit Unit { get; set; }

    public Disco()
    {
        DiscoTimer = timer.Create();
    }

    public void Dispose()
    {
        DiscoTimer.Pause();
        Enabled = false;
        ObjectPool.ReturnObject(this);
    }

    public void ToggleDisco(bool enable)
    {
        if (Unit == null) return;

        if (enable)
        {
            if (Enabled) return;
            Enabled = true;
            DiscoTimer.Start(0.4f, true, () => DiscoActions());
        }
        else
        {
            DiscoTimer.Pause();
            Enabled = false;
            if (Unit.UnitType == Constants.UNIT_KITTY) return;
            Dispose();
        }
    }

    private void DiscoActions()
    {
        SetUnitColor(this.Unit, ConvertPlayerColor(GetRandomInt(0, 24)));
        Blizzard.SetUnitVertexColorBJ(this.Unit, Blizzard.GetRandomPercentageBJ(), Blizzard.GetRandomPercentageBJ(), Blizzard.GetRandomPercentageBJ(), GetRandomReal(0, 25));
    }

}
