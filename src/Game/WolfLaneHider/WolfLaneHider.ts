import { Logger } from 'src/Events/Logger/Logger'
import { Globals } from 'src/Global/Globals'
import { WolfArea } from '../WolfArea'

export class WolfLaneHider {
    private static readonly lanesToEnable: Set<number> = new Set<number>()
    private static readonly currentlyVisibleLanes: Set<number> = new Set<number>()

    public static LanesHider() {
        try {
            this.UpdateLanesToEnable()
            this.ApplyLaneVisibility()
        } catch (e: any) {
            Logger.Warning('Error in WolfLaneHider: {e.Message}')
        }
    }

    private static UpdateLanesToEnable() {
        try {
            this.lanesToEnable.clear()

            for (let i: number = 0; i < Globals.ALL_PLAYERS.length; i++) {
                let kitty = Globals.ALL_KITTIES.get(Globals.ALL_PLAYERS[i])!
                let currentSafezone: number = kitty.CurrentSafeZone
                this.AddAdjacentLanes(currentSafezone)
            }
        } catch (e: any) {
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
            for (let laneId of this.lanesToEnable) {
                let lane = WolfArea.WolfAreas.get(laneId)
                if (!lane) continue
                if (!(this.currentlyVisibleLanes.has(laneId) && lane)) {
                    lane.IsEnabled = true
                    this.SetLaneVisibility(lane, true)
                }
            }

            // Hide lanes that are no longer visible
            for (let laneId of this.currentlyVisibleLanes) {
                let lane = WolfArea.WolfAreas.get(laneId)
                if (!lane) continue
                if (!(this.lanesToEnable.has(laneId) && lane)) {
                    lane.IsEnabled = false
                    this.SetLaneVisibility(lane, false)
                }
            }

            // Update the set for next time
            this.currentlyVisibleLanes.clear()
            for (let laneId of this.lanesToEnable) 
                this.currentlyVisibleLanes.add(laneId)
        } catch (e: any) {
            Logger.Warning('Error in ApplyLaneVisibility: {e.Message}')
        }
    }

    private static SetLaneVisibility(lane: WolfArea, isVisible: boolean) {
        for (let i: number = 0; i < lane.Wolves.length; i++) {
            let wolf = lane.Wolves[i]
            wolf.Unit.show = isVisible
            wolf.PauseSelf(!isVisible)
            wolf.Texttag?.setVisible(isVisible)
        }
    }

    public static HideAllLanes() {
        try {
            if (WolfArea.WolfAreas == null) return

            for (let [_, lane] of WolfArea.WolfAreas) {
                this.SetLaneVisibility(lane, false)
                lane.IsEnabled = false
            }
        } catch (e: any) {
            Logger.Warning('Error in HideAllLanes: {e.Message}')
        }
    }

    public static ResetLanes() {
        try {
            this.lanesToEnable.clear()
            this.currentlyVisibleLanes.clear()
            if (WolfArea.WolfAreas == null) return
            for (let [_, lane] of WolfArea.WolfAreas) {
                lane.IsEnabled = true
                this.SetLaneVisibility(lane, true)
            }
        } catch (e: any) {
            Logger.Warning('Error in ResetLanes: {e.Message}')
        }
    }
}
