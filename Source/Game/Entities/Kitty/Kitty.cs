using System;
using System.Collections.Generic;
using WCSharp.Api;
using static WCSharp.Api.Common;

public class Kitty
{
    private const int KITTY_HERO_TYPE = Constants.UNIT_KITTY;
    private const string SPAWN_IN_EFFECT = "Abilities\\Spells\\Undead\\DeathPact\\DeathPactTarget.mdl";
    private const float MANA_DEATH_PENALTY = 65.0f;
    private const float InvulDuration = 0.3f;
    public static bool InvulTest = false;

    public string Name { get; set; }
    public KittyData SaveData { get; set; }
    public List<Relic> Relics { get; set; }
    public KittyTime TimeProg { get; set; }
    public PlayerGameData CurrentStats { get; set; } = new PlayerGameData();
    public ProgressPointHelper ProgressHelper { get; set; } = new ProgressPointHelper();
    public ActiveAwards ActiveAwards { get; set; } = new ActiveAwards();
    public KittyStatsManager StatsManager { get; set; }
    public FloatingNameTag NameTag { get; set; }
    public YellowLightning YellowLightning { get; set; }
    public AIController aiController { get; set; }
    public SpinCam SpinCam { get; set; }
    public APMTracker APMTracker { get; set; }
    public KittyMorphosis KittyMorphosis { get; set; }
    public Slider Slider { get; private set; }
    public int CurrentSafeZone { get; set; } = 0;
    public player Player { get; }
    public unit Unit { get; set; }
    public bool ProtectionActive { get; set; } = false;
    public bool Invulnerable { get; set; } = false;
    public bool Alive { get; set; } = true;
    public bool Finished { get; set; } = false;
    public int TeamID { get; set; } = 0;
    public int ProgressZone { get; set; } = 0;
    public trigger w_Collision { get; set; } = trigger.Create();
    public trigger c_Collision { get; set; } = trigger.Create();
    public Disco Disco { get; set; }
    public timer InvulTimer { get; set; } = timer.Create();
    public bool IsChained = false;

    public Kitty(player player)
    {
        Player = player;
        Name = Player.Name.Split('#')[0];
        InitData();
        SpawnEffect();
        CreateKitty();
        TimeProg = new KittyTime(this);
        Slider = new Slider(this);
        StatsManager = new KittyStatsManager(this);
        YellowLightning = new YellowLightning(this);
        aiController = new AIController(this);
        SpinCam = new SpinCam(this);
        APMTracker = new APMTracker(this);
        NameTag = new FloatingNameTag(this);
        KittyMorphosis = new KittyMorphosis(this);
        Globals.ALL_KITTIES_LIST.Add(this);
        Disco = new Disco { Unit = this.Unit };
        StartAIController();
    }

    /// <summary>
    /// Initializes all kitty and circle objects for all players.
    /// </summary>
    public static void Initialize()
    {
        try
        {
            foreach (player player in Globals.ALL_PLAYERS)
            {
                new Circle(player);
                new Kitty(player);
            }
        }
        catch (Exception e)
        {
            Logger.Critical($"Error in Kitty.Initalize. {e.StackTrace}");
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
            if (Invulnerable || !Alive) return;

            Circle circle = Globals.ALL_CIRCLES[Player];

            // Pause processes before unit death
            Slider.PauseSlider();
            aiController.PauseAi();
            Unit.Kill();

            // Update status flags
            if (!ProtectionActive)
                Alive = false;

            // Apply death effects and stat updates
            CrystalOfFire.CrystalOfFireDeath(this);
            circle.SetMana(Unit.Mana - MANA_DEATH_PENALTY, Unit.MaxMana, (Unit.Intelligence * 0.08f) + 0.01f);
            circle.KittyDied(this);
            Solo.ReviveKittySoloTournament(this);
            Solo.RoundEndCheck();

            // Death Sounds
            SoundManager.PlayKittyDeathSound(Unit);
            SoundManager.PlayFirstBloodSound();

            // Update stats
            StatsManager.DeathStatUpdate();

            // Handle game mode specific logic
            if (Gamemode.CurrentGameMode == "Standard")
            {
                TeamDeathless.DiedWithOrb(this);
                ChainedTogether.LoseEvent(this.Name);
                SoundManager.PlayLastManStandingSound();
                Gameover.GameOver();
                MultiboardUtil.RefreshMultiboards();
            }
        }
        catch (Exception e)
        {
            Logger.Critical($"Error in KillKitty: {e.Message}");
        }
    }

