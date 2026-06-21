[![Review Assignment Due Date](https://classroom.github.com/assets/deadline-readme-button-22041afd0340ce965d47ae6ef1cefeee28c7c493a6346c4f15d667ab976d596c.svg)](https://classroom.github.com/a/iZes9Qfg)
# Exam #1: "Ultima Corsa"
## Student: s352496 PONTAROLO LETIZIA 

## React Client Application Routes

- Route `/`: home page containing the game instructions. Anonymous users can only access this page and the login page
- Route `/login`: login page
- Route `/setup`: setup phase showing the complete underground map before starting a game
- Route `/play/:gameId`: planning, execution and result phase of a game identified by gameId
- Route `/leaderboard`: leaderboard showing the best score of each user

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

- GET `/api/network/setup`    
  - Description: returns all stations and all metro lines, each containing the ordered list of stations belonging to that line
  - Request body: none
  - Response: `200 OK` (success), `401 Unauthorized` (failure, not authenticated) or `500 Internal Server Error` (failure)
  - Response body: a JSON object representing the network used during the setup phase

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
          "color": "brown",
          "stations": [
            {
              "id": 1,
              "name": "Paddington",
              "position": 1
            },
            {
              "id": 2,
              "name": "Marylebone",
              "position": 2
            },
            ...
          ]
        },
        ...
      ]
    }
    ```

- GET `/api/network/play`    
  - Description: returns all stations and all available connections between adjacent stations
  - Request body: none
  - Response: `200 OK` (success), `401 Unauthorized` (failure, not authenticated) or `500 Internal Server Error` (failure)
  - Response body: a JSON object representing the data required during the game

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
      "edges": [
        {
          "fromStationId": 3,
          "fromStationName": "Baker Street",
          "toStationId": 9,
          "toStationName": "Bond Street",
          "edgeKey": "3-9"
        },
        {
          "fromStationId": 3,
          "fromStationName": "Baker Street",
          "toStationId": 15,
          "toStationName": "Great Portland Street",
          "edgeKey": "3-15"
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
          "fromStationName": "Holborn",
          "toStationId": 11,
          "toStationName": "British Museum",
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
          "fromStationName": "British Museum",
          "toStationId": 10,
          "toStationName": "Tottenham Court Road",
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

- `Home` (in `Home.jsx`): instructions page
- `Login` (in `Login.jsx`): login form
- `Navigation` (in `Navigation.jsx`): top navigation bar with login/logout, home, leaderboard and play
- `MetroMap` (in `MetroMap.jsx`): renders the underground map using SVG
- `Setup` (in `Setup.jsx`): setup phase before the game starts
- `Play` (in `Play.jsx`): planning, execution and result phases
- `Leaderboard` (in `Leaderboard.jsx`): displays the leaderboard

## Screenshot

- Leaderboard  
  ![Leaderboard](leaderboard.png)

- During a game  
  ![Game](game1.png)
  ![Game](game2.png)

## Users Credentials

- username: sofia, password: Sofia2026!
- username: mario, password: Marioo00
- username: anna, password: Verdi99!

## Use of AI Tools

ChatGPT was used to help design the underground network (selection of lines, stations, and interchange stations), to assist in creating the SVG map layout and to perform code reviews aimed at checking the consistency of the implementation with the project specifications.