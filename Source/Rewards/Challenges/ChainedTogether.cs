using System;
using System.Collections.Generic;
using static WCSharp.Api.Common;
using WCSharp.Api;
using System.Linq;

public static class ChainedTogether
{
    private static Dictionary<string, lightning> KittyLightnings = new Dictionary<string, lightning>();
    private static List<List<Kitty>> kittyGroups;
    private static float timerInterval = 0.1f;
    private static Random rng = Globals.RANDOM_GEN;
    // Evaluate if this will be a one time thing for particular people .. or an instanced type of object.. Perhaps change this to use OOP instead? 

    /// <summary>
    /// Starts the event, TBD how
    /// </summary>
    public static void StartEvent()
    {
        try
        {
            kittyGroups = SetGroups();

            for (int i = 0; i < kittyGroups.Count; i++)
            {
                var group = kittyGroups[i];

                for (int j = 0; j < group.Count - 1; j++)
                {
                    var currentKitty = group[j];
                    var chainedKitty = group[j + 1];

                    currentKitty.IsChained = true;
                    var lightning = AddLightning("WHCH", true, currentKitty.Unit.X, currentKitty.Unit.Y, chainedKitty.Unit.X, chainedKitty.Unit.Y);
                    KittyLightnings[currentKitty.Name] = lightning;
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
        string kittyNameOutOfRange = "";

        for (int i = 0; i < kitties.Count - 1; i++)
        {
            var kitty = kitties[i];
            var kittyName = kitty.Name;
            if (!KittyLightnings.ContainsKey(kittyName))
            {
                continue;
            }

            var chainedKitty = kitties[i + 1];
            var x1 = kitty.Unit.X;
            var y1 = kitty.Unit.Y;
            var x2 = chainedKitty.Unit.X;
            var y2 = chainedKitty.Unit.Y;

            var lightning = KittyLightnings[kittyName];
            MoveLightning(lightning, true, x1, y1, x2, y2);

            float distance = Math.Abs(x2 - x1) + Math.Abs(y2 - y1);

            if (distance > 800)
            {
                kittyNameOutOfRange = kittyName;
            }

            ChangeChainColor(distance, kittyName);
        }

        // TODO: check how to apply pull mechanics
        if (kittyNameOutOfRange != "")
        {
            LoseEvent(kittyNameOutOfRange);
        }
    }

    public static void LoseEvent(string kittyNameOutSideRange)
    {
        try
        {
            FreeKittiesFromGroup(kittyNameOutSideRange, false);
        }
        catch (Exception e)
        {
            Logger.Warning($"Error in ChainedTogether.LoseEvent {e.Message}");
            throw;
        }
    }

    private static void ChangeChainColor(float distance, string kittyName)
    {
        var lightning = KittyLightnings[kittyName];
        float red = 0.0f, green = 1.0f, blue = 0.0f, alpha = 1.0f; // Default color is green

        // Change this values based on difficulty maybe?
        if (distance > 600)
        {
            red = 1.0f; green = 0.0f; blue = 0.0f; // Red
        }
        else if (distance > 400)
        {
            red = 1.0f; green = 1.0f; blue = 0.0f; // Yellow
        }

        SetLightningColor(lightning, red, green, blue, alpha);
    }

    private static void FreeKittiesFromGroup(string kittyName, bool isVictory = false)
    {
        int groupIndex = kittyGroups.FindIndex(group => group.Any(kitty => kitty.Name == kittyName));
        if (groupIndex < 0)
        {
            return;
        }

        var currentGroup = kittyGroups[groupIndex];

        for (int i = 0; i < currentGroup.Count; i++)
        {
            var kitty = currentGroup[i];
            kitty.IsChained = false;

            if (isVictory)
            {
                AwardChainedTogether(kitty);
            }

            if (KittyLightnings.ContainsKey(kitty.Name))
            {
                KittyLightnings[kitty.Name].Dispose();
                KittyLightnings.Remove(kitty.Name);
            }
        }

        kittyGroups.RemoveAt(groupIndex);
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

    public static void ReachedSafezone(Kitty kitty, Safezone safezone)
    {
        if (safezone.ID != RegionList.SafeZones.Length - 1)
        {
            return;
        }

        try
        {
            FreeKittiesFromGroup(kitty.Name, true);
        }
        catch (Exception e)
        {
            Logger.Warning($"Error in ChainedTogether.ReachedSafezone {e.Message}");
            throw;
        }

    }

    private static void AwardChainedTogether(Kitty kitty)
    {
        var textTag = texttag.Create();

        Utility.CreateSimpleTextTag($"{Colors.COLOR_RED}Chained Together!", 2.0f, kitty.Unit);
        // AwardManager.GiveReward(kitty.Player, nameof(Globals.GAME_AWARDS_SORTED... TBD);
    }
}
