import { useEffect, useState } from 'react';
import { Alert, Badge, Button, Card, Col, ListGroup, Row, Spinner } from 'react-bootstrap';
import { Link, useLocation, useNavigate, useParams } from 'react-router';

import API from '../API/API.js';
import MetroMap from './MetroMap.jsx';


// Converte una tratta in una stringa del tipo "Paddington ↔ Marylebone"
function edgeLabel(edge) {
  return `${edge.fromStationName} ↔ ${edge.toStationName}`;
}

function Play() {
  const { gameId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const game = location.state;

  const [endTime, setEndTime] = useState(null);
  const [network, setNetwork] = useState(null);
  const [selectedPath, setSelectedPath] = useState([]);
  const [usedEdges, setUsedEdges] = useState([]);
  const [secondsLeft, setSecondsLeft] = useState(90);
  const [submitted, setSubmitted] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');
  const [addedStationsCount, setAddedStationsCount] = useState([]);
  const [currentStepIndex, setCurrentStepIndex] = useState(0);


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
        submitPath(selectedPath);
      }
    }, 250);

    return () => clearInterval(timer);

  }, [game, submitted, endTime, selectedPath]);


  // Restituisce il nome di una stazione a partire dal suo id
  function getStationName(stationId) {
    const station = network.stations.find((station) => station.id === stationId);
    if (station) {
      return station.name;
    } else {
      return undefined;
    }
  }


  // Genera una chiave unica per identificare una tratta (es: "1-2")
  function getEdgeKey(a, b) {
    return Math.min(a, b) + "-" + Math.max(a, b);
  }


  // Controlla se una tratta non è ancora stata usata
  function isEdgeUsable(edge) {
    return !usedEdges.some((usedEdge) =>
      getEdgeKey(usedEdge.fromStationId, usedEdge.toStationId) ===
      getEdgeKey(edge.fromStationId, edge.toStationId)
    );
  }


  // Aggiunge una tratta al percorso selezionato
  function selectEdge(edge) {
    if (submitted) return;
    if (!isEdgeUsable(edge)) return;

    let newStations;

    // Prima tratta selezionata
    if (selectedPath.length === 0) {

      //Decide quale stazione della tratta mettere per prima
      if (edge.fromStationId === game.startStation.id) {
        newStations = [edge.fromStationId, edge.toStationId];
      }
      else if (edge.toStationId === game.startStation.id) {
        newStations = [edge.toStationId, edge.fromStationId];
      }
      else {
        newStations = [edge.fromStationId, edge.toStationId];
      }
    }

    // Tratte successive
    else {
      const currentStationId = selectedPath[selectedPath.length - 1];

      //Decide quale stazione della tratta mettere per prima
      if (edge.fromStationId === currentStationId) {
        newStations = [...selectedPath, edge.toStationId];
      } else if (edge.toStationId === currentStationId) {
        newStations = [...selectedPath, edge.fromStationId];
      } else {
        if (edge.fromStationId === game.endStation.id) {
          newStations = [...selectedPath, edge.toStationId, edge.fromStationId];
        } else {
          newStations = [...selectedPath, edge.fromStationId, edge.toStationId];
        }
      }
    }

    const count = newStations.length - selectedPath.length;

    // Salva la tratta nel percorso
    setSelectedPath(newStations);

    // Salva la tratta tra quelle già utilizzate
    setUsedEdges((oldEdges) => [...oldEdges, edge]);

    // Salva quante stazioni sono state aggiunte da questa tratta
    // (1 se collegata alla precedente, 2 se è la prima o se è scollegata)
    setAddedStationsCount((oldCounts) => [
      ...oldCounts,
      count
    ]);

  }


  // Rimuove l'ultima tratta inserita nel percorso
  function removeLastEdge() {
    if (submitted) return;
    if (usedEdges.length === 0) return;

    const lastCount = addedStationsCount[addedStationsCount.length - 1];

    setSelectedPath((oldPath) => oldPath.slice(0, -lastCount));
    setUsedEdges((oldEdges) => oldEdges.slice(0, -1));
    setAddedStationsCount((oldCounts) => oldCounts.slice(0, -1));
  }


  // Cancella completamente il percorso selezionato
  function clearPath() {
    if (submitted) return;

    setSelectedPath([]);
    setUsedEdges([]);
    setAddedStationsCount([]);
  }


  // Invia il percorso al server per la validazione
  async function submitPath(pathToSubmit) {
    if (submitted) return;

    setSubmitted(true);
    setError('');

    try {
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

  // Recupera lo step attualmente visualizzato
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
            <Col>
              <strong>Partenza:</strong>{' '}
              <Badge bg="success">{game.startStation.name}</Badge>
            </Col>
            <Col>
              <strong>Arrivo:</strong>{' '}
              <Badge bg="danger">{game.endStation.name}</Badge>
            </Col>
            <Col>
              <strong>Monete iniziali:</strong> {game.initialCoins} <i className="bi bi-coin"></i>
            </Col>
          </Row>
        </Card.Body>
      </Card>

      {!result && (
        <>
          <Card className="mb-3">
            <Card.Body>
              <Card.Title>Mappa senza linee</Card.Title>
              <MetroMap
                network={{
                  stations: network.stations,
                  lines: [],
                  lineStations: []
                }}
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
                      const usable = isEdgeUsable(edge);

                      return (
                        <ListGroup.Item
                          key={getEdgeKey(edge.fromStationId, edge.toStationId)}
                          action
                          disabled={!usable || submitted}
                          onClick={() => selectEdge(edge)}
                        >
                          {edgeLabel(edge)}
                          {!usable && (
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
                    {usedEdges.map((edge, index) => (
                      <li key={`${getEdgeKey(edge.fromStationId, edge.toStationId)}-${index}`}>
                        {edgeLabel(edge)}
                      </li>
                    ))}
                  </ol>

                  <Button onClick={() => submitPath(selectedPath)} disabled={submitted}>
                    Invia percorso
                  </Button>
                  <Button
                    variant="warning"
                    className="ms-2"
                    onClick={removeLastEdge}
                    disabled={submitted || usedEdges.length === 0}
                  >
                    Rimuovi ultima tratta
                  </Button>

                  <Button
                    variant="danger"
                    className="mt-2"
                    onClick={clearPath}
                    disabled={submitted || usedEdges.length === 0}
                  >
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

            {result.valid && currentStepIndex === 0 ? (
              <Alert variant="success">
                Percorso valido! Esecuzione del viaggio iniziata.
              </Alert>
            ) : !result.valid ? (
              <Alert variant="danger">
                Percorso non valido! {result.reason} Punteggio finale: <strong>0</strong> <i className="bi bi-coin"></i>
              </Alert>
            ) : null}

            {result.valid && currentStep && (
              <>
                <Card className="mb-3">
                  <Card.Body>
                    <Card.Title>
                      Tappa {currentStep.stepOrder} di {result.steps.length}
                    </Card.Title>

                    <p>
                      <strong>Percorso:</strong>{' '}
                      {getStationName(currentStep.fromStationId)} →{' '}
                      {getStationName(currentStep.toStationId)}
                    </p>

                    <p>
                      <strong>Evento:</strong>{' '}
                      {currentStep.event.description}{' '}
                      ({currentStep.event.effect > 0 ? '+' : ''}
                      {currentStep.event.effect})
                    </p>

                    <p>
                      <strong>Monete aggiornate:</strong>{' '}
                      {currentStep.coinsAfter} <i className="bi bi-coin"></i>
                    </p>

                    {!executionCompleted ? (
                      <Button
                        className="mt-3"
                        onClick={() => setCurrentStepIndex((oldIndex) => oldIndex + 1)}
                      >
                        Prossima tappa
                      </Button>
                    ) : (
                      <Alert variant="success" className="mt-3 mb-0">
                        Viaggio completato! Punteggio finale:{' '}
                        <strong>{result.finalScore}</strong>{' '}
                        <i className="bi bi-coin"></i>
                      </Alert>
                    )}
                  </Card.Body>
                </Card>
              </>
            )}

            <Button as={Link} to="/setup" className="me-2">
              Nuova partita
            </Button>

            <Button as={Link} to="/leaderboard" variant="secondary">
              Classifica
            </Button>
          </Card.Body>
        </Card>
      )}
    </>
  );
}

export default Play;