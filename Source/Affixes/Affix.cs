public abstract class Affix
{
    public Wolf Unit { get; set; }
    public string Name { get; set; }
    public string TypeName { get; set; }

    public Affix(Wolf unit)
    {
        Unit = unit;
        TypeName = this.GetType().Name;
    }

    public virtual void Apply()
    {
        // GC.GCAffixes.Add(this);
    }

    public virtual void Remove()
    {
        // GC.RemoveAffix(this);
    }

    public abstract void Pause(bool pause);
}
