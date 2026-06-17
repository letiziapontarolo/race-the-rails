import { Navbar, Nav, Container, Button } from 'react-bootstrap';
import { Link, useNavigate } from 'react-router';

function Navigation(props) {
  const navigate = useNavigate();

  async function doLogout() {
    await props.onLogout();
    navigate('/');
  }

  return (
    <Navbar bg="dark" variant="dark" expand="lg">
      <Container>

        <Navbar.Toggle aria-controls="main-navbar" />

        <Navbar.Collapse id="main-navbar">
          <Nav className="me-auto">
            <Nav.Link as={Link} to="/">
              Home <i className="bi bi-house-door"></i>
            </Nav.Link>

            <Nav.Link as={Link} to="/leaderboard">
              Classifica <i className="bi bi-trophy"></i>
            </Nav.Link>

            {props.loggedIn && (
              <Nav.Link as={Link} to="/setup">
                Gioca <i className="bi bi-controller"></i>
              </Nav.Link>
            )}

          </Nav>

          <Nav>
            {props.loggedIn ? (
              <>
                <Navbar.Text className="me-3">
                  <i className="bi bi-person-circle me-1"></i> {props.user.name}
                </Navbar.Text>
                <Button variant="outline-light" onClick={doLogout}>
                  Logout
                </Button>
              </>
            ) : (
              <Button as={Link} to="/login" variant="outline-light">
                Login
              </Button>
            )}
          </Nav>
        </Navbar.Collapse>
      </Container>
    </Navbar>
  );
}

export default Navigation;