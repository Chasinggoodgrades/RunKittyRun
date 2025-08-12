/// <summary>
/// This class is the primary location for adding rewards to the Reward System.
/// * Follow the AddReward functions below to determine what you wish to do.

import { Reward } from 'src/Rewards/Rewards/Reward'
class RewardManager {
    public static AddReward(reward: Reward): Reward
    public static AddReward(
        name: string,
        abilityID: number,
        originPoint: string,
        modelPath: string,
        rewardType: RewardType
    ): Reward
    public static AddReward(name: string, abilityID: number, skinID: number, rewardType: RewardType): Reward
    public static AddReward(
        name: string,
        abilityID: number,
        skinID: number,
        rewardType: RewardType,
        gameStat: string,
        gameStatValue: number
    ): Reward
    public static AddReward(
        name: string,
        abilityID: number,
        originPoint: string,
        modelPath: string,
        rewardType: RewardType,
        gameStat: string,
        gameStatValue: number
    ): Reward

    public static AddReward(...args: any[]): Reward {
        let reward: Reward

        if (args.length === 1 && typeof args[0] === 'object' && args[0] !== null && args[0] instanceof Reward) {
            reward = args[0]
        } else {
            reward = new Reward(...args) // Idk what the fuck to do here but OK good luck.
        }

        RewardsManager.Rewards.Add(reward)
        reward.TypeSorted = reward.SetRewardTypeSorted()
        return reward
    }

