using System.Collections.Generic;
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
    public static string StandInModel = "war3mapImported\\TyrandeWhisperwind.mdl";

    /// <summary>Draw the real unit transparent while the effect stands in. It stays selectable and keeps its health bar.</summary>
    private const bool HIDE_UNIT = true;

    /// <summary>A unit shrunk to this is not drawn at all, whatever alpha windwalk and co. give it.</summary>
    private const float HIDDEN_UNIT_SCALE = 0.001f;
    private const int DEFAULT_GHOST_PERCENT = 80;

    /// <summary>Farthest the effect may run ahead of the unit: about move speed times network latency, with room to spare.</summary>
    private static float MAX_LEAD => AsyncTuning.Get(0);

    /// <summary>Farther than this from the unit, something moved the unit (teleport, revive): the effect snaps back to it.</summary>
    private static float SNAP_DISTANCE => AsyncTuning.Get(1);

    /// <summary>How much faster than the move speed the effect catches up with the unit.</summary>
    private static float CATCH_UP_FACTOR => AsyncTuning.Get(2);

    private static float ARRIVE_EPSILON => AsyncTuning.Get(3);

    /// <summary>Degrees a second per point of the unit's turn rate: 0.6 turns half a circle in about half a second.</summary>
    private static float TURN_RATE_TO_DEGREES_PER_SECOND => AsyncTuning.Get(4);

    /// <summary>Used when the turn rate of the unit cannot be read.</summary>
    private static float FALLBACK_TURN_DEGREES_PER_SECOND => AsyncTuning.Get(5);

    /// <summary>
    /// Like a unit, the effect turns on the spot while it is facing this far (or more) from where
    /// it has to go, and only starts to move once it is within it.
    /// </summary>
    private static float PROPULSION_WINDOW => AsyncTuning.Get(6);

    /// <summary>Settling on the unit over less than this does not turn the effect: a tiny correction must not make it twitch.</summary>
    private static float SETTLE_TURN_DISTANCE => AsyncTuning.Get(7);

    /// <summary>A confirmed run whose unit has not moved for this long is over (it reached a wall, or was stopped by something else).</summary>
    private static float UNIT_STILL_TIMEOUT => AsyncTuning.Get(8);

    /// <summary>A click guessed locally that no move order confirmed within this long (a click on the UI, say) is dropped.</summary>
    private static float LOCAL_TARGET_TIMEOUT => AsyncTuning.Get(9);

    /// <summary>A move order this close to the local guess is taken as the confirmation of that very click.</summary>
    private static float ORDER_AGREE_DISTANCE => AsyncTuning.Get(10);

    /// <summary>
    /// Where the effect stands still after a touch it told the others about, until that touch comes
    /// back from the network (and the Kitty dies or not). Given up after this long whatever happens.
    /// </summary>
    private static float CONTACT_HOLD_TIMEOUT => AsyncTuning.Get(11);

    /// <summary>The owner sends ten packets a second: half a second of silence means it stopped talking.</summary>
    private static float PACKET_SILENCE_TIMEOUT => AsyncTuning.Get(12);

    /// <summary>A packet this far from the displayed effect replaces its position, closer ones only pull it halfway.</summary>
    private static float PACKET_SNAP_DISTANCE => AsyncTuning.Get(13);

    /// <summary>The effect wants to move, cannot, and the unit does: after this long it goes where the unit went.</summary>
    private static float BLOCKED_TIMEOUT => AsyncTuning.Get(14);

    /// <summary>How fast (per second, of the remaining gap) the effect glides back to a unit that got ahead of it.</summary>
    private static float GLIDE_RATE => AsyncTuning.Get(15);

    // heights (before the Kitty's scale) the attachments of rewards are drawn at, standing in for the unit's attachment points
    private static float ATTACH_HEIGHT_OVERHEAD => AsyncTuning.Get(16);
    private static float ATTACH_HEIGHT_HEAD => AsyncTuning.Get(17);
    private static float ATTACH_HEIGHT_CHEST => AsyncTuning.Get(18);
    private static float ATTACH_HEIGHT_HAND => AsyncTuning.Get(19);

    // seconds of lead (the effect ahead of the unit) allowed before the effect eases off
    private static float LEAD_TIME => AsyncTuning.Get(23);
    // seconds an observer's packet is already old when it arrives
    private static float REPLICA_LAG => AsyncTuning.Get(24);
    // per second: how fast an observer's effect takes up the error a packet shows
    private static float CORRECTION_RATE => AsyncTuning.Get(25);
    // after a click: the longest an order may take to land, and how long the unit then has to start moving
    private const float ORDER_GRACE = 1.2f;
    private const float ORDER_START_GRACE = 0.5f;

    // how far from the unit a stopped effect may stay without being moved at all
    private static float SETTLE_TOLERANCE => AsyncTuning.Get(29);

    // a unit that moves further than a run of a few ticks plus this did not run: it was teleported
    private const float TELEPORT_MARGIN = 25f;

    // seconds the unit has stood still before the effect starts easing the last few units onto it
    private static float SETTLE_DELAY => AsyncTuning.Get(28);

    // while the button is held: seconds between orders to the unit (0 = never) and how far the cursor must have moved
    private static float HOLD_INTERVAL => AsyncTuning.Get(26);
    private static float HOLD_DISTANCE => AsyncTuning.Get(27);

    // the walk animation only gives way to standing after this long without moving: no flicker
    private const float STAND_DELAY = 0.12f;

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

    /// <summary>Until then a unit that is not moving yet is not taken as a unit that stopped: an order takes a while to land.</summary>
    private float orderGraceUntil;

    // the last point a move order was asked for (by a click, or by SteerUnit) and when SteerUnit last asked
    private bool hasIssuedOrder;
    private float issuedOrderX;
    private float issuedOrderY;
    private float lastSteerTime = -10f;
    private float lastLocalTargetTime = -10f;
    private bool hasPrevUnit;
    private float prevUnitX;
    private float prevUnitY;

    // the course the effect was on when a contact stopped it, to take up again if the contact did not end it
    private bool heldHadTarget;
    private float heldTargetX;
    private float heldTargetY;
    private float blockedTime;
    private bool stepWasBlocked;
    private int slideSide = 1;
    private float notMovedTime;
    private float correctionX;
    private float correctionY;
    private float unitVelocityX;
    private float unitVelocityY;
    private string currentModel = "";
    private readonly HashSet<int> touching = new HashSet<int>();
    private readonly List<Follower> followers = new List<Follower>();

    private sealed class Follower
    {
        public effect Effect;
        public string Point;
    }

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

    /// <summary>Which safezones / wolf areas the effect stands in (see AsyncZones); owner side only reads it.</summary>
    private readonly bool[] zonesInside = new bool[AsyncZones.Count];

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
        currentModel = AsyncSkinModels.For(BlzGetUnitSkin(kitty.Unit));
        animationIsWalk = false;
        standIn = AddSpecialEffect(currentModel, kitty.Unit.X, kitty.Unit.Y);

        if (standIn == null) return;

        ApplyTint();
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

        RefreshModel();

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
        correctionX = 0f;
        correctionY = 0f;
        notMovedTime = 0f;
        hasPrevUnit = false;

        SetUnitHidden(true);
        Place();

        // revived on top of a wolf: it takes leaving and coming back to touch it, as with the unit
        AsyncContact.Seed(kitty, x, y, touching);
        AsyncZones.Seed(zonesInside, x, y);

        RebuildRewardEffects();
    }

    /// <summary>Stands down without destroying the handle: the effect waits under the map, the unit is drawn again.</summary>
    public void Hide()
    {
        bool wasActive = IsActive;
        IsActive = false;
        hasTarget = false;
        pendingLocal = false;

        Park();
        SetUnitHidden(false);
        kitty.NameTag?.FollowUnit();

        if (wasActive) RebuildRewardEffects();
    }

    /// <summary>
    /// Hats, wings, auras and trails hang on the unit, which is invisible while the effect stands in
    /// (and a latency behind it). Applying the saved rewards again makes them where they belong now:
    /// at the effect while it is active, on the unit when it is not (Kitty.AddKittyEffect decides).
    /// </summary>
    private void RebuildRewardEffects()
    {
        try
        {
            AwardManager.SetPlayerSelectedData(kitty);
        }
        catch (System.Exception ex)
        {
            Logger.Warning($"Async rewards rebuild: {ex.Message}");
        }
    }

    /// <summary>
    /// Matches the effect to the unit after its scale changed (morphosis at level 10, a reset, the
    /// -scale command). The effect draws the same model, so it takes the very same factor.
    /// </summary>
    public void RefreshScale()
    {
        if (standIn != null) BlzSetSpecialEffectScale(standIn, kitty.ModelScale);
        foreach (var f in followers) BlzSetSpecialEffectScale(f.Effect, kitty.ModelScale);
        ApplyUnitLook();
    }

    /// <summary>
    /// Something set the unit's colour, scale or skin (a reset, a new skin): hide it once more.
    /// Pass true after a skin change, which also brings the shadow back.
    /// </summary>
    public void ReapplyUnitHidden(bool skinChanged = false)
    {
        if (skinChanged) RefreshModel();

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

    /// <summary>
    /// A visual that would be attached to the unit (a windwalk model, say) is drawn on the unit,
    /// which is invisible and a latency behind. This makes it at the effect and keeps it there.
    /// Free it with <see cref="DestroyFollower"/>. Made on every machine alike: no sync data needed.
    /// </summary>
    public effect AddFollower(string model, string attachPoint = "origin")
    {
        var e = AddSpecialEffect(model, x, y);
        BlzSetSpecialEffectScale(e, kitty.ModelScale);

        var f = new Follower { Effect = e, Point = attachPoint ?? "origin" };
        followers.Add(f);
        PlaceFollower(f);
        return e;
    }

    public void DestroyFollower(effect e)
    {
        if (e == null) return;

        for (int i = 0; i < followers.Count; i++)
        {
            if (followers[i].Effect != e) continue;

            followers.RemoveAt(i);
            break;
        }

        e.Dispose();
    }

    /// <summary>
    /// The effect has no attachment points, so the point the model would have hung on is a height
    /// above the ground instead (tune to the Kitty model). Scales with the Kitty.
    /// </summary>
    private float AttachHeight(string point)
    {
        float height;

        switch (point)
        {
            case "overhead": height = ATTACH_HEIGHT_OVERHEAD; break;
            case "head": height = ATTACH_HEIGHT_HEAD; break;
            case "chest": height = ATTACH_HEIGHT_CHEST; break;
            case "hand left":
            case "hand right": height = ATTACH_HEIGHT_HAND; break;
            default: height = 0f; break;
        }

        return height * kitty.ModelScale / Kitty.DefaultModelScale;
    }

    private void PlaceFollower(Follower f)
    {
        BlzSetSpecialEffectPosition(f.Effect, x, y, Screen2World.GetZ(x, y) + GetUnitFlyHeight(kitty.Unit) + AttachHeight(f.Point));
        BlzSetSpecialEffectYaw(f.Effect, facing * DEG_TO_RAD);
    }

    private void ClearFollowers()
    {
        foreach (var f in followers) f.Effect.Dispose();
        followers.Clear();
    }

    private void Park()
    {
        if (standIn != null) BlzSetSpecialEffectPosition(standIn, 0, 0, PARKED_Z);
        foreach (var f in followers) BlzSetSpecialEffectPosition(f.Effect, 0, 0, PARKED_Z);
    }

    private void Place()
    {
        if (standIn == null) return;

        BlzSetSpecialEffectPosition(standIn, x, y, Screen2World.GetZ(x, y) + GetUnitFlyHeight(kitty.Unit));
        BlzSetSpecialEffectYaw(standIn, facing * DEG_TO_RAD);

        for (int i = 0; i < followers.Count; i++) PlaceFollower(followers[i]);

        // the name tag and the owner's camera go where the player sees the Kitty
        kitty.NameTag?.FollowPoint(x, y);
    }

    private void ShowAnimation(bool isWalking)
    {
        if (standIn == null) return;

        // walking starts at once, standing only after a short while: a stall of a tick or two
        // (a turn, a wall) must not restart the animation each time
        if (isWalking) notMovedTime = 0f;
        else notMovedTime += AsyncTuning.Get(22);

        if (!isWalking && notMovedTime < STAND_DELAY) isWalking = animationIsWalk;

        if (isWalking == animationIsWalk) return;

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
        orderGraceUntil = AsyncKittySync.Now + ORDER_GRACE;
        lastLocalTargetTime = AsyncKittySync.Now;
    }

    /// <summary>The press of a click: the game itself issues that order, so it is only noted, not sent again.</summary>
    public void NoteClickOrder(float worldX, float worldY)
    {
        hasIssuedOrder = true;
        issuedOrderX = worldX;
        issuedOrderY = worldY;
        lastSteerTime = AsyncKittySync.Now;
    }

    /// <summary>
    /// The button is held and the cursor has moved on, but the unit is still on its first order. Gives
    /// it a new one, though not a stream of them: at most one per holdinterval seconds, and only if
    /// the cursor is holddistance or more from the last order. <paramref name="final"/> (the
    /// button was released) sends the exact end point, so the unit stops where the effect does.
    /// Setting holdinterval to 0 turns this off.
    /// </summary>
    public void SteerUnit(float worldX, float worldY, bool final)
    {
        if (!IsOwnerHere || !IsActive) return;

        float interval = HOLD_INTERVAL;
        if (interval <= 0f) return;

        float away = hasIssuedOrder ? Distance(worldX, worldY, issuedOrderX, issuedOrderY) : 1000000f;

        if (final)
        {
            if (away < 25f) return;
        }
        else
        {
            if (AsyncKittySync.Now - lastSteerTime < interval) return;
            if (away < HOLD_DISTANCE) return;
        }

        NoteClickOrder(worldX, worldY);
        AsyncKittySync.SendSteer(KittyId, worldX, worldY);
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

                // The click was turned into a world point by an approximation; the order holds the
                // exact one the unit goes to. Taking it up now (the effect only bends its course a
                // little on the way) is what keeps the effect from ending a few units off the unit.
                // Not while the button is still held: the cursor has moved on since that order.
                if (AsyncKittySync.Now - lastLocalTargetTime > 0.15f)
                {
                    targetX = orderX;
                    targetY = orderY;
                }

                // the order has landed but the unit has not started yet: do not mistake that for a stop
                orderGraceUntil = AsyncKittySync.Now + ORDER_START_GRACE;
            }

            return;
        }

        // no local guess (a click on the minimap, a command from elsewhere): trust the order
        targetX = orderX;
        targetY = orderY;
        hasTarget = true;
        orderGraceUntil = AsyncKittySync.Now + ORDER_START_GRACE;
    }

    // ------------------------------------------------------------------ advancing (every machine)

    /// <summary>Called by the global tick on every machine, for every Kitty.</summary>
    public void Advance(float dt)
    {
        AdvanceCore(dt);

        // every way out of the step above counts (a slide, a jump, a snap): where the effect ended up decides the zones
        if (IsActive && IsOwnerHere && kitty.Unit != null)
        {
            AsyncZones.Scan(KittyId, zonesInside, x, y);
            TryPickup();
        }
    }

    private float nextPickupTime;

    /// <summary>
    /// Owner only: the unit is hidden and behind, so it would never walk over what the effect runs over.
    /// When something lies under the effect, the unit is told to take it (a few times a second at most).
    /// While sliding the Slider does this itself from the unit.
    /// </summary>
    private void TryPickup()
    {
        if (IsFollowingUnit) return;
        if (AsyncKittySync.Now < nextPickupTime) return;
        if (!ItemSpatialGrid.AnythingNear(x, y, AsyncKittySync.PICKUP_RADIUS)) return;

        nextPickupTime = AsyncKittySync.Now + 0.3f;
        AsyncKittySync.SendPickup(KittyId, x, y);
    }

    private void AdvanceCore(float dt)
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
            hasPrevUnit = false;
            FollowUnit(unitX, unitY);
            return;
        }

        // The unit jumped (Shard of Translocation, Fang of Shadows, a rewind, a summon, a command, a
        // round reset): the effect goes with it at once rather than running after it. More than a run
        // could cover in a few ticks counts as a jump; callers that know can say so with TeleportToUnit,
        // which also catches the short ones. The unit's order, if any, carries on from the new place.
        if (hasPrevUnit && Distance(prevUnitX, prevUnitY, unitX, unitY) > GetUnitMoveSpeed(kitty.Unit) * dt * 3f + TELEPORT_MARGIN)
        {
            prevUnitX = unitX;
            prevUnitY = unitY;
            JumpToUnit(unitX, unitY);
            return;
        }

        prevUnitX = unitX;
        prevUnitY = unitY;
        hasPrevUnit = true;

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

    /// <summary>
    /// For anything that moves the unit in one go: the effect is put where the unit now is. Detected
    /// by itself within a tick; this is for callers that want it that very moment.
    /// </summary>
    public void TeleportToUnit()
    {
        if (!IsActive || kitty.Unit == null) return;

        prevUnitX = kitty.Unit.X;
        prevUnitY = kitty.Unit.Y;
        hasPrevUnit = true;
        JumpToUnit(kitty.Unit.X, kitty.Unit.Y);
    }

    private void JumpToUnit(float unitX, float unitY)
    {
        x = unitX;
        y = unitY;
        correctionX = 0f;
        correctionY = 0f;
        lastUnitX = unitX;
        lastUnitY = unitY;
        stillTime = 0f;
        blockedTime = 0f;
        orderGraceUntil = AsyncKittySync.Now + ORDER_START_GRACE;

        facing = GetUnitFacing(kitty.Unit);

        // what it was running to is kept: the unit carries on to it from its new place.
        // (What it touches there is judged as ever: a wolf at the new place is a new touch.)
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
        unitVelocityX = unitX - lastUnitX;
        unitVelocityY = unitY - lastUnitY;
        stillTime = Distance(unitX, unitY, lastUnitX, lastUnitY) < 0.5f ? stillTime + dt : 0f;
        lastUnitX = unitX;
        lastUnitY = unitY;

        if (hasTarget && !pendingLocal && (kitty.Unit.IsPaused || (stillTime > UNIT_STILL_TIMEOUT && AsyncKittySync.Now > orderGraceUntil))) hasTarget = false;

        if (!hasTarget) blockedTime = 0f;

        if (hasTarget)
        {
            if (Distance(x, y, targetX, targetY) <= ARRIVE_EPSILON)
            {
                hasTarget = false;
            }
            else
            {
                // how far the effect is ahead of the unit along the way to the target: it slows down
                // smoothly as that grows (and speeds up when it is behind), instead of stopping dead
                float ahead = Distance(unitX, unitY, targetX, targetY) - Distance(x, y, targetX, targetY);
                float factor = LeadSpeedFactor(ahead, speed * LEAD_TIME);

                if (factor <= 0.02f) return false;

                return StepOrChase(dt, unitX, unitY, speed * factor);
            }
        }

        // nowhere to go. The unit may still be on its way to the very place the effect has
        // already reached: then the effect stands and waits for it, rather than turning round
        // to walk back to a unit that is about to arrive
        if (stillTime == 0f && IsAheadOfMovingUnit(unitX, unitY)) return false;

        return SettleOnUnit(dt, unitX, unitY);
    }

    /// <summary>True when the effect lies in the direction the unit is moving in, not too far off.</summary>
    private bool IsAheadOfMovingUnit(float unitX, float unitY)
    {
        float dx = x - unitX;
        float dy = y - unitY;

        if (dx * dx + dy * dy > 600f * 600f) return false;

        return dx * unitVelocityX + dy * unitVelocityY > 0f;
    }

    /// <summary>
    /// Speed factor from the lead: full speed up to the soft lead, easing down to a stop at MAX_LEAD
    /// (so the lead settles instead of ever being cut), and up to the catch-up factor when behind.
    /// </summary>
    private static float LeadSpeedFactor(float ahead, float allowedLead)
    {
        if (ahead <= 0f)
        {
            float behind = -ahead / MAX_LEAD;
            if (behind > 1f) behind = 1f;

            return 1f + behind * (CATCH_UP_FACTOR - 1f);
        }

        // the lead a network delay makes is normal and must not change the speed at all: only
        // a lead far beyond it (the unit is not following) eases the effect off
        if (allowedLead < 1f) return 1f;

        float t = ahead / allowedLead;

        if (t >= 1f) return 0f;
        if (t <= 0.8f) return 1f;

        return (1f - t) / 0.2f;
    }

    /// <summary>
    /// Nothing to do but be where the unit is. A far stray walks back (turning, as a unit would),
    /// a near one eases over without a visible turn.
    /// </summary>
    private bool SettleOnUnit(float dt, float unitX, float unitY, bool urgent = false)
    {
        float gap = Distance(x, y, unitX, unitY);

        if (gap <= ARRIVE_EPSILON) return false;

        // Close enough is left alone: a few units between the effect and the unit are not worth any
        // movement that could be seen. (Every order ends on the exact point for both, so it never adds up.)
        if (!urgent && gap <= SETTLE_TOLERANCE) return false;

        if (gap > SETTLE_TURN_DISTANCE * 3f)
        {
            return StepToward(unitX, unitY, speed * CATCH_UP_FACTOR, dt, false, true);
        }

        // A bigger difference after a stop is put right slowly and late: a quick slide, however short,
        // is what shows. (A unit being chased because the effect is blocked is urgent.)
        if (!urgent && IsOwnerHere && stillTime < SETTLE_DELAY) return false;

        return GlideToward(unitX, unitY, dt, urgent);
    }

    private bool AdvanceReplica(float dt, float unitX, float unitY)
    {
        float take = CORRECTION_RATE * dt;

        if (take > 1f) take = 1f;

        x += correctionX * take;
        y += correctionY * take;
        correctionX -= correctionX * take;
        correctionY -= correctionY * take;

        if (AsyncKittySync.Now - lastPacketTime > PACKET_SILENCE_TIMEOUT)
        {
            // its owner went quiet: dropped, frozen or gone. Settle on the unit rather than invent a path.
            hasTarget = false;

            return SettleOnUnit(dt, unitX, unitY);
        }

        if (!hasTarget) return false;

        if (Distance(x, y, targetX, targetY) <= ARRIVE_EPSILON)
        {
            hasTarget = false;
            return false;
        }

        return StepOrChase(dt, unitX, unitY, speed);
    }

    /// <summary>
    /// A step towards the target. When the effect cannot make one (walls on both axes, a corner)
    /// for a moment it is left behind by a unit that did get round, and goes where the unit goes.
    /// Turning on the spot is no reason to give up.
    /// </summary>
    private bool StepOrChase(float dt, float unitX, float unitY, float moveSpeed)
    {
        if (blockedTime < BLOCKED_TIMEOUT)
        {
            if (StepToward(targetX, targetY, moveSpeed, dt, true, true))
            {
                blockedTime = 0f;
                return true;
            }

            if (!stepWasBlocked) return false; // turning

            blockedTime += dt;
            return false;
        }

        return ChaseUnit(dt, unitX, unitY);
    }

    /// <summary>
    /// The effect cannot get on by itself. The unit is what the game believes, so the effect goes
    /// where the unit goes (through the walls it got round, no pathing check), at catch-up speed,
    /// and only stops waiting once it has caught it. Time spent turning on the spot is not "blocked".
    /// </summary>
    private bool ChaseUnit(float dt, float unitX, float unitY)
    {
        bool moved = SettleOnUnit(dt, unitX, unitY, true);

        // caught up with it: try the straight line again
        if (Distance(x, y, unitX, unitY) < MAX_LEAD * 0.2f) blockedTime = 0f;

        return moved;
    }

    /// <summary>
    /// Eases the effect onto the unit without a turn-around: it keeps heading the way the real unit
    /// is facing (which is smooth) while its position slides over, quickly when far and gently when
    /// close, so correcting a stray effect never shows as a U-turn or a jump.
    /// </summary>
    private bool GlideToward(float unitX, float unitY, float dt, bool urgent)
    {
        float gap = Distance(x, y, unitX, unitY);

        if (gap <= ARRIVE_EPSILON) return false;

        TurnToward(GetUnitFacing(kitty.Unit), dt);

        float step = gap * GLIDE_RATE * (urgent ? 4f : 1f) * dt;
        float most = speed * CATCH_UP_FACTOR * dt;

        // never less than a creep, or the last few units would take forever
        float least = 15f * dt;
        if (step < least) step = least;

        // never faster than a run: no slingshot
        if (step > most) step = most;
        if (step > gap) step = gap;

        x += (unitX - x) / gap * step;
        y += (unitY - y) / gap * step;

        // easing over a short distance is a correction, not a walk: no walking animation, no moonwalk
        return false;
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

        stepWasBlocked = false;

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

        // standing inside something blocked (the margin of the barrier, a pathing edge) the effect
        // may leave it in any direction rather than be held in place by it
        if (checkPathing && !IsBlockedAt(x, y) && IsBlockedAt(newX, newY))
        {
            // blocked head on: slide along the wall in the nearest free direction, the way a unit
            // does, rather than only along the axes (which sticks at diagonals and corners)
            if (!TrySlide(dx / distance, dy / distance, step, out newX, out newY))
            {
                newX = x;
                newY = y;

                if (!IsBlockedAt(x + (dx / distance) * step, y)) newX = x + (dx / distance) * step;
                else if (!IsBlockedAt(x, y + (dy / distance) * step)) newY = y + (dy / distance) * step;
            }
        }

        float movedX = newX - x;
        float movedY = newY - y;

        if (movedX * movedX + movedY * movedY < 0.0001f)
        {
            stepWasBlocked = true;
            return false;
        }

        x = newX;
        y = newY;
        return true;
    }

    private static readonly float[] SlideAngles = { 35f, 70f, 90f };

    private bool TrySlide(float dirX, float dirY, float step, out float newX, out float newY)
    {
        for (int i = 0; i < SlideAngles.Length; i++)
        {
            float radians = SlideAngles[i] * DEG_TO_RAD;
            float cos = Cos(radians);
            float sin = Sin(radians);
            float scale = cos < 0.3f ? 0.3f : cos;

            // the side it slid on last time first: no flipping from side to side at a head-on wall
            for (int k = 0; k < 2; k++)
            {
                int side = k == 0 ? slideSide : -slideSide;
                float rx = dirX * cos - dirY * sin * side;
                float ry = dirX * sin * side + dirY * cos;

                newX = x + rx * step * scale;
                newY = y + ry * step * scale;

                if (IsBlockedAt(newX, newY)) continue;

                slideSide = side;
                return true;
            }
        }

        newX = x;
        newY = y;
        return false;
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

        if (!AsyncContact.TryDetect(kitty, x, y, touching, out var kind, out var id)) return;

        // A revive circle is no danger: the effect runs on while the network revives the teammate.
        // A wolf stops it where it was seen to touch, since the Kitty most likely dies there.
        if (kind != AsyncContact.KIND_CIRCLE)
        {
            contactHoldUntil = AsyncKittySync.Now + CONTACT_HOLD_TIMEOUT;
            heldHadTarget = hasTarget;
            heldTargetX = targetX;
            heldTargetY = targetY;
            hasTarget = false;
            pendingLocal = false;
        }

        AsyncKittySync.SendContact(KittyId, kind, id, x, y);
    }

    /// <summary>The contact came back: an effect it did not kill moves on again.</summary>
    public void ReleaseContactHold()
    {
        contactHoldUntil = 0;

        // it survived the touch (an invulnerable Kitty, a wolf that was reviving): back on its way
        if (heldHadTarget && IsActive && !hasTarget)
        {
            hasTarget = true;
            targetX = heldTargetX;
            targetY = heldTargetY;
        }

        heldHadTarget = false;
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

        // the packet is a little old: where it says the effect was, moved on along its way
        float packetX = movement.X;
        float packetY = movement.Y;

        if (movement.IsMoving && movement.Speed > 0 && REPLICA_LAG > 0f)
        {
            float toX = movement.TargetX - packetX;
            float toY = movement.TargetY - packetY;
            float toDistance = SquareRoot(toX * toX + toY * toY);
            float advance = movement.Speed * REPLICA_LAG;

            if (advance > toDistance) advance = toDistance;

            if (toDistance > 0.001f)
            {
                packetX += toX / toDistance * advance;
                packetY += toY / toDistance * advance;
            }
        }

        if (Distance(x, y, packetX, packetY) > PACKET_SNAP_DISTANCE * 3f)
        {
            x = packetX;
            y = packetY;
            correctionX = 0f;
            correctionY = 0f;
        }
        else
        {
            // taken up smoothly over the next ticks, never in one jump
            correctionX = packetX - x;
            correctionY = packetY - y;
        }

        hasTarget = movement.IsMoving;
        targetX = movement.TargetX;
        targetY = movement.TargetY;
        speed = movement.Speed;
    }

    // ------------------------------------------------------------------ cleanup

    /// <summary>The Kitty's colours changed (-sc, -color, a reset): the effect takes them too.</summary>
    public void RefreshTint()
    {
        ApplyTint();
        ApplyUnitLook(); // a colour set on the unit also set its alpha: the hidden or ghost look is put back
    }

    private void ApplyTint()
    {
        if (standIn == null) return;

        BlzSetSpecialEffectColorByPlayer(standIn, (kitty.TeamColorIndex >= 0 && kitty.TeamColorIndex < 24) ? Player(kitty.TeamColorIndex) : kitty.Player);
        BlzSetSpecialEffectColor(standIn, kitty.VertexRed, kitty.VertexGreen, kitty.VertexBlue);
    }

    /// <summary>
    /// The effect is drawn with the model of the skin the unit wears. An effect cannot change its
    /// model, so a new skin means a new effect: done on every machine at once (skins are applied
    /// everywhere), the old one is freed and the new one takes its place.
    /// </summary>
    public void RefreshModel()
    {
        if (standIn == null || kitty.Unit == null) return;

        var path = AsyncSkinModels.For(BlzGetUnitSkin(kitty.Unit));

        if (path == currentModel) return;

        DestroyEffect(standIn);
        standIn = null;
        CreateHandle();

        if (standIn == null) return;

        if (IsActive) Place();
    }

    /// <summary>One line of what the effect is doing, for the debug command. Display only.</summary>
    public string Describe()
    {
        float ux = kitty.Unit.X;
        float uy = kitty.Unit.Y;

        return $"active={IsActive} owner={IsOwnerHere} effect=({(int)x},{(int)y}) unit=({(int)ux},{(int)uy}) gap={(int)Distance(x, y, ux, uy)} " +
               $"facing={(int)facing} unitFacing={(int)GetUnitFacing(kitty.Unit)} speed={(int)speed} " +
               $"target={(hasTarget ? $"({(int)targetX},{(int)targetY})" : "none")} pending={pendingLocal} still={stillTime:F2} blocked={blockedTime:F2} " +
               $"contactHold={(AsyncKittySync.Now < contactHoldUntil)} followers={followers.Count} ghost={ghostPercent}%";
    }

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
        ClearFollowers();

        if (standIn != null)
        {
            DestroyEffect(standIn);
            standIn = null;
        }
    }
}
