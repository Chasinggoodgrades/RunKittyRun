import { Affix } from 'src/Affixes/Affix'
import { Effect, Group, Timer, Trigger } from 'w3ts'
import { safeArraySplice } from './ArrayUtils'

export class GC {
    public static GCAffixes: Affix[] = []

    public static RemoveTrigger(t: Trigger) {
        // TODO; Cleanup:     public static RemoveTrigger(ref trigger t)
        if (t == null) return
        t.destroy()
    }

    public static RemoveTimer(t: Timer) {
        // TODO; Cleanup:     public static RemoveTimer(ref timer t)
        if (t == null) return
        t.pause()
        t.destroy()
    }

    public static RemoveEffect(e: Effect | undefined) {
        // TODO; Cleanup:     public static RemoveEffect(ref effect e)
        if (e == null) return
        e.destroy()
    }

    public static RemoveGroup(g: Group) {
        // TODO; Cleanup:     public static RemoveGroup(ref group g)
        if (g == null) return
        g.clear()
        g.destroy()
    }

    public static RemoveAffix(affix: Affix) {
        if (affix == null) return
        let index = GC.GCAffixes.indexOf(affix)
        if (index != -1) (GC.GCAffixes as any)[index] = null
        safeArraySplice(GC.GCAffixes, a => a === affix)
    }

    public static RemoveList<T>(list: T[]) {
        // TODO; Cleanup:     public static RemoveList<T>(ref list: T[])
        if (list == null) return
        list.length = 0
    }

    public static RemoveFilterFunc(filter: filterfunc | (() => boolean)) {}

    public static RemoveTimerDialog(td: timerdialog) {
        // TODO; Cleanup:     public static RemoveTimerDialog(ref timerdialog td)
        if (td == null) return
        DestroyTimerDialog(td)
    }
}
