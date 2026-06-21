import { Navbar, Nav, Container, Button } from 'react-bootstrap';
import { Link } from 'react-router';


function Navigation(props) {

  return (
    <Navbar bg="dark" data-bs-theme="dark">
      <Container>
        <Nav className="me-auto">
          <Nav.Link as={Link} to="/"> Home <i className="bi bi-house-door"></i></Nav.Link>

          {props.loggedIn && (
            <>
              <Nav.Link as={Link} to="/leaderboard"> Classifica <i className="bi bi-trophy"></i></Nav.Link>
              <Nav.Link as={Link} to="/setup"> Gioca <i className="bi bi-controller"></i></Nav.Link>
            </>
          )}
        </Nav>
        <Nav>
          {props.loggedIn ? (
            <>
              <Navbar.Text className="me-3"><i className="bi bi-person-circle me-1"></i> {props.user.name}</Navbar.Text>
              <Button variant="outline-light" onClick={props.handleLogout}>Logout</Button>
            </>
          ) : (
            <Button as={Link} to="/login" variant="outline-light">Login</Button>
          )}
        </Nav>
      </Container>
    </Navbar>
  );
}

export default Navigation;