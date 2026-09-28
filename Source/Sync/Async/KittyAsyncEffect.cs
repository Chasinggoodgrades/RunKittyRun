using WCSharp.Api;
using static WCSharp.Api.Common;

/// <summary>
/// C# counterpart of the heroEffect / isHeroEffectActive fields in Escaper.ts. Every alive Kitty
/// always has a stand-in effect: on the owning machine it simply follows the unit (movement is
/// order driven here, not slide driven), and on every other machine it is carried by the packets
/// AsyncKittySync relays, the way the unit of a hero sliding as an effect used to be carried on
/// the async slide in the TS version.
///
/// The unit itself is left alone: it keeps answering orders and existing for anything that reads
/// a real unit (abilities, pathing, collision), while the effect is what every machine actually
/// looks at for position when interpolating between two packets.
/// </summary>
public class KittyAsyncEffect
{
    /// <summary>Same stand-in model already used for other Kitty ghost/astral effects in this project (see UrnSoul UNIT_ASTRAL_KITTY companion visuals).</summary>
    private const string STAND_IN_MODEL = "war3mapImported\\TyrandeWhisperwind.mdx";

    /// <summary>Parks the effect far below the map, mirroring the off-map park position used for dead/hidden effects.</summary>
    private const float PARKED_Z = -10000f;

    private readonly Kitty kitty;
    private effect standInEffect;

    private KittyMovementState localState;
    private KittyMovementState syncedState;
    private int lastSequence = -1;

    /// <summary>Stable identifier carried on the wire: the owning player's id, unlike a list index it never shifts.</summary>
    public int KittyId { get; }

    /// <summary>Whether the stand-in effect is currently shown and tracking the Kitty (false once dead or disposed).</summary>
    public bool IsActive { get; private set; }

    public KittyAsyncEffect(Kitty kitty)
    {
        this.kitty = kitty;
        KittyId = kitty.Player.Id;
    }

    /// <summary>Creates the stand-in effect at the Kitty's current position. Safe to call once, at Kitty creation.</summary>
    public void Create()
    {
        if (standInEffect != null || kitty.Unit == null) return;

        standInEffect = effect.Create(STAND_IN_MODEL, kitty.Unit.X, kitty.Unit.Y);
        localState = new KittyMovementState(kitty.Unit.X, kitty.Unit.Y, kitty.Unit.Facing, 0);
        syncedState = localState;

        IsActive = true;

        UpdateEffectPosition(localState);
    }

    /// <summary>Read on the owning machine, ten times a second, to broadcast where the Kitty really is.</summary>
    public KittyMovementState GetLocalMovementState()
    {
        if (kitty.Unit != null)
        {
            localState = new KittyMovementState(kitty.Unit.X, kitty.Unit.Y, kitty.Unit.Facing, 0);
        }

        return localState;
    }

    /// <summary>Applied on every machine (owning machine included) from a Position packet.</summary>
    public void ApplyPosition(int sequence, KittyMovementState movement)
    {
        if (!IsActive || sequence <= lastSequence) return;

        lastSequence = sequence;
        syncedState = movement;

        UpdateEffectPosition(movement);
    }

    /// <summary>Applied on every machine from a Death packet: the effect stops standing in, at the spot every machine agrees on.</summary>
    public void ApplyDeath(int sequence, KittyMovementState movement)
    {
        if (sequence <= lastSequence) return;

        lastSequence = sequence;
        syncedState = movement;

        UpdateEffectPosition(movement);
        Hide();
    }

    /// <summary>Shows the effect again where the Kitty revives: called from Kitty.ReviveKitty.</summary>
    public void Show()
    {
        if (standInEffect == null) return;

        IsActive = true;
        UpdateEffectPosition(GetLocalMovementState());
    }

    /// <summary>Parks the effect out of sight without destroying its handle, mirroring parkHeroEffect in Escaper.ts.</summary>
    public void Hide()
    {
        IsActive = false;
        standInEffect?.SetPosition(0, 0, PARKED_Z);
    }

    private void UpdateEffectPosition(KittyMovementState movement)
    {
        standInEffect?.SetPosition(movement.X, movement.Y, movement.FlyHeight);
    }

    public void Dispose()
    {
        standInEffect?.Dispose();
        standInEffect = null;
        IsActive = false;
    }
}
