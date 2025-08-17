import { Logger } from 'src/Events/Logger/Logger'
import { MemoryHandler } from 'src/Utility/MemoryHandler/MemoryHandler'
import { Unit } from 'w3ts'

/// <summary>
/// Represents a visual range indicator created using lightning effects around a specified unit.
/// </summary>

export class RangeIndicator {
    /// <summary>
    /// The type of lightning used to create the range indicator. Default is "BLNL" (Blue Lightning).
    /// "BLNL" (Blue Lightning), "FINL" (Orange Lightning), "MYNL" (Purple Lightning), "RENL" (Red Lightning).
    /// "GRNL" (Green Lightning) "SPNL" (Tealish Spirit Lightning)
    /// </summary>
    public LIGHTNING_TYPE: string = 'BLNL'

    /// <summary>
    /// A list to store the lightning objects that make up the range indicator.
    /// </summary>
    public LightningObjects: lightning[] = []

    /// <summary>
    /// Initializes a new instance of the <see cref="RangeIndicator"/> class.
    /// Use with MemoryHandler.getEmptyObject<RangeIndicator>() for efficient object reuse.
    /// </summary>
    constructor() {
        this.LightningObjects = []
    }

    /// <summary>
    /// Creates a visual range indicator around the specified unit using lightning effects
    /// </summary>
    /// <param name="unit">The unit around which the range indicator will be displayed.</param>
    /// <param name="range">The radius of the range indicator in game units.</param>
    /// <param name="segments">The number of segments into which the range indicator is divided. Higher values produce a smoother circle. Default is 20.</param>
    /// <parm name="lightningType">The type of lightning effect to use for the range indicator. Default is "BLNL".</param>
    public CreateIndicator(unit: Unit, range: number, segments = 20, lightningType: string = this.LIGHTNING_TYPE) {
        const x: number = unit.x
        const y: number = unit.y

        const angleStep = 360.0 / segments

        // Creating a circular range indicator around the unit
        for (let i = 0; i < segments; i++) {
            const angle1: number = i * angleStep * bj_DEGTORAD
            const angle2: number = (i + 1) * angleStep * bj_DEGTORAD

            const startX: number = x + range * Cos(angle1)
            const startY: number = y + range * Sin(angle1)
            const endX: number = x + range * Cos(angle2)
            const endY: number = y + range * Sin(angle2)

            const lightning = AddLightning(lightningType, true, startX, startY, endX, endY)
            this.LightningObjects.push(lightning!)
        }
    }

    public DestroyIndicator() {
        try {
            for (let i = 0; i < this.LightningObjects.length; i++) {
                DestroyLightning(this.LightningObjects[i])
            }
            this.LightningObjects = []
        } catch (e: any) {
            Logger.Warning(`Error in RangeIndicator.DestroyIndicator: ${e}`)
        }
    }

    /// <summary>
    /// Disposes of the range indicator by destroying all associated lightning effects and releasing the object back to the pool
    /// </summary>
    public dispose() {
        this.DestroyIndicator()
        MemoryHandler.destroyObject(this)
    }
}
