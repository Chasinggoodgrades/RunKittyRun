using System;
using System.Collections.Generic;
using WCSharp.Api;
using static WCSharp.Api.Common;

public static class UnitWithinRange
{
    private static int currentUnitId = 1;
    private static int currentTriggerId = 1;
    private static readonly Dictionary<unit, int> unitIds = new();
    private static readonly Dictionary<trigger, int> triggerIds = new();
    private static readonly Dictionary<int, Dictionary<int, trigger>> unitRangeTriggers = new();
    private static readonly Dictionary<int, trigger> unitCleanupTriggers = new();
    private static readonly Dictionary<int, unit> unitRangeUnits = new();
    private static readonly Dictionary<int, (float eventValue, trigger execution)> udg_WithinRangeHash = new();
    private static readonly HashSet<unit> withinRangeUsers = new();

    private static int GetUniqueUnitId(unit u)
    {
        if (!unitIds.TryGetValue(u, out int id))
        {
            id = currentUnitId++;
            unitIds[u] = id;
        }
        return id;
    }

    private static int GetUniqueTriggerId(trigger trig)
    {
        if (!triggerIds.TryGetValue(trig, out int id))
        {
            id = currentTriggerId++;
            triggerIds[trig] = id;
        }
        return id;
    }

    private static bool RegisterUnitWithinRangeSuper(unit u, float range, bool cleanOnKilled, Func<bool> filter, trigger execution, float eventValue, bool destroyFilterWhenDone)
    {
        int unitId = GetUniqueUnitId(u);
        int rangeAsInt = (int)range;

        if (range <= 0)
        {
            return false;
        }

        if (!unitRangeTriggers.ContainsKey(unitId))
        {
            unitRangeTriggers[unitId] = new Dictionary<int, trigger>();
        }

        // Check if this range is already registered
        if (unitRangeTriggers[unitId].ContainsKey(rangeAsInt))
        {
            return false;
        }

        trigger trig = CreateTrigger();
        unitRangeTriggers[unitId][rangeAsInt] = trig;

        _ = TriggerAddAction(trig, () =>
        {
            ActionUnitWithinRange(trig);
        });

        if (cleanOnKilled && !unitCleanupTriggers.ContainsKey(unitId))
        {
            trigger cleanupTrigger = CreateTrigger();
            unitCleanupTriggers[unitId] = cleanupTrigger;

            _ = TriggerAddAction(cleanupTrigger, () =>
            {
                ActionUnitWithinCleanOnKilled(GetTriggerUnit());
            });

            _ = TriggerRegisterUnitStateEvent(cleanupTrigger, u, UNIT_STATE_LIFE, LESS_THAN_OR_EQUAL, 0.405f);
        }

        _ = TriggerRegisterUnitInRange(trig, u, range, Condition(() => filter()));

        int trigId = GetUniqueTriggerId(trig);
        unitRangeUnits[trigId] = u;
        _ = withinRangeUsers.Add(u);

        udg_WithinRangeHash[trigId] = (eventValue, execution);

        return true;
    }

    private static void ActionUnitWithinRange(trigger trig)
    {
        int trigId = GetUniqueTriggerId(trig);
        var (eventValue, execution) = udg_WithinRangeHash[trigId];
        _ = unitRangeUnits[trigId];
        _ = GetTriggerUnit();

        if (eventValue != 0.0f)
        {

        }

        execution?.Execute();
    }

    private static void ActionUnitWithinCleanOnKilled(unit unit)
    {
        DeRegisterUnitWithinRangeUnit(unit);
    }

    public static void DeRegisterUnitWithinRangeUnit(unit u)
    {
        int unitId = GetUniqueUnitId(u);
        if (unitRangeTriggers.ContainsKey(unitId))
        {
            foreach (var kvp in unitRangeTriggers[unitId])
            {
                RemoveTrigger(kvp.Value);
            }
            _ = unitRangeTriggers.Remove(unitId);
        }

        if (unitCleanupTriggers.ContainsKey(unitId))
        {
            RemoveTrigger(unitCleanupTriggers[unitId]);
            _ = unitCleanupTriggers.Remove(unitId);
        }

        _ = withinRangeUsers.Remove(u);
    }

    private static void RemoveTrigger(trigger trig)
    {
        int trigId = GetUniqueTriggerId(trig);
        // Remove saved handles and cleanup
        _ = unitRangeUnits.Remove(trigId);
        _ = udg_WithinRangeHash.Remove(trigId);
        // Destroy the trigger
        GC.RemoveTrigger(ref trig);
    }

    public static bool RegisterUnitWithinRangeEvent(unit u, float range, Func<bool> filter, float eventValue)
    {
        return RegisterUnitWithinRangeSuper(u, range, false, filter, null, eventValue, true);
    }

    public static bool RegisterUnitWithinRangeTrigger(unit u, float range, Func<bool> filter, trigger execution)
    {
        return RegisterUnitWithinRangeSuper(u, range, false, filter, execution, 1.0f, true);
    }
}