    /// <summary>
    /// Revives this object and increments savior's stats if provided.
    /// </summary>
    public void ReviveKitty(Kitty savior = null)
    {
        try
        {
            if (Unit.Alive) return;

            Circle circle = Globals.ALL_CIRCLES[Player];

            // Hide visual indicators before revival
            circle.HideCircle();
            InvulnerableKitty();
            Alive = true;

            // Revive the unit at its respective position
            Unit.Revive(circle.Unit.X, circle.Unit.Y, false);
            Unit.Mana = circle.Unit.Mana;

            // Adjust player controls and UI
            Utility.SelectUnitForPlayer(Player, Unit);
            CameraUtil.RelockCamera(Player);

            // Resume processes
            Slider.ResumeSlider(true);
            aiController.ResumeAi();

            // Update savior stats if applicable
            if (savior != null)
            {
                StatsManager.UpdateSaviorStats(savior);
                MultiboardUtil.RefreshMultiboards();
            }
        }
        catch (Exception e)
        {
            Logger.Critical($"Error in ReviveKitty: {e.Message}");
            throw;
        }
    }

    private void InvulnerableKitty()
    {
        if (!InvulTest) return;
        Invulnerable = true;
        InvulTimer.Start(InvulDuration, false, () =>
        {
            Invulnerable = false;
            InvulTimer.Pause();
        });
    }

    private void InitData()
    {
        try
        {
            // Save Data
            if (Player.Controller == mapcontrol.User && Player.SlotState == playerslotstate.Playing)
                SaveData = SaveManager.GetKittyData(Player);
            else
                SaveData = new KittyData(); // dummy data for comps

            Relics = new List<Relic>();
        }
        catch (Exception e)
        {
            Logger.Critical($"Error in InitData {e.Message}");
            throw;
        }
    }

    private void SpawnEffect()
    {
        WCSharp.Shared.Data.Point spawnCenter = RegionList.SpawnRegions[Player.Id].Center;
        Utility.CreateEffectAndDispose(SPAWN_IN_EFFECT, spawnCenter.X, spawnCenter.Y);
    }

    private void CreateKitty()
    {
        // Spawn Location
        WCSharp.Shared.Data.Point spawnCenter = RegionList.SpawnRegions[Player.Id].Center;

        // Creation of Unit
        Unit = unit.Create(Player, KITTY_HERO_TYPE, spawnCenter.X, spawnCenter.Y, 360);
        Utility.MakeUnitLocust(Unit);
        Utility.SelectUnitForPlayer(Player, Unit);

        // Initialize Kitty
        Globals.ALL_KITTIES.Add(Player, this);
        Resources.StartingItems(this);
        RelicUtil.DisableRelicBook(Unit);
        Unit.Name = $"{Colors.PlayerNameColored(Player)}";
        TrueSightGhostWolves();
        CollisionDetection.KittyRegisterCollisions(this);

        // Set Selected Rewards On Spawn but with a small delay for save data to get set.
        Utility.SimpleTimer(1.0f, () => AwardManager.SetPlayerSelectedData(this));
    }

    private void StartAIController()
    {
        if (Player.Controller == mapcontrol.Computer && Gamemode.CurrentGameMode == "Standard")
        {
            this.aiController?.StartAi();
            Unit.AddItem(FourCC("bspd")); // boots
        }
    }

    public void Dispose()
    {
        Alive = false;
        w_Collision.Dispose();
        c_Collision.Dispose();
        YellowLightning.Dispose();
        TimeProg.Dispose();
        APMTracker.Dispose();
        InvulTimer.Pause();
        InvulTimer.Dispose();
        Disco?.Dispose();
        aiController.StopAi();
        Unit.Dispose();
        ChainedTogether.RegenerateGroup(this.Name);
        if (Gameover.WinGame) return;
        Globals.ALL_KITTIES_LIST.Remove(this);
        Globals.ALL_KITTIES.Remove(Player);
    }

    private void TrueSightGhostWolves()
    {
        int trueSight = FourCC("Atru");
        Unit.AddAbility(trueSight);
        Unit.HideAbility(trueSight, true);
    }


}
