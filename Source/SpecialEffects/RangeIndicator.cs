using System.Collections.Generic;
using WCSharp.Api;
using static WCSharp.Api.Common;

/// <summary>
/// Represents a visual range indicator created using lightning effects around a specified unit.
/// </summary>
public class RangeIndicator
{
    /// <summary>
    /// The type of lightning used to create the range indicator. Default is "BLNL" (Blue Lightning).
    /// </summary>
    public const string LIGHTNING_TYPE = "BLNL";

    /// <summary>
    /// A list to store the lightning objects that make up the range indicator.
    /// </summary>
    public List<lightning> LightningObjects { get; set; }

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
    public void CreateIndicator(unit unit, float range, int segments = 20)
    {
        float x = unit.X;
        float y = unit.Y;

        float angleStep = 360.0f / segments;

        // Creating a circular range indicator around the unit
        for (int i = 0; i < segments; i++)
        {
            float angle1 = i * angleStep * Blizzard.bj_DEGTORAD;
            float angle2 = (i + 1) * angleStep * Blizzard.bj_DEGTORAD;

            float startX = x + (range * Cos(angle1));
            float startY = y + (range * Sin(angle1));
            float endX = x + (range * Cos(angle2));
            float endY = y + (range * Sin(angle2));

            var lightning = AddLightning(LIGHTNING_TYPE, true, startX, startY, endX, endY);
            LightningObjects.Add(lightning);
        }
    }

    /// <summary>
    /// Disposes of the range indicator by destroying all associated lightning effects and releasing the object back to the pool
    /// </summary>
    public void Dispose()
    {
        for (int i = 0; i < LightningObjects.Count; i++)
        {
            LightningObjects[i].Dispose();
            LightningObjects[i] = null;
        }
        LightningObjects.Clear();

        ObjectPool.ReturnObject(this);
    }
}
