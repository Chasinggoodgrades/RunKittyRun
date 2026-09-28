import { init_Cpm } from 'core/08_GAME/Apm_clics_par_minute/Cpm'
import { init_globals } from '../../../globals'
import { init_terrain_limit_variables } from '../01_libraries/Init_terrain_limit_variables'
import { initViewAllHideAll } from '../03_view_all_hide_all/View_all_hide_all'
import { initFirstPerson } from '../04_STRUCTURES/Escaper/Escaper_firstPerson'
import { init_StartAndEnd } from '../04_STRUCTURES/Level/StartAndEnd'
import { initContactChunks } from '../04_STRUCTURES/Monster/ContactChunks'
import { init_LongDistanceMoveOrder_garbageCollector } from '../04_STRUCTURES/Monster/LongDistanceMoveOrder'
import { initMonsterSimplePatrol } from '../04_STRUCTURES/Monster/MonsterSimplePatrol'
import { init_TrigMonstersClickableSetLife } from '../04_STRUCTURES/Monster/trig_Monsters_clickable_set_life'
import { init_MECRegions } from '../04_STRUCTURES/Region/MECRegion'
import { initTrig_Autorevive } from '../06_COMMANDS/Helpers/Autorevive'
import { initCachedPlayerNames } from '../06_COMMANDS/Helpers/Command_functions'
import { init_StopSecondIfMake } from '../07_TRIGGERS/Handling_secondary_hero/Stop_second_if_make'
import { init_TerrainTypeNamesAndData } from '../07_TRIGGERS/Modify_terrain_Functions/Terrain_type_names_and_data'
import { init_ToTurnOnSlide } from '../07_TRIGGERS/Slide_and_CheckTerrain_triggers/To_turn_on_slide'
import { init_startFirstLevel } from '../07_TRIGGERS/Start_of_the_game/start_first_level'
import { ReinitTerrains } from '../07_TRIGGERS/Triggers_to_modify_terrains/Reinit_terrains'
import { ReinitTerrainsPositions } from '../07_TRIGGERS/Triggers_to_modify_terrains/Reinit_terrains_position_Change_variations_and_ut_at_beginning'
import { init_Apm } from '../08_GAME/Apm_clics_par_minute/Apm'
import { init_cameraPositionAtStart } from '../08_GAME/Camera_reset/Camera_position_at_start'
import { initAsyncHeroSync } from '../08_GAME/Contact/AsyncHeroSync'
import { initContactCheck } from '../08_GAME/Contact/ContactCheck'
import { init_Trig_Allways_day } from '../08_GAME/Init_game/Allways_day'
import { init_Heroes } from '../08_GAME/Init_game/Heroes'
import { initNoSelectionCircle } from '../08_GAME/Init_game/No_selection_circle'
import { initSelectUnit } from '../08_GAME/select_unit'
import { initAsyncSlideInput } from '../Async_slide/AsyncSlideInput'
import { init_customUI } from '../DisablingInterface/EnableDisableInterface'
import { init_doubleKill } from '../Double_heroes/double_kill'
import { init_shortcurt_cancelRedo } from '../Keyboard_shortcuts/Cancel_redo'
import { init_E2ETests } from '../Test/e2e-tests/base/e2e-tests-registering'
import { init_Test } from '../Test/test'
import { initArrays } from './initArrays'
import { init_dataFromWorleditor } from './init_dataFromWorleditor'
import { initOldTriggers } from './init_old_triggers'

export const initializers = () => {
    init_globals()
    init_dataFromWorleditor()
    init_terrain_limit_variables()
    initArrays()
    initContactChunks() // before any monster unit exists: each of them registers itself as it appears
    initAsyncHeroSync() // the channel a contact is told through, ready before any hero can touch one
    initContactCheck() // what finds the contacts of every hero, the immolation being gone
    initAsyncSlideInput() // the local cursor and click an async slide is steered with
    init_StartAndEnd()
    initViewAllHideAll()
    initNoSelectionCircle()
    init_Apm()
    init_Cpm()
    init_Heroes()
    initSelectUnit()
    initOldTriggers()
    init_TerrainTypeNamesAndData()
    init_ToTurnOnSlide()
    init_StopSecondIfMake()
    initCachedPlayerNames()
    init_doubleKill()
    initTrig_Autorevive()
    init_TrigMonstersClickableSetLife()
    init_Trig_Allways_day()
    ReinitTerrains.init_ReinitAtStart()
    ReinitTerrainsPositions.init_reinitTerrainsPositions()
    initFirstPerson()
    initMonsterSimplePatrol()
    init_startFirstLevel()
    init_cameraPositionAtStart()
    init_LongDistanceMoveOrder_garbageCollector()
    init_MECRegions()
    init_E2ETests()

    //keyboard shortcuts
    init_shortcurt_cancelRedo()

    //custom UI
    init_customUI()

    //test trigger for developement
    init_Test()
}
