using System;
using System.Collections.Generic;
using WCSharp.Api;
using static WCSharp.Api.Common;

public class Kitty : IFloatingTags, ICircleOwner
{
    private const int KITTY_HERO_TYPE = Constants.UNIT_KITTY;
    private const string SPAWN_IN_EFFECT = "Abilities\\Spells\\Undead\\DeathPact\\DeathPactTarget.mdl";
    private const float MANA_DEATH_PENALTY = 65.0f;
    private const float InvulDuration = 0.3f;
    public static bool InvulTest = false;

    public bool ComputerControlled = false;
    public string Name { get; set; }
    public KittyData SaveData { get; set; }
    public List<Relic> Relics { get; set; }
    public KittyTime TimeProg { get; set; }
    public ShadowKitty ShadowKitty { get; set; }
    public PlayerGameData CurrentStats { get; set; } = new PlayerGameData();
    public ProgressPointHelper ProgressHelper { get; set; } = new ProgressPointHelper();
    public ActiveAwards ActiveAwards { get; set; } = new ActiveAwards();
    public KittyMiscInfo KittyMiscInfo { get; set; } = new KittyMiscInfo();
    public KittyStatsManager StatsManager { get; set; }
    public FloatingNameTag NameTag { get; set; }
    public YellowLightning YellowLightning { get; set; }
    public AIController aiController { get; set; }
    public SpinCam SpinCam { get; set; }
    public APMTracker APMTracker { get; set; }
    public KittyMorphosis KittyMorphosis { get; set; }
    public Windwalk Windwalk { get; private set; }
    public ProtectionOfAncients ProtectionOfAncients { get; private set; }
    public Slider Slider { get; private set; }
    public RTR RTR { get; private set; }
    public MirrorMovementHandler MirrorHandler { get; private set; }
    public Circle Circle { get; private set; }
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
    public bool IsChained { get; set; } = false;
    public bool IsMirror { get; set; } = false;
    public bool CanEarnAwards { get; set; } = true;
    public CommandTier CommandTier { get; set; } = CommandTier.All;
    public KittyAsyncEffect AsyncEffect { get; set; }

    /// <summary>Scale a Kitty unit has by default (and again after a reset).</summary>
    public const float DefaultModelScale = 0.60f;

    /// <summary>
    /// The scale the Kitty unit is drawn at. Warcraft has no getter for it, so everything that
    /// changes it goes through SetModelScale and the stand-in effect (KittyAsyncEffect) follows.
    /// </summary>
    public float ModelScale { get; private set; } = DefaultModelScale;

    /// <summary>Scales the unit and the async stand-in effect alike.</summary>
    public void SetModelScale(float scale)
    {
        ModelScale = scale;
        Unit.SetScale(scale, scale, scale);
        AsyncEffect?.RefreshScale(); // re-hides the unit when the effect stands in
    }

    /// <summary>
    /// The unit was given a scale by something other than SetModelScale (a new skin starts from the
    /// default one): only tell the effect, the unit is already right.
    /// </summary>
    public void NotifyModelScale(float scale)
    {
        ModelScale = scale;
        AsyncEffect?.RefreshScale();
    }

    // The colours the Kitty has been given (-sc, -vc, -color, a reset, disco). Kept here as well, so
    // the async effect draws the same ones whenever it is turned on, since a unit's colour cannot be read back.
    public int VertexRed { get; private set; } = 255;
    public int VertexGreen { get; private set; } = 255;
    public int VertexBlue { get; private set; } = 255;

    /// <summary>Player colour index (0-23) given by -color, or -1 for the colour of the player's slot.</summary>
    public int TeamColorIndex { get; private set; } = -1;

    /// <summary>Records a vertex colour for the effect to draw; the caller sets it on the unit.</summary>
    public void NotifyVertexColor(int r, int g, int b)
    {
        VertexRed = r;
        VertexGreen = g;
        VertexBlue = b;
        AsyncEffect?.RefreshTint();
    }

    public void NotifyTeamColor(int colorIndex)
    {
        TeamColorIndex = colorIndex;
        AsyncEffect?.RefreshTint();
    }

    /// <summary>
    /// A visual on the Kitty. With the async effect standing in it follows the effect, since the
    /// unit is invisible and a latency behind; otherwise it is attached to the unit as usual.
    /// </summary>
    public effect AddKittyEffect(string model, string attachPoint = "origin")
    {
        if (AsyncEffect != null && AsyncEffect.IsActive) return AsyncEffect.AddFollower(model, attachPoint);

        return AddSpecialEffectTarget(model, Unit, attachPoint);
    }

    public void RemoveKittyEffect(ref effect e)
    {
        RemoveKittyEffect(e);
        e = null;
    }

    public void RemoveKittyEffect(effect e)
    {
        if (e == null) return;

        if (AsyncEffect != null) AsyncEffect.DestroyFollower(e); // a plain dispose when it is not one of its own
        else e.Dispose();
    }

