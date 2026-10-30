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
        ObjectPool<Disco>.ReturnObject(this);
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
        int colorIndex = GetRandomInt(0, 24);
        SetUnitColor(this.Unit, ConvertPlayerColor(colorIndex));

        float r = Blizzard.GetRandomPercentageBJ();
        float g = Blizzard.GetRandomPercentageBJ();
        float b = Blizzard.GetRandomPercentageBJ();
        Blizzard.SetUnitVertexColorBJ(this.Unit, r, g, b, GetRandomReal(0, 25));

        // a Kitty's async effect dances with it
        if (Globals.ALL_KITTIES.TryGetValue(this.Unit.Owner, out var kitty) && kitty.Unit == this.Unit)
        {
            kitty.NotifyTeamColor(colorIndex);
            kitty.NotifyVertexColor((int)(r * 2.55f), (int)(g * 2.55f), (int)(b * 2.55f));
        }
    }

}
