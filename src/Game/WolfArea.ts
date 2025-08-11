

class WolfArea
{
    public static Dictionary<int, WolfArea> WolfAreas  = new();
    public static TotalArea: number = 0.0;
    public ID: number 
    public Rect: rect 
    public Region: region 
    public Rectangle: Rectangle 
    public Area: number 
    public IsEnabled: boolean = true;
    private AreaTrigger: trigger 
    public  Wolves : Wolf[] = []
    public FixationCount: number 

    public WolfArea(id: number, region: region)
    {
        ID = id;
        Region = region;
    }

    public static Initialize()
    {
        let count: number = 0;
        for (let wolfRegion in RegionList.WolfRegions)
        {
            let wolfArea = new WolfArea(count, wolfRegion.Region)
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

    private RegisterEnterEvents()
    {
        let AreaTrigger = CreateTrigger();
        AreaTrigger.RegisterEnterRegion(Region, FilterList.KittyFilter);
        AreaTrigger.AddAction(() =>
        {
            try
            {
                let unit = GetTriggerUnit();
                let player = unit.Owner;

                let kitty = Globals.ALL_KITTIES[player];
                kitty.ProgressHelper.CurrentPoint = ID;
                kitty.ProgressZone = ID;
            }
            catch (e: Error)
            {
                Logger.Warning("Error in WolfArea.RegisterEnterEvents: {e.Message}");
                throw e
            }
        });
    }

    /// <summary>
    /// Prevents wolves from leaving the area with wander.
    /// </summary>
    private RegisterLeaveEvents()
    {
        let AreaTrigger = CreateTrigger();
        AreaTrigger.RegisterLeaveRegion(Region, FilterList.DogFilter);
        AreaTrigger.AddAction(() =>
        {
            try
            {
                let wolf = Globals.ALL_WOLVES[GetTriggerUnit()];
                wolf.WolfMove();
            }
            catch (e: Error)
            {
                Logger.Critical("Error in WolfArea.RegisterLeaveEvents: {e.Message}");
            }
        });
    }

    private CalculateArea()
    {
        Area = Rectangle.Width * Rectangle.Height;
        TotalArea += Area;
    }
}
