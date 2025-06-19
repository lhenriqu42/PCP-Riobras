
import React, { useState } from 'react';
import Login from './components/login'; 

function App() {

  const [isAuthenticated, setIsAuthenticated] = useState(false);

  const [user, setUser] = useState(null);


  const handleLoginSuccess = (loggedInUser) => {
    setIsAuthenticated(true); 
    setUser(loggedInUser);   

    console.log('Login bem-sucedido para:', loggedInUser.username);
  };

  const handleLogout = () => {
    setIsAuthenticated(false);
    setUser(null);
    console.log('Usuário deslogado.');
  };

  return (
    <div className="App">
      {}
      {!isAuthenticated ? (
        <Login onLoginSuccess={handleLoginSuccess} />
      ) : (
        <div>
          <h1>Bem-vindo, {user ? user.username : 'Usuário'}!</h1>
          <p>Você está logado.</p>
          <button onClick={handleLogout}>Sair</button>
        </div>
      )}
    </div>
  );
}

export default App;