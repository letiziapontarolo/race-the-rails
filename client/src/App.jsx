import "bootstrap/dist/css/bootstrap.min.css";
import { Routes, Route } from "react-router";
import { Container } from "react-bootstrap";
import { useState } from 'react'

import Home from "./components/Home.jsx";

import './App.css'
import API from "./API/API.js";

function App() {

  return (
    <Container className="py-4">
      <Routes>
        <Route path="/" element={<Home loggedIn={false} />} />
        <Route path="/login" element={loggedIn ? <Navigate replace to="/" /> :<Login onLogin={handleLogin} />} />
      </Routes>
    </Container>
  )
}

export default App
