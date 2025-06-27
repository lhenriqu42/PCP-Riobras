import React, { useState } from 'react';
import { Box, TextField, Button, Typography, Paper, Alert } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext'; // Importe o useAuth do seu AuthContext

export default function Login() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();
  const { login } = useAuth(); // Use a função login do AuthContext

  const handleLogin = async () => {
    try {
      setError(''); // Limpa qualquer erro anterior

      // Chame a função login do AuthContext
      const result = await login(username, password);

      if (result.success) {
        navigate('/home');
      } else {
        // Se o login falhou, exibe a mensagem de erro retornada pelo AuthContext
        setError(result.message || 'Erro ao tentar fazer login. Verifique suas credenciais.');
      }
    } catch (err) {
      // Este catch pegaria erros que não foram tratados pelo AuthContext, como rede.
      console.error('Erro inesperado no componente de login:', err);
      setError('Ocorreu um erro inesperado. Tente novamente mais tarde.');
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter') {
      handleLogin();
    }
  };

  return (
    <Box
      sx={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        minHeight: '100vh',
        backgroundColor: '#f5f5f5',
      }}
    >
      <Paper elevation={3} sx={{ padding: 4, maxWidth: 400, width: '100%' }}>
        <Typography variant="h5" component="h1" gutterBottom align="center">
          Login
        </Typography>
        {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
        <TextField
          label="Usuário"
          variant="outlined"
          fullWidth
          margin="normal"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          onKeyPress={handleKeyPress}
        />
        <TextField
          label="Senha"
          type="password"
          variant="outlined"
          fullWidth
          margin="normal"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          onKeyPress={handleKeyPress}
        />
        <Button
          variant="contained"
          color="primary"
          fullWidth
          size="large"
          sx={{ mt: 2 }}
          onClick={handleLogin}
        >
          Entrar
        </Button>
      </Paper>
    </Box>
  );
}