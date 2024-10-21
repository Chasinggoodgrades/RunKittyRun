using static WCSharp.Api.Common;
using WCSharp.Api;
using System.Collections.Generic;
using System;
public class ShadowKitty
{
    public unit Unit { get; set; }
    public player Player { get; }
    public int ID;
    public trigger w_Collision;
    public trigger c_Collision;
    public static Dictionary<player, ShadowKitty> ALL_SHADOWKITTIES;

    public ShadowKitty(player Player)
    {
        this.Player = Player;
        ID = Player.Id;
        RegisterTriggers();
    }

    public static void Initialize()
    {
        if (Gamemode.CurrentGameMode != "Standard") return;
        ALL_SHADOWKITTIES = new Dictionary<player, ShadowKitty>();
        CreateShadowKitties();
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
        w_Collision = CreateTrigger();
        c_Collision = CreateTrigger();
    }

    /// <summary>
    /// Summons shadow kitty to the position of this player's kitty object.
    /// </summary>
    public void SummonShadowKitty()
    {
        try
        {
            var kitty = Globals.ALL_KITTIES[Player].Unit;
            Unit = unit.Create(Player, Constants.UNIT_SHADOWKITTY_RELIC_SUMMON, kitty.X, kitty.Y);
            Unit.SetVertexColor(0, 0, 0, 255);
            Utility.MakeUnitLocust(Unit);
            Utility.SelectUnitForPlayer(Player, Unit);
            CollisionDetection.ShadowKittyRegisterCollision(this);
            Unit.BaseMovementSpeed = 522;
            Unit.AddAbility(Constants.ABILITY_APPEAR_AT_SHADOWKITTY);
        }
        catch (Exception e)
        {
            Console.WriteLine(e.Message);
        }
    }

    /// <summary>
    /// Kills this shadow kitty object, disposing and deregistering it from collision.
    /// </summary>
    public void KillShadowKitty()
    {
        if(Unit == null) return;
        UnitWithinRange.DeRegisterUnitWithinRangeUnit(Unit);
        Unit.Kill();
        Unit.Dispose();
        Unit = null;
    }


}