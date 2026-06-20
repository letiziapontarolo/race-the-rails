import { useEffect, useState } from 'react';
import { Alert, Badge, Button, Card, Col, ListGroup, Row, Spinner } from 'react-bootstrap';
import { Link, useLocation, useNavigate, useParams } from 'react-router';

import API from '../API/API.js';
import MetroMap from './MetroMap.jsx';

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
  const [currentStepIndex, setCurrentStepIndex] = useState(0);

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

  useEffect(() => {
    if (!game || submitted || !endTime) return;

    const timer = setInterval(() => {

      const remaining = Math.max(0, Math.ceil((endTime - Date.now()) / 1000));

      setSecondsLeft(remaining);

      if (remaining <= 0) {
        clearInterval(timer);
        submitPath(selectedPath);
      }
    }, 250);

    return () => clearInterval(timer);

  }, [game, submitted, endTime, selectedPath]);

  function getStationName(stationId) {
    const station = network.stations.find((station) => station.id === stationId);
    if (station) {
      return station.name;
    } else {
      return undefined;
    }
  }

  function getEdgeKey(a, b) {
    return Math.min(a, b) + "-" + Math.max(a, b);
  }

  function isEdgeUsable(edge) {
    return !usedEdges.includes(getEdgeKey(edge.fromStationId, edge.toStationId));
  }

  function selectEdge(edge) {
    if (submitted) return;
    if (!isEdgeUsable(edge)) return;

    let newStations;

    if (selectedPath.length === 0) {
      if (edge.fromStationId === game.startStation.id) {
        newStations = [edge.fromStationId, edge.toStationId];
      }
      else if (edge.toStationId === game.startStation.id) {
        newStations = [edge.toStationId, edge.fromStationId];
      }
      else {
        newStations = [edge.fromStationId, edge.toStationId];
      }
    } else {
      const currentStationId = selectedPath[selectedPath.length - 1];

      let nextStationId;

      if (edge.fromStationId === currentStationId) {
        nextStationId = edge.toStationId;
      } else if (edge.toStationId === currentStationId) {
        nextStationId = edge.fromStationId;
      } else {
        nextStationId = edge.fromStationId;
      }

      newStations = [...selectedPath, nextStationId];
    }

    setSelectedPath(newStations);

    setUsedEdges((oldEdges) => [
      ...oldEdges,
      getEdgeKey(edge.fromStationId, edge.toStationId)
    ]);
  }

  function removeLastEdge() {
    if (submitted) return;
    if (usedEdges.length === 0) return;

    if (selectedPath.length === 2) {
      setSelectedPath([]);
    } else {
      setSelectedPath((oldPath) => oldPath.slice(0, -1));
    }

    setUsedEdges((oldEdges) => oldEdges.slice(0, -1));
  }

  function clearPath() {
    if (submitted) return;

    setSelectedPath([]);
    setUsedEdges([]);
  }

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

  if (result && result.valid && result.steps.length > 0) {
    currentStep = result.steps[currentStepIndex];

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
            <Col md={7}>
              <Card className="mb-3">
                <Card.Body>
                  <Card.Title>Tratte disponibili</Card.Title>

                  <ListGroup>
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

            <Col md={5}>
              <Card className="mb-3">
                <Card.Body>
                  <Card.Title>Percorso selezionato</Card.Title>

                  <ol>
                    {selectedPath.map((stationId, index) => (
                      <li key={`${stationId}-${index}`}>
                        {getStationName(stationId)}
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
                    disabled={submitted || selectedPath.length <= 1}
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

            {result.valid ? (
              <Alert variant="success">
                Percorso valido! Esecuzione del viaggio iniziata.
              </Alert>
            ) : (
              <Alert variant="danger">
                Percorso non valido! {result.reason}. Punteggio finale: <strong>0</strong> <i className="bi bi-coin"></i>
              </Alert>
            )}

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