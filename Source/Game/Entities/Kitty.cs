using System;
using System.Collections.Generic;
using WCSharp.Api;
using static WCSharp.Api.Common;

public class Kitty
{
    private const int KITTY_HERO_TYPE = Constants.UNIT_KITTY;
    private const string SPAWN_IN_EFFECT = "Abilities\\Spells\\Undead\\DeathPact\\DeathPactTarget.mdl";
    private const float MANA_DEATH_PENALTY = 65.0f;
    public KittyData SaveData { get; set; }
    public PlayerCurrentStats CurrentStats { get; set; } = new PlayerCurrentStats();
    public YellowLightning YellowLightning { get; set; }
    private effect Effect { get; set; }
    public player Player { get; }
    public unit Unit { get; set; }
    public bool ProtectionActive { get; set; } = false;
    public int TeamID { get; set; } = 0;
    public int ProgressZone { get; set; } = 0;
    public bool Alive { get; set; } = true;
    public bool Finished { get; set; } = false;
    public List<item> Relics { get; set; }
    public bool CanBuyRelic { get; set; } = false;
    public trigger w_Collision { get; set; } = CreateTrigger();
    public trigger c_Collision { get; set; } = CreateTrigger();
    public float Progress { get; set; } = 0.0f;
    public Dictionary<int, float> Time { get; set; } = new Dictionary<int, float>();

    public Kitty(player player)
    {
        Player = player;
        SpawnEffect();
        CreateKitty();
        InitData();
    }

    /// <summary>
    /// Initializes all kitty and circle objects for all players.
    /// </summary>
    public static void Initialize()
    {
        foreach (var player in Globals.ALL_PLAYERS)
        {
            new Kitty(player);
            new Circle(player);
        }
    }
    /// <summary>
    /// Removes the kitty from the game. 
    /// </summary>
    public void RemoveKitty() => Dispose();

    /// <summary>
    /// Kills this kitty object, and increments death stats. Calls attached circle object.
    /// </summary>
    public void KillKitty()
    {
        var circle = Globals.ALL_CIRCLES[Player];
        Unit.Kill();
        if (!ProtectionActive) Alive = false;
        DeathStatUpdate();
        circle.SetMana(Unit.Mana - MANA_DEATH_PENALTY, Unit.MaxMana, (Unit.Intelligence * 0.08f) + 0.01f);
        circle.KittyDied(this);
        SoundManager.PlayKittyDeathSound(Unit);
        Gameover.GameOver();
    }

    /// <summary>
    /// Revives this object and increments savior's stats if provided.
    /// </summary>
    public void ReviveKitty(Kitty savior = null)
    {
        if (Unit.Alive) return;
        var circle = Globals.ALL_CIRCLES[Player];
        circle.HideCircle();
        Alive = true;
        Unit.Revive(Unit.X, Unit.Y, false);
        Unit.Mana = circle.Unit.Mana;
        Utility.SelectUnitForPlayer(Player, Unit);

        if (savior == null) return;
        UpdateSaviorStats(savior);
    }
    private void InitData()
    {
        // Save Data
        if (Player.Controller == MAP_CONTROL_USER) SaveData = SaveManager.PlayerSaveData[Player].Stats[KittyType.Kitty];
        else SaveData = new KittyData(); // dummy data for comps, if something breaks.. this may be related.

        // Round Times
        for (int i = 1; i <= Gamemode.NumberOfRounds; i++)
            Time.Add(i, 0.0f);

        // Challenges, Relics, etc for Standard.
        if (Gamemode.CurrentGameMode == "Standard")
        {
            Relics = new List<item>();
            YellowLightning = new YellowLightning(Player);
        }

    }
    private void SpawnEffect()
    {
        var spawnCenter = RegionList.SpawnRegions[Player.Id].Center;
        Effect = effect.Create(SPAWN_IN_EFFECT, spawnCenter.X, spawnCenter.Y);
        Effect.Dispose();
    }
    private void CreateKitty()
    {
        // Spawn, Create, Locust
        var spawnCenter = RegionList.SpawnRegions[Player.Id].Center;
        Unit = unit.Create(Player, KITTY_HERO_TYPE, spawnCenter.X, spawnCenter.Y, 360);
        Utility.MakeUnitLocust(Unit);
        AwardManager.SetStartingSkin(this);
        Utility.SelectUnitForPlayer(Player, Unit);
        Globals.ALL_KITTIES.Add(Player, this);
        
        // Set Collision to Default
        CollisionDetection.KITTY_COLLISION_RADIUS.Add(Player, CollisionDetection.DEFAULT_WOLF_COLLISION_RADIUS);
        CollisionDetection.KittyRegisterCollisions(this);
    }

    private void Dispose()
    {
        Unit.Dispose();
        w_Collision.Dispose();
        c_Collision.Dispose();
        YellowLightning.Dispose();
        Relics.Clear();
        Globals.ALL_KITTIES.Remove(Player);
    }

    private void UpdateSaviorStats(Kitty savior)
    {
        SaveStatUpdate(savior);
        savior.Player.Gold += Resources.SaveGold;
        savior.Unit.Experience += Resources.SaveExperience;
    }

    private void DeathStatUpdate()
    {
        CurrentStats.TotalDeaths += 1;
        CurrentStats.RoundDeaths += 1;
        SaveData.GameStats[StatTypes.Deaths] += 1;
        SaveData.GameStats[StatTypes.SaveStreak] = 0;
    }

    private void SaveStatUpdate(Kitty savior)
    {
        savior.CurrentStats.TotalSaves += 1;
        savior.CurrentStats.RoundSaves += 1;
        savior.SaveData.GameStats[StatTypes.Saves] += 1;
        savior.SaveData.GameStats[StatTypes.SaveStreak] += 1;
        if(savior.SaveData.GameStats[StatTypes.SaveStreak] > savior.SaveData.GameStats[StatTypes.HighestSaveStreak])
            savior.SaveData.GameStats[StatTypes.HighestSaveStreak] = savior.SaveData.GameStats[StatTypes.SaveStreak];
        Challenges.PurpleLighting(savior);
        savior.YellowLightning.SaveIncrement();
    }
}
