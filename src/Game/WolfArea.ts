import { Logger } from 'src/Events/Logger/Logger'
import { Globals } from 'src/Global/Globals'
import { RegionList } from 'src/Global/RegionList'
import { FilterList } from 'src/Utility/FilterList'
import { getTriggerUnit } from 'src/Utility/w3tsUtils'
import { Rectangle, Trigger } from 'w3ts'
import { Wolf } from './Entities/Wolf'

export class WolfArea {
    public static WolfAreas: Map<number, WolfArea> = new Map<number, WolfArea>()
    public static TotalArea: number = 0.0
    public ID: number
    public Rect: Rectangle
    public Region: region
    public Rectangle: Rectangle
    public Area: number
    public IsEnabled: boolean = true
    private AreaTrigger: Trigger
    public Wolves: Wolf[] = []
    public FixationCount: number

    public WolfArea(id: number, region: region) {
        this.ID = id
        this.Region = region
    }

    public static Initialize() {
        let count: number = 0
        for (let wolfRegion in RegionList.WolfRegions) {
            let wolfArea = new WolfArea(count, wolfRegion.Region)
            {
                ;((Rect = wolfRegion.Rect), (Rectangle = wolfRegion))
            }
            wolfArea.CalculateArea()
            wolfArea.RegisterEnterEvents()
            wolfArea.RegisterLeaveEvents()
            WolfArea.WolfAreas.push(count, wolfArea)
            count++
        }
    }

    private RegisterEnterEvents() {
        let AreaTrigger = Trigger.create()!
        AreaTrigger.registerEnterRegion(this.Region, FilterList.KittyFilter)
        AreaTrigger.addAction(() => {
            try {
                let unit = getTriggerUnit()
                let player = unit.owner

                let kitty = Globals.ALL_KITTIES.get(player)!
                kitty.ProgressHelper.CurrentPoint = this.ID
                kitty.ProgressZone = this.ID
            } catch (e: any) {
                Logger.Warning('Error in WolfArea.RegisterEnterEvents: {e.Message}')
                throw e
            }
        })
    }

    /// <summary>
    /// Prevents wolves from leaving the area with wander.
    /// </summary>
    private RegisterLeaveEvents() {
        let AreaTrigger = Trigger.create()!
        AreaTrigger.registerLeaveRegion(this.Region, FilterList.DogFilter)
        AreaTrigger.addAction(() => {
            try {
                let wolf = Globals.ALL_WOLVES.get(getTriggerUnit())!
                wolf.WolfMove()
            } catch (e: any) {
                Logger.Critical('Error in WolfArea.RegisterLeaveEvents: {e.Message}')
            }
        })
    }

    private CalculateArea() {
        this.Area = this.Rectangle.width * this.Rectangle.Height
        WolfArea.TotalArea += this.Area
    }
}
