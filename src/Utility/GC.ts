

class GC
{
    public static List<Affix> GCAffixes = new List<Affix>();

    public static RemoveTrigger( t: trigger) // TODO; Cleanup:     public static RemoveTrigger(ref trigger t)
    {
        if (t == null) return;
        t.ClearActions();
        t.ClearConditions();
        t.Dispose();
        t = null;
    }

    public static RemoveTimer( t: timer) // TODO; Cleanup:     public static RemoveTimer(ref timer t)
    {
        if (t == null) return;
        t.Pause();
        t?.Dispose();
        t = null;
    }

    public static RemoveEffect( e: effect) // TODO; Cleanup:     public static RemoveEffect(ref effect e)
    {
        if (e == null) return;
        e?.Dispose();
        e = null;
    }

    public static RemoveGroup( g: group) // TODO; Cleanup:     public static RemoveGroup(ref group g)
    {
        if (g == null) return;
        g.Clear();
        g?.Dispose();
        g = null;
    }

    public static RemoveAffix(affix: Affix)
    {
        if (affix == null) return;
        let index = GCAffixes.IndexOf(affix);
        if (index != -1) GCAffixes[index] = null;
        GCAffixes.Remove(affix);
    }

    public static RemoveDictionary<K, V>( Dictionary<K, V> dict) // TODO; Cleanup:     public static RemoveDictionary<K, V>(ref Dictionary<K, V> dict)
    {
        if (dict == null) return;
        dict.Clear();
        dict = null;
    }

    public static RemoveList<T>( List<T> list) // TODO; Cleanup:     public static RemoveList<T>(ref List<T> list)
    {
        if (list == null) return;
        list.Clear();
        list = null;
    }

    public static RemoveFilterFunc( filter: filterfunc) // TODO; Cleanup:     public static RemoveFilterFunc(ref filterfunc filter)
    {
        if (filter == null) return;
        filter.Dispose();
        filter = null;
    }

    public static RemoveTimerDialog( td: timerdialog) // TODO; Cleanup:     public static RemoveTimerDialog(ref timerdialog td)
    {
        if (td == null) return;
        td.Dispose();
        td = null;
    }
}
