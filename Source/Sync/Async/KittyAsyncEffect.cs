using WCSharp.Api;
using static WCSharp.Api.Common;

/// <summary>
/// C# counterpart of the heroEffect / isHeroEffectActive fields in Escaper.ts, for a Kitty that is
/// RUNNING (order driven), which is what Run Kitty Run is most of the time.
///
/// While enabled (the "-async on" command), a stand-in effect is what the player looks at:
///  - on the OWNING machine it is steered by the click read locally at the press
///    (AsyncClickInput), a network latency before the move order reaches the unit. It runs
///    straight at the unit's move speed towards the clicked point, and the real unit follows the
///    normal order the game gives it. The unit is the authority: the effect is never allowed to
///    lead it by more than MAX_LEAD, it uses the unit as a path guide when its straight line is
///    blocked, and it snaps back to the unit after a teleport or a revive,
///  - on every OTHER machine it is carried by the packets AsyncKittySync relays ten times a
///    second (position, facing, and the point it is heading to), and replayed between them.
///
/// The unit itself is left alone and keeps being the object every synced system reads
/// (collision, items, regions, abilities). It is only drawn transparent while the effect stands in.
/// While the Kitty is on slide terrain (Slider) the effect simply follows the unit.
///
/// Handles: the effect is created once, on every machine alike, when the command enables it, and
/// is parked under the map rather than destroyed when it stands down.
/// </summary>
public class KittyAsyncEffect
{
    /// <summary>
    /// Model the stand-in is drawn with. Object data cannot be read at runtime, so set this to the
    /// model path of the Kitty hero unit (or the current Kitty skin) in the map.
    /// </summary>
    public static string StandInModel = "war3mapImported\\TyrandeWhisperwind.mdx";

    /// <summary>Draw the real unit transparent while the effect stands in. It stays selectable and keeps its health bar.</summary>
    private const bool HIDE_UNIT = true;

    /// <summary>A unit shrunk to this is not drawn at all, whatever alpha windwalk and co. give it.</summary>
    private const float HIDDEN_UNIT_SCALE = 0.001f;
    private const int DEFAULT_GHOST_PERCENT = 80;

    /// <summary>Farthest the effect may run ahead of the unit: about move speed times network latency, with room to spare.</summary>
    private const float MAX_LEAD = 250f;

    /// <summary>Farther than this from the unit, something moved the unit (teleport, revive): the effect snaps back to it.</summary>
    private const float SNAP_DISTANCE = 700f;

    /// <summary>How much faster than the move speed the effect catches up with the unit.</summary>
    private const float CATCH_UP_FACTOR = 1.5f;

    private const float ARRIVE_EPSILON = 2f;

    /// <summary>Degrees a second per point of the unit's turn rate: 0.6 turns half a circle in about half a second.</summary>
    private const float TURN_RATE_TO_DEGREES_PER_SECOND = 600f;

    /// <summary>Used when the turn rate of the unit cannot be read.</summary>
    private const float FALLBACK_TURN_DEGREES_PER_SECOND = 360f;

    /// <summary>
    /// Like a unit, the effect turns on the spot while it is facing this far (or more) from where
    /// it has to go, and only starts to move once it is within it.
    /// </summary>
    private const float PROPULSION_WINDOW = 60f;

    /// <summary>Settling on the unit over less than this does not turn the effect: a tiny correction must not make it twitch.</summary>
    private const float SETTLE_TURN_DISTANCE = 20f;

    /// <summary>A confirmed run whose unit has not moved for this long is over (it reached a wall, or was stopped by something else).</summary>
    private const float UNIT_STILL_TIMEOUT = 0.5f;

    /// <summary>A click guessed locally that no move order confirmed within this long (a click on the UI, say) is dropped.</summary>
    private const float LOCAL_TARGET_TIMEOUT = 0.6f;

    /// <summary>A move order this close to the local guess is taken as the confirmation of that very click.</summary>
    private const float ORDER_AGREE_DISTANCE = 150f;

