export class WolfLaneHider {
    private static readonly lanesToEnable: Set<number> = new Set<number>()
    private static readonly currentlyVisibleLanes: Set<number> = new Set<number>()

    public static LanesHider() {
        try {
            this.UpdateLanesToEnable()
            this.ApplyLaneVisibility()
        } catch (e) {
            Logger.Warning('Error in WolfLaneHider: {e.Message}')
        }
    }

    private static UpdateLanesToEnable() {
        try {
            this.lanesToEnable.clear()

            for (let i: number = 0; i < Globals.ALL_PLAYERS.length; i++) {
                let kitty = Globals.ALL_KITTIES[Globals.ALL_PLAYERS[i]]
                let currentSafezone: number = kitty.CurrentSafeZone
                this.AddAdjacentLanes(currentSafezone)
            }
        } catch (e) {
            Logger.Warning('Error in UpdateLanesToEnable: {e.Message}')
        }
    }

    public static ShadowKittyLaneAdd(safezone: number) {
        this.AddAdjacentLanes(safezone)
        this.ApplyLaneVisibility()
    }

    private static AddAdjacentLanes(currentSafezone: number) {
        this.AddLane(currentSafezone)
        this.AddLane(currentSafezone + 1)
        this.AddLane(currentSafezone - 1)
        this.AddLane(currentSafezone - 2)

        if (currentSafezone >= 13) {
            this.AddLane(currentSafezone + 2)
            this.AddLane(currentSafezone + 3)
        }
    }

    private static AddLane(lane: number) {
        if (lane >= 0 && lane <= 17) {
            this.lanesToEnable.add(lane)
        }
    }

    private static ApplyLaneVisibility() {
        try {
            if (WolfArea.WolfAreas == null) return

            // Show lanes that are now visible but weren't before
            for (let laneId in this.lanesToEnable) {
                if (
                    !(
                        this.currentlyVisibleLanes.includes(laneId) && (lane = WolfArea.WolfAreas.TryGetValue(laneId))
                    ) /* TODO; Prepend: let */
                ) {
                    lane.IsEnabled = true
                    SetLaneVisibility(lane, true)
                }
            }

            // Hide lanes that are no longer visible
            for (let laneId in this.currentlyVisibleLanes) {
                if (
                    !(
                        this.lanesToEnable.includes(laneId) && (lane = WolfArea.WolfAreas.TryGetValue(laneId))
                    ) /* TODO; Prepend: let */
                ) {
                    lane.IsEnabled = false
                    SetLaneVisibility(lane, false)
                }
            }

            // Update the set for next time
            this.currentlyVisibleLanes.clear()
            for (let laneId in this.lanesToEnable) this.currentlyVisibleLanes.add(laneId)
        } catch (e) {
            Logger.Warning('Error in ApplyLaneVisibility: {e.Message}')
        }
    }

    private static SetLaneVisibility(lane: WolfArea, isVisible: boolean) {
        for (let i: number = 0; i < lane.Wolves.length; i++) {
            let wolf = lane.Wolves[i]
            wolf.Unit.IsVisible = isVisible
            wolf.PauseSelf(!isVisible)
            wolf.Texttag?.setVisible(isVisible)
        }
    }

    public static HideAllLanes() {
        try {
            if (WolfArea.WolfAreas == null) return

            for (let lane in WolfArea.WolfAreas) {
                SetLaneVisibility(lane.Value, false)
                lane.Value.IsEnabled = false
            }
        } catch (e) {
            Logger.Warning('Error in HideAllLanes: {e.Message}')
        }
    }

    public static ResetLanes() {
        try {
            this.lanesToEnable.clear()
            this.currentlyVisibleLanes.clear()
            if (WolfArea.WolfAreas == null) return
            for (let lane in WolfArea.WolfAreas) {
                lane.Value.IsEnabled = true
                SetLaneVisibility(lane.Value, true)
            }
        } catch (e) {
            Logger.Warning('Error in ResetLanes: {e.Message}')
        }
    }
}
