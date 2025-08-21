import { Affix } from 'src/Affixes/Affix'
import { Effect, Group, Timer, Trigger } from 'w3ts'
import { safeArraySplice } from './ArrayUtils'

export class GC {
    public static GCAffixes: Affix[] = []

    public static RemoveTrigger = (t: Trigger | undefined) => {
        if (!t) return
        t.destroy()
    }

    public static RemoveTimer = (t: Timer | undefined) => {
        if (!t) return
        t.pause()
        t.destroy()
    }

    public static RemoveEffect = (e: Effect | undefined) => {
        if (!e) return
        e.destroy()
    }

    public static RemoveGroup = (g: Group | undefined) => {
        if (!g) return
        g.clear()
        g.destroy()
    }

    public static RemoveAffix = (affix: Affix | undefined) => {
        if (!affix) return
        const index = GC.GCAffixes.indexOf(affix)
        if (index !== -1) (GC.GCAffixes as any)[index] = null
        safeArraySplice(GC.GCAffixes, a => a === affix)
    }

    public static RemoveList<T>(list: T[] | undefined) {
        if (!list) return
        list.length = 0
    }

    public static RemoveFilterFunc = (filter: filterfunc | (() => boolean)) => {}

    public static RemoveTimerDialog = (td: timerdialog) => {
        if (!td) return
        DestroyTimerDialog(td)
    }
}
