

class Disco extends IDisposable
{
    public DiscoTimer!: timer 
    public Enabled: boolean = false;
    public Unit!: unit 

    public Disco()
    {
        this.DiscoTimer = CreateTimer();
    }

    public Dispose()
    {
        this.DiscoTimer.Pause();
        this.Enabled = false;
        ObjectPool<Disco>.ReturnObject(this);
    }

    public ToggleDisco(enable: boolean)
    {
        if (this.Unit == null) return;

        if (enable)
        {
            if (this.Enabled) return;
            this.Enabled = true;
            this.DiscoTimer.Start(0.4, true, () => DiscoActions());
        }
        else
        {
            this.DiscoTimer.Pause();
            this.Enabled = false;
            if (GetUnitTypeId(this.Unit) == Constants.UNIT_KITTY) return;
            this.Dispose();
        }
    }

    private DiscoActions()
    {
        SetUnitColor(this.Unit, ConvertPlayerColor(GetRandomInt(0, 24))!);
        SetUnitVertexColorBJ(this.Unit, GetRandomPercentageBJ(), GetRandomPercentageBJ(), GetRandomPercentageBJ(), GetRandomReal(0, 25));
    }

}
