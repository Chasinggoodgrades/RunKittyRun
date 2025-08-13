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
        CreateInitDestructiables()
        if (Gamemode.CurrentGameMode != GameMode.Standard) return
        SeasonalDoodads()
    }

    private static InitChristmasDecor() {
        return [
            CrystalRed,
            CrystalBlue,
            CrystalGreen,
            Snowglobe,
            Lantern,
            Fireplace,
            Snowman,
            Firepit,
            Igloo,
            RedLavaCracks,
            BlueLavaCracks,
            SuperChristmasTree,
        ]
    }

    private static SeasonalDoodads() {
        ChristmasDoodads()
    }

    public static NoSeasonDoodads() {
        ReplaceDoodad(SafezoneLanterns, 1.0)
        ShowSeasonalDoodads(false)
    }

    public static ChristmasDoodads() {
        if (SeasonalManager.Season != HolidaySeasons.Christmas) return
        ReplaceDoodad(ChristmasTree, 2.5)
        ShowSeasonalDoodads(true)
    }

    private static ReplaceDoodad(newType: number, scale: number) {
        let positions: { x: number; y: number }[] = []

        for (let des of this.AllDestructables) {
            positions.push({ x: GetDestructableX(des), y: GetDestructableY(des) })
            RemoveDestructable(des)
        }

        this.AllDestructables = []
        for (let pos of positions) {
            let newDestructible = CreateDeadDestructable(newType, pos.x, pos.y, 0, scale, 0)
            this.AllDestructables.push(newDestructible)
        }
        GC.RemoveList(positions) // TODO; Cleanup:         GC.RemoveList(ref positions);
    }

    private static CreateInitDestructiables() {
        let counter: number = 0

        for (let safeZone in Globals.SAFE_ZONES) {
            let rect = safeZone.Rect_

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
        return EnumDestructablesInRect(Globals.WORLD_BOUNDS, null, () => HideDoodads(show))
    }

    private static HideDoodads(show: boolean) {
        let des = GetEnumDestructable()
        if (ChristmasDecor.includes(des.Type)) des.setVisible(show)
    }
}
