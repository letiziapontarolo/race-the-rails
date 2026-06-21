import { useEffect, useState } from 'react';
import { Alert, Badge, Button, Card, Col, ListGroup, Row, Spinner } from 'react-bootstrap';
import { Link, useLocation, useNavigate, useParams } from 'react-router';

import API from '../API/API.js';
import MetroMap from './MetroMap.jsx';


function Play() {

  const { gameId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const game = location.state;

  const [endTime, setEndTime] = useState(null);
  const [network, setNetwork] = useState(null);
  const [secondsLeft, setSecondsLeft] = useState(90);
  const [selectedEdges, setSelectedEdges] = useState([]);
  const [submitted, setSubmitted] = useState(false);
  const [result, setResult] = useState(null);
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [error, setError] = useState('');


  // Carica la rete di gioco e inizializza il tempo di fine della partita
  useEffect(() => {
    if (!game) {
      navigate('/setup', { replace: true });
      return;
    }
    API.getPlayNetwork()
      .then((network) => {
        setNetwork(network);
        setEndTime(Date.now() + 90000);
      })
      .catch(() => setError('Errore nel caricamento della partita.'));
  }, [game, navigate]);


  // Aggiorna il timer e invia automaticamente il percorso allo scadere del tempo
  useEffect(() => {
    if (!game || submitted || !endTime) return;

    const timer = setInterval(() => {

      // Calcola quanti secondi mancano
      const remaining = Math.max(0, Math.ceil((endTime - Date.now()) / 1000));

      setSecondsLeft(remaining);

      if (remaining <= 0) {
        clearInterval(timer);
        submitPath();
      }

    }, 250);

    return () => clearInterval(timer);

  }, [game, submitted, endTime, selectedEdges]);


  // Controlla se una tratta non è ancora stata usata
  function isEdgeUsable(edge) {
    return !selectedEdges.some((selectedEdge) => selectedEdge.edgeKey === edge.edgeKey);
  }


  // Aggiunge una tratta all'elenco delle tratte selezionate
  function selectEdge(edge) {
    if (submitted) return;
    if (!isEdgeUsable(edge)) return;

    setSelectedEdges((oldEdges) => [...oldEdges, edge]);
  }


  // Rimuove l'ultima tratta selezionata
  function removeLastEdge() {
    if (submitted) return;

    setSelectedEdges((oldEdges) => oldEdges.slice(0, -1));
  }


  // Cancella tutte le tratte selezionate
  function clearPath() {
    if (submitted) return;

    setSelectedEdges([]);
  }


  // Costruisce il percorso come array di id di stazioni a partire dalle tratte selezionate
  function buildPathFromEdges() {
    const path = [];

    for (const edge of selectedEdges) {

      // Prima tratta del percorso
      if (path.length === 0) {
        if (edge.fromStationId === game.startStation.id) {
          path.push(edge.fromStationId, edge.toStationId);
        } else if (edge.toStationId === game.startStation.id) {
          path.push(edge.toStationId, edge.fromStationId);
        } else {
          path.push(edge.fromStationId, edge.toStationId);
        }
      } 

      // Tratte successive
      else {
        const currentStationId = path[path.length - 1];

        // Se la nuova tratta è collegata al percorso, aggiunge solo la nuova stazione
        if (edge.fromStationId === currentStationId) {
          path.push(edge.toStationId);
        } else if (edge.toStationId === currentStationId) {
          path.push(edge.fromStationId);
        } 
        
        // Se la tratta è scollegata, aggiunge entrambe le stazioni
        else {
          if (edge.fromStationId === game.endStation.id) {
            path.push(edge.toStationId, edge.fromStationId);
          } else {
            path.push(edge.fromStationId, edge.toStationId);
          }
        }
      }
    }

    return path;
  }


  // Invia il percorso al server per la validazione
  async function submitPath() {
    if (submitted) return;

    setSubmitted(true);
    setError('');

    try {
      const pathToSubmit = buildPathFromEdges();
      const response = await API.submitGame(gameId, pathToSubmit);
      setResult(response);
      setCurrentStepIndex(0);
    } catch {
      setError('Errore durante l’invio del percorso.');
      setSubmitted(false);
    }
  }


  if (error) {
    return <Alert variant="danger">{error}</Alert>;
  }


  if (!game || !network) {
    return <Spinner animation="border" />;
  }


  let currentStep = null;
  let executionCompleted = false;


  // Recupera la tappa attualmente visualizzata durante l'esecuzione del viaggio
  if (result && result.valid && result.steps.length > 0) {
    currentStep = result.steps[currentStepIndex];


    // Verifica se è stato raggiunto l'ultimo step
    if (currentStepIndex >= result.steps.length - 1) {
      executionCompleted = true;
    }
  }


  return (
    <>
      <h1>Partita</h1>

      {!result && (
        <Alert variant={secondsLeft <= 10 ? 'danger' : 'info'}>
          Tempo rimasto <i className="bi bi-clock-fill"></i> : <strong>{secondsLeft}</strong> secondi
        </Alert>
      )}

      <Card className="mb-3">
        <Card.Body>
          <Row>
            <Col><strong>Partenza: </strong><Badge bg="success">{game.startStation.name}</Badge></Col>
            <Col><strong>Arrivo: </strong><Badge bg="danger">{game.endStation.name}</Badge></Col>
            <Col><strong>Monete iniziali:</strong> {game.initialCoins} <i className="bi bi-coin"></i></Col>
          </Row>
        </Card.Body>
      </Card>

      {!result && (
        <>
          <Card className="mb-3">
            <Card.Body>
              <Card.Title>Mappa senza linee</Card.Title>
              <MetroMap
                network={network}
                showLines={false}
                startStationId={game.startStation.id}
                endStationId={game.endStation.id}
              />
            </Card.Body>
          </Card>

          <Row>
            <Col md={8}>
              <Card className="mb-3">
                <Card.Body>
                  <Card.Title>Tratte disponibili</Card.Title>

                  <ListGroup className="edges-list">
                    {network.edges.map((edge) => {
                      return (
                        <ListGroup.Item
                          key={edge.edgeKey}
                          action
                          disabled={!isEdgeUsable(edge) || submitted}
                          onClick={() => selectEdge(edge)}
                        >
                          {edge.fromStationName} ↔ {edge.toStationName}
                          {!isEdgeUsable(edge) && (
                            <Badge bg="secondary" className="ms-2">
                              già usata
                            </Badge>
                          )}
                        </ListGroup.Item>
                      );
                    })}
                  </ListGroup>
                </Card.Body>
              </Card>
            </Col>

            <Col md={4}>
              <Card className="mb-3">
                <Card.Body>
                  <Card.Title>Percorso selezionato</Card.Title>

                  <ol>
                    {selectedEdges.map((edge) => (
                      <li key={edge.edgeKey}>
                        {edge.fromStationName} ↔ {edge.toStationName}
                      </li>
                    ))}
                  </ol>

                  <Button onClick={submitPath} disabled={submitted}>Invia percorso</Button>
                  <Button variant="warning" className="ms-2" onClick={removeLastEdge} disabled={submitted || selectedEdges.length === 0}>
                    Rimuovi ultima tratta
                  </Button>
                  <Button variant="danger" className="mt-2" onClick={clearPath} disabled={submitted || selectedEdges.length === 0}>
                    Cancella percorso
                  </Button>
                </Card.Body>
              </Card>
            </Col>
          </Row>
        </>
      )}

      {result && (
        <Card>
          <Card.Body>
            <Card.Title>Risultato</Card.Title>

            {result.valid ? (
              <Alert variant="success">
                Percorso valido! Esecuzione del viaggio iniziata.
              </Alert>
            ) : (
              <Alert variant="danger">
                Percorso non valido! {result.reason} Punteggio finale: <strong>0</strong> <i className="bi bi-coin"></i>
              </Alert>
            )}

            {result.valid && currentStep && (
              <>
                <Card className="mb-3">
                  <Card.Body>
                    <Card.Title>
                      Tappa {currentStep.stepOrder} di {result.steps.length}
                    </Card.Title>

                    <p><strong>Percorso:</strong> {currentStep.fromStationName} → {currentStep.toStationName}</p>

                    <p>
                      <strong>Evento:</strong> {currentStep.event.description} (
                      {currentStep.event.effect > 0 ? '+' : ''}
                      {currentStep.event.effect})
                    </p>

                    <p>
                      <strong>Monete aggiornate:</strong> {currentStep.coinsAfter} <i className="bi bi-coin"></i>
                    </p>

                    {!executionCompleted ? (
                      <Button className="mt-3" onClick={() => setCurrentStepIndex((oldIndex) => oldIndex + 1)}>
                        Prossima tappa
                      </Button>
                    ) : (
                      <Alert variant="success" className="mt-3 mb-0">
                        Viaggio completato! Punteggio finale: <strong>{result.finalScore}</strong> <i className="bi bi-coin"></i>
                      </Alert>
                    )}
                  </Card.Body>
                </Card>
              </>
            )}

            <Button as={Link} to="/setup" className="me-2">Nuova partita</Button>
            <Button as={Link} to="/leaderboard" variant="secondary">Classifica</Button>
          </Card.Body>
        </Card>
      )}
    </>
  );

}

export default Play;