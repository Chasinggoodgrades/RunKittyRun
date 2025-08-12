export class FangOfShadows extends Relic {
    public RelicItemID: number = Constants.ITEM_FANG_OF_SHADOWS
    public RelicAbilityID: number = Constants.ABILITY_SUMMON_SHADOW_KITTY
    private TeleportAbilityID: number = Constants.ABILITY_APPEAR_AT_SHADOWKITTY
    private static IconPath: string = 'ReplaceableTextures\\CommandButtons\\BTNRingVioletSpider.blp'
    private SummonTrigger: trigger
    private TeleTrigger: trigger
    private KillTimer: timer
    private Owner: Unit
    private Active: boolean = false

    private RelicCost: number = 650
    private static SAFEZONE_REDUCTION: number = 0.25 // 25%
    private static UPGRADE_SAFEZONE_REDUCTION: number = 0.5 // 50%
    private static UPGRADE_COOLDOWN_REDUCTION: number = 30.0
    private static SHADOW_KITTY_SUMMON_DURATION: number = 75.0

    public constructor() {
        super(
            '{Colors.COLOR_PURPLE}Fang of Shadows',
            'Ability to summon a shadowy image for {Colors.COLOR_CYAN}{(int)SHADOW_KITTY_SUMMON_DURATION} seconds|r or until death. Teleport to the illusion at will.|r ' +
                '{Colors.COLOR_ORANGE}(Active)|r {Colors.COLOR_LIGHTBLUE}(3min) (Remaining cooldown reduced by 25% at safezones.)|r',
            RelicAbilityID,
            RelicItemID,
            RelicCost,
            IconPath
        )

        Upgrades.push(
            new RelicUpgrade(0, 'Overall cooldown is reduced by {UPGRADE_COOLDOWN_REDUCTION} seconds.', 15, 800)
        )
        Upgrades.push(
            new RelicUpgrade(1, 'Remaining cooldown reduced at new safezones is now 50% instead of 25%.', 20, 1000)
        )
    }

    public override ApplyEffect(Unit: Unit) {
        Owner = Unit
        this.RegisterTriggers(Unit)
        Unit.DisableAbility(RelicAbilityID, false, false)
        SetAbilityCooldown(Unit)
    }

    public override RemoveEffect(Unit: Unit) {
        Dethis.RegisterTriggers()
        Unit.DisableAbility(RelicAbilityID, false, true)
    }

    private RegisterTriggers(Unit: Unit) {
        let SummonTrigger = CreateTrigger()
        TriggerRegisterUnitEvent(SummonTrigger, Unit, unitevent.SpellCast)
        SummonTrigger.AddCondition(Condition(() => GetSpellAbilityId() == RelicAbilityID))
        SummonTrigger.AddAction(ErrorHandler.Wrap(SummonShadowKitty))

        let TeleTrigger = CreateTrigger()
        KillTimer = Timer.create()
    }

    private DeregisterTriggers() {
        GC.RemoveTrigger(SummonTrigger) // TODO; Cleanup:         GC.RemoveTrigger(ref SummonTrigger);
        GC.RemoveTrigger(TeleTrigger) // TODO; Cleanup:         GC.RemoveTrigger(ref TeleTrigger);
        GC.RemoveTimer(KillTimer) // TODO; Cleanup:         GC.RemoveTimer(ref KillTimer);
    }

    private SummonShadowKitty() {
        try {
            let summoner: Kitty = Globals.ALL_KITTIES[GetTriggerUnit().Owner]

            // Prevent summoning if holding the orb
            if (TeamDeathless.CurrentHolder == summoner) {
                summoner.Player.DisplayTimedTextTo(
                    3.0,
                    '{Colors.COLOR_RED}summon: shadow: kitty: while: holding: the: orb: Cannot!{Colors.COLOR_RESET}'
                )
                return
            }

            let shadowKitty: ShadowKitty = ShadowKitty.ALL_SHADOWKITTIES[GetTriggerUnit().Owner]

            // Summon and configure Shadow Kitty
            shadowKitty.SummonShadowKitty()
            RegisterTeleportAbility(shadowKitty.Unit)
            shadowKitty.Unit.ApplyTimedLife(FourCC('BTLF'), SHADOW_KITTY_SUMMON_DURATION)

            // Set kill timer
            KillTimer.start(SHADOW_KITTY_SUMMON_DURATION, false, ErrorHandler.Wrap(shadowKitty.KillShadowKitty))

            // Apply relic cooldowns with a slight delay
            Utility.SimpleTimer(0.1, () => RelicUtil.SetRelicCooldowns(Owner, RelicItemID, RelicAbilityID))
        } catch (e) {
            Logger.Warning('Error in SummonShadowKitty: {e}')
        }
    }

    private TeleportToShadowKitty() {
        try {
            let sk = ShadowKitty.ALL_SHADOWKITTIES[GetTriggerUnit().Owner]
            sk.TeleportToShadowKitty()
            Utility.DropAllItems(GetTriggerUnit())
            Utility.SimpleTimer(0.09, sk.KillShadowKitty)
            KillTimer.pause()
        } catch (e) {
            Logger.Warning('Error in FangOfShadows.TeleportToShadowKitty: {e}')
            return
        }
    }

    private RegisterTeleportAbility(Unit: Unit) {
        TriggerRegisterUnitEvent(TeleTrigger, Unit, unitevent.SpellCast)
        TeleTrigger.AddCondition(Condition(() => GetSpellAbilityId() == TeleportAbilityID))
        TeleTrigger.AddAction(TeleportToShadowKitty)
    }

    /// <summary>
    /// Upgrade Level 1 Cooldown Reduction
    /// </summary>
    /// <param name="Unit"></param>
    private SetAbilityCooldown(Unit: Unit) {
        let upgradeLevel = PlayerUpgrades.GetPlayerUpgrades(Unit.Owner).GetUpgradeLevel(GetType())
        let currentCooldown = BlzGetAbilityCooldown(RelicAbilityID, 0)
        let newCooldown = upgradeLevel >= 1 ? currentCooldown - UPGRADE_COOLDOWN_REDUCTION : currentCooldown

        //let ability = Unit.GetAbility(RelicAbilityID);
        RelicUtil.SetAbilityCooldown(Unit, RelicItemID, RelicAbilityID, newCooldown)
    }

    public ReduceCooldownAtSafezone(Unit: Unit) {
        // Have relic
        if (!Utility.UnitHasItem(Unit, RelicItemID)) return
        let upgradeLevel: number = PlayerUpgrades.GetPlayerUpgrades(Unit.Owner).GetUpgradeLevel(typeof FangOfShadows)
        Unit.GetAbility(RelicAbilityID)
        let reduction: number = upgradeLevel >= 2 ? UPGRADE_SAFEZONE_REDUCTION : SAFEZONE_REDUCTION
        let remainingCooldown: number = Unit.GetAbilityCooldownRemaining(RelicAbilityID)
        if (remainingCooldown <= 0) return
        let newCooldown: number = remainingCooldown * (1.0 - reduction)
        //Unit.SetAbilityCooldownRemaining(RelicAbilityID, newCooldown);
        RelicUtil.SetRelicCooldowns(Unit, RelicItemID, RelicAbilityID, newCooldown)
    }
}
