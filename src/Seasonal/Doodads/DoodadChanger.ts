import { CurrentGameMode } from 'src/Gamemodes/CurrentGameMode'
import { GameMode } from 'src/Gamemodes/GameModeEnum'
import { Globals } from 'src/Global/Globals'
import { GC } from 'src/Utility/GC'
import { Destructable } from 'w3ts'
import { HolidaySeasons, Seasons } from '../Seasons'

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
        DoodadChanger.CreateInitDestructiables()
        if (CurrentGameMode.active !== GameMode.Standard) return
        DoodadChanger.SeasonalDoodads()
    }

    private static InitChristmasDecor() {
        return [
            DoodadChanger.CrystalRed,
            DoodadChanger.CrystalBlue,
            DoodadChanger.CrystalGreen,
            DoodadChanger.Snowglobe,
            DoodadChanger.Lantern,
            DoodadChanger.Fireplace,
            DoodadChanger.Snowman,
            DoodadChanger.Firepit,
            DoodadChanger.Igloo,
            DoodadChanger.RedLavaCracks,
            DoodadChanger.BlueLavaCracks,
            DoodadChanger.SuperChristmasTree,
        ]
    }

    private static SeasonalDoodads() {
        DoodadChanger.ChristmasDoodads()
    }

    public static NoSeasonDoodads() {
        DoodadChanger.ReplaceDoodad(DoodadChanger.SafezoneLanterns, 1.0)
        DoodadChanger.ShowSeasonalDoodads(false)
    }

    public static ChristmasDoodads() {
        if (Seasons.getCurrentSeason() !== HolidaySeasons.Christmas) return
        DoodadChanger.ReplaceDoodad(DoodadChanger.ChristmasTree, 2.5)
        DoodadChanger.ShowSeasonalDoodads(true)
    }

    private static ReplaceDoodad(newType: number, scale: number) {
        const positions: { x: number; y: number }[] = []

        for (const des of DoodadChanger.AllDestructables) {
            positions.push({ x: GetDestructableX(des), y: GetDestructableY(des) })
            RemoveDestructable(des)
        }

        DoodadChanger.AllDestructables = []
        for (const pos of positions) {
            const newDestructible = CreateDeadDestructable(newType, pos.x, pos.y, 0, scale, 0)!
            DoodadChanger.AllDestructables.push(newDestructible)
        }
        GC.RemoveList(positions) // TODO; Cleanup:         GC.RemoveList(ref positions);
    }

    private static CreateInitDestructiables() {
        let counter = 0

        for (const safeZone of Globals.SAFE_ZONES) {
            const rect = safeZone.Rectangle

            const minX = rect.minX
            const minY = rect.minY
            const maxX = rect.maxX
            const maxY = rect.maxY

            if (counter % 4 !== 0) {
                const des = CreateDeadDestructable(DoodadChanger.SafezoneLanterns, minX, maxY, 0, 1, 0)
                if (des) DoodadChanger.AllDestructables.push(des) // Top left corner
            }
            if (counter % 4 !== 1 && counter !== 14) {
                const des = CreateDeadDestructable(DoodadChanger.SafezoneLanterns, maxX, maxY, 0, 1, 0)
                if (des) DoodadChanger.AllDestructables.push(des) // Top right corner
            }
            if (counter % 4 !== 2) {
                const des = CreateDeadDestructable(DoodadChanger.SafezoneLanterns, maxX, minY, 0, 1, 0)
                if (des) DoodadChanger.AllDestructables.push(des) // Bottom right corner
            }
            if (counter % 4 !== 3 && counter !== 0) {
                const des = CreateDeadDestructable(DoodadChanger.SafezoneLanterns, minX, minY, 0, 1, 0)
                if (des) DoodadChanger.AllDestructables.push(des) // Bottom left corner
            }

            counter++
        }
    }

    public static ShowSeasonalDoodads(show: boolean = false) {
        return EnumDestructablesInRect(Globals.WORLD_BOUNDS.handle, null as never, () =>
            DoodadChanger.HideDoodads(show)
        )
    }

    private static HideDoodads(show: boolean) {
        const des = Destructable.fromHandle(GetEnumDestructable())!
        if (DoodadChanger.ChristmasDecor.includes(des.typeId)) des.show(show)
    }
}
