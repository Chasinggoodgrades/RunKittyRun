import { InitTrig_Effect_meteor_on_pick_down } from 'core/04_STRUCTURES/Meteor/Effect_meteor_on_pick_down'
import { InitTrig_Effect_meteor_on_pick_up } from 'core/04_STRUCTURES/Meteor/Effect_meteor_on_pick_up'
import { InitTrig_Meteor_being_used } from 'core/04_STRUCTURES/Meteor/Meteor_being_used'
import { InitTrig_Right_click_on_widget } from 'core/04_STRUCTURES/Meteor/Right_click_on_widget'
import { InitTrig_On_using_normal_meteor } from '../04_STRUCTURES/Meteor/On_using_normal_meteor'
import { InitTrig_Afk_mode_ordre_recu } from 'core/08_GAME/Afk_mode/Afk_mode_ordre_recu'
import { InitTrig_Camera_reset } from 'core/08_GAME/Camera_reset/Camera_reset'
import { InitTrig_A_hero_dies_check_if_all_dead_and_sounds } from 'core/08_GAME/Death/A_hero_dies_check_if_all_dead_and_sounds'
import { InitTrig_Sound_monster_dies } from 'core/08_GAME/Death/Sound_monster_dies'
import { InitTrig_Forces_ally } from 'core/08_GAME/Init_game/Forces_ally'
import { InitTrig_Start_sound } from 'core/08_GAME/Init_game/Start_sound'
import { InitTrig_A_player_leaves } from 'core/08_GAME/Leavers/A_player_leaves'
import { InitTrig_creation_dialogue } from 'core/08_GAME/Mode_coop/creation_dialogue'
import { InitTrig_Select_hero } from 'core/08_GAME/Select_and_unselect_heroes/Select_hero'
import { InitTrig_Unselect_hero } from 'core/08_GAME/Select_and_unselect_heroes/Unselect_hero'

export const initOldTriggers = () => {
    InitTrig_Right_click_on_widget()
    InitTrig_Meteor_being_used()
    InitTrig_On_using_normal_meteor()
    InitTrig_Effect_meteor_on_pick_up()
    InitTrig_Effect_meteor_on_pick_down()
    InitTrig_Forces_ally()
    InitTrig_Start_sound()
    InitTrig_creation_dialogue()
    InitTrig_Camera_reset()
    InitTrig_Afk_mode_ordre_recu()
    InitTrig_A_player_leaves()
    InitTrig_A_hero_dies_check_if_all_dead_and_sounds()
    InitTrig_Sound_monster_dies()
    InitTrig_Select_hero()
    InitTrig_Unselect_hero()
}
