export class ExecuteLua {
    public static LuaCode(player: MapPlayer, args: string) {
        player.DisplayTextTo('Args: {args}')
        let func = Lua.Load(
            `return function()
            local self = Globals.ALL_KITTIES:get(getTriggerPlayer())
            local target = Globals.ALL_KITTIES:get(GetOwningPlayer(CustomStatFrame.SelectedUnit:get(getTriggerPlayer())))
            ${args}
            end`
        )
        if (func != null) {
            try {
                let result = Lua.Call(func)
                let resultFunc = result
                result = resultFunc()
                if (result != null) player.DisplayTextTo('Result: {result.toString()}')
            } catch (ex: any) {
                player.DisplayTextTo('Error: {ex.Message}')
            }
        } else player.DisplayTextTo('Syntax Error')
    }
}

export class DebugPrinter {
    public static _G: dynamic

    // Converts the TypeScript function printDebugNames into C#.
    public static PrintDebugNames(title: string) {
        // {{ LUA_REPLACE }}
    }
}