    public Kitty(player player)
    {
        Player = player;
        Name = Player.Name.Split('#')[0];
        InitData();
        SpawnEffect();
        CreateKitty();
        Circle = new Circle(player);
        TimeProg = new KittyTime(this, Progress.Instance);
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
        Windwalk = new Windwalk(this);
        ProtectionOfAncients = new ProtectionOfAncients(this);
        Globals.ALL_KITTIES_LIST.Add(this);
        Disco = new Disco { Unit = this.Unit };
        AsyncEffect = new KittyAsyncEffect(this);
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

            // Pause processes before unit death
            Slider.PauseSlider();
            RTR.PauseRTR();
            aiController.PauseAi();
            AsyncEffect?.ApplyDeathPointToUnit(); // dies where the player saw it touch the wolf
            Unit.Kill();

            // Update status flags
            if (!ProtectionActive) Alive = false;

            // The collision that killed this Kitty is a synced unit event, so every machine
            // stands the stand-in effect down on the same turn: no death packet is needed.
            AsyncEffect?.Hide();

            // Apply death effects and stat updates
            CrystalOfFire.CrystalOfFireDeath(this);
            Circle.SetMana(Unit.Mana - MANA_DEATH_PENALTY, Unit.MaxMana, (Unit.Intelligence * 0.08f) + 0.01f);
            Circle.KittyDied(this);

            // Death Sounds
            SoundManager.PlayKittyDeathSound(this);
            SoundManager.PlayFirstBloodSound();

            // Update stats
            StatsManager.DeathStatUpdate();

            // Gamemode specific logic like solo revive circles.. and w/e else.
            Gamemode.Current.OnKittyDied(this);
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

            // Hide visual indicators before revival
            Circle.HideCircle();
            Alive = true;

            // Revive the unit at its respective position
            Unit.Revive(Circle.Unit.X, Circle.Unit.Y, false);
            Unit.Mana = Circle.Unit.Mana;
            Windwalk.ReactivateWindwalk();
            AsyncEffect?.Show();

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
        catch (Exception e)
        {
            Logger.Critical($"Error in ReviveKitty: {e.Message}");
            throw;
        }
    }

    /// <summary>
    /// The amount in percentage of what we'll give back. For example.. 0.2 being 20%
    /// </summary>
    /// <param name="amount"></param>
    public void ReplenishMana(float amount)
    {
        var maxMana = this.Unit.MaxMana;
        var manaBack = (int)(maxMana * amount);
        Utility.UnitAddMana(this.Unit, manaBack);
    }

    public void InvulnerableKitty(float duration = InvulDuration)
    {
        Invulnerable = true;
        InvulTimer.Start(duration, false, () =>
        {
            Invulnerable = false;
            InvulTimer.Pause();
        });
    }

    public void ToggleMirror()
    {
        IsMirror = !IsMirror;
    }

    private void InitData()
    {
        try
        {
            if (Player.Controller == mapcontrol.Computer)
            {
                ComputerControlled = true;
                SaveData = new KittyData();
            }
            else SaveData = SaveManager.GetKittyData(Player);

            Relics = new List<Relic>();
            CommandsManager.InitCommandTier(this);
            TournamentSaver.Instance.ResetTournamentDataForPlayer(this);
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
        Globals.SetKittySlot(Player, this);
        Resources.StartingItems(this);
        RelicUtil.DisableRelicBook(Unit);
        Unit.Name = $"{Colors.PlayerNameColored(Player)} ({Colors.GetColoredCommandTier(CommandTier)})";

        TrueSightGhostWolves();
        CollisionDetection.KittyRegisterCollisions(this);

        // Set Selected Rewards On Spawn but with a small delay for save data to get set.
        Utility.SimpleTimer(1.0f, () => AwardManager.SetPlayerSelectedData(this));
    }

    private void StartAIController()
    {
        if (Player.Controller == mapcontrol.Computer && Gamemode.CurrentGameMode == GameMode.Standard)
        {
            this.aiController?.StartAi();
            Unit.AddItem(FourCC("bspd")); // boots
        }
    }

    public void Dispose()
    {
        Alive = false;
        ChainedTogether.OptOutOfChain(this);
        w_Collision.Dispose();
        c_Collision.Dispose();
        YellowLightning.Dispose();
        TimeProg.Dispose();
        APMTracker.Dispose();
        MirrorHandler.Dispose();
        InvulTimer.Pause();
        InvulTimer.Dispose();
        Circle?.Dispose();
        Disco?.Dispose();
        aiController?.StopAi();
        RTR?.Dispose();
        Slider?.Dispose();
        SpinCam?.Dispose();
        Windwalk?.Dispose();
        NameTag?.Dispose();
        AsyncEffect?.Dispose();
        Unit?.Dispose();
        //ChainedTogether.RegenerateGroup(this.Name);
        if (Gameover.WinGame) return;
        Globals.ALL_KITTIES_LIST.Remove(this);
        Globals.ALL_KITTIES.Remove(Player);
        Globals.SetKittySlot(Player, null);
    }

    private void TrueSightGhostWolves()
    {
        int trueSight = FourCC("Atru");
        Unit.AddAbility(trueSight);
        Unit.HideAbility(trueSight, true);
    }


}
