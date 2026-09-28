import { Constants } from 'core/01_libraries/Constants'

export const GRAVITY_EVERY_N_PERIOD = 2 //keep this value to "2" for a proper gravity

const initGravity = () => {
    let gravity = -45 * Constants.SLIDE_PERIOD * GRAVITY_EVERY_N_PERIOD

    const SetGravity = (newGravity: number) => {
        gravity = newGravity * Constants.SLIDE_PERIOD * GRAVITY_EVERY_N_PERIOD
    }

    const GetGravity = (): number => {
        return gravity
    }

    const GetRealGravity = (): number => {
        return gravity / (Constants.SLIDE_PERIOD * GRAVITY_EVERY_N_PERIOD)
    }

    return { SetGravity, GetGravity, GetRealGravity }
}

export const Gravity = initGravity()
