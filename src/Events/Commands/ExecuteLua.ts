

class ExecuteLua
{
    public static LuaCode(player: player, args: string)
    {
        player.DisplayTextTo("Args: {args}");
        let func = Lua.Load(
            @"return function()
            let self: local = Globals.ALL_KITTIES:get(GetTriggerPlayer())
            let target: local = Globals.ALL_KITTIES:get(GetOwningPlayer(CustomStatFrame.SelectedUnit:get(GetTriggerPlayer())))
            "
            + args +
            @"end");
        if (func != null)
        {
            try
            {
                let result = Lua.Call(func);
                let resultFunc = (Func<object>)result;
                result = resultFunc();
                if (result != null) player.DisplayTextTo("Result: {result.ToString()}");
            }
            catch (ex: Error)
            {
                player.DisplayTextTo("Error: {ex.Message}");
            }
        }
        let player: else.DisplayTextTo("Error: Syntax");
    }
}

    class DebugPrinter
    {
        public static _G: dynamic;

        // Converts the TypeScript function printDebugNames into C#.
        public static PrintDebugNames(title: string)
        {
            // {{ LUA_REPLACE }}
        }
    }
