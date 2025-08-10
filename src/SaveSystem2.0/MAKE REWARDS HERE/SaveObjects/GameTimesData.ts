class GameTimesData {
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

class NormalGameTimeData {
    public Date: string = ''
    public Time: number
    public TeamMembers: string = ''
    /*    public RoundOneTime: number 
    public RoundTwoTime: number 
    public RoundThreeTime: number 
    public RoundFourTime: number 
    public RoundFiveTime: number */
}

class HardGameTimeData {
    public Date: string = ''
    public Time: number
    public TeamMembers: string = ''
    /*    public RoundOneTime: number 
    public RoundTwoTime: number 
    public RoundThreeTime: number 
    public RoundFourTime: number 
    public RoundFiveTime: number */
}

class ImpossibleGameTimeData {
    public Date: string = ''
    public Time: number
    public TeamMembers: string = ''
    /*    public RoundOneTime: number 
    public RoundTwoTime: number 
    public RoundThreeTime: number 
    public RoundFourTime: number 
    public RoundFiveTime: number */
}

class NightmareGameTimeData {
    public Date: string = ''
    public Time: number
    public TeamMembers: string = ''
    /*    public RoundOneTime: number 
        public RoundTwoTime: number 
        public RoundThreeTime: number 
        public RoundFourTime: number 
        public RoundFiveTime: number */
}
