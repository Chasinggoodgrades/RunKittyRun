public abstract class Affix 
{
    public Wolf Unit { get; set; }
    public Affix(Wolf unit)
    {
        Unit = unit;
    }

    public abstract void Apply();

    public abstract void Remove();
}

