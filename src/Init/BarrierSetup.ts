class BarrierSetup {
    private static BARRIERID: number = FourCC('YTpb') // changed to call native only once
    private static BarrierActive: boolean
    private static DummyUnitOne: unit
    private static DummyUnitTwo: unit
    private static DummyUnitThree: unit
    public static destructables: destructable[] = []

    public static Initialize() {
        ActivateBarrier()
    }

    private static CreateDummyUnits() {
        let neutralPassive = player.NeutralPassive
        DummyUnitOne = unit.Create(
            neutralPassive,
            Constants.UNIT_DUMMY_1,
            Regions.Dummy1Region.Center.X,
            Regions.Dummy1Region.Center.Y,
            360
        )
        DummyUnitTwo = unit.Create(
            neutralPassive,
            Constants.UNIT_DUMMY_2,
            Regions.Dummy2Region.Center.X,
            Regions.Dummy2Region.Center.Y,
            360
        )
        DummyUnitThree = unit.Create(
            neutralPassive,
            Constants.UNIT_DUMMY_3,
            Regions.Dummy3Region.Center.X,
            Regions.Dummy3Region.Center.Y,
            360
        )
    }

    private static CreateBarrier() {
        let barrierRegion = Regions.BarrierRegion
        let centerX = barrierRegion.Center.X
        let minY = barrierRegion.Rect.MinY
        let maxY = barrierRegion.Rect.MaxY

        let distanceY: number = maxY - minY
        let intervalY: number = distanceY / 13
        for (let i: number = 1; i < 13; i++) {
            let currentY: number = minY + i * intervalY
            let des = destructable.Create(BARRIERID, centerX, currentY)
            destructables.Add(des)
        }
    }

    public static ActivateBarrier() {
        if (BarrierActive) return
        CreateDummyUnits()
        CreateBarrier()
        BarrierActive = true
    }

    public static DeactivateBarrier() {
        if (!BarrierActive) return
        DummyUnitOne.Dispose()
        DummyUnitTwo.Dispose()
        DummyUnitThree.Dispose()
        for (let des in destructables) {
            des.Dispose()
        }
        destructables.Clear()
        BarrierActive = false
    }
}
