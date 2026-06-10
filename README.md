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
  - Response: `201 Created` (success) or `401 Unauthorized` (failure, not authenticated)  
  - Response body: a JSON object representing the authenticated user

    ```
    { "id": 3, 
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
    { "id": 3, 
    "username": "anna", 
    "name": "Anna Verdi" 
    }
    ```

- DELETE `/api/sessions/current`
  - Description: delete the session for the current user (i.e., perform the logout)
  - Request body: none
  - Response: `200 OK` (success)
  - Response body: none


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
