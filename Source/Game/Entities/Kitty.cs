using System;
using System.Collections.Generic;
using WCSharp.Api;

public class Kitty
{
    private const int KITTY_HERO_TYPE = Constants.UNIT_KITTY;
    private const string SPAWN_IN_EFFECT = "Abilities\\Spells\\Undead\\DeathPact\\DeathPactTarget.mdl";
    private const float MANA_DEATH_PENALTY = 65.0f;
    public KittyData SaveData { get; set; }
    public List<Relic> Relics { get; set; }
    public PlayerCurrentStats CurrentStats { get; set; } = new PlayerCurrentStats();
    public YellowLightning YellowLightning { get; set; }
    public int WindwalkID { get; set; } = 0;
    private effect Effect { get; set; }
    public player Player { get; }
    public unit Unit { get; set; }
    public bool ProtectionActive { get; set; } = false;
    public int TeamID { get; set; } = 0;
    public int ProgressZone { get; set; } = 0;
    public bool Alive { get; set; } = true;
    public bool Finished { get; set; } = false;
    public bool CanBuyRelic { get; set; } = false;
    public trigger w_Collision { get; set; } = trigger.Create();
    public trigger c_Collision { get; set; } = trigger.Create();
    public float Progress { get; set; } = 0.0f;
    public Dictionary<int, float> Time { get; set; } = new Dictionary<int, float>();

    public Kitty(player player)
    {
        Player = player;
        InitData();
        SpawnEffect();
        CreateKitty();
    }

    /// <summary>
    /// Initializes all kitty and circle objects for all players.
    /// </summary>
    public static void Initialize()
    {
        try
        {
            foreach (var player in Globals.ALL_PLAYERS)
            {
                new Circle(player);
                new Kitty(player);
            }
        }
        catch (Exception e)
        {
            Console.WriteLine(e.Message);
            throw;
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
        if(!ProtectionActive) Alive = false;
        DeathStatUpdate();
        CrystalOfFire.CrystalOfFireDeath(this);
        circle.SetMana(Unit.Mana - MANA_DEATH_PENALTY, Unit.MaxMana, (Unit.Intelligence * 0.08f) + 0.01f);
        circle.KittyDied(this);
        SoundManager.PlayKittyDeathSound(Unit);
        Gameover.GameOver();
        MultiboardUtil.RefreshMultiboards();
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
        MultiboardUtil.RefreshMultiboards();
    }
    private void InitData()
    {
        // Save Data
        if (Player.Controller == mapcontrol.User) SaveData = SaveManager.PlayerSaveData[Player].Stats[KittyType.Kitty];
        else SaveData = new KittyData(); // dummy data for comps, if something breaks.. this may be related.

        // Round Times
        for (int i = 1; i <= Gamemode.NumberOfRounds; i++)
            Time.Add(i, 0.0f);

        // Challenges, Relics, etc for Standard.
        if (Gamemode.CurrentGameMode == "Standard")
        {
            Relics = new List<Relic>();
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
        Utility.SelectUnitForPlayer(Player, Unit);
        Globals.ALL_KITTIES.Add(Player, this);
        Resources.StartingItems(this);
        Relic.DisableRelicBook(Unit);
        
        // Set Collision to Default
        CollisionDetection.KITTY_COLLISION_RADIUS.Add(Player, CollisionDetection.DEFAULT_WOLF_COLLISION_RADIUS);
        CollisionDetection.KittyRegisterCollisions(this);

        // Set Selected Rewards On Spawn but with a small delay for systems to catchup.
        Utility.SimpleTimer(1.0f, () => AwardManager.SetPlayerSelectedData(this));
    }

    private void Dispose()
    {
        Alive = false;
        Unit.Dispose();
        w_Collision.Dispose();
        c_Collision.Dispose();
        YellowLightning.Dispose();
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
        CurrentStats.SaveStreak = 0;
        SaveData.GameStats[StatTypes.Deaths] += 1;
        SaveData.GameStats[StatTypes.SaveStreak] = 0;
    }

    private void SaveStatUpdate(Kitty savior)
    {
        savior.CurrentStats.TotalSaves += 1;
        savior.CurrentStats.RoundSaves += 1;
        savior.CurrentStats.SaveStreak += 1;
        if(savior.CurrentStats.SaveStreak > savior.CurrentStats.MaxSaveStreak)
            savior.CurrentStats.MaxSaveStreak = savior.CurrentStats.SaveStreak;
        savior.SaveData.GameStats[StatTypes.Saves] += 1;
        savior.SaveData.GameStats[StatTypes.SaveStreak] += 1;
        if(savior.SaveData.GameStats[StatTypes.SaveStreak] > savior.SaveData.GameStats[StatTypes.HighestSaveStreak])
            savior.SaveData.GameStats[StatTypes.HighestSaveStreak] = savior.SaveData.GameStats[StatTypes.SaveStreak];
        Challenges.PurpleLighting(savior);
        savior.YellowLightning.SaveIncrement();
    }
}
