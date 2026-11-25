using System;
using System.Collections.Generic;
using WCSharp.Api;
using static WCSharp.Api.Common;

public class ChainRing : Relic
{
    public const int RelicItemID = Constants.ITEM_CHAIN_RING;
    public new static int RelicAbilityID = Constants.ABILITY_CHAIN_RING_TOGGLE;
    private const int RelicCost = 50;
    private const float CHAIN_RING_RANGE = 600.0f;
    private const float TOGGLE_COOLDOWN = 1.0f;
    private new static string IconPath = "war3mapImported\\BTNChainedRing.blp";
    private static readonly List<ChainRing> ActiveRings = new List<ChainRing>();
    private static readonly List<Kitty> NearbyBuffer = new List<Kitty>();

    private trigger Trigger;
    private Kitty Owner;
    private bool Enabled;

    public ChainRing() : base(
        $"{Colors.COLOR_PURPLE}Ring of Linked Fates|r",
        $"Toggle on to chain yourself to every kitty with an enabled ring within {Colors.COLOR_ORANGE}{(int)CHAIN_RING_RANGE} range|r, and through them to others in range of those kitties. " +
        $"{Colors.COLOR_ORANGE}(Toggle)|r {Colors.COLOR_LIGHTBLUE}(Does not count towards the relic limit)|r",
        RelicAbilityID,
        RelicItemID,
        RelicCost,
        IconPath
        )
    {
        CountsTowardLimit = false;
    }

    public override void ApplyEffect(unit Unit)
    {
        Owner = Globals.ALL_KITTIES[Unit.Owner];
        Unit.DisableAbility(RelicAbilityID, false, false);
        Utility.SimpleTimer(0.1f, () => RelicUtil.SetAbilityCooldown(Unit, RelicItemID, RelicAbilityID, TOGGLE_COOLDOWN));
        Trigger = trigger.Create();
        Trigger.RegisterUnitEvent(Unit, unitevent.SpellEffect);
        Trigger.AddCondition(Condition(() => @event.SpellAbilityId == RelicAbilityID));
        Trigger.AddAction(ErrorHandler.Wrap(Toggle));
    }

    public override void RemoveEffect(unit Unit)
    {
        Disable();
        GC.RemoveTrigger(ref Trigger);
        Unit.DisableAbility(RelicAbilityID, false, true);
        Owner = null;
    }

    /// <summary>
    /// Called at round end, when all chains are disposed.
    /// </summary>
    public static void ResetAll()
    {
        for (int i = 0; i < ActiveRings.Count; i++) ActiveRings[i].Enabled = false;
        ActiveRings.Clear();
    }

    private void Toggle()
    {
        RelicUtil.CloseRelicBook(Owner.Player);
        var unit = Owner.Unit;
        Utility.SimpleTimer(0.1f, () => RelicUtil.SetRelicCooldowns(unit, RelicItemID, RelicAbilityID, TOGGLE_COOLDOWN));
        if (Enabled)
        {
            Disable();
            Owner.Player.DisplayTimedTextTo(4.0f, $"{Colors.COLOR_YELLOW}Chain ring disabled.{Colors.COLOR_RESET}");
            return;
        }

        if (!Owner.Alive) return;

        if (ChainedTogether.IsEventChained(Owner))
        {
            Owner.Player.DisplayTimedTextTo(4.0f, $"{Colors.COLOR_YELLOW}You are already chained.{Colors.COLOR_RESET}");
            return;
        }

        Enabled = true;
        ActiveRings.Add(this);

        NearbyBuffer.Clear();
        for (int i = 0; i < ActiveRings.Count; i++)
        {
            var other = ActiveRings[i].Owner;
            if (other == null || other == Owner || !other.Alive) continue;
            NearbyBuffer.Add(other);
        }

        var linked = ChainedTogether.JoinRingChain(Owner, NearbyBuffer, CHAIN_RING_RANGE);
        NearbyBuffer.Clear();
        Owner.Player.DisplayTimedTextTo(4.0f, linked > 0
            ? $"{Colors.COLOR_GREEN}Chain ring enabled. Chained together with {linked} other kitt{(linked == 1 ? "y" : "ies")}.{Colors.COLOR_RESET}"
            : $"{Colors.COLOR_YELLOW}Chain ring enabled. No enabled rings in range.{Colors.COLOR_RESET}");
    }
    private void Disable()
    {
        if (!Enabled) return;
        Enabled = false;
        ActiveRings.Remove(this);
        if (Owner != null) ChainedTogether.LeaveRingChain(Owner);
    }
}
