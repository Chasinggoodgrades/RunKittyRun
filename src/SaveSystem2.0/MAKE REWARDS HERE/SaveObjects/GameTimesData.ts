export class GameTimesData {
    public NormalGameTime: NormalGameTimeData
    public HardGameTime: HardGameTimeData
    public ImpossibleGameTime: ImpossibleGameTimeData
    public NightmareGameTime: NightmareGameTimeData

    public constructor() {
        this.NormalGameTime = new NormalGameTimeData()
        this.HardGameTime = new HardGameTimeData()
        this.ImpossibleGameTime = new ImpossibleGameTimeData()
        this.NightmareGameTime = new NightmareGameTimeData()
    }
}

export class NormalGameTimeData {
    public Date: string = ''
    public Time = 0
    public TeamMembers: string = ''
    /*    public RoundOneTime: number 
    public RoundTwoTime: number 
    public RoundThreeTime: number 
    public RoundFourTime: number 
    public RoundFiveTime: number */
}

export class HardGameTimeData {
    public Date: string = ''
    public Time = 0
    public TeamMembers: string = ''
    /*    public RoundOneTime: number 
    public RoundTwoTime: number 
    public RoundThreeTime: number 
    public RoundFourTime: number 
    public RoundFiveTime: number */
}

export class ImpossibleGameTimeData {
    public Date: string = ''
    public Time = 0
    public TeamMembers: string = ''
    /*    public RoundOneTime: number 
    public RoundTwoTime: number 
    public RoundThreeTime: number 
    public RoundFourTime: number 
    public RoundFiveTime: number */
}

export class NightmareGameTimeData {
    public Date: string = ''
    public Time = 0
    public TeamMembers: string = ''
    /*    public RoundOneTime: number 
        public RoundTwoTime: number 
        public RoundThreeTime: number 
        public RoundFourTime: number 
        public RoundFiveTime: number */
}
