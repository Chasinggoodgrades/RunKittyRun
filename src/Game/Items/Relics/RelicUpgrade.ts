export class RelicUpgrade {
    public Level: number
    public Description: string
    public RequiredLevel: number
    public Cost: number

    public RelicUpgrade(level: number, description: string, requiredLevel: number, cost: number) {
        Level = level
        Description = description
        RequiredLevel = requiredLevel
        Cost = cost
    }
}
