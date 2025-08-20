import { Logger } from 'src/Events/Logger/Logger'
import { Globals } from 'src/Global/Globals'
import { WolfArea } from '../WolfArea'

export class WolfLaneHider {
    private static readonly lanesToEnable: Set<number> = new Set<number>()
    private static readonly currentlyVisibleLanes: Set<number> = new Set<number>()

    public static LanesHider = () => {
        try {
            WolfLaneHider.UpdateLanesToEnable()
            WolfLaneHider.ApplyLaneVisibility()
        } catch (e) {
            Logger.Warning(`Error in WolfLaneHider: ${e}`)
        }
    }

    private static UpdateLanesToEnable = () => {
        try {
            WolfLaneHider.lanesToEnable.clear()

            for (let i = 0; i < Globals.ALL_PLAYERS.length; i++) {
                const kitty = Globals.ALL_KITTIES.get(Globals.ALL_PLAYERS[i])!
                const currentSafezone: number = kitty.CurrentSafeZone
                WolfLaneHider.AddAdjacentLanes(currentSafezone)
            }
        } catch (e) {
            Logger.Warning(`Error in UpdateLanesToEnable: ${e}`)
        }
    }

    public static ShadowKittyLaneAdd = (safezone: number) => {
        WolfLaneHider.AddAdjacentLanes(safezone)
        WolfLaneHider.ApplyLaneVisibility()
    }

    private static AddAdjacentLanes = (currentSafezone: number) => {
        WolfLaneHider.AddLane(currentSafezone)
        WolfLaneHider.AddLane(currentSafezone + 1)
        WolfLaneHider.AddLane(currentSafezone - 1)
        WolfLaneHider.AddLane(currentSafezone - 2)

        if (currentSafezone >= 13) {
            WolfLaneHider.AddLane(currentSafezone + 2)
            WolfLaneHider.AddLane(currentSafezone + 3)
        }
    }

    private static AddLane = (lane: number) => {
        if (lane >= 0 && lane <= 17) {
            WolfLaneHider.lanesToEnable.add(lane)
        }
    }

    private static ApplyLaneVisibility = () => {
        try {
            if (!WolfArea.WolfAreas) return

            // Show lanes that are now visible but weren't before
            for (const laneId of WolfLaneHider.lanesToEnable) {
                const lane = WolfArea.WolfAreas.get(laneId)
                if (!lane) continue
                if (!(WolfLaneHider.currentlyVisibleLanes.has(laneId) && lane)) {
                    lane.IsEnabled = true
                    WolfLaneHider.SetLaneVisibility(lane, true)
                }
            }

            // Hide lanes that are no longer visible
            for (const laneId of WolfLaneHider.currentlyVisibleLanes) {
                const lane = WolfArea.WolfAreas.get(laneId)
                if (!lane) continue
                if (!(WolfLaneHider.lanesToEnable.has(laneId) && lane)) {
                    lane.IsEnabled = false
                    WolfLaneHider.SetLaneVisibility(lane, false)
                }
            }

            // Update the set for next time
            WolfLaneHider.currentlyVisibleLanes.clear()
            for (const laneId of WolfLaneHider.lanesToEnable) WolfLaneHider.currentlyVisibleLanes.add(laneId)
        } catch (e) {
            Logger.Warning(`Error in ApplyLaneVisibility: ${e}`)
        }
    }

    private static SetLaneVisibility = (lane: WolfArea, isVisible: boolean) => {
        for (let i = 0; i < lane.Wolves.length; i++) {
            const wolf = lane.Wolves[i]
            wolf.Unit.show = isVisible
            wolf.PauseSelf(!isVisible)
            wolf.Texttag?.setVisible(isVisible)
        }
    }

    public static HideAllLanes = () => {
        try {
            if (!WolfArea.WolfAreas) return

            for (const [_, lane] of WolfArea.WolfAreas) {
                WolfLaneHider.SetLaneVisibility(lane, false)
                lane.IsEnabled = false
            }
        } catch (e) {
            Logger.Warning(`Error in HideAllLanes: ${e}`)
        }
    }

    public static ResetLanes = () => {
        try {
            WolfLaneHider.lanesToEnable.clear()
            WolfLaneHider.currentlyVisibleLanes.clear()
            if (!WolfArea.WolfAreas) return
            for (const [_, lane] of WolfArea.WolfAreas) {
                lane.IsEnabled = true
                WolfLaneHider.SetLaneVisibility(lane, true)
            }
        } catch (e) {
            Logger.Warning(`Error in ResetLanes: ${e}`)
        }
    }
}