    /// <summary>
    /// Where the effect stands still after a touch it told the others about, until that touch comes
    /// back from the network (and the Kitty dies or not). Given up after this long whatever happens.
    /// </summary>
    private const float CONTACT_HOLD_TIMEOUT = 1f;

    /// <summary>The owner sends ten packets a second: half a second of silence means it stopped talking.</summary>
    private const float PACKET_SILENCE_TIMEOUT = 0.5f;

    /// <summary>A packet this far from the displayed effect replaces its position, closer ones only pull it halfway.</summary>
    private const float PACKET_SNAP_DISTANCE = 60f;

    private const float PARKED_Z = -10000f;
    private const float RAD_TO_DEG = 57.29578f;
    private const float DEG_TO_RAD = 0.017453292f;

    private static readonly int ORDER_MOVE = OrderId("move");
    private static readonly int ORDER_SMART = OrderId("smart");
    private static readonly int ORDER_STOP = OrderId("stop");
    private static readonly int ORDER_HOLD = OrderId("holdposition");

    private readonly Kitty kitty;
    private effect standIn;
    private trigger pointOrderTrigger;
    private trigger targetOrderTrigger;
    private trigger plainOrderTrigger;

    private float x;
    private float y;
    private float facing;

    private bool hasTarget;
    private float targetX;
    private float targetY;
    private float speed;

    private bool pendingLocal;
    private float pendingSince;

    private float lastUnitX;
    private float lastUnitY;
    private float stillTime;

    private int lastSequence = -1;
    private int outSequence;
    private float lastPacketTime;

    private float contactHoldUntil;
    private bool hasDeathPoint;
    private float deathPointX;
    private float deathPointY;

    private bool unitHidden;
    private int ghostPercent;
    private bool animationIsWalk;
    private bool lastBroadcastMoving;

    /// <summary>Where this machine draws the effect. Differs from one machine to another: never feed it to synced logic.</summary>
    public float X => x;

    public float Y => y;

    /// <summary>Stable identifier carried on the wire: the owning player's id.</summary>
    public int KittyId { get; }

    /// <summary>Set by the "-async on" command: this Kitty is meant to be drawn as an effect.</summary>
    public bool Enabled { get; private set; }

    /// <summary>Enabled and alive: the effect is shown and standing in for the unit right now.</summary>
    public bool IsActive { get; private set; }

    public KittyAsyncEffect(Kitty kitty)
    {
        this.kitty = kitty;
        KittyId = kitty.Player.Id;
    }

    /// <summary>This machine is the one of the player owning the Kitty: the only one that knows where it really is going.</summary>
    public bool IsOwnerHere => GetLocalPlayer() == kitty.Player;

    /// <summary>On slide terrain the Slider moves the unit itself: the effect follows it instead of leading.</summary>
    private bool IsFollowingUnit => kitty.Slider != null && kitty.Slider.IsEnabled() && kitty.Slider.IsOnSlideTerrain();

    /// <summary>Whether a click read on this machine may steer the effect right now.</summary>
    public bool CanBeSteeredLocally => IsActive && !IsFollowingUnit && !kitty.Unit.IsPaused;

    // ------------------------------------------------------------------ enabling

    /// <summary>
    /// Turns the mode on. Called from a chat command, hence on every machine at the same moment:
    /// the handles it makes are made everywhere, as a handle has to be.
    /// </summary>
    public bool Enable()
    {
        if (kitty.ComputerControlled || kitty.Unit == null) return false;

        if (standIn == null) CreateHandle();
        if (standIn == null) return false;

        if (pointOrderTrigger == null) RegisterOrderEvents();

        Enabled = true;

        if (kitty.Unit.Alive) Show();

        return true;
    }

    /// <summary>Turns the mode off: the unit is drawn again and the effect is parked, not destroyed.</summary>
    public void Disable()
    {
        Enabled = false;
        Hide();
    }

