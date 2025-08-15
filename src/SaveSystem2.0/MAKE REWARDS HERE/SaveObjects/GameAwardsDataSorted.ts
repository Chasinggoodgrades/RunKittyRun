import { Auras } from "./RewardObjects/Auras"
import { Deathless } from "./RewardObjects/Deathless"
import { Hats } from "./RewardObjects/Hats"
import { Nitros } from "./RewardObjects/Nitros"
import { Skins } from "./RewardObjects/Skins"
import { Tournament } from "./RewardObjects/Tournament"
import { Trails } from "./RewardObjects/Trails"
import { Windwalks } from "./RewardObjects/Windwalks"
import { Wings } from "./RewardObjects/Wings"

export class GameAwardsDataSorted {
    public Auras: Auras
    public Hats: Hats
    public Nitros: Nitros
    public Skins: Skins
    public Trails: Trails
    public Windwalks: Windwalks
    public Tournament: Tournament
    public Deathless: Deathless
    public Wings: Wings

    public constructor() {
        this.Auras = new Auras()
        this.Wings = new Wings()
        this.Deathless = new Deathless()
        this.Hats = new Hats()
        this.Nitros = new Nitros()
        this.Skins = new Skins()
        this.Trails = new Trails()
        this.Windwalks = new Windwalks()
        this.Tournament = new Tournament()
    }
}
