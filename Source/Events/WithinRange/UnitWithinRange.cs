using System;
using System.Collections.Generic;
using WCSharp.Api;
using WCSharp.Events;
using WCSharp.Shared;
using WCSharp.Shared.Data;
using static WCSharp.Api.Common;

public static class UnitWithinRange
{
    private static readonly Dictionary<int, Dictionary<int, trigger>> unitRangeTriggers = new();
    private static readonly Dictionary<int, trigger> unitCleanupTriggers = new();
    private static readonly Dictionary<int, unit> unitRangeUnits = new();
    private static readonly Dictionary<int, (float eventValue, trigger execution)> udg_WithinRangeHash = new();
    private static readonly HashSet<unit> withinRangeUsers = new();

    private static bool RegisterUnitWithinRangeSuper(unit u, float range, bool cleanOnKilled, Func<bool> filter, trigger execution, float eventValue, bool destroyFilterWhenDone)
    {
        int unitId = GetHandleId(u);
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

        TriggerAddAction(trig, () =>
        {
            ActionUnitWithinRange(GetTriggeringTrigger());
        });

        if (cleanOnKilled && !unitCleanupTriggers.ContainsKey(unitId))
        {
            trigger cleanupTrigger = CreateTrigger();
            unitCleanupTriggers[unitId] = cleanupTrigger;

            TriggerAddAction(cleanupTrigger, () =>
            {
                ActionUnitWithinCleanOnKilled(GetTriggerUnit());
            });

            TriggerRegisterUnitStateEvent(cleanupTrigger, u, UNIT_STATE_LIFE, LESS_THAN_OR_EQUAL, 0.405f);
        }

        TriggerRegisterUnitInRange(trig, u, range, Condition(() => filter()));

        unitRangeUnits[GetHandleId(trig)] = u;
        withinRangeUsers.Add(u);

        udg_WithinRangeHash[GetHandleId(trig)] = (eventValue, execution);

        return true;
    }

    private static void ActionUnitWithinRange(trigger trig)
    {
        int trigId = GetHandleId(trig);
        var (eventValue, execution) = udg_WithinRangeHash[trigId];

        unit registeredUnit = unitRangeUnits[trigId];
        unit enteringUnit = GetTriggerUnit();

        if (eventValue != 0.0f)
        {
            // Do something with eventValue if needed
        }

        if (execution != null)
        {
            execution.Execute();
        }
    }

    private static void ActionUnitWithinCleanOnKilled(unit unit)
    {
        DeRegisterUnitWithinRangeUnit(unit);
        // Set udg_WithinRangeUnit and udg_WithinRangeEvent to appropriate values if needed
    }

    private static void DeRegisterUnitWithinRangeUnit(unit u)
    {
        int unitId = GetHandleId(u);

        if (unitRangeTriggers.ContainsKey(unitId))
        {
            foreach (var kvp in unitRangeTriggers[unitId])
            {
                DestroyTrigger(kvp.Value);
            }
            unitRangeTriggers.Remove(unitId);
        }

        if (unitCleanupTriggers.ContainsKey(unitId))
        {
            DestroyTrigger(unitCleanupTriggers[unitId]);
            unitCleanupTriggers.Remove(unitId);
        }

        withinRangeUsers.Remove(u);
    }

    private static void DestroyTrigger(trigger trig)
    {
        int trigId = GetHandleId(trig);
        // Remove saved handles and cleanup
        unitRangeUnits.Remove(trigId);
        udg_WithinRangeHash.Remove(trigId);
        // Destroy the trigger
        WCSharp.Api.Common.DestroyTrigger(trig);
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
