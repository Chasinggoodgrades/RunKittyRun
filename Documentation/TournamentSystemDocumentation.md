# Tournament System Documentation

## Table of Contents
1. [Overview](#overview)
2. [Architecture](#architecture)
3. [Data Models](#data-models)
4. [Save Logic & Workflow](#save-logic--workflow)
5. [Edge Cases & Conditions](#edge-cases--conditions)
6. [Key Algorithms](#key-algorithms)
7. [Integration Guide](#integration-guide)

---

## Overview

The Tournament System is designed to track and persist detailed player performance data across multiple tournament games. It supports both **Solo Tournament** and **Team Tournament** modes, capturing granular statistics per round, per game, and per tournament session.

### Key Features
- **Multi-Game Tracking**: Stores up to 3 games per tournament session
- **Round-Level Granularity**: Tracks 5 rounds per game with individual metrics
- **Session Management**: Automatically detects new tournaments vs. ongoing sessions
- **Mode Detection**: Handles different game modes (Solo vs. Team tournaments)
- **Admin Approval**: Supports filtering for approved/public tournament data
- **Unique Identifiers**: Generates unique Game IDs and Tournament IDs per session

---

## Architecture

### Component Overview

```
TournamentStats (Container)
    ├── Tournament Metadata (ID, region, mode, approval status)
    ├── Game_1 (TournamentGameData)
    │   └── Round_1 to Round_5 (TournamentRoundData)
    ├── Game_2 (TournamentGameData)
    │   └── Round_1 to Round_5 (TournamentRoundData)
    └── Game_3 (TournamentGameData)
        └── Round_1 to Round_5 (TournamentRoundData)
```

### Class Responsibilities

| Class | Purpose |
|-------|---------|
| `TournamentStats` | Top-level container for all tournament data for a player |
| `TournamentGameData` | Stores data for a single game (5 rounds + totals) |
| `TournamentRoundData` | Stores metrics for a single round |
| `TournamentSaver` | Singleton orchestrator managing save logic and session detection |

---

## Data Models

### TournamentStats
The root container for all tournament data per player.

```csharp
public class TournamentStats
{
    public string Tournament_ID { get; set; }     // Unique ID for the tournament session
    public bool AdminApproved { get; set; }       // Whether visible on web frontend
    public string PlayerName { get; set; }        // Player's display name
    public string Region { get; set; }            // Geographic region
    public string Gamemode { get; set; }          // "SoloTournament" or "TeamTournament"
    public string GameType { get; set; }          // Additional mode classification
    public string DateTime { get; set; }          // Last game timestamp (ISO format)
    
    public TournamentGameData Game_1 { get; set; }
    public TournamentGameData Game_2 { get; set; }
    public TournamentGameData Game_3 { get; set; }
}
```

**Key Points:**
- One `TournamentStats` instance per player
- `Tournament_ID` groups multiple games into a single tournament session
- `DateTime` is used for session timeout detection (3-minute threshold)
- `AdminApproved` flag controls web visibility

---

### TournamentGameData
Represents a single game within a tournament (maximum 3 games per tournament).

```csharp
public class TournamentGameData
{
    public string Game_ID { get; set; }          // Unique ID for this specific game
    public string Team { get; set; }             // Team color or "Solo"
    public string TeamMembers { get; set; }      // Comma-separated player names
    
    // Aggregated totals across all rounds
    public float TotalTime { get; set; }
    public int TotalDeaths { get; set; }
    public int TotalSaves { get; set; }
    public float TotalProgress { get; set; }
    
    // Individual round data
    public TournamentRoundData Round_1 { get; set; }
    public TournamentRoundData Round_2 { get; set; }
    public TournamentRoundData Round_3 { get; set; }
    public TournamentRoundData Round_4 { get; set; }
    public TournamentRoundData Round_5 { get; set; }
}
```

**Key Points:**
- `Game_ID` is unique per game instance
- `Team` stores team color for team tournaments, "Solo" for solo mode
- `TeamMembers` lists all participating players on the team
- Totals are recalculated after each round save via `UpdateTotals()`

---

### TournamentRoundData
Stores performance metrics for a single round.

```csharp
public class TournamentRoundData
{
    public float RoundTime { get; set; }    // Time taken to complete the round
    public float Progress { get; set; }     // Progress percentage (0.0 to 100.0)
    public int Saves { get; set; }          // Number of checkpoint saves
    public int Deaths { get; set; }         // Number of deaths
    public int Level { get; set; }          // Hero level at round completion
}
```

**Key Points:**
- Immutable per-round snapshot
- All values initialized to zero/defaults on `Reset()`
- `Progress` tracks partial completion for incomplete rounds

---

## Save Logic & Workflow

### Entry Point: `SaveTournamentData()`

Called periodically during tournament games to persist current state.

#### Preconditions for Saving
1. **Game Mode Check**: Only saves if `Gamemode.CurrentGameMode != GameMode.Standard`
2. **Valid Kitty**: Active kitty must exist with valid `SaveData.TournamentStats`
3. **Current Game Resolution**: Must successfully resolve which game slot to write to

#### Save Workflow

```
SaveTournamentData()
    │
    ├─► FOR EACH Active Kitty
    │       │
    │       ├─► Validate kitty and SaveData
    │       │
    │       ├─► GetCurrentGameData() → Determines which game slot to use
    │       │       │
    │       │       ├─► GetInProgressGame() → Check for existing game with matching Game_ID
    │       │       │
    │       │       ├─► If not found, evaluate session conditions:
    │       │       │       ├─► 3+ minutes since last game? → Reset all games
    │       │       │       ├─► Gamemode or GameType changed? → Reset all games
    │       │       │       └─► All 3 slots full? → Reset all games
    │       │       │
    │       │       └─► Return available game slot (Game_1, Game_2, or Game_3)
    │       │
    │       ├─► Populate Tournament Metadata (if not set):
    │       │       ├─► Tournament_ID
    │       │       ├─► PlayerName
    │       │       ├─► DateTime
    │       │       ├─► Region
    │       │       ├─► AdminApproved
    │       │       ├─► Gamemode
    │       │       └─► GameType
    │       │
    │       ├─► Set Team Information:
    │       │       ├─► Team Tournament: Team color + member list
    │       │       └─► Solo Tournament: Team = "Solo"
    │       │
    │       ├─► Save Round Data:
    │       │       ├─► SaveRoundTime()
    │       │       ├─► SaveRoundProgress()
    │       │       ├─► SaveRoundSaves()
    │       │       ├─► SaveRoundDeaths()
    │       │       └─► SaveRoundLevel()
    │       │
    │       └─► UpdateTotals() → Recalculate aggregated stats
    │
    └─► Handle exceptions and log errors
```

---

## Edge Cases & Conditions

### 1. Game Slot Selection

#### Case: Fresh Tournament Start
- **Condition**: First game of a session
- **Behavior**: Assigns `Game_1`, generates new `Tournament_ID` and `Game_ID`

#### Case: Continuing Same Game
- **Condition**: `Game_ID` matches an existing game slot
- **Behavior**: Writes to the matched game slot (in-progress game)

#### Case: Multiple Games in Succession
- **Condition**: Previous game completed, new game started within 12 hours, same gamemode
- **Behavior**: Uses next available slot (`Game_2`, then `Game_3`)

#### Case: All Slots Filled
- **Condition**: All three game slots contain data
- **Behavior**: Resets all games and starts fresh at `Game_1`

#### Case: 12-Hour Timeout
- **Condition**: `(CurrentTime - LastGameTime) >= 12 * 3600 seconds`
- **Behavior**: Resets all games, generates new `Tournament_ID`
- **Rationale**: Treats as a new tournament session

#### Case: Gamemode Mismatch
- **Condition**: `stats.Gamemode != Gamemode.CurrentGameMode.ToString()`
- **OR**: `stats.GameType != Gamemode.CurrentGameModeType`
- **Behavior**: Resets all games and starts fresh
- **Rationale**: Different tournament types shouldn't mix

---

### 2. Team vs. Solo Tournament Handling

#### Solo Tournament
```csharp
currentGame.Team = "Solo";
roundData.RoundTime = kitty.TimeProg.GetRoundTime(Globals.ROUND);
roundData.Progress = kitty.TimeProg.GetRoundProgress(Globals.ROUND);
```
- **Data Source**: Individual kitty stats
- **Team Field**: Always set to "Solo"
- **TeamMembers**: Empty

#### Team Tournament
```csharp
currentGame.Team = TeamsUtil.GetTeamColor(kitty);
currentGame.TeamMembers = TeamsUtil.GetTeamMembers(kitty);
roundData.RoundTime = team.TeamTimes[Globals.ROUND];
roundData.Progress = float.Parse(team.RoundProgress[Globals.ROUND]);
```
- **Data Source**: Team aggregated stats from `Globals.PLAYERS_TEAMS`
- **Team Field**: Team color (e.g., "Red", "Blue")
- **TeamMembers**: Comma-separated player names
- **Fallback**: If team data unavailable, falls back to individual kitty stats

---

### 3. DateTime Parsing & Validation

#### Save Format
```
"YYYY-MM-DD HH:MM:SS" (e.g., "2024-01-15 14:23:45")
```

#### Parsing Logic (`TryParseSavedDateTime`)
Validates format before parsing to avoid exceptions:
- Checks length >= 19 characters
- Validates delimiter positions (hyphens, colons, space/T separator)
- Uses `CultureInfo.InvariantCulture` for consistent parsing
- Returns `false` on any validation failure

#### Fallback Strategy
If parsing fails:
```csharp
lastGameTime = fallbackTime; // Uses current time
```
This prevents crashes but logs a debug warning.

---

### 4. Empty Game Detection

A game is considered "empty" if **ALL** of the following are true:
```csharp
IsGameEmpty(game):
    - Game_ID is null or whitespace
    - TotalTime <= 0.0f
    - TotalProgress <= 0.0f
    - TotalSaves == 0
    - TotalDeaths == 0
    - All rounds (1-5) are empty
```

A round is empty if:
```csharp
IsRoundEmpty(round):
    - RoundTime <= 0.0f
    - Progress <= 0.0f
    - Saves == 0
    - Deaths == 0
```

**Note**: The method returns `true` if **any** round has data (uses `||` logic), which may seem counterintuitive but prevents premature slot reuse.

---

### 5. Admin Approval Logic

```csharp
if (stats.AdminApproved == false && ApprovedForUpload)
    stats.AdminApproved = ApprovedForUpload;
```

- **Default**: `AdminApproved = false` (not visible on web)
- **Promotion**: Only set to `true` if `TournamentSaver.ApprovedForUpload` is true
- **Immutable**: Once approved, never reverts to false automatically
- **Purpose**: Allows admin review before public leaderboard display

---

## Key Algorithms

### 1. Unique ID Generation

#### Game ID
```csharp
GenerateUniqueGameID():
    stringToConvert = "{Second}{Day}{Month}{FullDateTime}{GAME_SEED}"
    base64String = Base64.ToBase64(stringToConvert)
    return base64String[0..^2]  // Remove last 2 characters
```

#### Tournament ID
```csharp
GenerateUniqueTournamentID():
    stringToConvert = "{GAME_SEED}{FullDateTime}{Month}{Day}{Second}"
    base64String = Base64.ToBase64(stringToConvert)
    return base64String[0..^2]
```

**Key Characteristics:**
- Uses current timestamp + global game seed
- Base64 encoding
- Trimmed by 2 characters (likely removes padding `==`)
- Different concatenation order prevents ID collisions

---

### 2. Total Calculation

```csharp
UpdateTotals(currentGame):
    TotalTime = Sum(Round_1..5.RoundTime)
    TotalProgress = Sum(Round_1..5.Progress)
    TotalSaves = Sum(Round_1..5.Saves)
    TotalDeaths = Sum(Round_1..5.Deaths)
```

**Called After Every Round Save:**
- Ensures totals are always synchronized
- Enables quick querying without recalculation
- Follows performance guidelines (avoids LINQ/ToList)

---

### 3. Session Timeout Detection

```csharp
var elapsedSeconds = currentTime.TotalSeconds - lastGameTime.TotalSeconds;
if (elapsedSeconds >= 12 * 3600) // 12 hours
{
    ResetAllGamesData(stats, currentTime);
    return stats.Game_1;
}
```

**Rationale:**
- 12 hours is sufficient time to distinguish intentional breaks from consecutive games and regional system clock differences
- Prevents stale tournament sessions from persisting indefinitely
- Balances between user convenience and data integrity

---

## Integration Guide

### Setting Up the Tournament System

#### 1. Initialize TournamentSaver (Singleton)
```csharp
var saver = TournamentSaver.Instance;
saver.SetRegion("NA"); // Set region early in initialization
saver.ApprovedForUpload = false; // Require admin review by default
```

#### 2. Call During Gameplay
```csharp
// Called at key moments (e.g., round end, checkpoint saves)
TournamentSaver.Instance.SaveTournamentData();
```

#### 3. Ensure Prerequisites
- `Gamemode.CurrentGameMode` is set correctly
- `Globals.ROUND` is accurate (1-5)
- `Globals.ALL_KITTIES_LIST` is populated
- `DateTimeManager.DateTime` is available
- For team tournaments: `Globals.PLAYERS_TEAMS` is populated

#### 4. Access Saved Data
```csharp
var stats = kitty.SaveData.TournamentStats;
var lastGame = stats.Game_3; // Most recent if all slots filled
var totalTimeAcrossGames = stats.Game_1.TotalTime + 
                          stats.Game_2.TotalTime + 
                          stats.Game_3.TotalTime;
```

## Performance Considerations

### Memory Efficiency
- **No LINQ**: All iteration uses `foreach` loops which is fine and minimal overhead
- **No ToList() on massive iterations.**: Direct access to collections.
- **No Dictionaries**: Uses switch statements for round selection
- **Object Pooling**: Could be applied to `TournamentRoundData` if needed

### Current Memory Footprint Per Player
```
TournamentStats: ~500 bytes
    ├── Game_1: ~160 bytes
    │   └── 5 Rounds: ~20 bytes each
    ├── Game_2: ~160 bytes
    └── Game_3: ~160 bytes
```

---

## Debugging & Troubleshooting

### Common Issues

#### Issue: Games Keep Resetting
**Causes:**
- `DateTime` parsing failures (check format)
- System clock changes
- Gamemode switching between saves

**Solution:**
```csharp
Logger.Debug($"Last saved time: {stats.DateTime}");
Logger.Debug($"Current mode: {Gamemode.CurrentGameMode}, Saved mode: {stats.Gamemode}");
```

#### Issue: Team Data Not Saving
**Causes:**
- `Globals.PLAYERS_TEAMS` not populated
- `kitty.TeamID` is 0 or invalid

**Solution:**
Verify team assignment before save:
```csharp
if (Globals.PLAYERS_TEAMS.TryGetValue(kitty.Player, out var team))
{
    Logger.Debug($"Team found: {team.TeamColor}");
}
else
{
    Logger.Debug("No team assignment - will use fallback solo stats");
}
```
---

## Future Enhancements

### Potential Improvements
1. **Dynamic Slot Count**: Support configurable number of games per tournament
2. **Historical Archiving**: Move older tournaments to separate storage
3. **Real-time Sync**: Push updates to web backend during gameplay
4. **Spectator Mode**: Read-only access to tournament data for observers
5. **Replay System**: Store input commands for game replay functionality

### Scalability Considerations
- Current design handles ~1,000 players with minimal overhead
- For larger scale (10,000+ players), consider:
  - Database integration instead of in-memory storage
  - Batch writes at interval checkpoints
  - Separate game slots into individual files

---

## Appendix: Save Conditions Matrix

| Condition | Game_1 | Game_2 | Game_3 | Action |
|-----------|--------|--------|--------|--------|
| First save ever | **Active** | Empty | Empty | Create new tournament |
| Same Game_ID found | Depends on match | Depends on match | Depends on match | Write to matching slot |
| <12 hr, same mode | Full | **Active** | Empty | Continue tournament |
| <12 hr, same mode | Full | Full | **Active** | Continue tournament |
| <12 hr, same mode | Full | Full | Full | Reset all |
| ≥12 hr elapsed | **Active** (reset) | Reset | Reset | New tournament |
| Mode changed | **Active** (reset) | Reset | Reset | New tournament |

---

## Version History

- **v1.0** (Current): Initial implementation with 3-game slots, 5 rounds per game
- Support for Solo and Team tournaments
- Admin approval system
- 12-hour session timeout

---

## License & Credits

This tournament system was designed for **Run Kitty Run** by Chasinggoodgrades.
For questions or contributions, refer to the project repository.
