using System;
using System.Collections.Generic;
using static WCSharp.Api.Common;
using WCSharp.Api;

public static class ChainedTogether
{

    private static Dictionary<string, lightning> KittyLightnings = new Dictionary<string, lightning>();
    private static float timerInterval = 0.1f; 
    private static Random rng = new Random();
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
                ChainKitties(group[0], group.GetRange(1, group.Count - 1));

                for (int j = 0; j < group.Count; j++)
                {
                    var kitty = group[j];
                    if (kitty.ChainedKitty != null && kitty.ChainedKitty.Unit != null)
                    {
                        var lightning = AddLightning("WHCH", true, kitty.Unit.X, kitty.Unit.Y, kitty.ChainedKitty.Unit.X, kitty.ChainedKitty.Unit.Y);
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
        var kitties = Globals.ALL_KITTIES_LIST;

        for (int i = 0; i < kitties.Count; i++)
        {
            var kitty = kitties[i];
            var kittyName = kitty.Name;
            if (!KittyLightnings.ContainsKey(kittyName))
            {
                continue;
            }

            var chainedKitty = kitty.ChainedKitty;
            var x1 = kitty.Unit.X;
            var y1 = kitty.Unit.Y;
            var x2 = chainedKitty.Unit.X;
            var y2 = chainedKitty.Unit.Y;

            var lightning = KittyLightnings[kittyName];
            MoveLightning(lightning, true, x1, y1, x2, y2);

            float distance = Math.Abs(x2 - x1) + Math.Abs(y2 - y1);

            ChangeChainColor(lightning, distance, kittyName);
        }
    }

    private static void ChangeChainColor(lightning lightning, float distance, string kittyName)
    {
        float red = 0.0f, green = 1.0f, blue = 0.0f, alpha = 1.0f; // Default color is green

        // TODO: remove referece to chained kitty + add destroy effect + show failed quest message
        if (distance > 800)
        {
            // Check if there's a way to decrease alhpa over time when chain is about to break
            lightning.Dispose();
            KittyLightnings.Remove(kittyName);
            return;
        }
        else if (distance > 600)
        {
            red = 1.0f; green = 0.0f; blue = 0.0f; // Red
        }
        else if (distance > 400)
        {
            red = 1.0f; green = 1.0f; blue = 0.0f; // Yellow
        }

        SetLightningColor(lightning, red, green, blue, alpha);
    }


    private static List<List<Kitty>> SetGroups()
    {
        var kitties = Globals.ALL_KITTIES_LIST;
        var groups = new List<List<Kitty>>();
        int count = kitties.Count;

        // Shuffle the kitties list to ensure randomness
        for (int i = kitties.Count - 1; i > 0; i--)
        {
            int j = rng.Next(i + 1);
            Kitty temp = kitties[i];
            kitties[i] = kitties[j];
            kitties[j] = temp;
        }

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


    private static void ChainKitties(Kitty currentKitty, List<Kitty> remainingKitties)
    {
        if (remainingKitties == null || remainingKitties.Count == 0) return;

        var nextKitty = remainingKitties[0];
        currentKitty.ChainedKitty = nextKitty;
        remainingKitties.Remove(nextKitty);
        ChainKitties(nextKitty, remainingKitties);
    }
}
