import "bootstrap/dist/css/bootstrap.min.css";
import 'bootstrap-icons/font/bootstrap-icons.css';
import { Routes, Route, Navigate } from "react-router";
import { Container } from "react-bootstrap";
import { useState, useEffect } from 'react'

import Home from "./components/Home.jsx";
import Login from "./components/Login.jsx";
import Navigation from "./components/Navigation.jsx";
import Setup from "./components/Setup.jsx";
import Play from "./components/Play.jsx";
import Leaderboard from "./components/Leaderboard.jsx";

import './App.css'
import API from "./API/API.js";

function App() {
  const [loggedIn, setLoggedIn] = useState(false);
  const [user, setUser] = useState(undefined);

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const user = await API.getUserInfo();
        setLoggedIn(true);
        setUser(user);
      } catch {
        setLoggedIn(false);
        setUser(undefined);
      }
    };

    checkAuth();
  }, []);


  const handleLogin = async (credentials) => {
    const user = await API.logIn(credentials);
    setUser(user);
    setLoggedIn(true);
  };

  const handleLogout = async () => {
    await API.logOut();
    setUser(undefined);
    setLoggedIn(false);
  };

  return (
    <>
      <Navigation user={user} loggedIn={loggedIn} handleLogout={handleLogout} />
      <Container className="py-4">
        <Routes>
          <Route path="/" element={<Home loggedIn={loggedIn} />} />
          <Route path="/login" element={loggedIn ? <Navigate replace to="/" /> : <Login handleLogin={handleLogin} />} />
          <Route path="/setup" element={loggedIn ? <Setup /> : <Navigate replace to="/login" />} />
          <Route path="/play/:gameId" element={loggedIn ? <Play /> : <Navigate replace to="/login" />} />
          <Route path="/leaderboard" element={loggedIn ? <Leaderboard /> : <Navigate replace to="/login" />} />
          <Route path="*" element={<Navigate replace to="/" />} />
        </Routes>
      </Container>
    </>
  )
}

export default App
