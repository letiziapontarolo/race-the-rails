import sqlite from "sqlite3";
import crypto from "crypto";


// Apertura del database
const db = new sqlite.Database("database.sqlite", (err) => {
    if (err) throw err;
});


// Funzioni helper per le Promise
const allAsync = (sql, params = []) => {
    return new Promise((resolve, reject) => {
        db.all(sql, params, (err, rows) => {
            if (err) reject(err);
            else resolve(rows);
        });
    });
};

const runAsync = (sql, params = []) => {
    return new Promise((resolve, reject) => {
        db.run(sql, params, function (err) {
            if (err) reject(err);
            else resolve({
                lastID: this.lastID,
                changes: this.changes
            });
        });
    });
};


// USERS

export const getUser = (username, password) => {
    return new Promise((resolve, reject) => {
        const sql = "SELECT * FROM users WHERE username = ?";
        db.get(sql, [username], (err, row) => {
            if (err) {
                reject(err);
            }
            else if (row === undefined) {
                resolve(false);
            }
            else {
                const user = { id: row.id, username: row.username, name: row.name };

                crypto.scrypt(password, row.salt, 32, function (err, hashedPassword) {
                    if (err) reject(err);
                    if (!crypto.timingSafeEqual(Buffer.from(row.password, "hex"), hashedPassword))
                        resolve(false);
                    else
                        resolve(user);
                });
            }
        });
    });
};


const stationsSql = `
      SELECT *
      FROM stations
    `;


// NETWORK

export const getSetupNetwork = async () => {

    const linesSql = `
      SELECT 
        l.id AS lineId,
        l.name AS lineName,
        l.color AS lineColor,
        s.id AS stationId,
        s.name AS stationName,
        ls.position
      FROM lines l
      JOIN line_stations ls ON l.id = ls.line_id
      JOIN stations s ON ls.station_id = s.id
      ORDER BY l.id, ls.position
    `;

    const stations = await allAsync(stationsSql);
    const rows = await allAsync(linesSql);

    const lines = [];

    for (const row of rows) {
        let line = lines.find((line) => line.id === row.lineId);

        if (!line) {
            line = {
                id: row.lineId,
                name: row.lineName,
                color: row.lineColor,
                stations: []
            };

            lines.push(line);
        }

        line.stations.push({
            id: row.stationId,
            name: row.stationName,
            position: row.position
        });
    }

    return {
        stations,
        lines
    };
};

export const getPlayNetwork = async () => {

    const edgesSql = `
      SELECT DISTINCT
        s1.id AS fromStationId,
        s1.name AS fromStationName,
        s2.id AS toStationId,
        s2.name AS toStationName,
        MIN(s1.id, s2.id) || '-' || MAX(s1.id, s2.id) AS edgeKey
      FROM line_stations ls1
      JOIN line_stations ls2
        ON ls1.line_id = ls2.line_id
       AND ls2.position = ls1.position + 1
      JOIN stations s1 ON ls1.station_id = s1.id
      JOIN stations s2 ON ls2.station_id = s2.id
      ORDER BY s1.name, s2.name
    `;

    const stations = await allAsync(stationsSql);
    const edges = await allAsync(edgesSql);

    return {
        stations,
        edges
    };
};


/* LEADERBOARD */

export const getLeaderboard = () => {

    const sql = `
      SELECT 
        u.username,
        u.name,
        MAX(g.final_score) AS bestScore
      FROM users u
      JOIN games g ON u.id = g.user_id
      WHERE g.status = 'completed'
      GROUP BY u.id
      ORDER BY bestScore DESC, u.username ASC
    `;

    return allAsync(sql);
};


/* GAMES HELPERS */

// Recupera tutte le tratte tra stazioni adiacenti, con una chiave unica edgeKey
const getEdges = () => {
    const sql = `
      SELECT DISTINCT
        s1.id AS fromStationId,
        s2.id AS toStationId,
        MIN(s1.id, s2.id) || '-' || MAX(s1.id, s2.id) AS edgeKey,
        ls1.line_id AS lineId
      FROM line_stations ls1
      JOIN line_stations ls2 
        ON ls1.line_id = ls2.line_id 
       AND ls2.position = ls1.position + 1
      JOIN stations s1 ON ls1.station_id = s1.id
      JOIN stations s2 ON ls2.station_id = s2.id
    `;

    return allAsync(sql);
};

