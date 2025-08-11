

class Disco extends IDisposable
{
    public DiscoTimer: timer 
    public Enabled: boolean = false;
    public Unit: unit 

    public Disco()
    {
        DiscoTimer = timer.Create();
    }

    public Dispose()
    {
        DiscoTimer.Pause();
        Enabled = false;
        ObjectPool<Disco>.ReturnObject(this);
    }

    public ToggleDisco(enable: boolean)
    {
        if (Unit == null) return;

        if (enable)
        {
            if (Enabled) return;
            Enabled = true;
            DiscoTimer.Start(0.4, true, () => DiscoActions());
        }
        else
        {
            DiscoTimer.Pause();
            Enabled = false;
            if (Unit.UnitType == Constants.UNIT_KITTY) return;
            Dispose();
        }
    }

    private DiscoActions()
    {
        SetUnitColor(this.Unit, ConvertPlayerColor(GetRandomInt(0, 24)));
        SetUnitVertexColorBJ(this.Unit, GetRandomPercentageBJ(), GetRandomPercentageBJ(), GetRandomPercentageBJ(), GetRandomReal(0, 25));
    }

}
