import { Logger } from 'src/Events/Logger/Logger'
import { Globals } from 'src/Global/Globals'
import { Auras } from 'src/SaveSystem2.0/MAKE REWARDS HERE/SaveObjects/RewardObjects/Auras'
import { Deathless } from 'src/SaveSystem2.0/MAKE REWARDS HERE/SaveObjects/RewardObjects/Deathless'
import { Hats } from 'src/SaveSystem2.0/MAKE REWARDS HERE/SaveObjects/RewardObjects/Hats'
import { Nitros } from 'src/SaveSystem2.0/MAKE REWARDS HERE/SaveObjects/RewardObjects/Nitros'
import { Skins } from 'src/SaveSystem2.0/MAKE REWARDS HERE/SaveObjects/RewardObjects/Skins'
import { Tournament } from 'src/SaveSystem2.0/MAKE REWARDS HERE/SaveObjects/RewardObjects/Tournament'
import { Trails } from 'src/SaveSystem2.0/MAKE REWARDS HERE/SaveObjects/RewardObjects/Trails'
import { Windwalks } from 'src/SaveSystem2.0/MAKE REWARDS HERE/SaveObjects/RewardObjects/Windwalks'
import { Wings } from 'src/SaveSystem2.0/MAKE REWARDS HERE/SaveObjects/RewardObjects/Wings'
import { Colors } from 'src/Utility/Colors/Colors'
import { ColorUtils } from 'src/Utility/Colors/ColorUtils'
import { GC } from 'src/Utility/GC'
import { Effect, MapPlayer } from 'w3ts'
import { GameStatRewards } from './GameStatRewards'

/// <summary>
/// Reward Class and Enums
/// * Enums are the different types of rewards. They help designate which category the reward should be in.
/// * The Reward class simply helps define what the Reward is ; ie name, ability, model.. etc.
/// </summary>
export enum RewardType {
    Auras,
    Windwalks,
    Skins,
    Trails,
    Tournament,
    Deathless,
    Nitros,
    Hats,
    Wings,
}

export class Reward {
    public name: string
    public AbilityID = 0
    public OriginPoint: string
    public ModelPath: string
    public SkinID = 0
    public Type: RewardType
    public TypeSorted: string
    public GameStat: string
    public GameStatValue = 0

    private constructor(name: string, abilityID: number, type: RewardType) {
        this.name = name
        this.AbilityID = abilityID
        this.Type = type
    }

    /**
     * Creates a reward with model path and origin point (for effects like auras, trails, wings, hats)
     */
    public static createRewardFromModel(
        name: string,
        abilityID: number,
        originPoint: string,
        modelPath: string,
        type: RewardType
    ): Reward {
        const reward = new Reward(name, abilityID, type)
        reward.OriginPoint = originPoint
        reward.ModelPath = modelPath
        return reward
    }

    /**
     * Creates a reward with model path, origin point, and game stat tracking
     */
    public static createRewardFromModelWithStats(
        name: string,
        abilityID: number,
        originPoint: string,
        modelPath: string,
        type: RewardType,
        gameStat: string,
        gameStatValue: number
    ): Reward {
        const reward = new Reward(name, abilityID, type)
        reward.OriginPoint = originPoint
        reward.ModelPath = modelPath
        reward.GameStat = gameStat
        reward.GameStatValue = gameStatValue
        GameStatRewards.push(reward)
        return reward
    }

    /**
     * Creates a reward with skin ID (for skin rewards)
     */
    public static createRewardFromSkin(name: string, abilityID: number, skinID: number, type: RewardType): Reward {
        const reward = new Reward(name, abilityID, type)
        reward.SkinID = skinID
        return reward
    }

    /**
     * Creates a reward with skin ID and game stat tracking
     */
    public static createRewardFromSkinWithStats(
        name: string,
        abilityID: number,
        skinID: number,
        type: RewardType,
        gameStat: string,
        gameStatValue: number
    ): Reward {
        const reward = new Reward(name, abilityID, type)
        reward.SkinID = skinID
        reward.GameStat = gameStat
        reward.GameStatValue = gameStatValue
        GameStatRewards.push(reward)
        return reward
    }

    /// <summary>
    /// Applies the reward and cosmetic appearance to the player.
    /// If the <param name="setData"/> parameter is true, it also alters the saved data. // TODO; Cleanup:     /// If the <paramref name="setData"/> parameter is true, it also alters the saved data.
    /// </summary>
    /// <param name="player">The player object to which the reward will be applied.</param>
    /// <param name="setData">Indicates whether to alter the saved data while setting the player's rewards. Default is true.</param>
    public ApplyReward(player: MapPlayer, setData: boolean = true) {
        if (setData) this.SetSelectedData(player)
        this.SetEffect(player)
        if (setData)
            player.DisplayTimedTextTo(
                3.0,
                `${Colors.COLOR_RED}Applied:|r ${this.GetRewardName()} ${Colors.COLOR_ORANGE}[${this.Type.toString()}]`
            )
    }

    private SetEffect(player: MapPlayer) {
        try {
            if (!Globals.ALL_KITTIES.has(player)) return

            if (this.SetSkin(player)) return
            if (this.SetWindwalk(player)) return

            const kitty = Globals.ALL_KITTIES.get(player)!.Unit
            const effectInstance = Effect.createAttachment(this.ModelPath, kitty, this.OriginPoint)!

            this.DestroyCurrentEffect(player)
            this.ApplyEffect(player, effectInstance)
        } catch (e) {
            Logger.Warning(e as string)
        }
    }

