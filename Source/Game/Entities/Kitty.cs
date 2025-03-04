using Source;
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
    public List<Relic> Relics { get; set; }
    public KittyTime TimeProg { get; set; }
    public PlayerGameData CurrentStats { get; set; } = new PlayerGameData();
    public YellowLightning YellowLightning { get; set; }
    public int WindwalkID { get; set; } = 0;
    public player Player { get; }
    public unit Unit { get; set; }
    public bool ProtectionActive { get; set; } = false;
    public bool Invulnerable { get; set; } = false;
    public int TeamID { get; set; } = 0;
    public int ProgressZone { get; set; } = 0;
    public bool Alive { get; set; } = true;
    public bool Finished { get; set; } = false;
    public trigger w_Collision { get; set; } = trigger.Create();
    public trigger c_Collision { get; set; } = trigger.Create();

    public Kitty(player player)
    {
        Player = player;
        InitData();
        SpawnEffect();
        CreateKitty();
        TimeProg = new KittyTime(this);
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
        catch (System.Exception e)
        {
            if (Program.Debug) Console.WriteLine(e.StackTrace);
            throw;
        }
    }

    /// <summary>
    /// Kills this kitty object, and increments death stats. Calls attached circle object.
    /// </summary>
    public void KillKitty()
    {
        try
        {
            var circle = Globals.ALL_CIRCLES[Player];
            Unit.Kill();
            if (!ProtectionActive) Alive = false;
            CrystalOfFire.CrystalOfFireDeath(this);
            circle.SetMana(Unit.Mana - MANA_DEATH_PENALTY, Unit.MaxMana, (Unit.Intelligence * 0.08f) + 0.01f);
            circle.KittyDied(this);
            Solo.ReviveKittySoloTournament(this);
            Solo.RoundEndCheck();

            SoundManager.PlayKittyDeathSound(Unit);
            SoundManager.PlayFirstBloodSound();
            DeathStatUpdate();

            if (Gamemode.CurrentGameMode != "Standard") return;
            SoundManager.PlayLastManStandingSound();
            Gameover.GameOver();
            MultiboardUtil.RefreshMultiboards();
        }
        catch (Exception e)
        {
            if (Program.Debug) Console.WriteLine(e.Message);
            if (Program.Debug) Console.WriteLine(e.StackTrace);
            throw;
        }
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
        Unit.Revive(circle.Unit.X, circle.Unit.Y, false);
        Unit.Mana = circle.Unit.Mana;
        Utility.SelectUnitForPlayer(Player, Unit);
        CameraUtil.RelockCamera(Player);

        if (savior == null) return;
        UpdateSaviorStats(savior);
        MultiboardUtil.RefreshMultiboards();
    }
    private void InitData()
    {
        try
        {
            // Save Data
            if (Player.Controller == mapcontrol.User && Player.SlotState == playerslotstate.Playing) SaveData = SaveManager.SaveData[Player];
            else SaveData = new KittyData(); // dummy data for comps

            YellowLightning = new YellowLightning(Player);
            Relics = new List<Relic>();
        }
        catch (Exception e)
        {
            if (Program.Debug) Console.WriteLine(e.Message);
            if (Program.Debug) Console.WriteLine(e.StackTrace);
            throw;
        }
    }
    private void SpawnEffect()
    {
        var spawnCenter = RegionList.SpawnRegions[Player.Id].Center;
        Utility.CreateEffectAndDispose(SPAWN_IN_EFFECT, spawnCenter.X, spawnCenter.Y);
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
        RelicUtil.DisableRelicBook(Unit);
        Unit.Name = $"{Colors.PlayerNameColored(Player)}";
        TrueSightGhostWolves();

        // Set Collision to Default
        CollisionDetection.KITTY_COLLISION_RADIUS.Add(Player, CollisionDetection.DEFAULT_WOLF_COLLISION_RADIUS);
        CollisionDetection.KittyRegisterCollisions(this);

        // Set Selected Rewards On Spawn but with a small delay for systems to catchup.
        Utility.SimpleTimer(1.0f, () => AwardManager.SetPlayerSelectedData(this));
    }

    public void Dispose()
    {
        Alive = false;
        Unit.Dispose();
        w_Collision.Dispose();
        c_Collision.Dispose();
        YellowLightning.Dispose();
        if (Gameover.WinGame) return; 
        Globals.ALL_KITTIES.Remove(Player);
    }

    private void UpdateSaviorStats(Kitty savior)
    {
        SaveStatUpdate(savior);
        savior.Player.Gold += Resources.SaveGoldBonus(savior.CurrentStats.SaveStreak);
        savior.Unit.Experience += Resources.SaveExperience;
    }

    private void DeathStatUpdate()
    {
        CurrentStats.TotalDeaths += 1;
        CurrentStats.RoundDeaths += 1;
        CurrentStats.SaveStreak = 0;
        SoloMultiboard.UpdateDeathCount(Player);
        if (Gamemode.CurrentGameMode != "Standard") return;
        DeathlessChallenges.ResetPlayerDeathless(Player);
        SaveData.GameStats.Deaths += 1;
        SaveData.GameStats.SaveStreak = 0;
    }

    private void SaveStatUpdate(Kitty savior)
    {
        savior.CurrentStats.TotalSaves += 1;
        savior.CurrentStats.RoundSaves += 1;
        savior.CurrentStats.SaveStreak += 1;
        if(savior.CurrentStats.SaveStreak > savior.CurrentStats.MaxSaveStreak)
            savior.CurrentStats.MaxSaveStreak = savior.CurrentStats.SaveStreak;
        if (Gamemode.CurrentGameMode != "Standard") return;
        savior.SaveData.GameStats.Saves += 1;
        savior.SaveData.GameStats.SaveStreak += 1;
        if(savior.SaveData.GameStats.SaveStreak > savior.SaveData.GameStats.HighestSaveStreak)
            savior.SaveData.GameStats.HighestSaveStreak = savior.SaveData.GameStats.SaveStreak;
        Challenges.PurpleLighting(savior);
        savior.YellowLightning.SaveIncrement();
    }

    private void TrueSightGhostWolves()
    {
        var trueSight = FourCC("Atru");
        Unit.AddAbility(trueSight);
        Unit.HideAbility(trueSight, true);
    }

}
