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
        }

        catch (Exception e)
        {
            Logger.Warning($"Error in ChainedTogether.StartEvent {e.Message}");
            throw;
        }
    }
}
