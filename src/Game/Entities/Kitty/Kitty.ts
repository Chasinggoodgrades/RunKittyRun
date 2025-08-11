

class Kitty
{
    private KITTY_HERO_TYPE: number = Constants.UNIT_KITTY;
    private SPAWN_IN_EFFECT: string = "Abilities\\Spells\\Undead\\DeathPact\\DeathPactTarget.mdl";
    private MANA_DEATH_PENALTY: number = 65.0;
    private InvulDuration: number = 0.3;
    public static InvulTest: boolean = false;

    public Name: string 
    public SaveData: KittyData 
    public  Relics :Relic[]
    public TimeProg: KittyTime 
    public ShadowKitty: ShadowKitty 
    public CurrentStats: PlayerGameData = new PlayerGameData();
    public ProgressHelper: ProgressPointHelper = new ProgressPointHelper();
    public ActiveAwards: ActiveAwards = new ActiveAwards();
    public KittyMiscInfo: KittyMiscInfo = new KittyMiscInfo();
    public StatsManager: KittyStatsManager 
    public NameTag: FloatingNameTag 
    public YellowLightning: YellowLightning 
    public aiController: AIController 
    public SpinCam: SpinCam 
    public APMTracker: APMTracker 
    public KittyMorphosis: KittyMorphosis 
    public Slider: Slider 
    public RTR: RTR 
    public MirrorHandler: MirrorMovementHandler 
    public CurrentSafeZone: number = 0;
    public Player: player 
    public Unit: unit 
    public ProtectionActive: boolean = false;
    public Invulnerable: boolean = false;
    public Alive: boolean = true;
    public Finished: boolean = false;
    public TeamID: number = 0;
    public ProgressZone: number = 0;
    public w_Collision: trigger = trigger.Create();
    public c_Collision: trigger = trigger.Create();
    public Disco: Disco 
    public InvulTimer: timer = timer.Create();
    public IsChained: boolean = false;
    public IsMirror: boolean = false;
    public CanEarnAwards: boolean = true;

    public Kitty(player: player)
    {
        Player = player;
        Name = Player.Name.split('#')[0];
        InitData();
        SpawnEffect();
        CreateKitty();
        TimeProg = new KittyTime(this);
        Slider = new Slider(this);
        RTR = new RTR(this);
        MirrorHandler = new MirrorMovementHandler(this);
        StatsManager = new KittyStatsManager(this);
        YellowLightning = new YellowLightning(this);
        aiController = new AIController(this);
        SpinCam = new SpinCam(this);
        APMTracker = new APMTracker(this);
        NameTag = new FloatingNameTag(this);
        KittyMorphosis = new KittyMorphosis(this);
        ShadowKitty = new ShadowKitty(this);
        Globals.ALL_KITTIES_LIST.Add(this);
        Disco = new Disco [Unit = this.Unit]
        StartAIController();
    }

    /// <summary>
    /// Initializes all kitty and circle objects for all players.
    /// </summary>
    public static Initialize()
    {
        try
        {
            for (let player: player in Globals.ALL_PLAYERS)
            {
                new Circle(player);
                new Kitty(player);
            }
        }
        catch (e: Error)
        {
            Logger.Critical("Error in Kitty.Initalize. {e.StackTrace}");
            throw e
        }
    }

    /// <summary>
    /// Kills this kitty object, and increments death stats. Calls attached circle object.
    /// </summary>
    public KillKitty()
    {
        try
        {
            if (Invulnerable || !Alive) return;

            let circle: Circle = Globals.ALL_CIRCLES[Player];

            // Pause processes before unit death
            Slider.PauseSlider();
            RTR.PauseRTR();
            aiController.PauseAi();
            Unit.Kill();

            // Update status flags
            if (!ProtectionActive)
                Alive = false;

            // Apply death effects and stat updates
            CrystalOfFire.CrystalOfFireDeath(this);
            circle.SetMana(Unit.Mana - MANA_DEATH_PENALTY, Unit.MaxMana, (Unit.Intelligence * 0.08) + 0.01);
            circle.KittyDied(this);
            Solo.ReviveKittySoloTournament(this);
            Solo.RoundEndCheck();

            // Death Sounds
            SoundManager.PlayKittyDeathSound(this);
            SoundManager.PlayFirstBloodSound();

            // Update stats
            StatsManager.DeathStatUpdate();

            // Handle game mode specific logic
            if (Gamemode.CurrentGameMode == GameMode.Standard)
            {
                TeamDeathless.DiedWithOrb(this);
                ChainedTogether.LoseEvent(this.Name);
                SoundManager.PlayLastManStandingSound();
                Gameover.GameOver();
                MultiboardUtil.RefreshMultiboards();
            }
        }
        catch (e: Error)
        {
            Logger.Critical("Error in KillKitty: {e.Message}");
        }
    }

