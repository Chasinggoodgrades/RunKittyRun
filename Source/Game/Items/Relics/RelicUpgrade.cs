public class RelicUpgrade
{
    public int Level { get; set; }
    public string Description { get; set; }
    public int RequiredLevel { get; set; }
    public int Cost { get; set; }

    public RelicUpgrade(int level, string description, int requiredLevel, int cost)
    {
        Level = level;
        Description = description;
        RequiredLevel = requiredLevel;
        Cost = cost;
    }
}