    public static SetupRewards() {
        let awardsSorted = Globals.GAME_AWARDS_SORTED
        let stats = Globals.GAME_STATS

        // Hats
        AddReward(
            'Bandana',
            Constants.ABILITY_HAT_BANDANA,
            'head',
            'war3mapImported\\Bandana2.MDX',
            RewardType.Hats,
            'Saves',
            200
        )
        AddReward(
            'PirateHat',
            Constants.ABILITY_HAT_PIRATE,
            'head',
            'war3mapImported\\PirateHat.MDX',
            RewardType.Hats,
            'Saves',
            250
        )
        AddReward(
            'ChefHat',
            Constants.ABILITY_HAT_CHEF,
            'head',
            'war3mapImported\\ChefsHat.mdx',
            RewardType.Hats,
            'Saves',
            300
        )
        AddReward(
            'TikiMask',
            Constants.ABILITY_HAT_TIKI,
            'head',
            'war3mapImported\\TikiMask.mdx',
            RewardType.Hats,
            'Saves',
            350
        )
        AddReward(
            'SamuraiHelm',
            Constants.ABILITY_HAT_SAMURAI,
            'head',
            'war3mapImported\\SamuraiHelmet2.mdx',
            RewardType.Hats,
            'Saves',
            400
        )
        AddReward(
            'SantaHat',
            Constants.ABILITY_HAT_SANTA,
            'head',
            'war3mapImported\\SantaHat.mdx',
            RewardType.Hats,
            'Saves',
            800
        )

        // Auras
        AddReward(
            'SpecialAura',
            Constants.ABILITY_AURA_SPECIAL,
            'origin',
            'war3mapImported\\SoulArmor.mdx',
            RewardType.Auras,
            'HardWins',
            5
        )
        AddReward(
            'StarlightAura',
            Constants.ABILITY_AURA_STARLIGHT,
            'origin',
            'war3mapImported\\StarlightAura.mdx',
            RewardType.Auras,
            'NormalGames',
            65
        )
        AddReward(
            'SpectacularAura',
            Constants.ABILITY_AURA_SPECTACULAR,
            'origin',
            'war3mapImported\\ChillingAura.mdx',
            RewardType.Auras,
            'NormalWins',
            30
        )
        AddReward(
            'ManaAura',
            Constants.ABILITY_AURA_MANATAP,
            'origin',
            'war3mapImported\\ManaTapAura.MDX',
            RewardType.Auras,
            'NormalWins',
            20
        )
        AddReward(
            'ButterflyAura',
            Constants.ABILITY_AURA_BUTTERFLY,
            'origin',
            'war3mapImported\\ButterflyAura.mdx',
            RewardType.Auras
        )
        AddReward(
            'FreezeAura',
            Constants.ABILITY_AURA_FREEZE,
            'origin',
            'war3mapImported\\HolyFreezeAuraD2.mdx',
            RewardType.Auras
        )
        AddReward(
            'VioletAura',
            Constants.ABILITY_CHAMPION_AURAPURPLERUNIC,
            'origin',
            'war3mapImported\\GlaciarAuraPurple.mdx',
            RewardType.Tournament
        )
        // Chained Together Awards
        AddReward(
            'ChainedNormalAura',
            Constants.ABILITY_AURA_CHAINEDNORMAL,
            'origin',
            'war3mapImported\\ChainedNormalAura.mdx',
            RewardType.Auras
        )
        AddReward(
            'ChainedHardAura',
            Constants.ABILITY_AURA_CHAINEDHARD,
            'origin',
            'war3mapImported\\ChainedHardAura.mdx',
            RewardType.Auras
        )
        AddReward(
            'ChainedImpossibleAura',
            Constants.ABILITY_AURA_CHAINEDIMPOSSIBLE,
            'origin',
            'war3mapImported\\ChainedImpossibleAura.mdx',
            RewardType.Auras
        )
        AddReward(
            'ChainedNightmareAura',
            Constants.ABILITY_AURA_CHAINEDNIGHTMARE,
            'origin',
            'war3mapImported\\ChainedNightmareAura.mdx',
            RewardType.Auras
        )

        // Wings
        AddReward(
            'PhoenixWings',
            Constants.ABILITY_WINGS_PHOENIX,
            'chest',
            'war3mapImported\\PhoenixWing2.mdx',
            RewardType.Wings,
            'Saves',
            375
        )
        AddReward(
            'FairyWings',
            Constants.ABILITY_WINGS_FAIRY,
            'chest',
            'war3mapImported\\fairywing.mdx',
            RewardType.Wings,
            'Saves',
            275
        )
        AddReward(
            'NightmareWings',
            Constants.ABILITY_WINGS_NIGHTMARE,
            'chest',
            'war3mapImported\\WingsoftheNightmare2.mdx',
            RewardType.Wings,
            'Saves',
            325
        )
        AddReward(
            'ArchangelWings',
            Constants.ABILITY_WINGS_ARCHANGEL,
            'chest',
            'war3mapImported\\ArchangelWings2.mdx',
            RewardType.Wings,
            'Saves',
            425
        )
        AddReward(
            'CosmicWings',
            Constants.ABILITY_WINGS_COSMIC,
            'chest',
            'war3mapImported\\Wings: Void.mdx',
            RewardType.Wings,
            'Saves',
            550
        )
        AddReward(
            'VoidWings',
            Constants.ABILITY_WINGS_VOID,
            'chest',
            'war3mapImported\\Wings: Cosmic.mdx',
            RewardType.Wings,
            'Saves',
            500
        )
        AddReward(
            'ChaosWings',
            Constants.ABILITY_WINGS_CHAOS,
            'chest',
            'war3mapImported\\ChaosWingsResized2.mdx',
            RewardType.Wings,
            'Saves',
            450
        )
        AddReward(
            'PinkWings',
            Constants.ABILITY_WINGS_PINK,
            'chest',
            'war3mapImported\\PinkyWings2.mdx',
            RewardType.Wings,
            'Saves',
            600
        )
        AddReward(
            'NatureWings',
            Constants.ABILITY_WINGS_NATURE,
            'chest',
            'war3mapImported\\Wings2: Nature.mdx',
            RewardType.Wings,
            'Saves',
            750
        )

        // Tendrils
        AddReward(
            'RedTendrils',
            Constants.ABILITY_WINGS_TRED,
            'chest',
            'war3mapImported\\RedTendrils.mdx',
            RewardType.Wings
        )
        AddReward(
            'WhiteTendrils',
            Constants.ABILITY_WINGS_TWHITE,
            'chest',
            'war3mapImported\\WhiteTendrils.mdx',
            RewardType.Wings
        )
        AddReward(
            'DivinityTendrils',
            Constants.ABILITY_WINGS_TYELLOW,
            'chest',
            'war3mapImported\\YellowTendrils.mdx',
            RewardType.Wings
        )
        AddReward(
            'GreenTendrils',
            Constants.ABILITY_WINGS_TGREEN,
            'chest',
            'war3mapImported\\GreenTendrils.mdx',
            RewardType.Wings
        )
        AddReward(
            'PatrioticTendrils',
            Constants.ABILITY_WINGS_PATRIOTIC,
            'chest',
            'RedWhiteBlueTendrilsTest.mdx',
            RewardType.Wings,
            'SaveStreak',
            50
        )
        AddReward(
            'VioletWings',
            Constants.ABILITY_CHAMPION_WINGSTVIOLET,
            'chest',
            'war3mapImported\\VoidTendrilsWings.mdx',
            RewardType.Tournament
        )
        AddReward(
            'TurquoiseWings',
            Constants.ABILITY_CHAMPION_WINGSTURQUOISE,
            'chest',
            'war3mapImported\\TurquoiseWings.mdx',
            RewardType.Tournament
        )

        // Fires
        AddReward(
            'PurpleFire',
            Constants.ABILITY_TRAIL_FIREPURPLE,
            'origin',
            'war3mapImported\\PurpleFire.mdx',
            RewardType.Trails
        )
        AddReward(
            'BlueFire',
            Constants.ABILITY_TRAIL_FIREBLUE,
            'origin',
            'war3mapImported\\BlueFire.mdx',
            RewardType.Trails
        )
        AddReward(
            'TurquoiseFire',
            Constants.ABILITY_TRAIL_FIRETURQUOISE,
            'origin',
            'war3mapImported\\TurquoiseFire.mdx',
            RewardType.Trails
        )
        AddReward(
            'PinkFire',
            Constants.ABILITY_TRAIL_FIREPINK,
            'origin',
            'war3mapImported\\PinkFire.mdx',
            RewardType.Trails
        )
        AddReward(
            'WhiteFire',
            Constants.ABILITY_TRAIL_FIREWHITE,
            'origin',
            'war3mapImported\\WhiteFire.mdx',
            RewardType.Trails
        )

        // Nitros
        AddReward('Nitro', Constants.ABILITY_NITRO, 'origin', 'war3mapImported\\Nitro.mdx', RewardType.Nitros)
        AddReward(
            'NitroBlue',
            Constants.ABILITY_NITROBLUE,
            'origin',
            'war3mapImported\\NitroBlue.mdx',
            RewardType.Nitros
        )
        AddReward('NitroRed', Constants.ABILITY_NITRORED, 'origin', 'war3mapImported\\NitroRed.mdx', RewardType.Nitros)
        AddReward(
            'NitroGreen',
            Constants.ABILITY_NITROGREEN,
            'origin',
            'war3mapImported\\NitroGreen.mdx',
            RewardType.Nitros
        )
        AddReward(
            'NitroPurple',
            Constants.ABILITY_NITROPURPLE,
            'origin',
            'war3mapImported\\NitroPurple.mdx',
            RewardType.Nitros
        )
        AddReward(
            'TurquoiseNitro',
            Constants.ABILITY_CHAMION_NITROTURQUOISE,
            'origin',
            'war3mapImported\\NitroTurquoise.mdx',
            RewardType.Tournament
        )

        // Divine Lights
        AddReward('DivineLight', Constants.ABILITY_TRAIL_DIVINELIGHT, 'origin', 'DivineLight.mdx', RewardType.Nitros)
        AddReward('AzureLight', Constants.ABILITY_TRAIL_AZURELIGHT, 'origin', 'AzureLight.mdx', RewardType.Nitros)
        AddReward('CrimsonLight', Constants.ABILITY_TRAIL_CRIMSONLIGHT, 'origin', 'CrimsonLight.mdx', RewardType.Nitros)
        AddReward('EmeraldLight', Constants.ABILITY_TRAIL_EMERALDLIGHT, 'origin', 'EmeraldLight.mdx', RewardType.Nitros)
        AddReward('VioletLight', Constants.ABILITY_TRAIL_VIOLETLIGHT, 'origin', 'VioletLight.mdx', RewardType.Nitros)
        AddReward(
            'PatrioticLight',
            Constants.ABILITY_TRAIL_PATRIOTICLIGHT,
            'origin',
            'PatrioticLight.mdx',
            RewardType.Nitros
        )

        // Lightning
        AddReward(
            'BlueLightning',
            Constants.ABILITY_TRAIL_LIGHTNINGBLUE,
            'origin',
            'war3mapImported\\GreatElderHydraLightningOrbV3.mdx',
            RewardType.Trails,
            'Saves',
            2000
        )
        AddReward(
            'RedLightning',
            Constants.ABILITY_TRAIL_LIGHTNINGRED,
            'origin',
            'war3mapImported\\RedLightning.mdx',
            RewardType.Trails,
            'SaveStreak',
            15
        )
        AddReward(
            'PurpleLightning',
            Constants.ABILITY_TRAIL_LIGHTNINGPURPLE,
            'origin',
            'war3mapImported\\PurpleLightning.mdx',
            RewardType.Trails
        )
        AddReward(
            'YellowLightning',
            Constants.ABILITY_TRAIL_LIGHTNINGYELLOW,
            'origin',
            'war3mapImported\\YellowLightning.mdx',
            RewardType.Trails
        )
        AddReward(
            'GreenLightning',
            Constants.ABILITY_TRAIL_LIGHTNINGGREEN,
            'origin',
            'war3mapImported\\GreenLightning.mdx',
            RewardType.Trails
        )
        // AddReward("LightningSpeed", Constants.ABILITY_AURA_BUTTERFLY, "origin", "lightning_shield.mdx", RewardType.Tournament);

        // WindWalks
        AddReward(
            'WWBlood',
            Constants.ABILITY_WW_BLOOD,
            'chest',
            'war3mapImported\\Blood: Windwalk.mdx',
            RewardType.Windwalks
        )
        AddReward(
            'WWBlue',
            Constants.ABILITY_WW_BLUE,
            'chest',
            'war3mapImported\\Blue: Soul: Windwalk',
            RewardType.Windwalks
        )
        AddReward(
            'WWFire',
            Constants.ABILITY_WW_FIRE,
            'chest',
            'war3mapImported\\Fire: Windwalk.mdx',
            RewardType.Windwalks
        )
        AddReward(
            'WWNecro',
            Constants.ABILITY_WW_NECRO,
            'chest',
            'war3mapImported\\Necro: Soul: Windwalk.mdx',
            RewardType.Windwalks
        )
        AddReward('WWSwift', Constants.ABILITY_WW_SWIFT, 'chest', 'war3mapImported\\Windwalk.mdx', RewardType.Windwalks)
        AddReward(
            'WWDivine',
            Constants.ABILITY_WW_DIVINE,
            'chest',
            'war3mapImported\\WindwalkDivine.mdx',
            RewardType.Windwalks
        )
        AddReward(
            'WWViolet',
            Constants.ABILITY_WW_VIOLET,
            'chest',
            'war3mapImported\\Violet: Windwalk.mdx',
            RewardType.Windwalks
        )
        // Deathless
        AddReward(
            'NormalDeathless1',
            Constants.ABILITY_DEATHLESS_FIRE_1_01,
            'origin',
            'Doodads\\Cinematic\\FireRockSmall\\FireRockSmall.mdl',
            RewardType.Deathless
        )
        AddReward(
            'NormalDeathless2',
            Constants.ABILITY_DEATHLESS_FIRE_1_02,
            'origin',
            'war3mapImported\\Deathless2.mdx',
            RewardType.Deathless
        )
        AddReward(
            'NormalDeathless3',
            Constants.ABILITY_DEATHLESS_FIRE_1_03,
            'origin',
            'war3mapImported\\Deathless3.mdx',
            RewardType.Deathless
        )
        AddReward(
            'NormalDeathless4',
            Constants.ABILITY_DEATHLESS_FIRE_1_04,
            'origin',
            'war3mapImported\\Deathless4.mdx',
            RewardType.Deathless
        )
        AddReward(
            'NormalDeathless5',
            Constants.ABILITY_DEATHLESS_FIRE_1_05,
            'origin',
            'war3mapImported\\Deathless5.mdx',
            RewardType.Deathless
        )

        // Team Deathless
        AddReward(
            'NormalTeamDeathless',
            Constants.ABILITY_NORMAL_TEAM_DEATHLESS,
            'origin',
            'war3mapImported\\NormalTeamDeathless.mdx',
            RewardType.Deathless
        )
        AddReward(
            'HardTeamDeathless',
            Constants.ABILITY_HARD_TEAM_DEATHLESS,
            'origin',
            'war3mapImported\\HardTeamDeathless.mdx',
            RewardType.Deathless
        )
        AddReward(
            'ImpossibleTeamDeathless',
            Constants.ABILITY_IMPOSSIBLE_TEAM_DEATHLESS,
            'origin',
            'war3mapImported\\ImpossibleTeamDeathless.mdx',
            RewardType.Deathless
        )

        // Skins
        AddReward(
            'UndeadKitty',
            Constants.ABILITY_SKIN_KITTYUNDEAD,
            Constants.UNIT_UNDEAD_KITTY,
            RewardType.Skins,
            'NormalWins',
            30
        )
        AddReward(
            'HighelfKitty',
            Constants.ABILITY_SKIN_KITTYHIGHELF,
            Constants.UNIT_HIGHELF_KITTY,
            RewardType.Skins,
            'NormalGames',
            40
        )
        AddReward(
            'AncientKitty',
            Constants.ABILITY_SKIN_KITTYANCIENT,
            Constants.UNIT_ANCIENT_KITTY,
            RewardType.Skins,
            'NormalWins',
            40
        )
        AddReward(
            'SatyrKitty',
            Constants.ABILITY_SKIN_KITTYSATYR,
            Constants.UNIT_SATYR_KITTY,
            RewardType.Skins,
            'NormalWins',
            25
        )
        AddReward(
            'AstralKitty',
            Constants.ABILITY_SKIN_KITTYASTRAL,
            Constants.UNIT_ASTRAL_KITTY,
            RewardType.Skins,
            'NormalGames',
            55
        )
        AddReward(
            'ZandalariKitty',
            Constants.ABILITY_SKIN_KITTYZANDALARI,
            Constants.UNIT_ZANDALARI_KITTY,
            RewardType.Skins
        )
        AddReward(
            'HuntressKitty',
            Constants.ABILITY_SKIN_KITTYHUNTRESS,
            Constants.UNIT_HUNTRESS_KITTY,
            RewardType.Skins
        )
        AddReward('PenguinSkin', Constants.ABILITY_CHAMPION_SKINPENGUIN, Constants.UNIT_PENGUIN, RewardType.Tournament)

        // Holiday
        AddReward(
            'SnowWings2023',
            Constants.ABILITY_HOLIDAY_WINGS_C2023,
            'chest',
            'war3mapImported\\SnowflakeWings.mdx',
            RewardType.Wings
        )
        AddReward(
            'SnowTrail2023',
            Constants.ABILITY_HOLIDAY_TRAIL_C2023,
            'origin',
            'war3mapImported\\snowtrail.mdx',
            RewardType.Trails
        )
    }
}