// Costruisce una mappa che rappresenta il grafo della rete (stazioni=vertici, tratte=archi) del tipo:
// Map {
//     1 => [2],
//     2 => [1, 3]
// }
const buildMap = (stations, edges) => {
    const map = new Map();

    for (const station of stations) {
        map.set(station.id, []);
    }

    for (const edge of edges) {
        map.get(edge.fromStationId).push(edge.toStationId);
        map.get(edge.toStationId).push(edge.fromStationId);
    }

    return map;
};

// Calcola la distanza minima tra due stazioni
const shortestDistance = (map, startId, endId) => {

    // Crea la coda con la prima stazione
    const queue = [{ id: startId, distance: 0 }];

    // Crea il set delle stazioni già visitate, inizialmente con solo la stazione di partenza
    const visited = new Set([startId]);

    while (queue.length > 0) {

        // Rimuove il primo elemento della coda e lo salva in current
        const current = queue.shift();

        // Se current è la stazione di arrivo, restituisce la distanza trovata
        if (current.id === endId) {
            return current.distance;
        }

        // Aggiunge alla coda ogni vicino non ancora visitato con distanza current + 1
        for (const next of map.get(current.id)) {
            if (!visited.has(next)) {
                visited.add(next);
                queue.push({
                    id: next,
                    distance: current.distance + 1
                });
            }
        }
    }

    // Se non esiste un percorso tra le due stazioni
    return Infinity;
};

// Genera tutte le possibili coppie stazionePartenza-stazioneArrivo con distanza minima 3
const getPossiblePairs = (stations, map) => {
    const possiblePairs = [];

    for (const start of stations) {
        for (const end of stations) {
            if (start.id !== end.id) {
                const distance = shortestDistance(map, start.id, end.id);

                if (distance >= 3 && distance !== Infinity) {
                    possiblePairs.push({
                        startStationId: start.id,
                        startStationName: start.name,
                        endStationId: end.id,
                        endStationName: end.name
                    });
                }
            }
        }
    }

    return possiblePairs;
};

// Restituisce un elemento casuale di un array
const randomElement = (array) => {
    return array[Math.floor(Math.random() * array.length)];
};

// Controlla che il percorso inviato sia valido
const validatePath = async (game, path) => {

    if (!Array.isArray(path) || path.length < 2) {
        return { valid: false, reason: 'Il percorso è vuoto o troppo corto.' };
    }

    if (path[0] !== game.start_station_id) {
        return { valid: false, reason: 'Il percorso non inizia dalla stazione assegnata.' };
    }

    if (path[path.length - 1] !== game.end_station_id) {
        return { valid: false, reason: 'Il percorso non finisce alla stazione assegnata.' };
    }

    // Costruisce una mappa idStazione -> nomeStazione
    const stationMap = new Map((await allAsync(stationsSql)).map((station) => [station.id, station.name]));

    for (const stationId of path) {
        if (!Number.isInteger(stationId) || !stationMap.has(stationId)) {
            return { valid: false, reason: 'Il percorso contiene una stazione sconosciuta.' };
        }
    }

    // Memorizza le tratte già usate, così una stessa tratta non può essere percorsa due volte
    const usedEdges = new Set();

    // Costruisce un array per gli step verificati
    const validatedSteps = [];

    // Costruisce una mappa edgeKey -> lineId
    const edgeMap = new Map((await getEdges()).map((edge) => [edge.edgeKey, edge.lineId]));

    // Controlla ogni coppia di stazioni consecutive del percorso
    for (let i = 0; i < path.length - 1; i++) {
        const fromStationId = path[i];
        const toStationId = path[i + 1];

        const edgeKey = Math.min(fromStationId, toStationId) + "-" + Math.max(fromStationId, toStationId);

        if (usedEdges.has(edgeKey)) {
            return { valid: false, reason: 'Una tratta è usata più di una volta.' };
        }

        usedEdges.add(edgeKey);

        if (!edgeMap.has(edgeKey)) {
            return {
                valid: false,
                reason: 'Due stazioni non sono direttamente connesse.'
            };
        }

        // Aggiunge la tratta all'array di step verificati
        validatedSteps.push({
            fromStationId,
            fromStationName: stationMap.get(fromStationId),
            toStationId,
            toStationName: stationMap.get(toStationId),
            lineId: edgeMap.get(edgeKey)
        });
    }

    return {
        valid: true,
        steps: validatedSteps
    };
};

