import { Unit } from 'w3ts'

/// <summary>
/// If the unit has the item, it'll be deleted.
/// </summary>
/// <param name="u"></param>
/// <param name="itemId"></param>
export const RemoveItemFromUnit = (u: Unit, itemId: number) => {
    for (let i = 0; i < 6; i++) {
        if (u.getItemInSlot(i)?.typeId === itemId) {
            u.removeItemFromSlot(i)?.destroy()
            return
        }
    }
}