    private void CreateHandle()
    {
        standIn = AddSpecialEffect(StandInModel, kitty.Unit.X, kitty.Unit.Y);

        if (standIn == null) return;

        BlzSetSpecialEffectColorByPlayer(standIn, kitty.Player);
        BlzSetSpecialEffectScale(standIn, kitty.ModelScale);
        Park();
    }

    private void RegisterOrderEvents()
    {
        pointOrderTrigger = CreateTrigger();
        TriggerRegisterUnitEvent(pointOrderTrigger, kitty.Unit, EVENT_UNIT_ISSUED_POINT_ORDER);
        TriggerAddAction(pointOrderTrigger, () => OnPointOrder());

        targetOrderTrigger = CreateTrigger();
        TriggerRegisterUnitEvent(targetOrderTrigger, kitty.Unit, EVENT_UNIT_ISSUED_TARGET_ORDER);
        TriggerAddAction(targetOrderTrigger, () => OnTargetOrder());

        plainOrderTrigger = CreateTrigger();
        TriggerRegisterUnitEvent(plainOrderTrigger, kitty.Unit, EVENT_UNIT_ISSUED_ORDER);
        TriggerAddAction(plainOrderTrigger, () => OnPlainOrder());
    }

    // ------------------------------------------------------------------ shown / hidden

    /// <summary>Stands in for the unit again, where the unit is: after enabling, a revive.</summary>
    public void Show()
    {
        if (!Enabled || standIn == null || kitty.Unit == null) return;

        IsActive = true;
        x = kitty.Unit.X;
        y = kitty.Unit.Y;
        facing = GetUnitFacing(kitty.Unit);
        hasTarget = false;
        pendingLocal = false;
        speed = GetUnitMoveSpeed(kitty.Unit);
        lastUnitX = x;
        lastUnitY = y;
        stillTime = 0;
        lastPacketTime = AsyncKittySync.Now;
        lastBroadcastMoving = false;

        SetUnitHidden(true);
        Place();
    }

    /// <summary>Stands down without destroying the handle: the effect waits under the map, the unit is drawn again.</summary>
    public void Hide()
    {
        IsActive = false;
        hasTarget = false;
        pendingLocal = false;

        Park();
        SetUnitHidden(false);
        kitty.NameTag?.FollowUnit();
    }

    /// <summary>
    /// Matches the effect to the unit after its scale changed (morphosis at level 10, a reset, the
    /// -scale command). The effect draws the same model, so it takes the very same factor.
    /// </summary>
    public void RefreshScale()
    {
        if (standIn != null) BlzSetSpecialEffectScale(standIn, kitty.ModelScale);
        ApplyUnitLook();
    }

    /// <summary>
    /// Something set the unit's colour, scale or skin (a reset, a new skin): hide it once more.
    /// Pass true after a skin change, which also brings the shadow back.
    /// </summary>
    public void ReapplyUnitHidden(bool skinChanged = false)
    {
        if (!unitHidden || kitty.Unit == null) return;

        if (skinChanged) RemoveUnitShadow();
        ApplyUnitLook();
    }

    /// <summary>Percent of transparency of the ghost of the real unit (0 = no ghost, the unit is not drawn).</summary>
    public int GhostPercent => ghostPercent;

    /// <summary>Shows the real unit as a see-through ghost following the effect (0 hides it completely).</summary>
    public void SetGhost(int percent)
    {
        ghostPercent = percent < 0 ? 0 : (percent > 95 ? 95 : percent);
        ApplyUnitLook();
    }

    public static int DefaultGhostPercent => DEFAULT_GHOST_PERCENT;

