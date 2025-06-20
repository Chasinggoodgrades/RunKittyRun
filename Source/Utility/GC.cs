﻿using System.Collections.Generic;
using WCSharp.Api;

public static class GC
{
    public static List<Affix> GCAffixes = new List<Affix>();

    public static void RemoveTrigger(ref trigger t)
    {
        if (t == null) return;
        t.ClearActions();
        t.ClearConditions();
        t.Dispose();
        t = null;
    }

    public static void RemoveTimer(ref timer t)
    {
        if (t == null) return;
        t.Pause();
        t?.Dispose();
        t = null;
    }

    public static void RemoveEffect(ref effect e)
    {
        if (e == null) return;
        e?.Dispose();
        e = null;
    }

    public static void RemoveGroup(ref group g)
    {
        if (g == null) return;
        g.Clear();
        g?.Dispose();
        g = null;
    }

    public static void RemoveAffix(Affix affix)
    {
        if (affix == null) return;
        var index = GCAffixes.IndexOf(affix);
        if (index != -1) GCAffixes[index] = null;
        GCAffixes.Remove(affix);
    }

    public static void RemoveDictionary<K, V>(ref Dictionary<K, V> dict)
    {
        if (dict == null) return;
        dict.Clear();
        dict = null;
    }

    public static void RemoveList<T>(ref List<T> list)
    {
        if (list == null) return;
        list.Clear();
        list = null;
    }

    public static void RemoveFilterFunc(ref filterfunc filter)
    {
        if (filter == null) return;
        filter.Dispose();
        filter = null;
    }

    public static void RemoveTimerDialog(ref timerdialog td)
    {
        if (td == null) return;
        td.Dispose();
        td = null;
    }
}
