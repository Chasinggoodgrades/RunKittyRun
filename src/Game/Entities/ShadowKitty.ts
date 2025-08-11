class ShadowKitty {
    public static ALL_SHADOWKITTIES: { [x: player]: ShadowKitty }
    public Unit: unit

    public Player: player

    public Kitty: Kitty

    public Active: boolean

    public wCollision: trigger

    public cCollision: trigger

    public ID: number

    public ShadowKitty(kitty: Kitty) {
        this.Kitty = kitty
        this.Player = kitty.Player
        ID = kitty.Player.Id
        ALL_SHADOWKITTIES[Player] = this
        this.RegisterTriggers()
    }

    public static Initialize() {
        ALL_SHADOWKITTIES = {}
    }

    /// <summary>
    /// Summons shadow kitty to the position of this player's kitty object.
    /// </summary>
    public SummonShadowKitty() {
        let kitty = Globals.ALL_KITTIES[Player].Unit
        this.Unit = unit.Create(Player, Constants.UNIT_SHADOWKITTY_RELIC_SUMMON, kitty.X, kitty.Y)
        this.Unit.SetVertexColor(0, 0, 0, 255)

        // Unit.AddAbility(Constants.ABILITY_APPEAR_AT_SHADOWKITTY);
        Unit.AddAbility(Constants.ABILITY_WIND_WALK)
        Unit.SetAbilityLevel(Constants.ABILITY_WIND_WALK, 3)
        Utility.MakeUnitLocust(this.Unit)
        CollisionDetection.ShadowKittyRegisterCollision(this)
        this.Unit.MovementSpeed = 522
        RelicUtil.CloseRelicBook(kitty)
        PauseKitty(this.Player, true)
        Utility.SelectUnitForPlayer(this.Player, this.Unit)
        this.Active = true
    }

    /// <summary>
    /// Teleports the player's kitty to the shadow kitty's position.
    /// </summary>
    public TeleportToShadowKitty() {
        let kitty = Globals.ALL_KITTIES[Player].Unit
        kitty.SetPosition(Unit.X, Unit.Y)
    }

    /// <summary>
    /// Kills this shadow kitty object, disposing and deregistering it from collision.
    /// </summary>
    public KillShadowKitty() {
        try {
            UnitWithinRange.DeRegisterUnitWithinRangeUnit(this)
            this.Unit.Kill()
            this.Unit.Dispose()
            this.Unit = null
            this.Active = false
            PauseKitty(this.Player, false)
        } catch (e: Error) {
            Logger.Warning('ShadowKitty.KillShadowKitty: {e.Message}')
            throw e
        }
    }

    /// <summary>
    /// The game doesnt register the the abilities or movement, so a reselection is required.
    /// </summary>
    /// <param name="player"></param>
    public SelectReselectShadowKitty() {
        let kitty = Globals.ALL_KITTIES[this.Player].Unit
        Utility.SelectUnitForPlayer(this.Player, this.Unit)
    }

    private static PauseKitty(player: player, paused: boolean) {
        let kitty = Globals.ALL_KITTIES[player].Unit
        kitty.IsPaused = paused
    }

    private RegisterTriggers() {
        this.wCollision = trigger.Create()
        this.cCollision = trigger.Create()
    }
}
