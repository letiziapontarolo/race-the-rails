import { useState } from 'react';
import { Alert, Button, Card, Form } from 'react-bootstrap';


function Login(props) {

  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');


  async function handleSubmit(event) {
    event.preventDefault();
    setError('');

    try {
      await props.handleLogin({ username, password });
    } catch {
      setError('Username o password non validi.');
    }
  }

  return (
    <Card className="mx-auto" style={{ maxWidth: '420px' }}>
      <Card.Body>
        <Card.Title>Login</Card.Title>

        {error && <Alert variant="danger">{error}</Alert>}

        <Form onSubmit={handleSubmit}>

          <Form.Group className="mb-3">
            <Form.Label>Username</Form.Label>
            <Form.Control value={username} onChange={(event) => setUsername(event.target.value)}/>
          </Form.Group>

          <Form.Group className="mb-3">
            <Form.Label>Password</Form.Label>
            <Form.Control type="password" value={password} onChange={(event) => setPassword(event.target.value)}/>
          </Form.Group>
          
          <Button type="submit">Login</Button>
        </Form>

      </Card.Body>
    </Card>
  );
}

export default Login;