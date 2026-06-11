const SERVER_URL = "http://localhost:3001";

// POST /api/sessions
const logIn = async (credentials) => {
    const response = await fetch(SERVER_URL + "/api/sessions", {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify(credentials),
    });
    if (response.ok) {
        const user = await response.json();
        return user;
    }
    else {
        const errDetails = response.headers.get("WWW-Authenticate");
        throw errDetails;
    }
};

// GET /api/sessions/current
const getUserInfo = async () => {
    const response = await fetch(SERVER_URL + "/api/sessions/current", {
        credentials: "include",
    });
    const user = await response.json();
    if (response.ok) {
        return user;
    } else {
        throw user.error;
    }
};

// DELETE /api/sessions/current
const logOut = async () => {
    const response = await fetch(SERVER_URL + "/api/sessions/current", {
        method: "DELETE",
        credentials: "include"
    });
    if (response.ok)
        return null;
}

// GET /api/network
const getNetwork = async () => {
  const response = await fetch(`${SERVER_URL}/api/network`, {
    credentials: 'include'
  });

  if (response.ok) {
    const network = await response.json();
    return network;
  }
  else {
    throw new Error("Internal server error");
  }
};

// GET /api/leaderboard
const getLeaderboard = async () => {
  const response = await fetch(`${SERVER_URL}/api/leaderboard`, {
    credentials: 'include'
  });

  if (response.ok) {
    const leaderboard = await response.json();
    return leaderboard;
  }
  else {
    throw new Error('Internal server error.');
  }
};

const API = { logIn, getUserInfo, logOut, getNetwork, getLeaderboard };
export default API;