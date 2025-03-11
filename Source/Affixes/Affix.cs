public abstract class Affix
{
    public Wolf Unit { get; set; }
    public string Name { get; set; }
    public Affix(Wolf unit)
    {
        Unit = unit;
    }

    public virtual void Apply()
    {
        GC.GCAffixes.Add(this);
    }

    public virtual void Remove()
    {
        GC.RemoveAffix(this);
    }
}

