import { useEffect, useState } from 'react';
import { Alert, Table } from 'react-bootstrap';

import API from '../API/API.js';

function Leaderboard() {
    const [leaderboard, setLeaderboard] = useState([]);
    const [error, setError] = useState('');

    useEffect(() => {
        API.getLeaderboard()
            .then(setLeaderboard)
            .catch(() => setError('Errore nel caricamento della classifica.'));
    }, []);

    return (
        <>
            <h1>Classifica generale</h1>

            {error && <Alert variant="danger">{error}</Alert>}

            {leaderboard.length === 0 && !error && (
                <Alert variant="info">Nessuna partita completata.</Alert>
            )}

            <Table striped bordered>
                <thead>
                    <tr>
                        <th>Posizione</th>
                        <th>Giocatore</th>
                        <th>Username</th>
                        <th>Miglior punteggio</th>
                    </tr>
                </thead>
                <tbody>
                    {leaderboard.map((row, index) => (
                        <tr key={row.username}>
                            <td>{index + 1}</td>
                            <td>{row.name}</td>
                            <td>{row.username}</td>
                            <td>{row.bestScore}</td>
                        </tr>
                    ))}
                </tbody>
            </Table>
        </>
    );
}

export default Leaderboard;