using WCSharp.Api;
using static WCSharp.Api.Common;

/// <summary>
/// Reads the right click of THIS machine at the press and steers the local Kitty's stand-in
/// effect with it, a network latency before the move order reaches anyone. Port of the
/// "asyncClicks" idea of AsyncSlideInput.ts / AutoTurn.ts, for running instead of sliding.
///
/// Holding the button keeps re-reading the cursor; the unit gets a fresh order only now and then (see SteerUnit),
/// so holding the right button down to run behaves the way it always did, only sooner.
///
/// Everything read here is local, so only the owner's own copy of the effect is ever moved by it;
/// it never feeds synced logic. No frame is made.
/// </summary>
public static class AsyncClickInput
{
    /// <summary>Below this frame height is the console (command card, inventory): a right click there is not a move.</summary>
    private const float CONSOLE_TOP_Y = 0.13f;

    /// <summary>How often the cursor is re-read while the button stays down.</summary>
    private static float REFRESH_PERIOD => AsyncTuning.Get(21);

    private static bool wasRightPressed;
    private static float lastRefresh = -1f;
    private static float lastWorldX;
    private static float lastWorldY;
    private static bool hasWorld;

    /// <summary>Called by the global tick, on every machine: only the one of the owner finds anything to do.</summary>
    public static void Poll()
    {
        if (!AsyncMouse.IsAvailable) return;

        var localPlayer = GetLocalPlayer();
        if (localPlayer == null) return;

        if (!Globals.ALL_KITTIES.TryGetValue(localPlayer, out var kitty)) return;

        var fx = kitty.AsyncEffect;

        if (fx == null || !fx.CanBeSteeredLocally)
        {
            wasRightPressed = false;
            hasWorld = false;
            return;
        }

        bool isPressed = AsyncMouse.IsRightPressed();

        if (isPressed && (!wasRightPressed || AsyncKittySync.Now - lastRefresh >= REFRESH_PERIOD))
        {
            lastRefresh = AsyncKittySync.Now;
            Steer(fx, !wasRightPressed);
        }
        else if (!isPressed && wasRightPressed && hasWorld)
        {
            // let go: the unit is given the exact place the effect is running to
            fx.SteerUnit(lastWorldX, lastWorldY, true);
        }

        wasRightPressed = isPressed;
    }

    private static void Steer(KittyAsyncEffect effect, bool isPress)
    {
        if (!AsyncMouse.TryGetPosition(out var mouseX, out var mouseY)) return;
        if (mouseY < CONSOLE_TOP_Y) return;
        if (!Screen2World.TryConvert(mouseX, mouseY, out var worldX, out var worldY)) return;

        effect.SetLocalTarget(worldX, worldY);

        lastWorldX = worldX;
        lastWorldY = worldY;
        hasWorld = true;

        if (isPress) effect.NoteClickOrder(worldX, worldY); // the game issues this order itself
        else effect.SteerUnit(worldX, worldY, false);       // held: now and then, not constantly
    }
}
