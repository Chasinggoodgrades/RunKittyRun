using System;
using System.Collections.Generic;
using WCSharp.Api;
using static WCSharp.Api.Common;

public class EngagementRing : MiscItem
{
    public const int RelicItemID = Constants.ITEM_ENGAGEMENT_RING;
    public static int RelicAbilityID = Constants.ABILITY_ENGAGEMENT_RING_PROPOSE;
    private const int RelicCost = 50;
    private const float PROPOSAL_WINDOW = 5.0f;
    private const float PRESS_COOLDOWN = 1.0f;
    private const float NEARBY_RANGE = 600.0f;
    private const float REMINDER_INTERVAL = 20.0f;
    private const int INITIAL_HEART_PULSES = 10;
    private const float INITIAL_HEART_PULSE_INTERVAL = 0.3f;
    private const float HEART_LIFETIME = 1.5f;
    private const string HEART_EFFECT = "ZHeart.MDX";
    private new static string IconPath = "war3mapImported\\BTNEngagementRing.blp";
    private static readonly List<EngagementRing> ActiveRings = new List<EngagementRing>();
    private static timer ReminderTimer;
    private static readonly Action ReminderAction = ErrorHandler.Wrap(ShowReminders);

    private trigger Trigger;
    private Kitty Owner;
    private EngagementRing Spouse;
    private bool Proposing;
    private int ProposalToken;

    public EngagementRing() : base(
        $"{Colors.COLOR_PINK}Engagement Ring|r",
        $"Press at the same time as another kitty with an Engagement Ring (within {Colors.COLOR_ORANGE}{(int)PROPOSAL_WINDOW} seconds|r) to marry the nearest one. Married kitties shower each other in hearts. " +
        $"{Colors.COLOR_ORANGE}(Active)|r",
        RelicAbilityID,
        RelicItemID,
        RelicCost,
        IconPath
        )
    {
    }

    public override void ApplyEffect(unit Unit)
    {
        Owner = Globals.ALL_KITTIES[Unit.Owner];
        ActiveRings.Add(this);
        Unit.DisableAbility(RelicAbilityID, false, false);
        Utility.SimpleTimer(0.1f, () => RelicUtil.SetAbilityCooldown(Unit, RelicItemID, RelicAbilityID, PRESS_COOLDOWN));
        Trigger = trigger.Create();
        Trigger.RegisterUnitEvent(Unit, unitevent.SpellEffect);
        Trigger.AddCondition(Condition(() => @event.SpellAbilityId == RelicAbilityID));
        Trigger.AddAction(ErrorHandler.Wrap(Propose));
    }

    public override void RemoveEffect(unit Unit)
    {
        ProposalToken++;
        Proposing = false;
        if (Spouse != null)
        {
            Spouse.Spouse = null;
            Spouse = null;
        }
        ActiveRings.Remove(this);
        GC.RemoveTrigger(ref Trigger);
        Unit.DisableAbility(RelicAbilityID, false, true);
        Owner = null;
    }

    private void Propose()
    {
        RelicUtil.CloseRelicBook(Owner.Player);
        var unit = Owner.Unit;
        Utility.SimpleTimer(0.1f, () => RelicUtil.SetRelicCooldowns(unit, RelicItemID, RelicAbilityID, PRESS_COOLDOWN));
        if (!Owner.Alive) return;

        if (Spouse != null)
        {
            Owner.Player.DisplayTimedTextTo(4.0f, $"{Colors.COLOR_PINK}You are already married to {Spouse.Owner.Name}.{Colors.COLOR_RESET}");
            return;
        }

        var partner = FindNearestProposer();
        if (partner != null)
        {
            Marry(partner);
            return;
        }

        Proposing = true;
        var token = ++ProposalToken;
        Owner.Player.DisplayTimedTextTo(4.0f, $"{Colors.COLOR_PINK}You are proposing... another kitty must press their Engagement Ring within {(int)PROPOSAL_WINDOW} seconds.{Colors.COLOR_RESET}");
        Utility.SimpleTimer(PROPOSAL_WINDOW, () =>
        {
            if (token != ProposalToken || !Proposing) return;
            Proposing = false;
        });
    }
    private EngagementRing FindNearestProposer()
    {
        EngagementRing nearest = null;
        float nearestSq = float.MaxValue;
        for (int i = 0; i < ActiveRings.Count; i++)
        {
            var other = ActiveRings[i];
            if (other == this || !other.Proposing || other.Spouse != null) continue;
            if (other.Owner == null || !other.Owner.Alive) continue;
            float dSq = DistanceSq(Owner, other.Owner);
            if (dSq >= nearestSq) continue;
            nearestSq = dSq;
            nearest = other;
        }
        return nearest;
    }

    private void Marry(EngagementRing partner)
    {
        Spouse = partner;
        partner.Spouse = this;
        Proposing = false;
        partner.Proposing = false;
        ProposalToken++;
        partner.ProposalToken++;

        var message = $"{Colors.COLOR_PINK}{Owner.Name} and {partner.Owner.Name} are now married!{Colors.COLOR_RESET}";
        Owner.Player.DisplayTimedTextTo(6.0f, message);
        partner.Owner.Player.DisplayTimedTextTo(6.0f, message);

        var a = Owner;
        var b = partner.Owner;
        for (int i = 0; i < INITIAL_HEART_PULSES; i++)
            Utility.SimpleTimer(i * INITIAL_HEART_PULSE_INTERVAL + 0.01f, () => ShowHearts(a, b));

        ReminderTimer ??= timer.Create();
        ReminderTimer.Start(REMINDER_INTERVAL, true, ReminderAction);
    }

    // Each couple is handled once, by the ring that comes first in the list.
    private static void ShowReminders()
    {
        bool anyMarried = false;
        for (int i = 0; i < ActiveRings.Count; i++)
        {
            var ring = ActiveRings[i];
            if (ring.Spouse == null) continue;
            anyMarried = true;
            if (ActiveRings.IndexOf(ring.Spouse) < i) continue;
            var a = ring.Owner;
            var b = ring.Spouse.Owner;
            if (a == null || b == null || !a.Alive || !b.Alive) continue;
            if (DistanceSq(a, b) > NEARBY_RANGE * NEARBY_RANGE) continue;
            ShowHearts(a, b);
        }

        if (anyMarried) return;
        ReminderTimer?.Pause();
    }

    private static void ShowHearts(Kitty a, Kitty b)
    {
        if (a.Alive) SpawnHeart(a);
        if (b.Alive) SpawnHeart(b);
    }

    private static void SpawnHeart(Kitty kitty)
    {
        var heart = kitty.AddKittyEffect(HEART_EFFECT, "overhead");
        Utility.SimpleTimer(HEART_LIFETIME, () => kitty.RemoveKittyEffect(heart));
    }

    private static float DistanceSq(Kitty a, Kitty b)
    {
        float dx = a.Unit.X - b.Unit.X;
        float dy = a.Unit.Y - b.Unit.Y;
        return dx * dx + dy * dy;
    }
}
