using WCSharp.Api;
using WCSharp.Shared.Data;

public static class NitroPacer
{
    public static unit Unit { get; set; }

    private static float currentDistance = 0;
    private static int currentCheckpoint = 0;
    private static timer pacerTimer;
    private static rect spawnRect = RegionList.SpawnRegions[5].Rect;
    private static Rectangle[] pathingPoints = RegionList.PathingPoints;
    private static effect nitroEffect;
    private static item ghostBoots;

    /// <summary>
    /// Initializes the Nitros Pacer unit and effect, only applies to the standard gamemode.
    /// </summary>
    public static void Initialize()
    {
        if (Gamemode.CurrentGameMode != "Standard")
        {
            return;
        }

        Unit = unit.Create(player.NeutralPassive, Constants.UNIT_NITRO_PACER, spawnRect.CenterX, spawnRect.CenterY, 360);
        Utility.MakeUnitLocust(Unit);
        Unit.IsInvulnerable = true;
        ghostBoots = Unit.AddItem(Constants.ITEM_GHOST_KITTY_BOOTS);
        nitroEffect = effect.Create("war3mapImported\\Nitro.mdx", Unit, "origin");
        VisionShare();

        pacerTimer = timer.Create();
    }

    /// <summary>
    /// Returns the current distance of the nitro pacer.
    /// </summary>
    /// <returns></returns>
    public static int GetCurrentCheckpoint() => currentCheckpoint;

    /// <summary>
    /// Starts the nitro pacer, resets the pacer and sets the speed of the unit to 0.
    /// </summary>
    public static void StartNitroPacer()
    {
        ResetNitroPacer();
        Unit.UseItem(ghostBoots);
        NitroPacerQueueOrders();
        pacerTimer.Start(0.15f, true, UpdateNitroPacer);
    }

    /// <summary>
    /// Resets the nitro pacer, sets the unit to the spawn point, and sets the speed of the unit to 0.
    /// </summary>
    public static void ResetNitroPacer()
    {
        pacerTimer.Pause();
        Unit.IsPaused = false;
        Unit.SetPosition(spawnRect.CenterX, spawnRect.CenterY);
        currentCheckpoint = 0;
        currentDistance = 0;
    }

    private static void UpdateNitroPacer()
    {
        currentDistance = Progress.CalculateNitroPacerProgress();
        float remainingDistance = Progress.DistancesFromStart[RegionList.PathingPoints.Length - 1] - currentDistance;
        float remainingTime = NitroChallenges.GetNitroTimeRemaining();
        float speed = remainingTime != 0.0f ? remainingDistance / remainingTime : 350.0f;
        SetSpeed(speed);

        if (pathingPoints[currentCheckpoint + 1].Contains(Unit.X, Unit.Y))
        {
            currentCheckpoint++;
            if (currentCheckpoint >= pathingPoints.Length - 1)
            {
                pacerTimer.Pause();
                Utility.SimpleTimer(2.0f, () => Unit.IsPaused = true); // this is actually ok since we reset pacer before starting it again
                return;
            }
        }

    }

    private static void NitroPacerQueueOrders()
    {
        // backwards for pathingpoints, for stack queue order
        for (int i = pathingPoints.Length - 1; i >= 1; i--) // exclude starting point
        {
            Rectangle point = pathingPoints[i];
            Unit.QueueOrder(WolfPoint.MoveOrderID, point.Center.X, point.Center.Y);
        }
    }

    private static void VisionShare()
    {
        foreach (player player in Globals.ALL_PLAYERS)
        {
            player.NeutralPassive.SetAlliance(player, alliancetype.SharedVisionForced, true);
        }
    }

    private static void SetSpeed(float speed) => Unit.BaseMovementSpeed = speed;

}