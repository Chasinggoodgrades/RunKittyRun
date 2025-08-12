export class GameTimesData {
    public NormalGameTime: NormalGameTimeData
    public HardGameTime: HardGameTimeData
    public ImpossibleGameTime: ImpossibleGameTimeData
    public NightmareGameTime: NightmareGameTimeData

    public GameTimesData() {
        NormalGameTime = new NormalGameTimeData()
        HardGameTime = new HardGameTimeData()
        ImpossibleGameTime = new ImpossibleGameTimeData()
        NightmareGameTime = new NightmareGameTimeData()
    }
}

export class NormalGameTimeData {
    public Date: string = ''
    public Time: number
    public TeamMembers: string = ''
    /*    public RoundOneTime: number 
    public RoundTwoTime: number 
    public RoundThreeTime: number 
    public RoundFourTime: number 
    public RoundFiveTime: number */
}

export class HardGameTimeData {
    public Date: string = ''
    public Time: number
    public TeamMembers: string = ''
    /*    public RoundOneTime: number 
    public RoundTwoTime: number 
    public RoundThreeTime: number 
    public RoundFourTime: number 
    public RoundFiveTime: number */
}

export class ImpossibleGameTimeData {
    public Date: string = ''
    public Time: number
    public TeamMembers: string = ''
    /*    public RoundOneTime: number 
    public RoundTwoTime: number 
    public RoundThreeTime: number 
    public RoundFourTime: number 
    public RoundFiveTime: number */
}

export class NightmareGameTimeData {
    public Date: string = ''
    public Time: number
    public TeamMembers: string = ''
    /*    public RoundOneTime: number 
        public RoundTwoTime: number 
        public RoundThreeTime: number 
        public RoundFourTime: number 
        public RoundFiveTime: number */
}