    private ApplyEffect(player: MapPlayer, effectInstance: Effect) {
        const activeRewards = Globals.ALL_KITTIES.get(player)!.ActiveAwards
        switch (this.Type) {
            case RewardType.Wings:
                activeRewards.ActiveWings = effectInstance
                break

            case RewardType.Hats:
                activeRewards.ActiveHats = effectInstance
                break

            case RewardType.Auras:
                activeRewards.ActiveAura = effectInstance
                break

            case RewardType.Trails:
            case RewardType.Nitros:
            case RewardType.Deathless:
                activeRewards.ActiveTrail = effectInstance
                break

            case RewardType.Tournament:
                this.SetTournamentReward(player, effectInstance, true)
                break

            default:
                throw new Error('' + this.Type)
        }
    }

    private DestroyCurrentEffect(player: MapPlayer) {
        const activeRewards = Globals.ALL_KITTIES.get(player)!.ActiveAwards
        switch (this.Type) {
            case RewardType.Wings: {
                const x = activeRewards.ActiveWings
                GC.RemoveEffect(x) // TODO; Cleanup:                 GC.RemoveEffect(ref x);
                break
            }

            case RewardType.Hats: {
                const y = activeRewards.ActiveHats
                GC.RemoveEffect(y) // TODO; Cleanup:                 GC.RemoveEffect(ref y);
                break
            }

            case RewardType.Auras: {
                const z = activeRewards.ActiveAura
                GC.RemoveEffect(z) // TODO; Cleanup:                 GC.RemoveEffect(ref z);
                break
            }

            case RewardType.Trails:
            case RewardType.Nitros:
            case RewardType.Deathless: {
                const t = activeRewards.ActiveTrail
                GC.RemoveEffect(t) // TODO; Cleanup:                 GC.RemoveEffect(ref t);
                break
            }

            case RewardType.Tournament:
                this.SetTournamentReward(player, null, false)
                break

            default:
                throw new Error('' + this.Type)
        }
    }

    private SetWindwalk(player: MapPlayer) {
        if (this.Type !== RewardType.Windwalks) return false
        const kitty = Globals.ALL_KITTIES.get(player)!
        kitty.ActiveAwards.WindwalkID = this.AbilityID
        return true
    }

    private SetSkin(player: MapPlayer, tournament: boolean = false) {
        if (this.Type !== RewardType.Skins && tournament === false) return false

        const kitty = Globals.ALL_KITTIES.get(player)!

        if (this.SkinID !== 0) {
            kitty.Unit.skin = this.SkinID
            kitty.KittyMorphosis.ScaleUnit()
            kitty.Unit.name = ColorUtils.PlayerNameColored(player)
        } else Logger.Critical(`Invalid Skin ID for: ${this.name}`)

        return true
    }

    private SetSelectedData(player: MapPlayer) {
        if (!Globals.ALL_KITTIES.has(player)) return

        const saveData = Globals.ALL_KITTIES.get(player)!.SaveData

        switch (this.Type) {
            case RewardType.Skins:
                saveData.SelectedData.SelectedSkin = this.name
                break

            case RewardType.Windwalks:
                saveData.SelectedData.SelectedWindwalk = this.name
                break

            case RewardType.Auras:
                saveData.SelectedData.SelectedAura = this.name
                break

            case RewardType.Hats:
                saveData.SelectedData.SelectedHat = this.name
                break

            case RewardType.Wings:
                saveData.SelectedData.SelectedWings = this.name
                break

            case RewardType.Trails:
            case RewardType.Nitros:
            case RewardType.Deathless:
                saveData.SelectedData.SelectedTrail = this.name
                break

            case RewardType.Tournament:
                break

            default:
                Logger.Critical('Error with selected data')
                throw new Error(this.Type)
        }
    }

    private SetTournamentReward(player: MapPlayer, e: Effect | null, activate: boolean) {
        if (this.Type !== RewardType.Tournament) return false

        const activeRewards = Globals.ALL_KITTIES.get(player)!.ActiveAwards
        if (activate) {
            if (this.name.includes('Nitro')) e && (activeRewards.ActiveTrail = e)
            else if (this.name.includes('Aura')) e && (activeRewards.ActiveAura = e)
            else if (this.name.includes('Wings')) e && (activeRewards.ActiveWings = e)
            else if (this.name.includes('Skin')) {
                this.SetSkin(player, true)
                Globals.ALL_KITTIES.get(player)!.SaveData.SelectedData.SelectedSkin = this.name
            } else {
                Logger.Warning(`Tournament reward ${this.name} is not a valid type.`)
                return false
            }
        } else {
            if (this.name.includes('Nitro')) activeRewards.ActiveTrail?.destroy()
            else if (this.name.includes('Aura')) activeRewards.ActiveAura?.destroy()
            else if (this.name.includes('Wings')) activeRewards.ActiveWings?.destroy()
            else return false
        }

        return true
    }

    public SetRewardTypeSorted(): string {
        switch (this.Type) {
            case RewardType.Auras:
                return Auras.name

            case RewardType.Windwalks:
                return Windwalks.name

            case RewardType.Skins:
                return Skins.name

            case RewardType.Trails:
                return Trails.name

            case RewardType.Deathless:
                return Deathless.name

            case RewardType.Nitros:
                return Nitros.name

            case RewardType.Hats:
                return Hats.name

            case RewardType.Wings:
                return Wings.name

            default:
                return Tournament.name
        }
    }

    public SystemRewardName(): string {
        return this.name.toString()
    }

    public GetRewardName(): string {
        return BlzGetAbilityTooltip(this.AbilityID, 0) || ''
    }

    public GetAbilityID(): number {
        return this.AbilityID
    }
}
