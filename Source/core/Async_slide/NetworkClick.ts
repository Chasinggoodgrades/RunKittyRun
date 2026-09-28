import { createEvent } from 'Utils/mapUtils'
import { getUdgEscapers } from '../../../globals'
import { Natives } from '../wc3_natives_unsecured/Natives'
import { getAutoTurnMode, setAutoTurnSteering } from './AutoTurn'
import { isTestingLeftClicks, takeLastLocalClickTime } from './HeroEffect'

/**
 * Right click moves the shared effect for everybody: EVENT_PLAYER_MOUSE_DOWN is a synchronized
 * event, so the click travels through the game turn queue exactly like a unit order, and the
 * effect only moves once the click has been delivered to every machine (= latency).
 *
 * The left click is logged too, without moving anything: that very click is what
 * "hero-effect-locally-async" reacts to asynchronously, so comparing the two timestamps tells
 * how much the local path really saves.
 */
/** The same teal as the local click line, so both halves of a click read as one pair */
const CYAN = '|cff1ce6b9'

/**
 * Listened to for a player who chose a steering mode or is testing left clicks, and for nobody
 * else. Created and destroyed rather than turned on and off, as the game carries the mouse of a
 * player over the network because the event is registered, not because a trigger acts on it.
 */
const clickTriggers: { [escaperId: number]: trigger } = {}

export const setNetworkClickListeningEnabled = (escaperId: number, isEnabled: boolean) => {
    const existing = clickTriggers[escaperId]

    if (isEnabled === (existing !== undefined)) {
        return
    }

    if (!isEnabled) {
        DestroyTrigger(existing)
        delete clickTriggers[escaperId]

        return
    }

    const escaper = getUdgEscapers().get(escaperId)

    if (!escaper) {
        return
    }

    {
        clickTriggers[escaperId] = createEvent({
            events: [t => TriggerRegisterPlayerEvent(t, escaper.getPlayer(), EVENT_PLAYER_MOUSE_DOWN)],
            actions: [
                () => {
                    const mouseButton = Natives.UBlzGetTriggerPlayerMouseButton()
                    const isRightClick = mouseButton === MOUSE_BUTTON_TYPE_RIGHT

                    if (!isRightClick && mouseButton !== MOUSE_BUTTON_TYPE_LEFT) {
                        return
                    }

                    const x = BlzGetTriggerPlayerMouseX()
                    const y = BlzGetTriggerPlayerMouseY()

                    // Shown to the player clicking only: this event runs on every machine, and the
                    // local click it is compared to belongs to the machine of that player alone.
                    if (
                        !isRightClick &&
                        Natives.UGetTriggerPlayer() === GetLocalPlayer() &&
                        isTestingLeftClicks(GetPlayerId(Natives.UGetTriggerPlayer()))
                    ) {
                        // that same click was caught by the asynchronous path first: the gap between
                        // the two is the latency the local path saves
                        const localClickTime = takeLastLocalClickTime()
                        const delay =
                            localClickTime === undefined
                                ? `${CYAN}(no local click to compare to)|r`
                                : `${CYAN}${math.floor((os.clock() - localClickTime) * 1000)} ms after the local one|r`

                        print(
                            `NETWORK left click at ${math.floor(x)}, ${math.floor(y)} ` +
                                `(t = ${math.floor(os.clock() * 1000)} ms), ` +
                                delay
                        )
                    }

                    if (x === 0 && y === 0) {
                        // the click was not on the terrain (UI, minimap...)
                        return
                    }

                    // Both buttons order the hero of the clicking player around. An order changes
                    // the state of the game, so this is where it belongs in a multiplayer game:
                    // given from a synchronized event, hence on every machine at once.
                    // "hero-effect-locally-async" gives it earlier than this, but on one machine
                    // only, which is why it is solo only.
                    const escaperId = GetPlayerId(Natives.UGetTriggerPlayer())

                    // while a steering mode is chosen, the buttons hand the hero over to the mouse
                    // and take it back, rather than each click being an order of its own
                    if (getAutoTurnMode(escaperId) !== 'off') {
                        setAutoTurnSteering(escaperId, isRightClick)
                    }

                    // No order is given from here any more. The game gives its own for a right
                    // click that reaches the world, and its own knows what was clicked: a
                    // destructible, a unit, an item. A point order written here would replace that
                    // with a plain move to the ground, and the target would be lost.
                },
            ],
        })
    }
}
