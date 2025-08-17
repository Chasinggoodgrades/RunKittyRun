import { Logger } from 'src/Events/Logger/Logger'
import { Globals } from 'src/Global/Globals'
import { RegionList } from 'src/Global/RegionList'
import { FilterList } from 'src/Utility/FilterList'
import { getTriggerUnit } from 'src/Utility/w3tsUtils'
import { Rectangle, Trigger } from 'w3ts'
import { Wolf } from './Entities/Wolf'

export class WolfArea {
    public static WolfAreas: Map<number, WolfArea> = new Map<number, WolfArea>()
    public static TotalArea = 0.0
    public ID = 0
    public Rect: rect
    public Region: region
    public Rectangle: Rectangle
    public Area = 0
    public IsEnabled: boolean = true
    private AreaTrigger: Trigger
    public Wolves: Wolf[] = []
    public FixationCount = 0

    public constructor(id: number, region: region) {
        this.ID = id
        this.Region = region
    }

    public static Initialize = () => {
        let count = 0
        for (const wolfRegion of RegionList.WolfRegions) {
            const wolfArea = new WolfArea(count, wolfRegion.region())
            wolfArea.Rect = Rect(wolfRegion.minX, wolfRegion.minY, wolfRegion.maxX, wolfRegion.maxY)
            wolfArea.Rectangle = wolfRegion
            wolfArea.CalculateArea()
            wolfArea.RegisterEnterEvents()
            wolfArea.RegisterLeaveEvents()
            WolfArea.WolfAreas.set(count, wolfArea)
            count++
        }
    }

    private RegisterEnterEvents = () => {
        const AreaTrigger = Trigger.create()!
        AreaTrigger.registerEnterRegion(this.Region, FilterList.KittyFilter)
        AreaTrigger.addAction(() => {
            try {
                const unit = getTriggerUnit()
                const player = unit.owner

                const kitty = Globals.ALL_KITTIES.get(player)!
                kitty.ProgressHelper.CurrentPoint = this.ID
                kitty.ProgressZone = this.ID
            } catch (e: any) {
                Logger.Warning(`Error in WolfArea.RegisterEnterEvents: ${e}`)
                throw e
            }
        })
    }

    /// <summary>
    /// Prevents wolves from leaving the area with wander.
    /// </summary>
    private RegisterLeaveEvents = () => {
        const AreaTrigger = Trigger.create()!
        AreaTrigger.registerLeaveRegion(this.Region, FilterList.DogFilter)
        AreaTrigger.addAction(() => {
            try {
                const wolf = Globals.ALL_WOLVES.get(getTriggerUnit())!
                wolf.WolfMove()
            } catch (e: any) {
                Logger.Critical(`Error in WolfArea.RegisterLeaveEvents: ${e}`)
            }
        })
    }

    private CalculateArea = () => {
        const width = Math.abs(this.Rectangle.maxX - this.Rectangle.minX)
        const height = Math.abs(this.Rectangle.maxY - this.Rectangle.minY)

        this.Area = width * height
        WolfArea.TotalArea += this.Area
    }
}
