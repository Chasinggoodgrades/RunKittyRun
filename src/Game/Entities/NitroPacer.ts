import { Rectangle } from 'w3ts'

export class NitroPacer {
    public static Unit: Unit

    private static currentDistance: number = 0
    private static currentCheckpoint: number = 0
    private static pacerTimer: AchesTimers
    private static spawnRect: Rectangle = RegionList.SpawnRegions[5].Rect
    private static pathingPoints: Rectangle[] = RegionList.PathingPoints
    private static _cachedNitroPacerUpdate: Action
    private static nitroEffect: Effect
    private static ghostBoots: item

    /// <summary>
    /// Initializes the Nitros Pacer unit and effect, only applies to the standard gamemode.
    /// </summary>
    public static Initialize() {
        if (Gamemode.CurrentGameMode != GameMode.Standard) return

        Unit ??= Unit.create(
            player.NeutralPassive,
            Constants.UNIT_NITRO_PACER,
            spawnRect.centerX,
            spawnRect.centerY,
            360
        )
        Utility.MakeUnitLocust(Unit)
        Unit.IsInvulnerable = true
        Unit.name = '{Colors.COLOR_TURQUOISE}Pacer: Nitro{Colors.COLOR_RESET}'
        ghostBoots = Unit.addItem(Constants.ITEM_GHOST_KITTY_BOOTS)
        nitroEffect = Effect.create('war3mapImported\\Nitro.mdx', Unit, 'origin')!
        _cachedNitroPacerUpdate = UpdateNitroPacer
        VisionShare()

        pacerTimer = MemoryHandler.getEmptyObject<AchesTimers>()
    }

    /// <summary>
    /// Returns the current distance of the nitro pacer.
    /// </summary>
    /// <returns></returns>
    public static GetCurrentCheckpoint(): number {
        return this.currentCheckpoint
    }

    /// <summary>
    /// Starts the nitro pacer, resets the pacer and sets the speed of the unit to 0.
    /// </summary>
    public static StartNitroPacer() {
        if (Gamemode.CurrentGameMode != GameMode.Standard) return

        ResetNitroPacer()
        Unit.UseItem(ghostBoots)
        NitroPacerQueueOrders()
        pacerTimer.Timer.start(0.15, true, _cachedNitroPacerUpdate)
    }

    /// <summary>
    /// Resets the nitro pacer, sets the unit to the spawn point, and sets the speed of the unit to 0.
    /// </summary>
    public static ResetNitroPacer() {
        if (Gamemode.CurrentGameMode != GameMode.Standard) return

        pacerTimer?.pause()
        Unit.paused = false
        Unit.setPos(spawnRect.centerX, spawnRect.centerY)
        currentCheckpoint = 0
        currentDistance = 0
    }

    private static UpdateNitroPacer() {
        try {
            currentDistance = Progress.CalculateNitroPacerProgress()
            let remainingDistance: number =
                Progress.DistancesFromStart[RegionList.PathingPoints.length - 1] - currentDistance
            let remainingTime: number = NitroChallenges.GetNitroTimeRemaining()
            let speed: number = remainingTime != 0.0 ? remainingDistance / remainingTime : 350.0
            SetSpeed(speed)

            if (pathingPoints[currentCheckpoint + 1].includes(Unit.x, unit.y)) {
                currentCheckpoint++
                if (currentCheckpoint >= pathingPoints.length - 1) {
                    pacerTimer?.pause()
                    Utility.SimpleTimer(2.0, () => (Unit.paused = true)) // this is actually ok since we reset pacer before starting it again
                    return
                }
            }
        } catch (e: any) {
            Logger.Warning('Error in UpdateNitroPacer. {e.Message}')
            throw e
        }
    }

    private static NitroPacerQueueOrders() {
        // backwards for pathingpoints, for stack queue order
        for (
            let i: number = pathingPoints.length - 1;
            i >= 1;
            i-- // exclude starting point
        ) {
            let point: Rectangle = pathingPoints[i]
            Unit.QueueOrder(WolfPoint.MoveOrderID, point.Center.x, point.Center.y)
        }
    }

    private static VisionShare() {
        for (let player of Globals.ALL_PLAYERS) {
            player.NeutralPassive.setAlliance(player, alliancetype.SharedVisionForced, true)
        }
    }

    private static SetSpeed(speed: number) {
        return (Unit.MovementSpeed = speed)
    }
}
