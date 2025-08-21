import { Logger } from 'src/Events/Logger/Logger'
import { Wolf } from 'src/Game/Entities/Wolf'
import { Globals } from 'src/Global/Globals'
import { Affix } from './Affix'

export class AffixUtil {
    public static RemoveAffix(affix: Affix, wolf: Wolf): void
    public static RemoveAffix(affixName: string, wolf: Wolf): void
    public static RemoveAffix(arg: Affix | string, wolf: Wolf): void {
        if (typeof arg === 'string') {
            for (let i = 0; i < wolf.Affixes.length; i++) {
                if (wolf.Affixes[i].constructor.name === arg) {
                    AffixUtil.RemoveAffix(wolf.Affixes[i], wolf)
                    break
                }
            }
        } else {
            wolf.Affixes.splice(wolf.Affixes.indexOf(arg), 1)
            arg.Remove()
            Globals.AllAffixes.splice(Globals.AllAffixes.indexOf(arg), 1)
        }
    }
}

export const RemoveAllWolfAffixes = (wolf: Wolf) => {
    if (wolf.AffixCount() === 0) return

    try {
        for (let i = wolf.Affixes.length - 1; i >= 0; i--) {
            wolf.Affixes[i].Remove()
            Globals.AllAffixes.splice(Globals.AllAffixes.indexOf(wolf.Affixes[i]), 1)
        }
    } catch (e) {
        Logger.Warning(`Error in RemoveAllWolfAffixes: ${e}`)
    }

    wolf.Affixes = []
}

export const AddAffix = (affix: Affix, wolf: Wolf) => {
    wolf.Affixes.push(affix)
    Globals.AllAffixes.push(affix)
    affix.Apply()
}