// Recupera tutti gli eventi disponibili
const getEvents = () => {
    const sql = `
      SELECT *
      FROM events
    `;

    return allAsync(sql);
};

// Inserisce uno step della partita nel database
const insertGameStep = async (gameId, stepOrder, step, event, coinsAfter) => {
    const sql = `
      INSERT INTO game_steps(
        game_id,
        step_order,
        from_station_id,
        to_station_id,
        line_id,
        event_id,
        coins_after
      )
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `;

    const result = await runAsync(
        sql,
        [
            gameId,
            stepOrder,
            step.fromStationId,
            step.toStationId,
            step.lineId,
            event.id,
            coinsAfter
        ]
    );

    return result.lastID;
};

// Aggiorna il punteggio finale e termina la partita
const completeGame = async (gameId, finalScore) => {
    const sql = `
      UPDATE games
      SET final_score = ?,
          status = 'completed',
          completed_at = datetime('now', 'localtime')
      WHERE id = ?
    `;

    const result = await runAsync(sql, [finalScore, gameId]);

    return result.changes;
};

// Recupera una partita e calcola quanti secondi sono trascorsi dall'inizio
const getGame = (gameId, userId) => {
    const sql = `
      SELECT *,
        (strftime('%s','now','localtime') - strftime('%s', started_at)) AS seconds
      FROM games
      WHERE id = ? AND user_id = ?
    `;

    return new Promise((resolve, reject) => {
        db.get(sql, [gameId, userId], (err, row) => {
            if (err) reject(err);
            else resolve(row);
        });
    });
};

/* GAMES */

export const startGame = async (userId) => {
    const stations = await allAsync(stationsSql);
    const edges = await getEdges();
    const map = buildMap(stations, edges);

    const possiblePairs = getPossiblePairs(stations, map);

    if (possiblePairs.length === 0) {
        throw new Error("Nessuna coppia di stazioni disponibile.");
    }

    const pair = randomElement(possiblePairs);

    const sql = `
      INSERT INTO games(user_id, start_station_id, end_station_id, initial_coins, status, started_at)
      VALUES (?, ?, ?, 20, 'planning', datetime('now', 'localtime'))
    `;

    const result = await runAsync(
        sql, [userId, pair.startStationId, pair.endStationId]
    );

    return {
        id: result.lastID,
        startStation: {
            id: pair.startStationId,
            name: pair.startStationName
        },
        endStation: {
            id: pair.endStationId,
            name: pair.endStationName
        },
        initialCoins: 20,
        planningSeconds: 90,
        started_at: Date.now()
    };
};


export const submitGame = async (gameId, userId, path) => {
    const game = await getGame(gameId, userId);

    if (game === undefined) {
        return { notFound: true };
    }

    if (game.status === 'completed') {
        return { alreadyCompleted: true };
    }

    if (game.seconds > 90.5) {
        await completeGame(gameId, 0);

        return {
            valid: false,
            reason: 'Tempo scaduto.',
            finalScore: 0,
            steps: []
        };
    }

    const validation = await validatePath(game, path);

    if (!validation.valid) {
        await completeGame(gameId, 0);

        return {
            valid: false,
            reason: validation.reason,
            finalScore: 0,
            steps: []
        };
    }

    const events = await getEvents();
    let coins = 20;
    const resultSteps = [];

    for (let i = 0; i < validation.steps.length; i++) {
        const step = validation.steps[i];
        const event = randomElement(events);

        coins += event.effect;

        await insertGameStep(gameId, i + 1, step, event, coins);

        resultSteps.push({
            stepOrder: i + 1,
            fromStationId: step.fromStationId,
            fromStationName: step.fromStationName,
            toStationId: step.toStationId,
            toStationName: step.toStationName,
            event: {
                id: event.id,
                description: event.description,
                effect: event.effect
            },
            coinsAfter: coins
        });
    }

    const finalScore = Math.max(0, coins);
    await completeGame(gameId, finalScore);

    return {
        valid: true,
        finalScore,
        steps: resultSteps
    };
};