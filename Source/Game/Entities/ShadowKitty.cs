using System.Collections.Generic;
using WCSharp.Api;

public class ShadowKitty
{
    public static Dictionary<player, ShadowKitty> ALL_SHADOWKITTIES;
    public unit Unit { get; set; }

    public player Player { get; }

    public Kitty Kitty { get; set; }

    public bool Active { get; set; }

    public trigger wCollision { get; set; }

    public trigger cCollision { get; set; }

    public int ID;


    public ShadowKitty(player Player)
    {
        this.Player = Player;
        ID = Player.Id;
        Kitty = Globals.ALL_KITTIES[Player];
        this.RegisterTriggers();
    }

    public static void Initialize()
    {
        ALL_SHADOWKITTIES = new Dictionary<player, ShadowKitty>();
        CreateShadowKitties();
    }

    /// <summary>
    /// Summons shadow kitty to the position of this player's kitty object.
    /// </summary>
    public void SummonShadowKitty()
    {
        var kitty = Globals.ALL_KITTIES[Player].Unit;
        this.Unit = unit.Create(Player, Constants.UNIT_SHADOWKITTY_RELIC_SUMMON, kitty.X, kitty.Y);
        this.Unit.SetVertexColor(0, 0, 0, 255);

        // Unit.AddAbility(Constants.ABILITY_APPEAR_AT_SHADOWKITTY);
        Unit.AddAbility(Constants.ABILITY_WIND_WALK);
        Unit.SetAbilityLevel(Constants.ABILITY_WIND_WALK, 3);
        Utility.MakeUnitLocust(this.Unit);
        CollisionDetection.ShadowKittyRegisterCollision(this);
        this.Unit.MovementSpeed = 522;
        RelicUtil.CloseRelicBook(kitty);
        PauseKitty(this.Player, true);
        Utility.SelectUnitForPlayer(this.Player, this.Unit);
        this.Active = true;
    }

    /// <summary>
    /// Teleports the player's kitty to the shadow kitty's position.
    /// </summary>
    public void TeleportToShadowKitty()
    {
        var kitty = Globals.ALL_KITTIES[Player].Unit;
        kitty.SetPosition(Unit.X, Unit.Y);
    }

    /// <summary>
    /// Kills this shadow kitty object, disposing and deregistering it from collision.
    /// </summary>
    public void KillShadowKitty()
    {
        try
        {
            UnitWithinRange.DeRegisterUnitWithinRangeUnit(this);
            this.Unit.Kill();
            this.Unit.Dispose();
            this.Unit = null;
            this.Active = false;
            PauseKitty(this.Player, false);
        }
        catch (System.Exception e)
        {
            Logger.Warning($"ShadowKitty.KillShadowKitty: {e.Message}");
            throw;
        }
    }

    /// <summary>
    /// The game doesnt register the the abilities or movement, so a reselection is required.
    /// </summary>
    /// <param name="player"></param>
    public void SelectReselectShadowKitty()
    {
        var kitty = Globals.ALL_KITTIES[this.Player].Unit;
        Utility.SelectUnitForPlayer(this.Player, this.Unit);
    }

    private static void PauseKitty(player player, bool paused)
    {
        var kitty = Globals.ALL_KITTIES[player].Unit;
        kitty.IsPaused = paused;
    }

    private static void CreateShadowKitties()
    {
        foreach (var player in Globals.ALL_PLAYERS)
        {
            var shadowKitty = new ShadowKitty(player);
            ALL_SHADOWKITTIES.Add(player, shadowKitty);
        }
    }

    private void RegisterTriggers()
    {
        this.wCollision = trigger.Create();
        this.cCollision = trigger.Create();
    }
}
