import { Gamemode } from 'src/Gamemodes/Gamemode'
import { GameMode } from 'src/Gamemodes/GameModeEnum'
import { Globals } from 'src/Global/Globals'
import { GC } from 'src/Utility/GC'
import { Destructable } from 'w3ts'
import { HolidaySeasons, SeasonalManager } from '../SeasonalManager'

export class DoodadChanger {
    private static SafezoneLanterns: number = FourCC('B005')
    private static ChristmasTree: number = FourCC('B001')
    private static CrystalRed: number = FourCC('B002')
    private static CrystalBlue: number = FourCC('B003')
    private static CrystalGreen: number = FourCC('B004')
    private static Snowglobe: number = FourCC('B006')
    private static Lantern: number = FourCC('B007')
    private static Fireplace: number = FourCC('B008')
    private static Snowman: number = FourCC('B009')
    private static Firepit: number = FourCC('B00A')
    private static Igloo: number = FourCC('ITig')
    private static RedLavaCracks: number = FourCC('B00B')
    private static BlueLavaCracks: number = FourCC('B00C')
    private static SuperChristmasTree: number = FourCC('B00D')
    private static ChristmasDecor: number[] = DoodadChanger.InitChristmasDecor()
    private static AllDestructables: destructable[] = []

    public static Initialize() {
        this.CreateInitDestructiables()
        if (Gamemode.CurrentGameMode != GameMode.Standard) return
        this.SeasonalDoodads()
    }

    private static InitChristmasDecor() {
        return [
            this.CrystalRed,
            this.CrystalBlue,
            this.CrystalGreen,
            this.Snowglobe,
            this.Lantern,
            this.Fireplace,
            this.Snowman,
            this.Firepit,
            this.Igloo,
            this.RedLavaCracks,
            this.BlueLavaCracks,
            this.SuperChristmasTree,
        ]
    }

    private static SeasonalDoodads() {
        this.ChristmasDoodads()
    }

    public static NoSeasonDoodads() {
        this.ReplaceDoodad(this.SafezoneLanterns, 1.0)
        this.ShowSeasonalDoodads(false)
    }

    public static ChristmasDoodads() {
        if (SeasonalManager.Season != HolidaySeasons.Christmas) return
        this.ReplaceDoodad(this.ChristmasTree, 2.5)
        this.ShowSeasonalDoodads(true)
    }

    private static ReplaceDoodad(newType: number, scale: number) {
        let positions: { x: number; y: number }[] = []

        for (let des of this.AllDestructables) {
            positions.push({ x: GetDestructableX(des), y: GetDestructableY(des) })
            RemoveDestructable(des)
        }

        this.AllDestructables = []
        for (let pos of positions) {
            let newDestructible = CreateDeadDestructable(newType, pos.x, pos.y, 0, scale, 0)!
            this.AllDestructables.push(newDestructible)
        }
        GC.RemoveList(positions) // TODO; Cleanup:         GC.RemoveList(ref positions);
    }

    private static CreateInitDestructiables() {
        let counter: number = 0

        for (let safeZone of Globals.SAFE_ZONES) {
            let rect = safeZone.Rectangle

            let minX = rect.minX
            let minY = rect.minY
            let maxX = rect.maxX
            let maxY = rect.maxY

            if (counter % 4 != 0) {
                const des = CreateDeadDestructable(DoodadChanger.SafezoneLanterns, minX, maxY, 0, 1, 0)
                if (des) this.AllDestructables.push(des) // Top left corner
            }
            if (counter % 4 != 1 && counter != 14) {
                const des = CreateDeadDestructable(DoodadChanger.SafezoneLanterns, maxX, maxY, 0, 1, 0)
                if (des) this.AllDestructables.push(des) // Top right corner
            }
            if (counter % 4 != 2) {
                const des = CreateDeadDestructable(DoodadChanger.SafezoneLanterns, maxX, minY, 0, 1, 0)
                if (des) this.AllDestructables.push(des) // Bottom right corner
            }
            if (counter % 4 != 3 && counter != 0) {
                const des = CreateDeadDestructable(DoodadChanger.SafezoneLanterns, minX, minY, 0, 1, 0)
                if (des) this.AllDestructables.push(des) // Bottom left corner
            }

            counter++
        }
    }

    public static ShowSeasonalDoodads(show: boolean = false) {
        return EnumDestructablesInRect(Globals.WORLD_BOUNDS.handle, null as never, () => this.HideDoodads(show))
    }

    private static HideDoodads(show: boolean) {
        let des = Destructable.fromHandle(GetEnumDestructable())!
        if (this.ChristmasDecor.includes(des.typeId)) des.show(show)
    }
}
