using WCSharp.Api;
using static WCSharp.Api.Common;

/// <summary>
/// Reads the right click of THIS machine at the press and steers the local Kitty's stand-in
/// effect with it, a network latency before the move order reaches anyone. Port of the
/// "asyncClicks" idea of AsyncSlideInput.ts / AutoTurn.ts, for running instead of sliding.
///
/// Holding the button keeps re-reading the cursor, as the game keeps re-issuing the move order,
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
    private const float REFRESH_PERIOD = 0.03f;

    private static bool wasRightPressed;
    private static float lastRefresh = -1f;

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
            return;
        }

        bool isPressed = AsyncMouse.IsRightPressed();

        if (isPressed && (!wasRightPressed || AsyncKittySync.Now - lastRefresh >= REFRESH_PERIOD))
        {
            lastRefresh = AsyncKittySync.Now;
            Steer(fx);
        }

        wasRightPressed = isPressed;
    }

    private static void Steer(KittyAsyncEffect effect)
    {
        if (!AsyncMouse.TryGetPosition(out var mouseX, out var mouseY)) return;
        if (mouseY < CONSOLE_TOP_Y) return;
        if (!Screen2World.TryConvert(mouseX, mouseY, out var worldX, out var worldY)) return;

        effect.SetLocalTarget(worldX, worldY);
    }
}
