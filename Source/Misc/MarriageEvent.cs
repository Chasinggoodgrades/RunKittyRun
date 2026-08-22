using WCSharp.Api;

public class MarriageEvent
{
    private static MarriageEvent _MarriageEvent;
    public static MarriageEvent Instance => _MarriageEvent ??= new MarriageEvent();
    private object ClingyPerson { get; set; } // More genertic implementation
    private trigger EventTrigger;

    public MarriageEvent()
    {
        _MarriageEvent = this;

    }

    


}