    /// <summary>
    /// The engine's windwalk (and anything else that fades the unit) overrides the vertex alpha,
    /// so a hidden unit is shrunk to nothing instead: no model, no matter its alpha. The ghost
    /// keeps the real scale and a fixed alpha.
    /// </summary>
    private void ApplyUnitLook()
    {
        if (!HIDE_UNIT || !unitHidden || kitty.Unit == null) return;

        if (ghostPercent > 0)
        {
            float s = kitty.ModelScale;
            kitty.Unit.SetScale(s, s, s);
            kitty.Unit.SetVertexColor(255, 255, 255, (int)(255f * (100 - ghostPercent) / 100f));
        }
        else
        {
            kitty.Unit.SetScale(HIDDEN_UNIT_SCALE, HIDDEN_UNIT_SCALE, HIDDEN_UNIT_SCALE);
            kitty.Unit.SetVertexColor(255, 255, 255, 0);
        }
    }

    /// <summary>
    /// The shadow is part of the skin, not of the model: switching to another skin and back drops it
    /// (same trick as the CORE map). It stays gone until the unit gets a new skin.
    /// </summary>
    private void RemoveUnitShadow()
    {
        if (kitty.Unit == null) return;

        int skin = BlzGetUnitSkin(kitty.Unit);
        BlzSetUnitSkin(kitty.Unit, skin == FourCC("hpea") ? FourCC("hfoo") : FourCC("hpea"));
        BlzSetUnitSkin(kitty.Unit, skin);
    }

    private void SetUnitHidden(bool hidden)
    {
        if (!HIDE_UNIT || kitty.Unit == null || unitHidden == hidden) return;

        unitHidden = hidden;

        if (hidden)
        {
            RemoveUnitShadow();
            ApplyUnitLook();
        }
        else
        {
            float s = kitty.ModelScale;
            kitty.Unit.SetScale(s, s, s);
            kitty.Unit.SetVertexColor(255, 255, 255, 255);
        }
    }

    private void Park()
    {
        if (standIn != null) BlzSetSpecialEffectPosition(standIn, 0, 0, PARKED_Z);
    }

    private void Place()
    {
        if (standIn == null) return;

        BlzSetSpecialEffectPosition(standIn, x, y, Screen2World.GetZ(x, y) + GetUnitFlyHeight(kitty.Unit));
        BlzSetSpecialEffectYaw(standIn, facing * DEG_TO_RAD);

        // the name tag and the owner's camera go where the player sees the Kitty
        kitty.NameTag?.FollowPoint(x, y);
    }

    private void ShowAnimation(bool isWalking)
    {
        if (standIn == null || isWalking == animationIsWalk) return;

        animationIsWalk = isWalking;
        BlzPlaySpecialEffect(standIn, isWalking ? ANIM_TYPE_WALK : ANIM_TYPE_STAND);
    }

    // ------------------------------------------------------------------ steering (owning machine)

    /// <summary>
    /// A click read on this machine at the press, a latency before the network order: the effect
    /// starts running at once. Confirmed, or dropped, by the order that follows (see OnPointOrder).
    /// </summary>
    public void SetLocalTarget(float worldX, float worldY)
    {
        if (!CanBeSteeredLocally) return;

        targetX = worldX;
        targetY = worldY;
        hasTarget = true;
        pendingLocal = true;
        pendingSince = AsyncKittySync.Now;
    }

    private void OnPointOrder()
    {
        OnMoveOrder(GetIssuedOrderId(), GetOrderPointX(), GetOrderPointY());
    }

    private void OnTargetOrder()
    {
        var widget = GetOrderTarget();
        if (widget == null) return;

        OnMoveOrder(GetIssuedOrderId(), GetWidgetX(widget), GetWidgetY(widget));
    }

    /// <summary>Orders without a target: a stop or a hold position ends the run on the spot.</summary>
    private void OnPlainOrder()
    {
        int order = GetIssuedOrderId();

        if (order == ORDER_STOP || order == ORDER_HOLD)
        {
            hasTarget = false;
            pendingLocal = false;
        }
    }

