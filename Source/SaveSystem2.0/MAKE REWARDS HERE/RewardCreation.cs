using System;
using System.Reflection;
using System.Security.Cryptography;

/// <summary>
/// This class is the primary location for adding rewards to the Reward System.
/// * Follow the AddReward functions below to determine what you wish to do.
/// </summary>
public static class RewardCreation
{
    public static Reward AddReward(Reward reward)
    {
        RewardsManager.Rewards.Add(reward);
        return reward;
    }

    /// <summary>
    /// General Award type, used when not using StatTypes or game statistics. Used most of the time. Often for wings / auras and such.
    /// </summary>
    /// <param name="name">The name of the Award enum</param>
    /// <param name="abilityID">The ID of the ability associated with the reward. Refer to Constants</param>
    /// <param name="originPoint">Where the reward is displayed, e.g., "chest", "origin", etc.</param>
    /// <param name="modelPath">The file path to the model associated with the reward.</param>
    /// <param name="rewardType">The type of the reward (e.g., skin, ability, item).</param>
    /// <returns>Returns an instance of the created reward.</returns>
    public static Reward AddReward(string name, int abilityID, string originPoint, string modelPath, RewardType rewardType)
    {
        return AddReward(new Reward(name, abilityID, originPoint, modelPath, rewardType));
    }

    /// <summary>
    /// Niche Award type, used when the reward is a skin and not using StatTypes or game statistics.
    /// </summary>
    /// <param name="name">The name of the Award enum</param>
    /// <param name="abilityID">The ID of the ability associated with the reward. Refer to Constants</param>
    /// <param name="skinID">If the reward is a skin, provide a valid skin ID; otherwise, set this to 0.</param>
    /// <param name="rewardType">The type of the reward (e.g., skin, ability, item).</param>
    /// <returns>Returns an instance of the created reward.</returns>
    public static Reward AddReward(string name, int abilityID, int skinID, RewardType rewardType)
    {
        return AddReward(new Reward(name, abilityID, skinID, rewardType));
    }

    /// <summary>
    /// Skin Award type that is based on using StatTypes / Game Stats.
    /// </summary>
    /// <param name="name">The name of the Award enum</param>
    /// <param name="abilityID">The ID of the ability associated with the reward. Refer to Constants</param>
    /// <param name="skinID">If the reward is a skin, provide a valid skin ID; otherwise, set this to 0.</param>
    /// <param name="rewardType">The type of the reward (e.g., skin, ability, item).</param>
    /// <param name="gameStat">The type of the game statistic associated with the reward.</param>
    /// <param name="gameStatValue">The value of the game statistic associated with the reward.</param>
    /// <returns>Returns an instance of the created reward.</returns>
    public static Reward AddReward(string name, int abilityID, int skinID, RewardType rewardType, string gameStat, int gameStatValue)
    {
        return AddReward(new Reward(name, abilityID, skinID, rewardType, gameStat, gameStatValue));
    }

    /// <summary>
    /// General Award type that is based on using StatTypes / Game Stats that isn't a skin.
    /// </summary>
    /// <param name="name">The name of the Award enum</param>
    /// <param name="abilityID">The ID of the ability associated with the reward. Refer to Constants</param>
    /// <param name="originPoint">Where the reward is displayed, e.g., "chest", "origin", etc.</param>
    /// <param name="modelPath">The file path to the model associated with the reward.</param>
    /// <param name="rewardType">The type of the reward (e.g., skin, ability, item).</param>
    /// <param name="gameStat">The type of the game statistic associated with the reward.</param>
    /// <param name="gameStatValue">The value of the game statistic associated with the reward.</param>
    /// <returns>Returns an instance of the created reward.</returns>
    public static Reward AddReward(string name, int abilityID, string originPoint, string modelPath, RewardType rewardType, string gameStat, int gameStatValue)
    {
        return AddReward(new Reward(name, abilityID, originPoint, modelPath, rewardType, gameStat, gameStatValue));
    }

