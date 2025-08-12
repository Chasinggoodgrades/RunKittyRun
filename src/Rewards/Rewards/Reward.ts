/// <summary>
/// Reward Class and Enums
/// * Enums are the different types of rewards. They help designate which category the reward should be in.
/// * The Reward class simply helps define what the Reward is ; ie name, ability, model.. etc.

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
import { GC } from 'src/Utility/GC'
import { Effect, MapPlayer } from 'w3ts'
import { RewardsManager } from './RewardsManager'

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
    public Name: string
    public AbilityID: number
    public OriginPoint: string
    public ModelPath: string
    public SkinID: number
    public Type: RewardType
    public TypeSorted: string
    public GameStat: string
    public GameStatValue: number

    public Reward(name: string, abilityID: number, originPoint: string, modelPath: string, type: RewardType) {
        this.Name = name
        this.AbilityID = abilityID
        this.OriginPoint = originPoint
        this.ModelPath = modelPath
        this.Type = type
    }

    public Reward(name: string, abilityID: number, skinID: number, type: RewardType) {
        this.Name = name
        this.AbilityID = abilityID
        this.SkinID = skinID
        this.Type = type
    }

    public Reward(
        name: string,
        abilityID: number,
        skinID: number,
        type: RewardType,
        gameStat: string,
        gameStatValue: number
    ) {
        this.Name = name
        this.AbilityID = abilityID
        this.SkinID = skinID
        this.Type = type
        this.GameStat = gameStat
        this.GameStatValue = gameStatValue
        RewardsManager.GameStatRewards.push(this)
    }

    public Reward(
        name: string,
        abilityID: number,
        originPoint: string,
        modelPath: string,
        type: RewardType,
        gameStat: string,
        gameStatValue: number
    ) {
        this.Name = name
        this.AbilityID = abilityID
        this.OriginPoint = originPoint
        this.ModelPath = modelPath
        this.Type = type
        this.GameStat = gameStat
        this.GameStatValue = gameStatValue
        RewardsManager.GameStatRewards.push(this)
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
                '{Colors.COLOR_RED}Applied:|r {GetRewardName()} {Colors.COLOR_ORANGE}[{Type.ToString()}]'
            )
    }

    private SetEffect(player: MapPlayer) {
        try {
            if (!Globals.ALL_KITTIES.has(player)) return

            if (this.SetSkin(player)) return
            if (this.SetWindwalk(player)) return

            let kitty = Globals.ALL_KITTIES.get(player).Unit
            let effectInstance = Effect.create(this.ModelPath, kitty, this.OriginPoint)!

            this.DestroyCurrentEffect(player)
            this.ApplyEffect(player, effectInstance)
        } catch (e) {
            Logger.Warning(e.Message)
        }
    }

    private ApplyEffect(player: MapPlayer, effectInstance: effect = null) {
        let activeRewards = Globals.ALL_KITTIES.get(player).ActiveAwards
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
                throw new ArgumentOutOfRangeError(nameof(this.Type), this.Type, null)
        }
    }

    private DestroyCurrentEffect(player: MapPlayer) {
        let activeRewards = Globals.ALL_KITTIES.get(player).ActiveAwards
        switch (this.Type) {
            case RewardType.Wings:
                let x = activeRewards.ActiveWings
                GC.RemoveEffect(x) // TODO; Cleanup:                 GC.RemoveEffect(ref x);
                break

            case RewardType.Hats:
                let y = activeRewards.ActiveHats
                GC.RemoveEffect(y) // TODO; Cleanup:                 GC.RemoveEffect(ref y);
                break

            case RewardType.Auras:
                let z = activeRewards.ActiveAura
                GC.RemoveEffect(z) // TODO; Cleanup:                 GC.RemoveEffect(ref z);
                break

            case RewardType.Trails:
            case RewardType.Nitros:
            case RewardType.Deathless:
                let t = activeRewards.ActiveTrail
                GC.RemoveEffect(t) // TODO; Cleanup:                 GC.RemoveEffect(ref t);
                break

            case RewardType.Tournament:
                this.SetTournamentReward(player, null, false)
                break

            default:
                throw new ArgumentOutOfRangeError(nameof(this.Type), this.Type, null)
        }
    }

    private SetWindwalk(player: MapPlayer) {
        if (this.Type != RewardType.Windwalks) return false
        let kitty = Globals.ALL_KITTIES.get(player)
        kitty.ActiveAwards.WindwalkID = this.AbilityID
        return true
    }

    private SetSkin(player: MapPlayer, tournament: boolean = false) {
        if (this.Type != RewardType.Skins && tournament == false) return false

        let kitty = Globals.ALL_KITTIES.get(player)

        if (this.SkinID != 0) {
            kitty.Unit.Skin = this.SkinID
            kitty.KittyMorphosis.ScaleUnit()
            kitty.Unit.Name = '{Colors.PlayerNameColored(player)}'
        } else Logger.Critical('ID: invalid: for: Skins {Name}')

        return true
    }

    private SetSelectedData(player: MapPlayer) {
        if (!Globals.ALL_KITTIES.has(player)) return

        let saveData = Globals.ALL_KITTIES.get(player).SaveData

        switch (this.Type) {
            case RewardType.Skins:
                saveData.SelectedData.SelectedSkin = this.Name
                break

            case RewardType.Windwalks:
                saveData.SelectedData.SelectedWindwalk = this.Name
                break

            case RewardType.Auras:
                saveData.SelectedData.SelectedAura = this.Name
                break

            case RewardType.Hats:
                saveData.SelectedData.SelectedHat = this.Name
                break

            case RewardType.Wings:
                saveData.SelectedData.SelectedWings = this.Name
                break

            case RewardType.Trails:
            case RewardType.Nitros:
            case RewardType.Deathless:
                saveData.SelectedData.SelectedTrail = this.Name
                break

            case RewardType.Tournament:
                break

            default:
                Logger.Critical('with: selected: data: Error')
                throw new ArgumentOutOfRangeError(nameof(this.Type), this.Type, null)
        }
    }

    private SetTournamentReward(player: MapPlayer, e: effect, activate: boolean) {
        if (this.Type != RewardType.Tournament) return false

        let activeRewards = Globals.ALL_KITTIES.get(player).ActiveAwards
        if (activate) {
            if (this.Name.includes('Nitro')) activeRewards.ActiveTrail = e
            else if (this.Name.includes('Aura')) activeRewards.ActiveAura = e
            else if (this.Name.includes('Wings')) activeRewards.ActiveWings = e
            else if (this.Name.includes('Skin')) {
                this.SetSkin(player, true)
                Globals.ALL_KITTIES.get(player).SaveData.SelectedData.SelectedSkin = this.Name
            } else {
                Logger.Warning('Error: reward: Tournament {Name} is a: valid: type: not.')
                return false
            }
        } else {
            if (this.Name.includes('Nitro')) activeRewards.ActiveTrail?.Dispose()
            else if (this.Name.includes('Aura')) activeRewards.ActiveAura?.Dispose()
            else if (this.Name.includes('Wings')) activeRewards.ActiveWings?.Dispose()
            else return false
        }

        return true
    }

    public SetRewardTypeSorted(): string {
        switch (this.Type) {
            case RewardType.Auras:
                return new Auras().GetType().Name

            case RewardType.Windwalks:
                return new Windwalks().GetType().Name

            case RewardType.Skins:
                return new Skins().GetType().Name

            case RewardType.Trails:
                return new Trails().GetType().Name

            case RewardType.Deathless:
                return new Deathless().GetType().Name

            case RewardType.Nitros:
                return new Nitros().GetType().Name

            case RewardType.Hats:
                return new Hats().GetType().Name

            case RewardType.Wings:
                return new Wings().GetType().Name

            default:
                return new Tournament().GetType().Name
        }
    }

    public SystemRewardName(): string {
        return this.Name.ToString()
    }

    public GetRewardName(): string {
        return BlzGetAbilityTooltip(this.AbilityID, 0)
    }

    public GetAbilityID(): number {
        return this.AbilityID
    }
}
