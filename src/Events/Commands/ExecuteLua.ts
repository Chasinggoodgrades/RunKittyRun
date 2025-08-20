import { MapPlayer } from 'w3ts'

export class ExecuteLua {
    public static LuaCode(player: MapPlayer, args: string) {
        player.DisplayTextTo(`Args: '${args}'`)

        /*
            local self = Globals.ALL_KITTIES:get(getTriggerPlayer())
            local target = Globals.ALL_KITTIES:get(GetOwningPlayer(CustomStatFrame.SelectedUnit:get(getTriggerPlayer())))
        */
        const luaChunk = `return function()
            return ${args}
        end`

        try {
            const [func, err] = load(luaChunk)

            if (func) {
                const [ok, f] = pcall(func)

                if (ok) {
                    player.DisplayTextTo(`Ran: '${args}'`)
                    const out = f()

                    if (out) {
                        player.DisplayTextTo(`Result: '${out}'`)
                    }
                } else {
                    player.DisplayTextTo(`Error: ${f}`)
                }
            } else {
                if (typeof err === 'string') {
                    player.DisplayTextTo(err)
                } else {
                    player.DisplayTextTo('Syntax Error')
                }
            }
        } catch (e) {
            player.DisplayTextTo(`Error: ${e}`)
        }
    }
}
