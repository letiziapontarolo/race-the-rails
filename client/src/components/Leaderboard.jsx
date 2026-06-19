import { useEffect, useState } from 'react';
import { Alert, Table } from 'react-bootstrap';

import API from '../API/API.js';

function Leaderboard(props) {
    const [leaderboard, setLeaderboard] = useState([]);
    const [error, setError] = useState('');

    useEffect(() => {
        if (props.loggedIn) {
            API.getLeaderboard()
                .then(setLeaderboard)
                .catch(() => setError('Errore nel caricamento della classifica.'));
        }
    }, [props.loggedIn]);

    return (
        <>
            <h1>Classifica generale</h1>

            {!props.loggedIn ? (
                <Alert variant="warning">
                    Gli utenti anonimi possono vedere solo le istruzioni.
                    Per vedere la classifica devi fare login.
                </Alert>
            ) : (
                <>
                    {error && <Alert variant="danger">{error}</Alert>}

                    <Table striped bordered hover>
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
            )}
        </>
    );
}

export default Leaderboard;