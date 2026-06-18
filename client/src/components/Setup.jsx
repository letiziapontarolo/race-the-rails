import { useEffect, useState } from 'react';
import { Alert, Button, Card, Spinner } from 'react-bootstrap';
import { useNavigate } from 'react-router';

import API from '../API/API.js';
import MetroMap from './MetroMap.jsx';

function Setup() {
  const [network, setNetwork] = useState(null);
  const [error, setError] = useState('');
  const [starting, setStarting] = useState(false);

  const navigate = useNavigate();

  useEffect(() => {
    API.getNetwork()
      .then(setNetwork)
      .catch(() => setError('Errore nel caricamento della rete.'));
  }, []);

  async function handleStartGame() {
    setStarting(true);
    setError('');

    try {
      const game = await API.startGame();
      navigate(`/play/${game.id}`, { state: game });
    } catch {
      setError('Errore nella creazione della partita.');
      setStarting(false);
    }
  }

  return (
    <>

      <p className="mb-3">
        Studia la mappa completa della rete. Quando sei pronto, inizia la partita:
        nella fase successiva le linee spariranno e avrai 90 secondi.
      </p>

      {error && <Alert variant="danger">{error}</Alert>}

      {!network ? (
        <Spinner animation="border" />
      ) : (
        <Card className="mb-3">
          <Card.Body>
            <MetroMap network={network} showLines={true} />
          </Card.Body>
        </Card>
      )}

      <Button
        onClick={handleStartGame}
        disabled={!network || starting}
      >
        {starting ? 'Creazione partita...' : 'Inizia partita'}
      </Button>
    </>
  );
}

export default Setup;