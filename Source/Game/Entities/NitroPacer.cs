using WCSharp.Api;
using WCSharp.Shared.Data;
using System.Linq;

public static class NitroPacer
{
    public static unit Unit;
    private static float Speed = 0.03f;
    private static float currentDistance = 0;
    private static int currentCheckpoint = 0;
    private static timer pacerTimer;
    private static rect SPAWN_RECT = RegionList.SpawnRegions[5].Rect;
    private static Rectangle[] PathingPoints = RegionList.PathingPoints;
    private static effect nitroEffect;
    private static item ghostBoots;

    /// <summary>
    /// Initializes the Nitros Pacer unit and effect, only applies to the standard gamemode.
    /// </summary>
    public static void Initialize()
    {
        if(Gamemode.CurrentGameMode != "Standard") return;

        Unit = unit.Create(player.NeutralPassive, Constants.UNIT_NITRO_PACER, SPAWN_RECT.CenterX, SPAWN_RECT.CenterY, 360);
        Utility.MakeUnitLocust(Unit);
        Unit.IsInvulnerable = true;
        ghostBoots = Unit.AddItem(Constants.ITEM_GHOST_KITTY_BOOTS);
        nitroEffect = effect.Create("war3mapImported\\Nitro.mdx", Unit, "origin");
        VisionShare();

        pacerTimer = timer.Create();
    }

    public static void StartNitroPacer()
    {
        ResetNitroPacer();
        Unit.UseItem(ghostBoots);
        pacerTimer.Start(0.15f, true, UpdateNitroPacer);
    }

    public static void ResetNitroPacer()
    {
        pacerTimer.Pause();
        Unit.IsPaused = false;
        Unit.SetPosition(SPAWN_RECT.CenterX, SPAWN_RECT.CenterY);
        currentCheckpoint = 0;
        currentDistance = 0;
    }

    private static void UpdateNitroPacer()
    {
        currentDistance = Progress.CalculateNitroPacerProgress();
        var remainingDistance = Progress.DistancesFromStart[RegionList.PathingPoints.Count() - 1] - currentDistance;
        var remainingTime = NitroChallenges.GetNitroTimeRemaining();
        var speed = 0.0f;
        if (remainingTime != 0.0f) speed = remainingDistance / remainingTime;
        else speed = 350.0f;

        SetSpeed(speed);

        if(currentCheckpoint == 0) MoveNextZone();
        if (PathingPoints[currentCheckpoint+1].Contains(Unit.X, Unit.Y))
        {
            currentCheckpoint++;
            if(currentCheckpoint >= PathingPoints.Count() - 1)
            {
                pacerTimer.Pause();
                Utility.SimpleTimer(2.0f, () => Unit.IsPaused = true); // this is actually ok since we reset pacer before starting it again
                return;
            }
            MoveNextZone();
        }
    }

    private static void MoveNextZone()
    {
        var nextZone = PathingPoints[currentCheckpoint+1];
        Unit.IssueOrder("move", nextZone.Center.X, nextZone.Center.Y);
    }

    private static void VisionShare()
    {
        foreach(var player in Globals.ALL_PLAYERS)
            player.NeutralPassive.SetAlliance(player, alliancetype.SharedVisionForced, true);
    }

    private static void SetSpeed(float speed) => Unit.BaseMovementSpeed = speed;
    public static int GetCurrentCheckpoint() => currentCheckpoint;
    

}