import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { TextField, Button, Box, Typography, Paper } from '@mui/material';

function Login() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError('');
    const result = await login(username, password);
    if (result.success) {
      navigate('/dashboard/injetora'); // Redireciona para o Dashboard Injetora após o login
    } else {
      setError(result.message);
    }
  };

  return (
    <Box
      sx={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        minHeight: '100vh',
        backgroundColor: 'background.default',
      }}
    >
      <Paper elevation={6} sx={{ padding: 4, display: 'flex', flexDirection: 'column', gap: 2, width: 320, maxWidth: '90%', borderRadius: 2 }}>
        <Typography variant="h5" component="h1" align="center" gutterBottom color="primary">
          Login Riobras PCP
        </Typography>
        <form onSubmit={handleSubmit}>
          <TextField
            label="Usuário"
            variant="outlined"
            fullWidth
            margin="normal"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            required
            autoComplete="username"
          />
          <TextField
            label="Senha"
            type="password"
            variant="outlined"
            fullWidth
            margin="normal"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            autoComplete="current-password"
          />
          {error && (
            <Typography color="error" variant="body2" sx={{ mt: 1 }}>
              {error}
            </Typography>
          )}
          <Button
            type="submit"
            variant="contained"
            color="primary"
            fullWidth
            size="large"
            sx={{ mt: 3 }}
          >
            Entrar
          </Button>
        </form>
      </Paper>
    </Box>
  );
}

export default Login;