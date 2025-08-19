import { Logger } from 'src/Events/Logger/Logger'
import { ProtectionOfAncients } from 'src/Game/ProtectionOfAncients'
import { Colors } from 'src/Utility/Colors/Colors'
import { Utility } from 'src/Utility/Utility'
import { getTriggerUnit } from 'src/Utility/w3tsUtils'
import { MapPlayer, Trigger, Unit } from 'w3ts'
import { PlayerUpgrades } from './PlayerUpgrades'
import { RelicUpgrade } from './RelicUpgrade'
import { RelicUtil } from './RelicUtil'

export abstract class Relic {
    private static CanBuyRelicsTrigger: Trigger
    private static CanBuyRelics: MapPlayer[]

    public static RequiredLevel = 12
    public static RelicIncrease = 16
    public static RelicSellLevel = 15
    public static MaxRelics = 2
    public name: string
    public Description: string
    public ItemID = 0
    public Cost = 0
    public IconPath: string
    public UpgradeLevel = 0
    public RelicAbilityID = 0
    public Upgrades: RelicUpgrade[] = []

    public constructor(
        name: string,
        desc: string,
        relicAbilityID: number,
        itemID: number,
        cost: number,
        iconPath: string
    ) {
        this.name = name
        this.Description = desc
        this.RelicAbilityID = relicAbilityID
        this.ItemID = itemID
        this.Cost = cost
        this.IconPath = iconPath
    }

    public abstract ApplyEffect(Unit: Unit): void

    public abstract RemoveEffect(Unit: Unit): void

    public GetCurrentUpgrade(): RelicUpgrade {
        if (this.Upgrades === null || this.Upgrades.length === 0) return null as never
        if (this.UpgradeLevel >= this.Upgrades.length) return this.Upgrades[this.Upgrades.length - 1]
        return this.Upgrades[this.UpgradeLevel]
    }

    public CanUpgrade(player: MapPlayer) {
        return PlayerUpgrades.GetPlayerUpgrades(player).GetUpgradeLevel(this.constructor.name) < this.Upgrades.length
    }

    public Upgrade(Unit: Unit) {
        if (!this.CanUpgrade(Unit.owner)) return false
        this.UpgradeLevel = this.UpgradeLevel + 1
        PlayerUpgrades.IncreaseUpgradeLevel(this.constructor.name, Unit)
        this.SetUpgradeLevelDesc(Unit)
        this.RemoveEffect(Unit)
        this.ApplyEffect(Unit)
        return true
    }

    public static GetRelicCountForLevel(currentLevel: number) {
        const count = currentLevel - Relic.RelicIncrease + 1 // account for level 10 relic ..
        return count < 0 ? 0 : count >= Relic.MaxRelics ? Relic.MaxRelics : count
    }

    public SetUpgradeLevelDesc(Unit: Unit) {
        const upgradeLevel = PlayerUpgrades.GetPlayerUpgrades(Unit.owner).GetUpgradeLevel(this.constructor.name)
        if (upgradeLevel === 0) return

        const item = Utility.UnitGetItem(Unit, this.ItemID)
        if (!item) return

        let tempName = item.name
        const newUpgradeText = `${Colors.COLOR_TURQUOISE}[Upgrade: ${upgradeLevel}]${Colors.COLOR_RESET}`

        if (tempName.startsWith(`${Colors.COLOR_TURQUOISE}[Upgrade:`)) {
            const endIndex = tempName.indexOf(']|r') + 3
            tempName = tempName.substring(endIndex).trim()
        }

        item.name = `${newUpgradeText} ${tempName}`
    }

    public static RegisterRelicEnabler = () => {
        // Ability to Purchase Relics
        PlayerUpgrades.Initialize()
        Relic.CanBuyRelicsTrigger ??= Trigger.create()!
        Relic.CanBuyRelics ??= []
        Relic.CanBuyRelicsTrigger.registerAnyUnitEvent(EVENT_PLAYER_HERO_LEVEL)
        Relic.CanBuyRelicsTrigger.addAction(() => {
            try {
                if (Relic.CanBuyRelics.includes(getTriggerUnit().owner)) return
                if (getTriggerUnit().getHeroLevel() < Relic.RequiredLevel) return
                Relic.CanBuyRelics.push(getTriggerUnit().owner)
                RelicUtil.EnableRelicBook(getTriggerUnit())
                RelicUtil.DisableRelicAbilities(getTriggerUnit())
                ProtectionOfAncients.SetProtectionOfAncientsLevel(getTriggerUnit())
                getTriggerUnit()
                    .getOwner()!
                    .DisplayTimedTextTo(
                        4.0,
                        `${Colors.COLOR_TURQUOISE}You may now buy relics from the shop!${Colors.COLOR_RESET}`
                    )
            } catch (e) {
                Logger.Warning(`Error in RegisterLevelTenTrigger: ${e}`)
            }
        })
    }
}
