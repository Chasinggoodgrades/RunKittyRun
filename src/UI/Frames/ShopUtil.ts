import { PlayerUpgrades } from 'src/Game/Items/Relics/PlayerUpgrades'
import { Relic } from 'src/Game/Items/Relics/Relic'
import { Globals } from 'src/Global/Globals'
import { RegionList } from 'src/Global/RegionList'
import { Colors } from 'src/Utility/Colors/Colors'
import { getTriggerPlayer } from 'src/Utility/w3tsUtils'
import { MapPlayer } from 'w3ts'

export class ShopUtil {
    public static IsPlayerInWolfLane = (player: MapPlayer) => {
        const kitty = Globals.ALL_KITTIES.get(player)!
        const currentZone = kitty.ProgressZone
        const region = RegionList.WolfRegions[currentZone]
        if (region.includes(kitty.Unit.x, kitty.Unit.y) && kitty.isAlive()) {
            player.DisplayTimedTextTo(1.0, `${Colors.COLOR_RED}Shops are inactive in wolf lanes.${Colors.COLOR_RESET}`)
            return true
        }
        return false
    }

    /// <summary>
    /// Returns true if the player is dead, false otherwise.
    /// </summary>
    /// <param name="player"></param>
    /// <returns></returns>
    public static PlayerIsDead = (player: MapPlayer) => {
        const kitty = Globals.ALL_KITTIES.get(player)!
        if (kitty === null || !kitty.isAlive() || kitty.ProtectionActive) {
            // not null, cannot be alive, and pota active
            player.DisplayTimedTextTo(
                1.0,
                `${Colors.COLOR_RED}Cannot buy shop items while you are dead! :(${Colors.COLOR_RESET}`
            )
            return true
        }
        return false
    }
}

export function RefreshUpgradeTooltip(relic: Relic) {
    const finalString: string[] = []
    const playersUpgradeLevel = PlayerUpgrades.GetPlayerUpgrades(getTriggerPlayer()).GetUpgradeLevel(
        relic.constructor.name
    )

    for (let i = 0; i < relic.Upgrades.length; i++) {
        const upgrade = relic.Upgrades[i]
        let color: string, colorDescription

        if (i < playersUpgradeLevel - 1) {
            color = Colors.COLOR_GREY // Grey out past upgrades
            colorDescription = Colors.COLOR_GREY
        } else if (i === playersUpgradeLevel - 1) {
            color = Colors.COLOR_GREY // INCASE WE WANT TO CHANGE THE COLOR OF THE CURRENT UPGRADE OR ADD DETAILS
            colorDescription = Colors.COLOR_GREY
        } else if (i === playersUpgradeLevel) {
            color = Colors.COLOR_YELLOW // Yellow for the next available upgrade
            colorDescription = Colors.COLOR_YELLOW_ORANGE
        } else {
            color = Colors.COLOR_GREY // Grey for upgrades past next available upgrade.
            colorDescription = Colors.COLOR_GREY
        }

        finalString.push(`${color}[Upgrade ${i + 1}] ${upgrade.Cost}g${Colors.COLOR_RESET}`)
        finalString.push(`${colorDescription}${upgrade.Description}${Colors.COLOR_RESET}`)
        finalString.push('----------------------------')
    }

    Globals.upgradeTooltip.text = finalString.join('\n')
}
