import { Alert, Button, Card } from 'react-bootstrap';
import { Link } from 'react-router';


function Home(props) {

    return (
        <>
            <h1>Ultima Corsa</h1>

            <Card className="mb-3">
                <Card.Body>
                    <Card.Title>Istruzioni</Card.Title>
                    <Card.Text>
                        Pianifica un percorso nella metropolitana di Londra entro 90 secondi.
                        Parti dalla stazione assegnata, raggiungi la destinazione e cerca di conservare più monete possibile.
                        Durante il viaggio ogni tratta genera un evento casuale che può aumentare o diminuire il punteggio.
                    </Card.Text>
                </Card.Body>
            </Card>

            {props.loggedIn ? (
                <>
                    <Alert variant="success">
                        Sei autenticato. Puoi iniziare una nuova partita.
                    </Alert>

                    <Button as={Link} to="/setup" className="me-2">
                        Inizia una partita
                    </Button>

                    <Button as={Link} to="/leaderboard" variant="secondary">
                        Vai alla classifica
                    </Button>
                </>
            ) : (
                <Alert variant="warning">
                    Gli utenti anonimi possono vedere solo le istruzioni. Per giocare devi fare login.
                </Alert>
            )}


        </>
    );
}

export default Home;