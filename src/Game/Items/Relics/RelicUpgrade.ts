export class RelicUpgrade {
    public Level: number
    public Description: string
    public RequiredLevel: number
    public Cost: number

    public constructor(level: number, description: string, requiredLevel: number, cost: number) {
        this.Level = level
        this.Description = description
        this.RequiredLevel = requiredLevel
        this.Cost = cost
    }
}
