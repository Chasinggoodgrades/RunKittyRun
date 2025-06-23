using System.Collections.Generic;
using WCSharp.Api;
using WCSharp.Shared.Data;

public class WolfArea
{
    public static Dictionary<int, WolfArea> WolfAreas { get; } = new();
    public static float TotalArea { get; private set; } = 0.0f;
    public int ID { get; set; }
    public rect Rect { get; set; }
    public region Region { get; set; }
    public Rectangle Rectangle { get; set; }
    public float Area { get; private set; }
    public bool IsEnabled { get; set; } = true;
    private trigger AreaTrigger { get; set; }
    public List<Wolf> Wolves { get; set; } = new List<Wolf>();
    public int FixationCount { get; set; }

    public WolfArea(int id, region region)
    {
        ID = id;
        Region = region;
    }

    public static void Initialize()
    {
        int count = 0;
        foreach (var wolfRegion in RegionList.WolfRegions)
        {
            var wolfArea = new WolfArea(count, wolfRegion.Region)
            {
                Rect = wolfRegion.Rect,
                Rectangle = wolfRegion
            };
            wolfArea.CalculateArea();
            wolfArea.RegisterEnterEvents();
            wolfArea.RegisterLeaveEvents();
            WolfAreas.Add(count, wolfArea);
            count++;
        }
    }

    private void RegisterEnterEvents()
    {
        AreaTrigger = trigger.Create();
        AreaTrigger.RegisterEnterRegion(Region, FilterList.KittyFilter);
        AreaTrigger.AddAction(() =>
        {
            try
            {
                var unit = @event.Unit;
                var player = unit.Owner;

                var kitty = Globals.ALL_KITTIES[player];
                kitty.ProgressHelper.CurrentPoint = ID;
                kitty.ProgressZone = ID;
            }
            catch (System.Exception e)
            {
                Logger.Warning($"Error in WolfArea.RegisterEnterEvents: {e.Message}");
                throw;
            }
        });
    }

    /// <summary>
    /// Prevents wolves from leaving the area with wander.
    /// </summary>
    private void RegisterLeaveEvents()
    {
        AreaTrigger = trigger.Create();
        AreaTrigger.RegisterLeaveRegion(Region, FilterList.DogFilter);
        AreaTrigger.AddAction(() =>
        {
            try
            {
                var wolf = Globals.ALL_WOLVES[@event.Unit];
                wolf.WolfMove();
            }
            catch (System.Exception e)
            {
                Logger.Critical($"Error in WolfArea.RegisterLeaveEvents: {e.Message}");
            }
        });
    }

    private void CalculateArea()
    {
        Area = Rectangle.Width * Rectangle.Height;
        TotalArea += Area;
    }
}
