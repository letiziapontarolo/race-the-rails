[![Review Assignment Due Date](https://classroom.github.com/assets/deadline-readme-button-22041afd0340ce965d47ae6ef1cefeee28c7c493a6346c4f15d667ab976d596c.svg)](https://classroom.github.com/a/iZes9Qfg)
# Exam #N: "Exam Title"
## Student: s123456 LASTNAME FIRSTNAME 

## React Client Application Routes

- Route `/`: page content and purpose
- Route `/something/:param`: page content and purpose, param specification
- ...

## API Server

- POST `/api/sessions`  
  - Description: create a new session (i.e., perform the login)
  - Request body: a JSON object with username and password

    ```
    { 
      "username": "anna", 
      "password": "Verdi99!" 
    }
    ```
  - Response: `201 Created` (success) or `401 Unauthorized` (failure, wrong credentials)  
  - Response body: a JSON object representing the authenticated user

    ```
    { 
      "id": 3, 
      "username": "anna", 
      "name": "Anna Verdi" 
    }
    ```

- GET `/api/sessions/current`    
  - Description: check if the user is still logged in
  - Request body: none
  - Response: `200 OK` (success) or `401 Unauthorized` (failure, not authenticated)
  - Response body: a JSON object representing the authenticated user

    ```
    { 
      "id": 3, 
      "username": "anna", 
      "name": "Anna Verdi" 
    }
    ```

- DELETE `/api/sessions/current`
  - Description: delete the session for the current user (i.e., perform the logout)
  - Request body: none
  - Response: `200 OK` (success)
  - Response body: none

- GET `/api/network`    
  - Description: returns all stations, all metro lines, the association between stations and lines (including their order on each line) and all directly connected station pairs
  - Request body: none
  - Response: `200 OK` (success), `401 Unauthorized` (failure, not authenticated) or `500 Internal Server Error` (failure)
  - Response body: a JSON object representing the network

    ```
    {
      "stations": [
        {
          "id": 3,
          "name": "Baker Street"
        },
        {
          "id": 18,
          "name": "Barbican"
        },
        ...
      ],
      "lines": [
        {
          "id": 1,
          "name": "Bakerloo Line",
          "color": "brown"
        },
        {
          "id": 2,
          "name": "Central Line",
          "color": "red"
        },
        ...
      ],
      "lineStations": [
        {
          "lineId": 1,
          "lineName": "Bakerloo Line",
          "lineColor": "brown",
          "stationId": 1,
          "stationName": "Paddington",
          "position": 1
        },
        {
          "lineId": 1,
          "lineName": "Bakerloo Line",
          "lineColor": "brown",
          "stationId": 2,
          "stationName": "Marylebone",
          "position": 2
        },
        ...
      ],
      "edges": [
        {
          "fromStationId": 3,
          "fromStationName": "Baker Street",
          "toStationId": 9,
          "toStationName": "Bond Street"
        },
        {
          "fromStationId": 3,
          "fromStationName": "Baker Street",
          "toStationId": 15,
          "toStationName": "Great Portland Street"
        },
        ...
      ]
    }
    ```

- GET `/api/leaderboard`    
  - Description: returns the best score of each registered user
  - Request body: none
  - Response: `200 OK` (success), `401 Unauthorized` (failure, not authenticated) or `500 Internal Server Error` (failure)
  - Response body: a JSON array representing the leaderboard

    ```
    [
      {
      "username": "anna",
      "name": "Anna Verdi",
      "bestScore": 24
      },
      {
        "username": "mario",
        "name": "Mario Rossi",
        "bestScore": 23
      },
      {
        "username": "sofia",
        "name": "Sofia Mosso",
        "bestScore": 20
      }
    ]
    ```
  
- POST `/api/games/start`  
  - Description: create a new game for the authenticated user
  - Request body: none
  - Response: `201 Created` (success), `401 Unauthorized` (failure, not authenticated)  or `500 Internal Server Error` (failure)
  - Response body: a JSON object representing the created game

    ```
    {
      "id": 5,
      "startStation": 
        {
          "id": 12,
          "name": "Holborn"
        },
      "endStation": 
        {
          "id": 14,
          "name": "Royal Oak"
        },
      "initialCoins": 20,
      "planningSeconds": 90
    }
    ```

- POST `/api/games/:id/submit`  
  - Description: validates the submitted path, generates random events and returns the final score
  - Request body: a JSON object with the path
    ```
    {
      "path": [12, 11, 10, 5, 4, 3, 14]
    }
    ```
  - Response: `200 OK` (success), `401 Unauthorized` (failure, not authenticated), `404 Not Found` (failure, game not found), `409 Conflict` (failure, game already completed), `422 Unprocessable Entity` (failure, request body malformed) or `500 Internal Server Error` (failure)
  - Response body: a JSON object representing the game's final score and steps

    ```
    {
      "valid": true,
      "finalScore": 17,
      "steps": 
      [
        {
          "stepOrder": 1,
          "fromStationId": 12,
          "toStationId": 11,
          "event": 
          {
            "id": 14,
            "description": "Sciopero improvviso",
            "effect": -3
          },
          "coinsAfter": 17
        },
        {
          "stepOrder": 2,
          "fromStationId": 11,
          "toStationId": 10,
          "event":
          {
            "id": 2,
            "description": "Passeggero gentile",
            "effect": 1
          },
          "coinsAfter": 18
        },
        ...
      ]
    }
    ```

## Database Tables

- Table `users` - contains registered users, hashed passwords and salts
- Table `stations` - contains underground stations
- Table `lines` - contains underground lines
- Table `line_stations` - associates stations with lines and stores their order
- Table `games` - contains information about each played game
- Table `game_steps` - contains every segment travelled during a game and the associated event
- Table `events` - contains random events and their effects on coins

## Main React Components

- `ListOfSomething` (in `List.js`): component purpose and main functionality
- `GreatButton` (in `GreatButton.js`): component purpose and main functionality
- ...

(only _main_ components, minor ones may be skipped)

## Screenshot

![Screenshot](./img/screenshot.jpg)

## Users Credentials

- username: sofia, password: Sofia2026!
- username: mario, password: Marioo00
- username: anna, password: Verdi99!

## Use of AI Tools
Briefly describe whether you used any AI tools (e.g., ChatGPT, GitHub Copilot, Claude) while working on this project, for which purposes (e.g., clarifying concepts, debugging, generating code), and how you verified or adapted their output.
If you did not use any AI tools, simply state so.
