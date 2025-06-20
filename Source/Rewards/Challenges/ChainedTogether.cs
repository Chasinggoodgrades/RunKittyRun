using System;
using System.Collections.Generic;
using static WCSharp.Api.Common;
using WCSharp.Api;

public static class ChainedTogether
{

    private static Dictionary<string, lightning> KittyLightnings = new Dictionary<string, lightning>();

    private static float timerInterval = 0.1f; 
    // Evaluate if this will be a one time thing for particular people .. or an instanced type of object.. Perhaps change this to use OOP instead? 

    /// <summary>
    /// Starts the event, TBD how
    /// </summary>
    public static void StartEvent()
    {
        try
        {
            // When the event starts, each kitty gets attached to the closest player. It doesn't change over time
            var kittyGroups = SetGroups();

            for (int i = 0; i < kittyGroups.Count; i++)
            {
                var group = kittyGroups[i];
                ChainClosestKitties(group[0], group.GetRange(1, group.Count - 1));

                for (int j = 0; j < group.Count; j++)
                {
                    var kitty = group[j];
                    if (kitty.ChainedKitty != null && kitty.ChainedKitty.Unit != null)
                    {
                        // TODO: the color might vary based on conditions
                        var lightning = AddLightning("GRCH", true, kitty.Unit.X, kitty.Unit.Y, kitty.ChainedKitty.Unit.X, kitty.ChainedKitty.Unit.Y);
                        KittyLightnings[kitty.Name] = lightning;
                    }
                }
            }

            timer moveTimer = CreateTimer();
            TimerStart(moveTimer, timerInterval, true, ErrorHandler.Wrap(MoveChain));

        }

        catch (Exception e)
        {
            Logger.Warning($"Error in ChainedTogether.StartEvent {e.Message}");
            throw;
        }
    }

    private static void MoveChain()
    {
        var kitties = new List<Kitty>(Globals.ALL_KITTIES.Values);

        for (int i = 0; i < kitties.Count; i++)
        {
            var kitty = kitties[i];
            var chainedKitty = kitty.ChainedKitty;
            
            if (KittyLightnings.ContainsKey(kitty.Name))
            {
                var lightning = MoveLightning(KittyLightnings[kitty.Name], true, kitty.Unit.X, kitty.Unit.Y, chainedKitty.Unit.X, chainedKitty.Unit.Y);
            }
        }

    }

    private static List<List<Kitty>> SetGroups()
    {
        var kitties = new List<Kitty>(Globals.ALL_KITTIES.Values);
        var groups = new List<List<Kitty>>();
        int count = kitties.Count;

        if (count < 3)
        {
            groups.Add(kitties);
            return groups;
        }

        int index = 0;
        int groupsOfThree = count / 3;
        int remainder = count % 3;

        if (remainder == 1)
        {
            // convert two groups of 3 into two groups of 4 to avoid a group of 1
            groupsOfThree -= 1;
            remainder += 3;
        }

        for (int i = 0; i < groupsOfThree; i++)
        {
            groups.Add(new List<Kitty> { kitties[index], kitties[index + 1], kitties[index + 2] });
            index += 3;
        }

        if (remainder > 0)
        {
            var lastGroup = new List<Kitty>();
            for (int i = index; i < kitties.Count; i++)
            {
                lastGroup.Add(kitties[i]);
            }
            groups.Add(lastGroup);
        }

        return groups;
    }


    private static void ChainClosestKitties(Kitty currentKitty, List<Kitty> remainingKitties)
    {
        if (remainingKitties == null || remainingKitties.Count == 0) return;

        Kitty closestKitty = null;
        float minDistance = float.MaxValue;

        foreach (var kitty in remainingKitties)
        {
            if (kitty.Unit == null || !kitty.Alive) continue;

            float distance = Math.Abs(currentKitty.Unit.X - kitty.Unit.X) + Math.Abs(currentKitty.Unit.Y - kitty.Unit.Y);
            if (distance < minDistance)
            {
                minDistance = distance;
                closestKitty = kitty;
            }
        }

        if (closestKitty != null)
        {
            remainingKitties.Remove(closestKitty);
            currentKitty.ChainedKitty = closestKitty;
            ChainClosestKitties(closestKitty, remainingKitties);
        }
    }
}