    /// <summary>
    /// Runs on every machine, as the order is synced. Only the owner acts on it: the others learn
    /// where the Kitty is heading from its packets.
    /// </summary>
    private void OnMoveOrder(int order, float orderX, float orderY)
    {
        if (!IsActive || !IsOwnerHere) return;
        if (order != ORDER_MOVE && order != ORDER_SMART) return;

        if (pendingLocal)
        {
            // the click this order belongs to was guessed already; one that disagrees is the order of an older click, a newer one is still on its way
            if (Distance(targetX, targetY, orderX, orderY) <= ORDER_AGREE_DISTANCE)
            {
                pendingLocal = false;
            }

            return;
        }

        // no local guess (a click on the minimap, a command from elsewhere): trust the order
        targetX = orderX;
        targetY = orderY;
        hasTarget = true;
    }

    // ------------------------------------------------------------------ advancing (every machine)

    /// <summary>Called by the global tick on every machine, for every Kitty.</summary>
    public void Advance(float dt)
    {
        if (!Enabled || standIn == null || kitty.Unit == null) return;

        if (!kitty.Unit.Alive)
        {
            if (IsActive) Hide();
            return;
        }

        // revived by something other than ReviveKitty (a protection, say)
        if (!IsActive)
        {
            Show();
            return;
        }

        float unitX = kitty.Unit.X;
        float unitY = kitty.Unit.Y;

        if (IsFollowingUnit)
        {
            FollowUnit(unitX, unitY);
            return;
        }

        if (Distance(x, y, unitX, unitY) > SNAP_DISTANCE)
        {
            FollowUnit(unitX, unitY);
            return;
        }

        bool moved;

        if (IsOwnerHere)
        {
            moved = AdvanceOwner(dt, unitX, unitY);
        }
        else
        {
            moved = AdvanceReplica(dt, unitX, unitY);
        }

        ShowAnimation(moved);
        Place();
        DetectContact();
    }

    private void FollowUnit(float unitX, float unitY)
    {
        x = unitX;
        y = unitY;
        facing = GetUnitFacing(kitty.Unit);
        hasTarget = false;
        pendingLocal = false;

        ShowAnimation(false);
        Place();
        DetectContact();
    }

    private bool AdvanceOwner(float dt, float unitX, float unitY)
    {
        speed = GetUnitMoveSpeed(kitty.Unit);

        // stopped where it touched something, waiting for the network to say what that did
        if (AsyncKittySync.Now < contactHoldUntil) return false;

        if (pendingLocal && AsyncKittySync.Now - pendingSince > LOCAL_TARGET_TIMEOUT)
        {
            // never confirmed: it was not a move order after all
            pendingLocal = false;
            hasTarget = false;
        }

        // a paused Kitty, or one whose unit stopped moving for good, is not running anywhere
        stillTime = Distance(unitX, unitY, lastUnitX, lastUnitY) < 0.5f ? stillTime + dt : 0f;
        lastUnitX = unitX;
        lastUnitY = unitY;

        if (hasTarget && !pendingLocal && (kitty.Unit.IsPaused || stillTime > UNIT_STILL_TIMEOUT)) hasTarget = false;

        if (hasTarget)
        {
            if (Distance(x, y, targetX, targetY) <= ARRIVE_EPSILON)
            {
                hasTarget = false;
            }
            else if (Distance(x, y, unitX, unitY) >= MAX_LEAD)
            {
                // far enough ahead: wait for the unit
                return false;
            }
            else if (StepToward(targetX, targetY, speed, dt, true, true))
            {
                return true;
            }
            else
            {
                // blocked on the straight line: the unit knows the way round
                return StepToward(unitX, unitY, speed * CATCH_UP_FACTOR, dt, false, true);
            }
        }

        // nowhere to go: settle on the unit
        float gap = Distance(x, y, unitX, unitY);

        if (gap > ARRIVE_EPSILON)
        {
            return StepToward(unitX, unitY, speed * CATCH_UP_FACTOR, dt, false, gap > SETTLE_TURN_DISTANCE);
        }

        return false;
    }

