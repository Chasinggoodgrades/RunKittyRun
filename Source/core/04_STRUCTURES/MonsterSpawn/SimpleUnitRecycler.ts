import { MemoryHandler } from 'Utils/MemoryHandler'
import { arrayPush } from 'core/01_libraries/Basic_functions'
import { Timer } from 'w3ts'
import { createTimer } from '../../../Utils/mapUtils'

const UNIT_UNAVAILABLE_TIME = 10 // in seconds

export const initSimpleUnitRecycler = () => {
    const units = MemoryHandler.getEmptyArray<unit>()

    /**
     * The units handed back and not reusable yet, in the order they were handed back, with the
     * seconds each has left. An order every machine goes through alike: these used to be tables keyed
     * by handle id, and the order they were walked in decided which unit the next spawn reuses. Lua
     * recycles handle ids on each machine at the pace of its own garbage collector, so each machine
     * soon reused another unit for the same spawn, and units stood in different places.
     */
    const unavailableUnits = MemoryHandler.getEmptyArray<unit>()
    const unavailableRemainingTimes = MemoryHandler.getEmptyArray<number>()
    /** Whether a unit is waiting there already, by handle id: looked up on this machine, never walked */
    const isUnavailable: { [x: number]: boolean } = MemoryHandler.getEmptyObject()

    // During UNIT_UNAVAILABLE_TIME seconds a removed unit is unavailable to be reused, in case of movement effect following the unit
    const unavailableTimeTimer: Timer = createTimer(1, true, () => {
        let keptCount = 0

        for (let i = 0; i < unavailableUnits.length; i++) {
            const u = unavailableUnits[i]
            const newTime = unavailableRemainingTimes[i] - 1

            if (newTime <= 0) {
                delete isUnavailable[GetHandleId(u)]
                arrayPush(units, u)
            } else {
                unavailableUnits[keptCount] = u
                unavailableRemainingTimes[keptCount] = newTime
                keptCount++
            }
        }

        unavailableUnits.length = keptCount
        unavailableRemainingTimes.length = keptCount
    })

    const reinit = () => {
        for (const u of units) {
            RemoveUnit(u)
        }
        units.length = 0

        for (const u of unavailableUnits) {
            delete isUnavailable[GetHandleId(u)]
            RemoveUnit(u)
        }
        unavailableUnits.length = 0
        unavailableRemainingTimes.length = 0
    }

    const destroy = () => {
        for (const u of units) {
            RemoveUnit(u)
        }

        MemoryHandler.destroyArray(units)
        MemoryHandler.destroyArray(unavailableUnits)
        MemoryHandler.destroyArray(unavailableRemainingTimes)
        MemoryHandler.destroyObject(isUnavailable)
        unavailableTimeTimer.destroy()
    }

    return {
        getUnit: (): unit | undefined => {
            const u = units.shift()

            if (u) {
                ShowUnit(u, true)
            }

            return u
        },
        removeUnit: (u: unit) => {
            ShowUnit(u, false)

            const handleId = GetHandleId(u)

            // handed back again while waiting: its wait starts over, where it already stands in line
            if (isUnavailable[handleId]) {
                for (let i = 0; i < unavailableUnits.length; i++) {
                    if (unavailableUnits[i] === u) {
                        unavailableRemainingTimes[i] = UNIT_UNAVAILABLE_TIME
                        return
                    }
                }
            }

            isUnavailable[handleId] = true
            arrayPush(unavailableUnits, u)
            arrayPush(unavailableRemainingTimes, UNIT_UNAVAILABLE_TIME)
        },
        reinit,
        destroy,
    }
}
