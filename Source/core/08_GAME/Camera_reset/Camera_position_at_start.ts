import { createTimer } from '../../../Utils/mapUtils'
import { getUdgLevels } from '../../../../globals'

export const init_cameraPositionAtStart = () => {
    createTimer(0, false, () => {
        const level0start = getUdgLevels().get(0)?.getStart()
        if (level0start) {
            SetCameraPosition(level0start.getCenterX(), level0start.getCenterY())
        }
    })
}