    private bool AdvanceReplica(float dt, float unitX, float unitY)
    {
        if (AsyncKittySync.Now - lastPacketTime > PACKET_SILENCE_TIMEOUT)
        {
            // its owner went quiet: dropped, frozen or gone. Settle on the unit rather than invent a path.
            hasTarget = false;

            float gap = Distance(x, y, unitX, unitY);

            if (gap > ARRIVE_EPSILON)
            {
                return StepToward(unitX, unitY, speed * CATCH_UP_FACTOR, dt, false, gap > SETTLE_TURN_DISTANCE);
            }

            return false;
        }

        if (!hasTarget) return false;

        if (Distance(x, y, targetX, targetY) <= ARRIVE_EPSILON)
        {
            hasTarget = false;
            return false;
        }

        return StepToward(targetX, targetY, speed, dt, true, true);
    }

    /// <summary>
    /// One step towards a point, sliding along walls the way the Slider does. The effect turns
    /// towards where it goes at the turn rate of the unit, rather than facing it at once, and does
    /// not move while it is still facing too far away from it, as a unit does not. False when
    /// nothing moved: arrived, turning on the spot, or both axes blocked.
    /// </summary>
    private bool StepToward(float toX, float toY, float moveSpeed, float dt, bool checkPathing, bool turn)
    {
        float dx = toX - x;
        float dy = toY - y;
        float distance = SquareRoot(dx * dx + dy * dy);

        if (distance < 0.001f || moveSpeed <= 0) return false;

        if (turn)
        {
            float heading = Atan2(dy, dx) * RAD_TO_DEG;

            if (TurnToward(heading, dt) > PROPULSION_WINDOW) return false;
        }

        float step = moveSpeed * dt;
        if (step > distance) step = distance;

        float newX = x + dx / distance * step;
        float newY = y + dy / distance * step;

        if (checkPathing)
        {
            if (IsBlockedAt(newX, y)) newX = x;
            if (IsBlockedAt(x, newY)) newY = y;
        }

        float movedX = newX - x;
        float movedY = newY - y;

        if (movedX * movedX + movedY * movedY < 0.0001f) return false;

        x = newX;
        y = newY;
        return true;
    }

    /// <summary>What stops the unit stops the effect: the terrain, and the barrier (destructables the terrain check cannot see).</summary>
    private static bool IsBlockedAt(float px, float py)
    {
        return IsTerrainPathable(px, py, PATHING_TYPE_WALKABILITY) || BarrierSetup.IsBlocked(px, py);
    }

    /// <summary>Turns the facing towards an angle by at most the turn rate allows in dt. Returns how far it still is from it afterwards.</summary>
    private float TurnToward(float desired, float dt)
    {
        float diff = AngleDifference(desired, facing);
        float maxTurn = GetTurnDegreesPerSecond() * dt;

        if (diff <= maxTurn && diff >= -maxTurn)
        {
            facing = desired;
            return 0f;
        }

        facing += diff > 0 ? maxTurn : -maxTurn;

        while (facing >= 360f) facing -= 360f;
        while (facing < 0f) facing += 360f;

        float left = diff > 0 ? diff - maxTurn : maxTurn + diff;
        return left < 0 ? -left : left;
    }

    private float GetTurnDegreesPerSecond()
    {
        float turnRate = BlzGetUnitRealField(kitty.Unit, UNIT_RF_TURN_RATE);

        return turnRate > 0 ? turnRate * TURN_RATE_TO_DEGREES_PER_SECOND : FALLBACK_TURN_DEGREES_PER_SECOND;
    }

    /// <summary>Signed shortest angle from one facing to another, between -180 and 180.</summary>
    private static float AngleDifference(float to, float from)
    {
        float diff = to - from;

        while (diff > 180f) diff -= 360f;
        while (diff < -180f) diff += 360f;

        return diff;
    }

    private static float Distance(float x1, float y1, float x2, float y2)
    {
        float dx = x2 - x1;
        float dy = y2 - y1;
        return SquareRoot(dx * dx + dy * dy);
    }

    // ------------------------------------------------------------------ contact

