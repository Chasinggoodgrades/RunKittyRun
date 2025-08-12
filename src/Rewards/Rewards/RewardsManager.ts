/// <summary>
/// This class handles:
/// * Activation / Deactivation of Rewards (Based on Spell Cast Event)
/// * Any activated reward including the Reset ability so long as it's added within the RewardCreation class.
/// </summary>
export class RewardsManager {
    private static Trigger: trigger = CreateTrigger()
    private static RewardAbilities: number[] = []
    public static Rewards: Reward[] = []
    public static GameStatRewards: Reward[] = []

    public static Initialize() {
        RegisterTrigger()
        RewardCreation.SetupRewards()
        RewardAbilitiesList()
        AwardManager.RegisterGamestatEvents()
        ChampionAwards.AwardAllChampions()
    }

    private static RewardAbilitiesList() {
        for (let reward in Rewards) RewardAbilities.push(reward.AbilityID)
    }

    private static RegisterTrigger() {
        for (let player in Globals.ALL_PLAYERS) {
            Trigger.RegisterPlayerUnitEvent(player, playerunitevent.SpellCast, null)
        }
        Trigger.AddAction(CastedReward)
    }

    private static CastedReward() {
        let spellID = GetSpellAbilityId()
        let unit = GetTriggerUnit()
        if (IsResetSpell(spellID)) {
            ResetRewardSettings(unit)
            Globals.ALL_KITTIES[unit.Owner].KittyMorphosis.ScaleUnit() // changes scale of unit if they have amulet.
            return
        }
    }

    private static IsRewardAbility(spellID: number) {
        return RewardAbilities.includes(spellID)
    }

    private static IsResetSpell(spellID: number) {
        return spellID == Constants.ABILITY_RESET
    }

    private static ResetRewardSettings(Unit: Unit) {
        let player = Unit.Owner
        let kitty = Globals.ALL_KITTIES.get(player)
        let activeRewards = kitty.ActiveAwards

        let wings = activeRewards.ActiveWings
        GC.RemoveEffect(wings) // TODO; Cleanup:         GC.RemoveEffect(ref wings);

        let auras = activeRewards.ActiveAura
        GC.RemoveEffect(auras) // TODO; Cleanup:         GC.RemoveEffect(ref auras);

        let hats = activeRewards.ActiveHats
        GC.RemoveEffect(hats) // TODO; Cleanup:         GC.RemoveEffect(ref hats);

        let trails = activeRewards.ActiveTrail
        GC.RemoveEffect(trails) // TODO; Cleanup:         GC.RemoveEffect(ref trails);

        kitty.Unit.Skin = Constants.UNIT_KITTY
        kitty.Unit.SetVertexColor(255, 255, 255)

        for (let property in kitty.SaveData.SelectedData.GetType().GetProperties())
            property.SetValue(kitty.SaveData.SelectedData, '')

        if (kitty.SaveData.SelectedData.SelectedWindwalk == '') kitty.ActiveAwards.WindwalkID = 0
    }
}
