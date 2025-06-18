using System;
using System.Collections.Generic;
using WCSharp.Api;
using static WCSharp.Api.Common;

public static class ChainedTogether
{

    // Evaluate if this will be a one time thing for particular people .. or an instanced type of object.. Perhaps change this to use OOP instead? 

    /// <summary>
    /// Starts the event, TBD how
    /// </summary>
    public static void StartEvent()
    {
        try
        {
            Utility.TimedTextToAllPlayers(4.0f, $"TOGHETHER WE STAND, DIVIDED WE FALL!");

            // When the event starts, each kitty gets attached to the closest player. It doesn't change over time
            var kitties = new List<Kitty>(Globals.ALL_KITTIES.Values);

            ChainClosestKitties(kitties[0], kitties.GetRange(1, kitties.Count - 1));

            Utility.TimedTextToAllPlayers(4.0f, $"kitties chain:");

            foreach (var kitty in kitties)
            {
                Utility.TimedTextToAllPlayers(4.0f, $"kitty: {kitty.Name}");
            }

        }

        catch (Exception e)
        {
            Logger.Warning($"Error in ChainedTogether.StartEvent {e.Message}");
            throw;
        }
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

    /// <summary>
    /// Finds the two kitties that are the farthest apart from each other.
    /// Is this really needed? Maybe we can just use the first and last kitty in the list?
    /// </summary>
    private static (Kitty, Kitty) GetChainEnds()
    {
        var kitties = new List<Kitty>(Globals.ALL_KITTIES.Values);
        Kitty farthestA = null;
        Kitty farthestB = null;
        float maxDistance = float.MinValue;

        for (int i = 0; i < kitties.Count; i++)
        {
            var kittyA = kitties[i];
            if (kittyA.Unit == null || !kittyA.Alive) continue;

            for (int j = i + 1; j < kitties.Count; j++)
            {
                var kittyB = kitties[j];
                if (kittyB.Unit == null || !kittyB.Alive) continue;

                float distance = Math.Abs(kittyA.Unit.X - kittyB.Unit.X) + Math.Abs(kittyA.Unit.Y - kittyB.Unit.Y);
                if (distance > maxDistance)
                {
                    maxDistance = distance;
                    farthestA = kittyA;
                    farthestB = kittyB;
                }
            }
        }

        return (farthestA, farthestB);
    }
}
