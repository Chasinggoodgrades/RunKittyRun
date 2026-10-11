using System;
using WCSharp.Api;
using WCSharp.Shared;
using static WCSharp.Api.Common;

/// <summary>
/// Asynchronous mouse state of THIS machine, port of AsyncMouse.ts.
///
/// BlzGetMouseScreenPosX/Y, BlzPixelToFrameX/Y and BlzIsMouseButtonPressed are Warcraft III 3.0
/// natives that WCSharp.Api 3.3.9 does not expose, so they are reached through two tiny Lua
/// functions, compiled once (same Lua.Load / Lua.Call pattern as the "test34" command).
///
/// Everything here answers at once and differs from one machine to another: it may only ever
/// feed purely local, visual logic (see KittyAsyncEffect), never synced game state.
/// Positions are in frame coordinates: the centre of the screen is (0.4, 0.3).
/// </summary>
public static class AsyncMouse
{
    private static Func<object> isRightPressedFn;
    private static Func<object> getPositionFn;
    private static bool initialized;

    /// <summary>False when the Lua natives could not be reached: every async feature then stays off.</summary>
    public static bool IsAvailable { get; private set; }

    /// <summary>Compiles the Lua readers. Call once at game start, on every machine alike.</summary>
    public static void Initialize()
    {
        if (initialized) return;
        initialized = true;

        try
        {
            isRightPressedFn = Compile(
                @"return function()
                    if BlzIsMouseButtonPressed(MOUSE_BUTTON_TYPE_RIGHT) then return '1' end
                    return '0'
                end");

            getPositionFn = Compile(
                @"return function()
                    return string.format('%.5f|%.5f', BlzPixelToFrameX(BlzGetMouseScreenPosX()), BlzPixelToFrameY(BlzGetMouseScreenPosY()))
                end");

            IsAvailable = isRightPressedFn != null && getPositionFn != null;
        }
        catch (Exception e)
        {
            IsAvailable = false;
            Logger.Warning($"AsyncMouse unavailable: {e.Message}");
        }
    }

    private static Func<object> Compile(string luaChunk)
    {
        var chunk = Lua.Load(luaChunk);
        if (chunk == null) return null;

        return (Func<object>)Lua.Call(chunk);
    }

    /// <summary>Whether the right button of this machine is down right now.</summary>
    public static bool IsRightPressed()
    {
        if (!IsAvailable) return false;

        var result = isRightPressedFn();
        return result != null && result.ToString() == "1";
    }

    /// <summary>Cursor of this machine in frame coordinates. False when it could not be read.</summary>
    public static bool TryGetPosition(out float x, out float y)
    {
        x = 0.4f;
        y = 0.3f;

        if (!IsAvailable) return false;

        var result = getPositionFn();
        if (result == null) return false;

        var parts = result.ToString().Split('|');
        if (parts.Length < 2) return false;

        x = float.Parse(parts[0]);
        y = float.Parse(parts[1]);
        return true;
    }
}
