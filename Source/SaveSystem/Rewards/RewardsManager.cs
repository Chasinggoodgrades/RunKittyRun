﻿using System;
using System.Collections.Generic;
using System.Diagnostics.Tracing;
using WCSharp.Api;
using static WCSharp.Api.Common;
public static class RewardsManager
{
    public static List<Reward> Rewards = new List<Reward>();
    public static List<Reward> GameStatRewards = new List<Reward>();
    public static Dictionary<player, effect> ActiveWings = new Dictionary<player, effect>();
    public static Dictionary<player, effect> ActiveAuras = new Dictionary<player, effect>();
    public static Dictionary<player, effect> ActiveHats = new Dictionary<player, effect>();
    public static Dictionary<player, effect> ActiveTrails = new Dictionary<player, effect>();
    private static trigger Trigger = CreateTrigger();
    private static List<int> RewardAbilities = new List<int>();
    public static void Initialize()
    {
        InitializeRewardState();
        AwardManager.Initialize();
        RegisterTrigger();
        TestReward();
        RewardAbilitiesList();
    }

    private static void RewardAbilitiesList()
    {
        foreach (var reward in Rewards)
            RewardAbilities.Add(reward.AbilityID);
    }

    private static void InitializeRewardState()
    {
        foreach (var player in Globals.ALL_PLAYERS)
        {
            ActiveWings.Add(player, null);
            ActiveAuras.Add(player, null);
            ActiveHats.Add(player, null);
            ActiveTrails.Add(player, null);
        }
    }

    private static void RegisterTrigger()
    {
        foreach (var player in Globals.ALL_PLAYERS)
        {
            Trigger.RegisterPlayerUnitEvent(player, EVENT_PLAYER_UNIT_SPELL_CAST, null);
        }
        Trigger.AddAction(() => CastedReward());
    }

    private static void CastedReward()
    {
        var spellID = GetSpellAbilityId();
        var unit = GetTriggerUnit();
        if (IsResetSpell(spellID))
        {
            ResetRewardSettings(unit);
            return;
        }
        else if (IsRewardAbility(spellID))
        {
            Console.WriteLine("Reward spell casted!");
            var player = GetOwningPlayer(unit);
            var reward = Rewards.Find(r => r.GetAbilityID() == GetSpellAbilityId());
            Console.WriteLine(player.Name + " has casted " + reward.SystemRewardName() + "!");
            reward.ApplyReward(player);
        }
    }

    private static bool IsRewardAbility(int spellID)
    {
        if (RewardAbilities.Contains(spellID)) return true;
        return false;
    }

    private static bool IsResetSpell(int spellID)
    {
        if (spellID == Constants.ABILITY_RESET) return true;
        return false;
    }

    private static void ResetRewardSettings(unit Unit)
    {
        var player = GetOwningPlayer(Unit);
        var kitty = Globals.ALL_KITTIES[player].Unit;
        if (ActiveWings[player] != null)
        {
            ActiveWings[player].Dispose();
            ActiveWings[player] = null;
        }
        if (ActiveAuras[player] != null)
        {
            ActiveAuras[player].Dispose();
            ActiveAuras[player] = null;
        }
        if (ActiveHats[player] != null)
        {
            ActiveHats[player].Dispose();
            ActiveHats[player] = null;
        }
        if (ActiveTrails[player] != null)
        {
            ActiveTrails[player].Dispose();
            ActiveTrails[player] = null;
        }
        BlzSetUnitSkin(kitty, Constants.UNIT_KITTY);
    }
    public static Reward AddReward(Reward reward)
    {
        Rewards.Add(reward);
        Console.WriteLine(reward.SystemRewardName() + " has been added to the rewards list.");
        return reward;
    }

    /// <summary>
    /// Handles the creation of a reward with specific parameters such as ability, model, and appearance.
    /// </summary>
    /// <param name="name">The name of the Award enum</param>
    /// <param name="abilityID">The ID of the ability associated with the reward. Refer to Constants</param>
    /// <param name="originPoint">Where reward displays.. i.e. "chest", "origin", etc.</param>
    /// <param name="modelPath">
    /// The file path to the model associated with the reward.  </param>
    /// <param name="skinID">
    /// If the reward is a skin, provide a valid skin ID; otherwise, set this to 0.</param>
    /// <param name="rewardType">The type of the reward (e.g., skin, ability, item).</param>
    /// <param name="gameStatsAward">Whether the reward is associated with any game statistics or achievements.</param>
    /// <returns>Returns an instance of the created reward.</returns>
    public static Reward AddReward(Awards name, int abilityID, string originPoint, string modelPath, RewardType rewardType)
    {
        return AddReward(new Reward(name, abilityID, originPoint, modelPath, rewardType));
    }

