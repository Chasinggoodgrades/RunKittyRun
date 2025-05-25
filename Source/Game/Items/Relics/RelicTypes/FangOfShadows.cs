using System;
using WCSharp.Api;
using static WCSharp.Api.Common;

public class FangOfShadows : Relic
{
    public const int RelicItemID = Constants.ITEM_FANG_OF_SHADOWS;
    public new const int RelicAbilityID = Constants.ABILITY_SUMMON_SHADOW_KITTY;
    private const int TeleportAbilityID = Constants.ABILITY_APPEAR_AT_SHADOWKITTY;
    private new static string IconPath = "ReplaceableTextures\\CommandButtons\\BTNRingVioletSpider.blp";
    private trigger SummonTrigger;
    private trigger TeleTrigger;
    private timer KillTimer;
    private unit Owner;
    private bool Active = false;

    private const int RelicCost = 650;
    private static float SAFEZONE_REDUCTION = 0.25f; // 25%
    private static float UPGRADE_SAFEZONE_REDUCTION = 0.50f; // 50%
    private static float UPGRADE_COOLDOWN_REDUCTION = 30.0f;
    private static float SHADOW_KITTY_SUMMON_DURATION = 75.0f;

    public FangOfShadows() : base(
        $"{Colors.COLOR_PURPLE}Fang of Shadows",
        $"Ability to summon a shadowy image for {Colors.COLOR_CYAN}{(int)SHADOW_KITTY_SUMMON_DURATION} seconds|r or until death. Teleport to the illusion at will.|r " +
        $"{Colors.COLOR_ORANGE}(Active)|r {Colors.COLOR_LIGHTBLUE}(3min) (Remaining cooldown reduced by 25% at safezones.)|r",
        RelicAbilityID,
        RelicItemID,
        RelicCost,
        IconPath
        )
    {
        Upgrades.Add(new RelicUpgrade(0, $"Overall cooldown is reduced by {UPGRADE_COOLDOWN_REDUCTION} seconds.", 15, 800));
        Upgrades.Add(new RelicUpgrade(1, $"Remaining cooldown reduced at new safezones is now 50% instead of 25%.", 20, 1000));
    }

    public override void ApplyEffect(unit Unit)
    {
        Owner = Unit;
        RegisterTriggers(Unit);
        Unit.DisableAbility(RelicAbilityID, false, false);
        SetAbilityCooldown(Unit);
    }

    public override void RemoveEffect(unit Unit)
    {
        DeregisterTriggers();
        Unit.DisableAbility(RelicAbilityID, false, true);
    }

    private void RegisterTriggers(unit Unit)
    {
        SummonTrigger = trigger.Create();
        SummonTrigger.RegisterUnitEvent(Unit, unitevent.SpellCast);
        SummonTrigger.AddCondition(Condition(() => @event.SpellAbilityId == RelicAbilityID));
        SummonTrigger.AddAction(ErrorHandler.Wrap(SummonShadowKitty));

        TeleTrigger = trigger.Create();
        KillTimer = timer.Create();
    }

    private void DeregisterTriggers()
    {
        GC.RemoveTrigger(ref SummonTrigger);
        GC.RemoveTrigger(ref TeleTrigger);
        GC.RemoveTimer(ref KillTimer);
    }

    private void SummonShadowKitty()
    {
        try
        {
            Kitty summoner = Globals.ALL_KITTIES[@event.Unit.Owner];

            // Prevent summoning if holding the orb
            if (TeamDeathless.CurrentHolder == summoner)
            {
                summoner.Player.DisplayTimedTextTo(3.0f, $"{Colors.COLOR_RED}Cannot summon shadow kitty while holding the orb!{Colors.COLOR_RESET}");
                return;
            }

            ShadowKitty shadowKitty = ShadowKitty.ALL_SHADOWKITTIES[@event.Unit.Owner];

            // Summon and configure Shadow Kitty
            shadowKitty.SummonShadowKitty();
            RegisterTeleportAbility(shadowKitty.Unit);
            shadowKitty.Unit.ApplyTimedLife(FourCC("BTLF"), SHADOW_KITTY_SUMMON_DURATION);

            // Set kill timer
            KillTimer.Start(SHADOW_KITTY_SUMMON_DURATION, false, ErrorHandler.Wrap(shadowKitty.KillShadowKitty));

            // Apply relic cooldowns with a slight delay
            Utility.SimpleTimer(0.1f, () => RelicUtil.SetRelicCooldowns(Owner, RelicItemID, RelicAbilityID));
        }
        catch (Exception e)
        {
            Logger.Warning($"Error in SummonShadowKitty: {e}");
        }
    }

    private void TeleportToShadowKitty()
    {
        try
        {
            var sk = ShadowKitty.ALL_SHADOWKITTIES[@event.Unit.Owner];
            sk.TeleportToShadowKitty();
            Utility.DropAllItems(@event.Unit);
            Utility.SimpleTimer(0.09f, sk.KillShadowKitty);
            KillTimer.Pause();
        }
        catch (System.Exception e)
        {
            Logger.Warning($"Error in FangOfShadows.TeleportToShadowKitty: {e}");
            return;
        }
    }

    private void RegisterTeleportAbility(unit Unit)
    {
        TeleTrigger.RegisterUnitEvent(Unit, unitevent.SpellCast);
        TeleTrigger.AddCondition(Condition(() => @event.SpellAbilityId == TeleportAbilityID));
        TeleTrigger.AddAction(TeleportToShadowKitty);
    }

    /// <summary>
    /// Upgrade Level 1 Cooldown Reduction
    /// </summary>
    /// <param name="Unit"></param>
    private void SetAbilityCooldown(unit Unit)
    {
        var upgradeLevel = PlayerUpgrades.GetPlayerUpgrades(Unit.Owner).GetUpgradeLevel(GetType());
        var currentCooldown = BlzGetAbilityCooldown(RelicAbilityID, 0);
        var newCooldown = upgradeLevel >= 1
            ? currentCooldown - UPGRADE_COOLDOWN_REDUCTION
            : currentCooldown;

        //var ability = Unit.GetAbility(RelicAbilityID);
        RelicUtil.SetAbilityCooldown(Unit, RelicItemID, RelicAbilityID, newCooldown);
    }

    public void ReduceCooldownAtSafezone(unit Unit)
    {
        // Have relic
        if (!Utility.UnitHasItem(Unit, RelicItemID)) return;
        int upgradeLevel = PlayerUpgrades.GetPlayerUpgrades(Unit.Owner).GetUpgradeLevel(typeof(FangOfShadows));
        Unit.GetAbility(RelicAbilityID);
        float reduction = upgradeLevel >= 2 ? UPGRADE_SAFEZONE_REDUCTION : SAFEZONE_REDUCTION;
        float remainingCooldown = Unit.GetAbilityCooldownRemaining(RelicAbilityID);
        if (remainingCooldown <= 0) return;
        float newCooldown = remainingCooldown * (1.00f - reduction);
        //Unit.SetAbilityCooldownRemaining(RelicAbilityID, newCooldown);
        RelicUtil.SetRelicCooldowns(Unit, RelicItemID, RelicAbilityID, newCooldown);
    }
}
