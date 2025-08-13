export class BarrierSetup {
    private static BARRIERID: number = FourCC('YTpb') // changed to call native only once
    private static BarrierActive: boolean
    private static DummyUnitOne: Unit
    private static DummyUnitTwo: Unit
    private static DummyUnitThree: Unit
    public static destructables: destructable[] = []

    public static Initialize() {
        ActivateBarrier()
    }

    private static CreateDummyUnits() {
        let neutralPassive = player.NeutralPassive
        DummyUnitOne = Unit.create(
            neutralPassive,
            Constants.UNIT_DUMMY_1,
            Regions.Dummy1Region.Center.x,
            Regions.Dummy1Region.Center.y,
            360
        )
        DummyUnitTwo = Unit.create(
            neutralPassive,
            Constants.UNIT_DUMMY_2,
            Regions.Dummy2Region.Center.x,
            Regions.Dummy2Region.Center.y,
            360
        )
        DummyUnitThree = Unit.create(
            neutralPassive,
            Constants.UNIT_DUMMY_3,
            Regions.Dummy3Region.Center.x,
            Regions.Dummy3Region.Center.y,
            360
        )
    }

    private static CreateBarrier() {
        let barrierRegion = Regions.BarrierRegion
        let centerX = barrierRegion.Center.x
        let minY = barrierRegion.Rect.minY
        let maxY = barrierRegion.Rect.maxY

        let distanceY: number = maxY - minY
        let intervalY: number = distanceY / 13
        for (let i: number = 1; i < 13; i++) {
            let currentY: number = minY + i * intervalY
            let des = destructable.Create(BARRIERID, centerX, currentY)
            destructables.push(des)
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
        DummyUnitOne.dispose()
        DummyUnitTwo.dispose()
        DummyUnitThree.dispose()
        for (let des in destructables) {
            des.dispose()
        }
        destructables.clear()
        BarrierActive = false
    }
}