    public static Reward AddReward(Awards name, int abilityID, int skinID, RewardType rewardType)
    {
        return AddReward(new Reward(name, abilityID, skinID, rewardType));
    }

    public static Reward AddReward(Awards name, int abilityID, int skinID, RewardType rewardType, StatTypes gameStat, int gameStatValue)
    {
        return AddReward(new Reward(name, abilityID, skinID, rewardType, gameStat, gameStatValue));
    }

    public static Reward AddReward(Awards name, int abilityID, string originPoint, string modelPath, RewardType rewardType, StatTypes gameStat, int gameStatValue)
    {
        return AddReward(new Reward(name, abilityID, originPoint, modelPath, rewardType, gameStat, gameStatValue));
    }

    public static void TestReward()
    {
        // Hats
        AddReward(Awards.Bandana, Constants.ABILITY_HAT_BANDANA, "head", "war3mapImported\\Bandana2.MDX", RewardType.Hat, StatTypes.Saves, 200);
        AddReward(Awards.Chef_Hat, Constants.ABILITY_HAT_CHEF, "head", "war3mapImported\\ChefsHat.mdx", RewardType.Hat, StatTypes.Saves, 250);
        AddReward(Awards.Santa_Hat, Constants.ABILITY_HAT_SANTA, "head", "war3mapImported\\SantaHat.mdx", RewardType.Hat, StatTypes.Saves, 300);
        AddReward(Awards.Samurai_Helm, Constants.ABILITY_HAT_SAMURAI, "head", "war3mapImported\\SamuraiHelmet2.mdx", RewardType.Hat, StatTypes.Saves, 350);
        AddReward(Awards.Pirate_Hat, Constants.ABILITY_HAT_PIRATE, "head", "war3mapImported\\PirateHat.MDX", RewardType.Hat, StatTypes.Saves, 400);
        AddReward(Awards.Tiki_Mask, Constants.ABILITY_HAT_TIKI, "head", "war3mapImported\\TikiMask.mdx", RewardType.Hat, StatTypes.Saves, 800);

        // Auras
        AddReward(Awards.Special_Aura, Constants.ABILITY_AURA_SPECIAL, "origin", "war3mapImported\\SoulArmor.mdx", RewardType.Aura, StatTypes.Wins, 5);
        AddReward(Awards.Starlight_Aura, Constants.ABILITY_AURA_STARLIGHT, "origin", "war3mapImported\\StarlightAura.mdx", RewardType.Aura, StatTypes.Wins, 10);
        AddReward(Awards.Spectacular_Aura, Constants.ABILITY_AURA_SPECTACULAR, "origin", "war3mapImported\\ChillingAura.mdx", RewardType.Aura, StatTypes.Wins, 30);
        AddReward(Awards.Mana_Aura, Constants.ABILITY_AURA_MANATAP, "origin", "war3mapImported\\ManaTapAura.MDX", RewardType.Aura, StatTypes.Wins, 20);
        AddReward(Awards.Butterfly_Aura, Constants.ABILITY_AURA_BUTTERFLY, "origin", "war3mapImported\\ButterflyAura.mdx", RewardType.Aura);

        // Wings
        AddReward(Awards.Phoenix_Wings, Constants.ABILITY_WINGS_PHOENIX, "chest", "war3mapImported\\PhoenixWing2.mdx", RewardType.Wings, StatTypes.Saves, 375);
        AddReward(Awards.Fairy_Wings, Constants.ABILITY_WINGS_FAIRY, "chest", "war3mapImported\\fairywing.mdx", RewardType.Wings, StatTypes.Saves, 275);
        AddReward(Awards.Nightmare_Wings, Constants.ABILITY_WINGS_NIGHTMARE, "chest", "war3mapImported\\WingsoftheNightmare2.mdx", RewardType.Wings, StatTypes.Saves, 325);
        AddReward(Awards.Archangel_Wings, Constants.ABILITY_WINGS_ARCHANGEL, "chest", "war3mapImported\\ArchangelWings2.mdx", RewardType.Wings, StatTypes.Saves, 425);
        AddReward(Awards.Cosmic_Wings, Constants.ABILITY_WINGS_COSMIC, "chest", "war3mapImported\\Cosmic Wings.mdx", RewardType.Wings, StatTypes.Saves, 550);
        AddReward(Awards.Void_Wings, Constants.ABILITY_WINGS_VOID, "chest", "war3mapImported\\Void Wings.mdx", RewardType.Wings, StatTypes.Saves, 500);
        AddReward(Awards.Chaos_Wings, Constants.ABILITY_WINGS_CHAOS, "chest", "war3mapImported\\ChaosWingsResized2.mdx", RewardType.Wings, StatTypes.Saves, 450);
        AddReward(Awards.Pink_Wings, Constants.ABILITY_WINGS_PINK, "chest", "war3mapImported\\PinkyWings2.mdx", RewardType.Wings, StatTypes.Saves, 600);
        AddReward(Awards.Nature_Wings, Constants.ABILITY_WINGS_NATURE, "chest", "war3mapImported\\Nature Wings2.mdx", RewardType.Wings, StatTypes.Saves, 750);

        // Tendrils
        AddReward(Awards.Red_Tendrils, Constants.ABILITY_WINGS_TRED, "chest", "war3mapImported\\RedTendrils.mdx", RewardType.Wings);
        AddReward(Awards.White_Tendrils, Constants.ABILITY_WINGS_TWHITE, "chest", "war3mapImported\\WhiteTendrils.mdx", RewardType.Wings);
        AddReward(Awards.Divinity_Tendrils, Constants.ABILITY_WINGS_TYELLOW, "chest", "war3mapImported\\YellowTendrils.mdx", RewardType.Wings);
        AddReward(Awards.Green_Tendrils, Constants.ABILITY_WINGS_TGREEN, "chest", "war3mapImported\\GreenTendrils.mdx", RewardType.Wings);
        AddReward(Awards.Patriotic_Tendrils, Constants.ABILITY_WINGS_PATRIOTIC, "chest", "RedWhiteBlueTendrilsTest.mdx", RewardType.Wings);

        // Fires
        AddReward(Awards.Purple_Fire, Constants.ABILITY_TRAIL_FIREPURPLE, "origin", "war3mapImported\\PurpleFire.mdx", RewardType.Trail);
        AddReward(Awards.Blue_Fire, Constants.ABILITY_TRAIL_FIREBLUE, "origin", "war3mapImported\\BlueFire.mdx", RewardType.Trail);
        AddReward(Awards.Turquoise_Fire, Constants.ABILITY_TRAIL_FIRETURQUOISE, "origin", "war3mapImported\\TurquoiseFire.mdx", RewardType.Trail);
        AddReward(Awards.Pink_Fire, Constants.ABILITY_TRAIL_FIREPINK, "origin", "war3mapImported\\PinkFire.mdx", RewardType.Trail);
        AddReward(Awards.White_Fire, Constants.ABILITY_TRAIL_FIREWHITE, "origin", "war3mapImported\\WhiteFire.mdx", RewardType.Trail);

        // Nitros
        AddReward(Awards.Nitro_1, Constants.ABILITY_NITRO, "origin", "war3mapImported\\Nitro.mdx", RewardType.Trail);
        AddReward(Awards.Nitro_Blue, Constants.ABILITY_NITROBLUE, "origin", "war3mapImported\\NitroBlue.mdx", RewardType.Trail);
        AddReward(Awards.Nitro_Red, Constants.ABILITY_NITRORED, "origin", "war3mapImported\\NitroRed.mdx", RewardType.Trail);
        AddReward(Awards.Nitro_Green, Constants.ABILITY_NITROGREEN, "origin", "war3mapImported\\NitroGreen.mdx", RewardType.Trail);
        AddReward(Awards.Nitro_Purple, Constants.ABILITY_NITROPURPLE, "origin", "war3mapImported\\NitroPurple.mdx", RewardType.Trail);
        AddReward(Awards.Divine_Light, Constants.ABILITY_TRAIL_DIVINELIGHT, "origin", "DivineLight.mdx", RewardType.Trail);

        // Lightning
        AddReward(Awards.Blue_Lightning, Constants.ABILITY_TRAIL_LIGHTNINGBLUE, "origin", "war3mapImported\\GreatElderHydraLightningOrbV3.mdx", RewardType.Trail, StatTypes.Saves, 2000);
        AddReward(Awards.Red_Lightning, Constants.ABILITY_TRAIL_LIGHTNINGRED, "origin", "war3mapImported\\RedLightning.mdx", RewardType.Trail);
        AddReward(Awards.Purple_Lightning, Constants.ABILITY_TRAIL_LIGHTNINGPURPLE, "origin", "war3mapImported\\PurpleLightning.mdx", RewardType.Trail);
        AddReward(Awards.Yellow_Lightning, Constants.ABILITY_TRAIL_LIGHTNINGYELLOW, "origin", "war3mapImported\\YellowLightning.mdx", RewardType.Trail);
        AddReward(Awards.Green_Lightning, Constants.ABILITY_TRAIL_LIGHTNINGGREEN, "origin", "war3mapImported\\GreenLightning.mdx", RewardType.Trail);

        // WindWalks
        AddReward(Awards.WW_Blood, Constants.ABILITY_WW_BLOOD, "chest", "war3mapImported\\Windwalk Blood.mdx", RewardType.Windwalk);
        AddReward(Awards.WW_Blue, Constants.ABILITY_WW_BLUE, "chest", "war3mapImported\\Windwalk Blue Soul.mdx", RewardType.Windwalk);
        AddReward(Awards.WW_Fire, Constants.ABILITY_WW_FIRE, "chest", "war3mapImported\\Windwalk Fire.mdx", RewardType.Windwalk);
        AddReward(Awards.WW_Necro, Constants.ABILITY_WW_NECRO, "chest", "war3mapImported\\Windwalk Necro Soul.mdx", RewardType.Windwalk);
        AddReward(Awards.WW_Swift, Constants.ABILITY_WW_SWIFT, "chest", "war3mapImported\\Windwalk.mdx", RewardType.Windwalk);

        // Deathless
        AddReward(Awards.Deathless_1, Constants.ABILITY_DEATHLESS_FIRE_1_01, "origin", "Doodads\\Cinematic\\FireRockSmall\\FireRockSmall.mdl", RewardType.Trail);
        AddReward(Awards.Deathless_2, Constants.ABILITY_DEATHLESS_FIRE_1_02, "origin", "war3mapImported\\Deathless2.mdx", RewardType.Trail);
        AddReward(Awards.Deathless_3, Constants.ABILITY_DEATHLESS_FIRE_1_03, "origin", "war3mapImported\\Deathless3.mdx", RewardType.Trail);
        AddReward(Awards.Deathless_4, Constants.ABILITY_DEATHLESS_FIRE_1_04, "origin", "war3mapImported\\Deathless4.mdx", RewardType.Trail);
        AddReward(Awards.Deathless_5, Constants.ABILITY_DEATHLESS_FIRE_1_05, "origin", "war3mapImported\\Deathless5.mdx", RewardType.Trail);

        // Skins
        AddReward(Awards.Undead_Kitty, Constants.ABILITY_SKIN_KITTYUNDEAD, Constants.UNIT_UNDEAD_KITTY, RewardType.Skin, StatTypes.Wins, 30);
        AddReward(Awards.Highelf_Kitty, Constants.ABILITY_SKIN_KITTYHIGHELF, Constants.UNIT_HIGHELF_KITTY, RewardType.Skin, StatTypes.NormalGames, 40);
        AddReward(Awards.Ancient_Kitty, Constants.ABILITY_SKIN_KITTYANCIENT, Constants.UNIT_ANCIENT_KITTY, RewardType.Skin, StatTypes.Wins, 40);
        AddReward(Awards.Satyr_Kitty, Constants.ABILITY_SKIN_KITTYSATYR, Constants.UNIT_SATYR_KITTY, RewardType.Skin, StatTypes.Wins, 25);
        AddReward(Awards.Astral_Kitty, Constants.ABILITY_SKIN_KITTYASTRAL, Constants.UNIT_ASTRAL_KITTY, RewardType.Skin, StatTypes.NormalGames, 55);
    }

}