using WCSharp.Api;
using static WCSharp.Api.Common;

// Designing an affix system where we apply affixes to a specific unit.
// These affixes will inherit from this abstract class.
// Other affixes include: Fixation, Speedster, and Unpredictable
public abstract class Affix 
{
    public Wolf Unit { get; set; }
    public int ID { get; set; } = 0;

    public Affix(Wolf unit)
    {
        Unit = unit;
    }

    public abstract void Apply();

    public abstract void Remove();

}

