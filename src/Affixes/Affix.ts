abstract class Affix {
    public Unit: Wolf
    public Name: string

    public Affix(unit: Wolf) {
        Unit = unit
    }

    public Apply(): virtual {
        // GC.GCAffixes.Add(this);
    }

    public Remove(): virtual {
        // GC.RemoveAffix(this);
    }

    public abstract Pause(pause: boolean)
}