    /// <summary>
    /// Owner only: reads what the effect touches and tells everyone. The effect stops on the spot
    /// meanwhile, so the Kitty dies where it was seen to touch, not a round of the network further.
    /// </summary>
    private void DetectContact()
    {
        if (!IsOwnerHere || !IsActive) return;
        if (AsyncKittySync.Now < contactHoldUntil) return;

        if (!AsyncContact.TryDetect(kitty, x, y, out var kind, out var id)) return;

        contactHoldUntil = AsyncKittySync.Now + CONTACT_HOLD_TIMEOUT;
        hasTarget = false;
        pendingLocal = false;

        AsyncKittySync.SendContact(KittyId, kind, id, x, y);
    }

    /// <summary>The contact came back: an effect it did not kill moves on again.</summary>
    public void ReleaseContactHold()
    {
        contactHoldUntil = 0;
    }

    /// <summary>Every machine learns where the effect was at the touch, from the packet: the same numbers everywhere.</summary>
    public void SetContactPoint(float contactX, float contactY)
    {
        hasDeathPoint = true;
        deathPointX = contactX;
        deathPointY = contactY;
    }

    public void ClearContactPoint()
    {
        hasDeathPoint = false;
    }

    /// <summary>
    /// Called by KillKitty right before the unit dies: a Kitty killed by a contact told by the
    /// network dies where its effect was, which every machine agrees on, rather than where its
    /// unit had got to a latency behind.
    /// </summary>
    public void ApplyDeathPointToUnit()
    {
        if (!hasDeathPoint || kitty.Unit == null) return;

        hasDeathPoint = false;

        kitty.Unit.SetPathing(false);
        kitty.Unit.SetPosition(deathPointX, deathPointY);
        kitty.Unit.SetPathing(true);
    }

    // ------------------------------------------------------------------ packets

    /// <summary>Read on the owning machine, ten times a second, to broadcast where the Kitty is and where it heads.</summary>
    public KittyMovementState GetLocalMovementState()
    {
        return new KittyMovementState(x, y, facing, targetX, targetY, hasTarget, speed);
    }

    /// <summary>
    /// Whether the owner has something to tell: it is moving, or it just stopped (one last packet
    /// so the others stop too). A resting Kitty costs no traffic.
    /// </summary>
    public bool TryTakeBroadcast(out int sequence, out KittyMovementState state)
    {
        sequence = 0;
        state = default;

        if (!IsActive || IsFollowingUnit) return false;
        if (!hasTarget && !lastBroadcastMoving) return false;

        lastBroadcastMoving = hasTarget;
        outSequence++;

        sequence = outSequence;
        state = GetLocalMovementState();
        return true;
    }

    /// <summary>Applied from a Position packet on every machine. The sender is already ahead of it and learns nothing.</summary>
    public void ApplyPosition(int sequence, KittyMovementState movement)
    {
        if (!IsActive || sequence <= lastSequence) return;

        lastSequence = sequence;

        if (IsOwnerHere) return;

        lastPacketTime = AsyncKittySync.Now;

        if (Distance(x, y, movement.X, movement.Y) > PACKET_SNAP_DISTANCE)
        {
            x = movement.X;
            y = movement.Y;
        }
        else
        {
            x += (movement.X - x) * 0.5f;
            y += (movement.Y - y) * 0.5f;
        }

        hasTarget = movement.IsMoving;
        targetX = movement.TargetX;
        targetY = movement.TargetY;
        speed = movement.Speed;
    }

    // ------------------------------------------------------------------ cleanup

    public void Dispose()
    {
        Enabled = false;
        IsActive = false;
        SetUnitHidden(false);

        pointOrderTrigger?.Dispose();
        targetOrderTrigger?.Dispose();
        plainOrderTrigger?.Dispose();
        pointOrderTrigger = null;
        targetOrderTrigger = null;
        plainOrderTrigger = null;

        kitty.NameTag?.FollowUnit();

        if (standIn != null)
        {
            DestroyEffect(standIn);
            standIn = null;
        }
    }
}
