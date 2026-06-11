import sqlite from "sqlite3";
import crypto from "crypto";


const db = new sqlite.Database("database.sqlite", (err) => {
    if (err) throw err;
});


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

export const getNetwork = () => {
    return new Promise((resolve, reject) => {
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

        db.all(stationsSql, [], (err, stations) => {
            if (err) {
                reject(err);
            }
            else {
                db.all(linesSql, [], (err, lines) => {
                    if (err) {
                        reject(err);
                    }
                    else {
                        db.all(lineStationsSql, [], (err, lineStations) => {
                            if (err) {
                                reject(err);
                            }
                            else {
                                db.all(edgesSql, [], (err, edges) => {
                                    if (err) {
                                        reject(err);
                                    }
                                    else {
                                        resolve({
                                            stations,
                                            lines,
                                            lineStations,
                                            edges
                                        });
                                    }
                                });
                            }
                        });
                    }
                });
            }
        });
    });
};



/* LEADERBOARD */

export const getLeaderboard = () => {
    return new Promise((resolve, reject) => {
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

        db.all(sql, [], (err, rows) => {
            if (err) {
                reject(err);
            }
            else {
                resolve(rows);
            }
        });
    });
};

