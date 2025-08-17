export class RelicUpgrade {
    public Level = 0
    public Description: string
    public RequiredLevel = 0
    public Cost = 0

    public constructor(level: number, description: string, requiredLevel: number, cost: number) {
        this.Level = level
        this.Description = description
        this.RequiredLevel = requiredLevel
        this.Cost = cost
    }
}