    public static void SetupRewards()
    {
        var awards = Globals.GAME_AWARDS;
        var stats = Globals.GAME_STATS;

        // Hats
        AddReward(nameof(awards.Bandana), Constants.ABILITY_HAT_BANDANA, "head", "war3mapImported\\Bandana2.MDX", RewardType.Hats, nameof(stats.Saves), 200);
        AddReward(nameof(awards.PirateHat), Constants.ABILITY_HAT_PIRATE, "head", "war3mapImported\\PirateHat.MDX", RewardType.Hats, nameof(stats.Saves), 250);
        AddReward(nameof(awards.ChefHat), Constants.ABILITY_HAT_CHEF, "head", "war3mapImported\\ChefsHat.mdx", RewardType.Hats, nameof(stats.Saves), 300);
        AddReward(nameof(awards.TikiMask), Constants.ABILITY_HAT_TIKI, "head", "war3mapImported\\TikiMask.mdx", RewardType.Hats, nameof(stats.Saves), 350);
        AddReward(nameof(awards.SamuraiHelm), Constants.ABILITY_HAT_SAMURAI, "head", "war3mapImported\\SamuraiHelmet2.mdx", RewardType.Hats, nameof(stats.Saves), 400);
        AddReward(nameof(awards.SantaHat), Constants.ABILITY_HAT_SANTA, "head", "war3mapImported\\SantaHat.mdx", RewardType.Hats, nameof(stats.Saves), 800);

        // Auras
        AddReward(nameof(awards.SpecialAura), Constants.ABILITY_AURA_SPECIAL, "origin", "war3mapImported\\SoulArmor.mdx", RewardType.Auras, nameof(stats.HardGames), 5);
        AddReward(nameof(awards.StarlightAura), Constants.ABILITY_AURA_STARLIGHT, "origin", "war3mapImported\\StarlightAura.mdx", RewardType.Auras, nameof(stats.NormalGames), 65);
        AddReward(nameof(awards.SpectacularAura), Constants.ABILITY_AURA_SPECTACULAR, "origin", "war3mapImported\\ChillingAura.mdx", RewardType.Auras, nameof(stats.NormalWins), 30);
        AddReward(nameof(awards.ManaAura), Constants.ABILITY_AURA_MANATAP, "origin", "war3mapImported\\ManaTapAura.MDX", RewardType.Auras, nameof(stats.NormalWins), 20);
        AddReward(nameof(awards.ButterflyAura), Constants.ABILITY_AURA_BUTTERFLY, "origin", "war3mapImported\\ButterflyAura.mdx", RewardType.Auras);
        AddReward(nameof(awards.VioletAura), Constants.ABILITY_CHAMPION_AURAPURPLERUNIC, "origin", "war3mapImported\\GlaciarAuraPurple.mdx", RewardType.Auras);

        // Wings
        AddReward(nameof(awards.PhoenixWings), Constants.ABILITY_WINGS_PHOENIX, "chest", "war3mapImported\\PhoenixWing2.mdx", RewardType.Wings, nameof(stats.Saves), 375);
        AddReward(nameof(awards.FairyWings), Constants.ABILITY_WINGS_FAIRY, "chest", "war3mapImported\\fairywing.mdx", RewardType.Wings, nameof(stats.Saves), 275);
        AddReward(nameof(awards.NightmareWings), Constants.ABILITY_WINGS_NIGHTMARE, "chest", "war3mapImported\\WingsoftheNightmare2.mdx", RewardType.Wings, nameof(stats.Saves), 325);
        AddReward(nameof(awards.ArchangelWings), Constants.ABILITY_WINGS_ARCHANGEL, "chest", "war3mapImported\\ArchangelWings2.mdx", RewardType.Wings, nameof(stats.Saves), 425);
        AddReward(nameof(awards.CosmicWings), Constants.ABILITY_WINGS_COSMIC, "chest", "war3mapImported\\Void Wings.mdx", RewardType.Wings, nameof(stats.Saves), 550);
        AddReward(nameof(awards.VoidWings), Constants.ABILITY_WINGS_VOID, "chest", "war3mapImported\\Cosmic Wings.mdx", RewardType.Wings, nameof(stats.Saves), 500);
        AddReward(nameof(awards.ChaosWings), Constants.ABILITY_WINGS_CHAOS, "chest", "war3mapImported\\ChaosWingsResized2.mdx", RewardType.Wings, nameof(stats.Saves), 450);
        AddReward(nameof(awards.PinkWings), Constants.ABILITY_WINGS_PINK, "chest", "war3mapImported\\PinkyWings2.mdx", RewardType.Wings, nameof(stats.Saves), 600);
        AddReward(nameof(awards.NatureWings), Constants.ABILITY_WINGS_NATURE, "chest", "war3mapImported\\Nature Wings2.mdx", RewardType.Wings, nameof(stats.Saves), 750);

        // Tendrils
        AddReward(nameof(awards.RedTendrils), Constants.ABILITY_WINGS_TRED, "chest", "war3mapImported\\RedTendrils.mdx", RewardType.Wings);
        AddReward(nameof(awards.WhiteTendrils), Constants.ABILITY_WINGS_TWHITE, "chest", "war3mapImported\\WhiteTendrils.mdx", RewardType.Wings);
        AddReward(nameof(awards.DivinityTendrils), Constants.ABILITY_WINGS_TYELLOW, "chest", "war3mapImported\\YellowTendrils.mdx", RewardType.Wings);
        AddReward(nameof(awards.GreenTendrils), Constants.ABILITY_WINGS_TGREEN, "chest", "war3mapImported\\GreenTendrils.mdx", RewardType.Wings);
        AddReward(nameof(awards.PatrioticTendrils), Constants.ABILITY_WINGS_PATRIOTIC, "chest", "RedWhiteBlueTendrilsTest.mdx", RewardType.Wings, nameof(stats.SaveStreak), 50);
        AddReward(nameof(awards.VioletWings), Constants.ABILITY_CHAMPION_WINGSTVIOLET, "chest", "war3mapImported\\VoidTendrilsWings.mdx", RewardType.Wings);
        AddReward(nameof(awards.TurquoiseWings), Constants.ABILITY_CHAMPION_WINGSTURQUOISE, "chest", "war3mapImported\\TurquoiseWings.mdx", RewardType.Wings);

        // Fires
        AddReward(nameof(awards.PurpleFire), Constants.ABILITY_TRAIL_FIREPURPLE, "origin", "war3mapImported\\PurpleFire.mdx", RewardType.Trails);
        AddReward(nameof(awards.BlueFire), Constants.ABILITY_TRAIL_FIREBLUE, "origin", "war3mapImported\\BlueFire.mdx", RewardType.Trails);
        AddReward(nameof(awards.TurquoiseFire), Constants.ABILITY_TRAIL_FIRETURQUOISE, "origin", "war3mapImported\\TurquoiseFire.mdx", RewardType.Trails);
        AddReward(nameof(awards.PinkFire), Constants.ABILITY_TRAIL_FIREPINK, "origin", "war3mapImported\\PinkFire.mdx", RewardType.Trails);
        AddReward(nameof(awards.WhiteFire), Constants.ABILITY_TRAIL_FIREWHITE, "origin", "war3mapImported\\WhiteFire.mdx", RewardType.Trails);

        // Nitros
        AddReward(nameof(awards.Nitro), Constants.ABILITY_NITRO, "origin", "war3mapImported\\Nitro.mdx", RewardType.Nitros);
        AddReward(nameof(awards.NitroBlue), Constants.ABILITY_NITROBLUE, "origin", "war3mapImported\\NitroBlue.mdx", RewardType.Nitros);
        AddReward(nameof(awards.NitroRed), Constants.ABILITY_NITRORED, "origin", "war3mapImported\\NitroRed.mdx", RewardType.Nitros);
        AddReward(nameof(awards.NitroGreen), Constants.ABILITY_NITROGREEN, "origin", "war3mapImported\\NitroGreen.mdx", RewardType.Nitros);
        AddReward(nameof(awards.NitroPurple), Constants.ABILITY_NITROPURPLE, "origin", "war3mapImported\\NitroPurple.mdx", RewardType.Nitros);
        AddReward(nameof(awards.DivineLight), Constants.ABILITY_TRAIL_DIVINELIGHT, "origin", "DivineLight.mdx", RewardType.Nitros);
        AddReward(nameof(awards.TurquoiseNitro), Constants.ABILITY_CHAMION_NITROTURQUOISE, "origin", "war3mapImported\\NitroTurquoise.mdx", RewardType.Nitros);

        // Lightning
        AddReward(nameof(awards.BlueLightning), Constants.ABILITY_TRAIL_LIGHTNINGBLUE, "origin", "war3mapImported\\GreatElderHydraLightningOrbV3.mdx", RewardType.Trails, nameof(stats.Saves), 2000);
        AddReward(nameof(awards.RedLightning), Constants.ABILITY_TRAIL_LIGHTNINGRED, "origin", "war3mapImported\\RedLightning.mdx", RewardType.Trails, nameof(stats.SaveStreak), 15);
        AddReward(nameof(awards.PurpleLightning), Constants.ABILITY_TRAIL_LIGHTNINGPURPLE, "origin", "war3mapImported\\PurpleLightning.mdx", RewardType.Trails);
        AddReward(nameof(awards.YellowLightning), Constants.ABILITY_TRAIL_LIGHTNINGYELLOW, "origin", "war3mapImported\\YellowLightning.mdx", RewardType.Trails);
        AddReward(nameof(awards.GreenLightning), Constants.ABILITY_TRAIL_LIGHTNINGGREEN, "origin", "war3mapImported\\GreenLightning.mdx", RewardType.Trails);

        // WindWalks
        AddReward(nameof(awards.WWBlood), Constants.ABILITY_WW_BLOOD, "chest", "war3mapImported\\Windwalk Blood.mdx", RewardType.Windwalks);
        AddReward(nameof(awards.WWBlue), Constants.ABILITY_WW_BLUE, "chest", "war3mapImported\\Windwalk Blue Soul", RewardType.Windwalks);
        AddReward(nameof(awards.WWFire), Constants.ABILITY_WW_FIRE, "chest", "war3mapImported\\Windwalk Fire.mdx", RewardType.Windwalks);
        AddReward(nameof(awards.WWNecro), Constants.ABILITY_WW_NECRO, "chest", "war3mapImported\\Windwalk Necro Soul.mdx", RewardType.Windwalks);
        AddReward(nameof(awards.WWSwift), Constants.ABILITY_WW_SWIFT, "chest", "war3mapImported\\Windwalk.mdx", RewardType.Windwalks);

        // Deathless
        AddReward(nameof(awards.Deathless1), Constants.ABILITY_DEATHLESS_FIRE_1_01, "origin", "Doodads\\Cinematic\\FireRockSmall\\FireRockSmall.mdl", RewardType.Deathless);
        AddReward(nameof(awards.Deathless2), Constants.ABILITY_DEATHLESS_FIRE_1_02, "origin", "war3mapImported\\Deathless2.mdx", RewardType.Deathless);
        AddReward(nameof(awards.Deathless3), Constants.ABILITY_DEATHLESS_FIRE_1_03, "origin", "war3mapImported\\Deathless3.mdx", RewardType.Deathless);
        AddReward(nameof(awards.Deathless4), Constants.ABILITY_DEATHLESS_FIRE_1_04, "origin", "war3mapImported\\Deathless4.mdx", RewardType.Deathless);
        AddReward(nameof(awards.Deathless5), Constants.ABILITY_DEATHLESS_FIRE_1_05, "origin", "war3mapImported\\Deathless5.mdx", RewardType.Deathless);

        // Skins
        AddReward(nameof(awards.UndeadKitty), Constants.ABILITY_SKIN_KITTYUNDEAD, Constants.UNIT_UNDEAD_KITTY, RewardType.Skins, nameof(stats.NormalWins), 30);
        AddReward(nameof(awards.HighelfKitty), Constants.ABILITY_SKIN_KITTYHIGHELF, Constants.UNIT_HIGHELF_KITTY, RewardType.Skins, nameof(stats.NormalGames), 40);
        AddReward(nameof(awards.AncientKitty), Constants.ABILITY_SKIN_KITTYANCIENT, Constants.UNIT_ANCIENT_KITTY, RewardType.Skins, nameof(stats.NormalWins), 40);
        AddReward(nameof(awards.SatyrKitty), Constants.ABILITY_SKIN_KITTYSATYR, Constants.UNIT_SATYR_KITTY, RewardType.Skins, nameof(stats.NormalWins), 25);
        AddReward(nameof(awards.AstralKitty), Constants.ABILITY_SKIN_KITTYASTRAL, Constants.UNIT_ASTRAL_KITTY, RewardType.Skins, nameof(stats.NormalGames), 55);
        AddReward(nameof(awards.ZandalariKitty), Constants.ABILITY_SKIN_KITTYZANDALARI, Constants.UNIT_ZANDALARI_KITTY, RewardType.Skins);

        // Holiday
        AddReward(nameof(awards.SnowWings2023), Constants.ABILITY_HOLIDAY_WINGS_C2023, "chest", "war3mapImported\\SnowflakeWings.mdx", RewardType.Wings);
        AddReward(nameof(awards.SnowTrail2023), Constants.ABILITY_HOLIDAY_TRAIL_C2023, "origin", "war3mapImported\\snowtrail.mdx", RewardType.Trails);
    }
}