    /// <summary>
    /// Revives this object and increments savior's stats if provided.
    /// </summary>
    public ReviveKitty(savior: Kitty = null)
    {
        try
        {
            if (Unit.Alive) return;

            let circle: Circle = Globals.ALL_CIRCLES[Player];

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
            RTR.ResumeRTR();
            aiController.ResumeAi();

            // Update savior stats if applicable
            if (savior != null)
            {
                StatsManager.UpdateSaviorStats(savior);
                MultiboardUtil.RefreshMultiboards();
            }
        }
        catch (e: Error)
        {
            Logger.Critical("Error in ReviveKitty: {e.Message}");
            throw e
        }
    }

    private InvulnerableKitty()
    {
        if (!InvulTest) return;
        Invulnerable = true;
        InvulTimer.Start(InvulDuration, false, () =>
        {
            Invulnerable = false;
            InvulTimer.Pause();
        });
    }

    public ToggleMirror()
    {
        IsMirror = !IsMirror;
    }

    private InitData()
    {
        try
        {
            // Save Data
            if (Player.Controller == mapcontrol.User && Player.SlotState == playerslotstate.Playing)
                SaveData = SaveManager.GetKittyData(Player);
            else
                SaveData = new KittyData(); // dummy data for comps

            Relics : Relic[] = []
        }
        catch (e: Error)
        {
            Logger.Critical("Error in InitData {e.Message}");
            throw e
        }
    }

    private SpawnEffect()
    {
        WCSharp.Shared.Data.spawnCenter: Point = RegionList.SpawnRegions[Player.Id].Center;
        Utility.CreateEffectAndDispose(SPAWN_IN_EFFECT, spawnCenter.X, spawnCenter.Y);
    }

    private CreateKitty()
    {
        // Spawn Location
        WCSharp.Shared.Data.spawnCenter: Point = RegionList.SpawnRegions[Player.Id].Center;

        // Creation of Unit
        Unit = unit.Create(Player, KITTY_HERO_TYPE, spawnCenter.X, spawnCenter.Y, 360);
        Utility.MakeUnitLocust(Unit);
        Utility.SelectUnitForPlayer(Player, Unit);

        // Initialize Kitty
        Globals.ALL_KITTIES.Add(Player, this);
        Resources.StartingItems(this);
        RelicUtil.DisableRelicBook(Unit);
        Unit.Name = "{Colors.PlayerNameColored(Player)}";
        TrueSightGhostWolves();
        CollisionDetection.KittyRegisterCollisions(this);

        // Set Selected Rewards On Spawn but with a small delay for save data to get set.
        Utility.SimpleTimer(1.0, () => AwardManager.SetPlayerSelectedData(this));
    }

    private StartAIController()
    {
        if (Player.Controller == mapcontrol.Computer && Gamemode.CurrentGameMode == GameMode.Standard)
        {
            this.aiController?.StartAi();
            Unit.AddItem(FourCC("bspd")); // boots
        }
    }

    public Dispose()
    {
        Alive = false;
        w_Collision.Dispose();
        c_Collision.Dispose();
        YellowLightning.Dispose();
        TimeProg.Dispose();
        APMTracker.Dispose();
        MirrorHandler.Dispose();
        InvulTimer.Pause();
        InvulTimer.Dispose();
        Disco?.Dispose();
        aiController.StopAi();
        RTR.StopRTR();
        Unit.Dispose();
        ChainedTogether.RegenerateGroup(this.Name);
        if (Gameover.WinGame) return;
        Globals.ALL_KITTIES_LIST.Remove(this);
        Globals.ALL_KITTIES.Remove(Player);
    }

    private TrueSightGhostWolves()
    {
        let trueSight: number = FourCC("Atru");
        Unit.AddAbility(trueSight);
        Unit.HideAbility(trueSight, true);
    }

}
