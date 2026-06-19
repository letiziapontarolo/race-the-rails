import sqlite from "sqlite3";
import crypto from "crypto";


const db = new sqlite.Database("database.sqlite", (err) => {
    if (err) throw err;
});

const getAsync = (sql, params = []) => {
    return new Promise((resolve, reject) => {
        db.get(sql, params, (err, row) => {
            if (err) reject(err);
            else resolve(row);
        });
    });
};

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


/* USERS */

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


/* NETWORK */

export const getNetwork = async () => {
    const stationsSql = `
      SELECT id, name
      FROM stations
      ORDER BY name
    `;

    const linesSql = `
      SELECT id, name, color
      FROM lines
      ORDER BY id
    `;

    const lineStationsSql = `
      SELECT 
        l.id AS lineId,
        l.name AS lineName,
        l.color AS lineColor,
        s.id AS stationId,
        s.name AS stationName,
        ls.position
      FROM line_stations ls
      JOIN lines l ON ls.line_id = l.id
      JOIN stations s ON ls.station_id = s.id
      ORDER BY l.id, ls.position
    `;

    const edgesSql = `
      SELECT DISTINCT
        s1.id AS fromStationId,
        s1.name AS fromStationName,
        s2.id AS toStationId,
        s2.name AS toStationName
      FROM line_stations ls1
      JOIN line_stations ls2
        ON ls1.line_id = ls2.line_id
       AND ls2.position = ls1.position + 1
      JOIN stations s1 ON ls1.station_id = s1.id
      JOIN stations s2 ON ls2.station_id = s2.id
      ORDER BY s1.name, s2.name
    `;

    const stations = await allAsync(stationsSql);
    const lines = await allAsync(linesSql);
    const lineStations = await allAsync(lineStationsSql);
    const edges = await allAsync(edgesSql);

    return {
        stations,
        lines,
        lineStations,
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

const getEdges = () => {
    const sql = `
      SELECT DISTINCT
        s1.id AS fromStationId,
        s2.id AS toStationId,
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

const getStations = () => {
    const sql = `
      SELECT id, name
      FROM stations
    `;

    return allAsync(sql);
};

const buildNetwork = (stations, edges) => {
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

const shortestDistance = (map, startId, endId) => {
    const queue = [{ id: startId, distance: 0 }];
    const visited = new Set([startId]);

    while (queue.length > 0) {
        const current = queue.shift();

        if (current.id === endId) {
            return current.distance;
        }

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

    return Infinity;
};


const edgeKey = (a, b) => {
    return [Math.min(a, b), Math.max(a, b)].join('-');
};

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

    const stations = await getStations();
    const stationsId = new Set(stations.map((station) => station.id));

    for (const stationId of path) {
        if (!Number.isInteger(stationId) || !stationsId.has(stationId)) {
            return { valid: false, reason: 'Il percorso contiene una stazione sconosciuta.' };
        }
    }

    const usedEdges = new Set();
    const validatedSteps = [];
    const edgeMap = new Map((await getEdges()).map((edge) => [
        edgeKey(edge.fromStationId, edge.toStationId),
        edge.lineId])
    );

    for (let i = 0; i < path.length - 1; i++) {
        const fromStationId = path[i];
        const toStationId = path[i + 1];

        const key = edgeKey(fromStationId, toStationId);

        if (usedEdges.has(key)) {
            return { valid: false, reason: 'Una tratta è usata più di una volta.' };
        }

        usedEdges.add(key);

        if (!edgeMap.has(key)) {
            return {
                valid: false,
                reason: 'Due stazioni consecutive non sono direttamente connesse.'
            };
        }

        validatedSteps.push({
            fromStationId,
            toStationId,
            lineId: edgeMap.get(key)
        });
    }

    return {
        valid: true,
        steps: validatedSteps
    };
};


const getEvents = () => {
    const sql = `
      SELECT *
      FROM events
    `;

    return allAsync(sql);
};

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

const getGame = (gameId, userId) => {
    const sql = `
      SELECT *,
      (strftime('%s','now','localtime') - strftime('%s', started_at)) AS seconds
      FROM games
      WHERE id = ? AND user_id = ?
    `;

    return getAsync(sql, [gameId, userId]);
};

/* GAMES */

export const startGame = async (userId) => {
    const stations = await getStations();
    const edges = await getEdges();
    const map = buildNetwork(stations, edges);

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

    if (possiblePairs.length === 0) {
        throw new Error("Nessuna coppia di stazioni disponibile.");
    }

    const pair = possiblePairs[Math.floor(Math.random() * possiblePairs.length)];

    const sql = `
      INSERT INTO games(user_id, start_station_id, end_station_id, initial_coins, status, started_at)
      VALUES (?, ?, ?, 20, 'planning', datetime('now', 'localtime'))
    `;

    const result = await runAsync(
        sql,
        [userId, pair.startStationId, pair.endStationId]
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
        planningSeconds: 90
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

    if (game.seconds > 90) {
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
        const event = events[Math.floor(Math.random() * events.length)];

        coins += event.effect;

        await insertGameStep(gameId, i + 1, step, event, coins);

        resultSteps.push({
            stepOrder: i + 1,
            fromStationId: step.fromStationId,
            toStationId: step.toStationId,
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