public sealed class ProgressRequest
{
    public float UnitX { get; set; }
    public float UnitY { get; set; }
    public int ProgressZone { get; set; }
    public int CurrentPoint { get; set; }
    public bool Finished { get; set; }
    public bool Alive { get; set; }

    public ProgressRequest()
    {
    }

    public void Update(float unitX, float unitY, int progressZone, int currentPoint, bool finished, bool alive)
    {
        UnitX = unitX;
        UnitY = unitY;
        ProgressZone = progressZone;
        CurrentPoint = currentPoint;
        Finished = finished;
        Alive = alive;
    }
}
