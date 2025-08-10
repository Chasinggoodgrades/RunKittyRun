

/// <summary>
/// Represents a visual range indicator created using lightning effects around a specified unit.
/// </summary>
class RangeIndicator
{
    /// <summary>
    /// The type of lightning used to create the range indicator. Default is "BLNL" (Blue Lightning).
    /// "BLNL" (Blue Lightning), "FINL" (Orange Lightning), "MYNL" (Purple Lightning), "RENL" (Red Lightning).
    /// "GRNL" (Green Lightning) "SPNL" (Tealish Spirit Lightning)
    /// </summary>
    public LIGHTNING_TYPE: string = "BLNL";

    /// <summary>
    /// A list to store the lightning objects that make up the range indicator.
    /// </summary>
    public List<lightning> LightningObjects 

    /// <summary>
    /// Initializes a new instance of the <see cref="RangeIndicator"/> class.
    /// Use with ObjectPool.GetEmptyObject<RangeIndicator>() for efficient object reuse.
    /// </summary>
    public RangeIndicator()
    {
        LightningObjects ??= new List<lightning>();
    }

    /// <summary>
    /// Creates a visual range indicator around the specified unit using lightning effects
    /// </summary>
    /// <param name="unit">The unit around which the range indicator will be displayed.</param>
    /// <param name="range">The radius of the range indicator in game units.</param>
    /// <param name="segments">The number of segments into which the range indicator is divided. Higher values produce a smoother circle. Default is 20.</param>
    /// <parm name="lightningType">The type of lightning effect to use for the range indicator. Default is "BLNL".</param>
    public CreateIndicator(unit: unit, range: number, segments: number = 20, lightningType: string = LIGHTNING_TYPE)
    {
        let x: number = unit.X;
        let y: number = unit.Y;

        let angleStep: number = 360.0 / segments;

        // Creating a circular range indicator around the unit
        for (let i: number = 0; i < segments; i++)
        {
            let angle1: number = i * angleStep * Blizzard.bj_DEGTORAD;
            let angle2: number = (i + 1) * angleStep * Blizzard.bj_DEGTORAD;

            let startX: number = x + (range * Cos(angle1));
            let startY: number = y + (range * Sin(angle1));
            let endX: number = x + (range * Cos(angle2));
            let endY: number = y + (range * Sin(angle2));

            let lightning = AddLightning(lightningType, true, startX, startY, endX, endY);
            LightningObjects.Add(lightning);
        }
    }

    public DestroyIndicator()
    {
        try
        {
            for (let i: number = 0; i < LightningObjects.Count; i++)
            {
                LightningObjects[i].Dispose();
                LightningObjects[i] = null;
            }
            LightningObjects.Clear();
        }
        catch (e: Error)
        {
            Logger.Warning("Error in RangeIndicator.DestroyIndicator: {e.Message}");
        }
    }

    /// <summary>
    /// Disposes of the range indicator by destroying all associated lightning effects and releasing the object back to the pool
    /// </summary>
    public Dispose()
    {
        DestroyIndicator();
        ObjectPool<RangeIndicator>.ReturnObject(this);
    }
}
