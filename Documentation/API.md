# Run Kitty Run API Documentation

## Overview

This API provides access to player statistics, game data, tournament information, and leaderboards for Run Kitty Run. All endpoints return JSON responses and use standard HTTP status codes.

**Version:** 1.0.0

---

## Table of Contents

- [Player Endpoints](#player-endpoints)
- [Game Times Endpoints](#game-times-endpoints)
- [Tournament Endpoints](#tournament-endpoints)
- [Game Endpoints](#game-endpoints)
- [Round Endpoints](#round-endpoints)
- [Leaderboard Endpoints](#leaderboard-endpoints)
- [Response Codes](#response-codes)

---

## Player Endpoints

### Get Players

Retrieves player data from the database. Can filter by battletag or return all players.

**Endpoint:** `GET /players`

**Query Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `battletag` | string | No | Filter results by player's battletag |

**Example Requests:**

```http
GET /players
GET /players?battletag=Player%231234
```

**Success Response:**

- **Code:** 200 OK
- **Content:** Array of player objects

```json
[
  {
    "battletag": "Player#1234",
    "Save Data": "{All Player Save Data in JSON format}",
    "LastPlayed": "2024-06-01T12:34:56Z"
    "UploadDate": "2024-06-01T12:34:56Z"
  }
]
```

**Error Response:**

- **Code:** 500 Internal Server Error
- **Content:** `Error connecting to the MySQL database`

---

## Game Times Endpoints

### Get Game Times

Retrieves game time records. Can filter by difficulty level or return all records.

**Endpoint:** `GET /gametimes`

**Query Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `Difficulty` | string | No | Filter results by difficulty level |

**Example Requests:**

```http
GET /gametimes
GET /gametimes?Difficulty=Hard
```

**Success Response:**

- **Code:** 200 OK
- **Content:** Array of game time objects

```json
[
  {
    "GameDate": "2024-06-01T12:34:56Z",
    "Difficulty": "Hard",
    "Data": "{JSON GameTimeData (Date, TeamMembers, Time)}",
    "Invalid": 0
  }
]
```

**Error Response:**

- **Code:** 500 Internal Server Error
- **Content:** `Error connecting to the MySQL database`

---

## Tournament Endpoints

### Get All Tournaments

Retrieves all tournaments from the database.

**Endpoint:** `GET /tournaments`

**Example Request:**

```http
GET /tournaments
```

**Success Response:**

- **Code:** 200 OK
- **Content:** Array of tournament objects

```json
[
  {
    "id": 1,
    "tournament_id": "MTE4NTgyMDI2LTAyLTE2IDIzOjI3OjQ3MjE2ND",
    "region": "NA",
    "gamemode": "SoloTournament",
    "gametype": "Race",
    "datetime": "2024-06-01T12:34:56Z",
    "admin_approved": 0
  }
]
```

**Error Response:**

- **Code:** 500 Internal Server Error
- **Content:** `Error fetching tournaments`

---

### Get Tournament Players

Retrieves all players participating in a specific tournament.

**Endpoint:** `GET /tournaments/:tournamentId/players`

**Path Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `tournamentId` | integer | Yes | Unique identifier for the tournament |

**Example Request:**

```http
GET /tournaments/1/players
```

**Success Response:**

- **Code:** 200 OK
- **Content:** Array of player objects

```json
[
  {
    "battletag": "Player#1234"
  },
  {
    "battletag": "Player#5678"
  }
]
```

**Error Response:**

- **Code:** 500 Internal Server Error
- **Content:** `Error fetching players for tournament`

---

### Get Tournament Games

Retrieves all games for all players in a tournament, ordered by battletag and game number.

**Endpoint:** `GET /tournaments/:tournamentId/games`

**Path Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `tournamentId` | integer | Yes | Unique identifier for the tournament |

**Example Request:**

```http
GET /tournaments/1/games
```

**Success Response:**

- **Code:** 200 OK
- **Content:** Array of game objects ordered by battletag and game number

```json
[
  {
    "id": 1,
    "tournament_id": 1,
    "battletag": "Player#1234",
    "game_number": 1,
    "game_uid": "NDcxNjIyMDI2LTAyLTE2IDIzOjI3OjQ3MTE4NT",
    "team": "red",
    "team_members": "Player#1234, Player#5678, Player#9012",
    "total_deaths": 10,
    "total_progress": 457.05,
    "total_saves": 52,
    "total_time": 456.708
  }
]
```

**Error Response:**

- **Code:** 500 Internal Server Error
- **Content:** `Error fetching games for tournament`

---

### Get Tournament Rounds

Retrieves all rounds for all games in a tournament, ordered by battletag, game number, and round number.

**Endpoint:** `GET /tournaments/:tournamentId/rounds`

**Path Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `tournamentId` | integer | Yes | Unique identifier for the tournament |

**Example Request:**

```http
GET /tournaments/1/rounds
```

**Success Response:**

- **Code:** 200 OK
- **Content:** Array of round objects with associated game information

```json
[
  {
    "id": 1,
    "game_id": 1,
    "round_number": 3,
    "deaths": 4,
    "level": 12,
    "progress": 195.99,
    "round_time": 45.67,
    "saves": 5,
    "battletag": "Player#1234",
    "game_number": 1
  }
]
```

**Error Response:**

- **Code:** 500 Internal Server Error
- **Content:** `Error fetching rounds for tournament`

---

## Game Endpoints

### Get Player Games in Tournament

Retrieves all games for a specific player in a tournament, ordered by game number.

**Endpoint:** `GET /tournaments/:tournamentId/players/:battletag/games`

**Path Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `tournamentId` | integer | Yes | Unique identifier for the tournament |
| `battletag` | string | Yes | Player's battletag (URL encoded) |

**Example Request:**

```http
GET /tournaments/1/players/Player%231234/games
```

**Success Response:**

- **Code:** 200 OK
- **Content:** Array of game objects ordered by game number

```json
[
  {
    "id": 1,
    "tournament_id": 1,
    "battletag": "Player#1234",
    "game_number": 1,
    "game_uid": 456.78,
    "team": "red",
    "team_members": "Player#1234, Player#5678, Player#9012",
    "total_deaths": 10,
    "total_progress": 457.05,
    "total_saves": 52,
    "total_time": 456.708
  }
]
```

**Error Response:**

- **Code:** 500 Internal Server Error
- **Content:** `Error fetching games for player`

---

## Round Endpoints

### Get Game Rounds

Retrieves all rounds for a specific game, ordered by round number.

**Endpoint:** `GET /games/:gameId/rounds`

**Path Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `gameId` | integer | Yes | Unique identifier for the game |

**Example Request:**

```http
GET /games/1/rounds
```

**Success Response:**

- **Code:** 200 OK
- **Content:** Array of round objects ordered by round number

```json
[
  {
    "id": 16,
    "game_id": 4,
    "round_number": 1,
    "deaths": 1,
    "level": 5,
    "progress": 100,
    "round_time": 138.956,
    "saves": 0
  }
]
```

**Error Response:**

- **Code:** 500 Internal Server Error
- **Content:** `Error fetching rounds`

---

## Leaderboard Endpoints

### Get Tournament Time Leaderboard

Retrieves the fastest total time for each player in a tournament, ordered by total time ascending (fastest first).

**Endpoint:** `GET /tournaments/:tournamentId/leaderboard/time`

**Path Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `tournamentId` | integer | Yes | Unique identifier for the tournament |

**Example Request:**

```http
GET /tournaments/2/leaderboard/time
```

**Success Response:**

- **Code:** 200 OK
- **Content:** Array of leaderboard entries ordered by total time (ascending)

```json
[
  {
    "battletag": "Aches#1817",
    "total_time": 965.0114135742188
  },
  {
    "battletag": "Cait#12805",
    "total_time": 1023.8090209960938
  },
  {
    "battletag": "Omniology#11850",
    "total_time": 1283.5980224609375
  },
  {
    "battletag": "hoff#11404",
    "total_time": 1507.989013671875
  }
]
```

**Error Response:**

- **Code:** 500 Internal Server Error
- **Content:** `Error fetching leaderboard`

---

## Response Codes

The API uses standard HTTP response codes:

| Code | Description |
|------|-------------|
| `200` | Success - Request completed successfully |
| `500` | Internal Server Error - Database connection or query error |

---

## Notes

- All string parameters in URLs should be URL-encoded (e.g., `Player#1234` becomes `Player%231234`)
- Timestamps are returned in ISO 8601 format
- All numeric values (times, scores) are returned as numbers
- Empty result sets return an empty array `[]`

---

## Support

For issues, questions, or contributions, please visit the [GitHub repository](https://github.com/Chasinggoodgrades/RunKittyRun).
