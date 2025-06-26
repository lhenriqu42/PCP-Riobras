const express = require('express');
const cors = require('cors');
const { google } = require('googleapis');
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const app = express();
const port = 3001; // Porta do backend

// Configuração do CORS para permitir requisições do frontend
app.use(cors({
  origin: 'http://localhost:3000', // Altere para a URL do seu frontend em produção
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));
app.use(express.json()); // Para parsear o corpo das requisições JSON

// ======================================================
// CONFIGURAÇÃO GOOGLE SHEETS (PARA LOGIN)
// ======================================================
const auth = new google.auth.GoogleAuth({
  credentials: {
    client_email: process.env.GOOGLE_CLIENT_EMAIL,
    private_key: process.env.GOOGLE_PRIVATE_KEY.replace(/\\n/g, '\n'), 
  },
  scopes: ['https://www.googleapis.com/auth/spreadsheets'], 
});

const sheets = google.sheets({ version: 'v4', auth });
const spreadsheetId = process.env.GOOGLE_SHEET_ID; 

// ======================================================
// CONFIGURAÇÃO SUPABASE (PARA DADOS DA APLICAÇÃO)
// ======================================================
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY;


if (!supabaseUrl || !supabaseAnonKey) {
  console.error("ERRO: Variáveis de ambiente SUPABASE_URL ou SUPABASE_ANON_KEY não definidas.");
  process.exit(1); 
}
const supabase = createClient(supabaseUrl, supabaseAnonKey);

// ======================================================
// ROTAS DA APLICAÇÃO
// ======================================================

// Rota de Login (USANDO GOOGLE SHEETS)
app.post('/login', async (req, res) => {
  const { username, password } = req.body;
  try {
    // ESTE É O RANGE PARA BUSCAR USUÁRIOS E SENHAS PARA LOGIN
    // Certifique-se que a aba "USUARIOS" existe na sua planilha e que username/password estão em A e B
    const loginRange = 'USUARIOS!A:B'; // Exemplo: Aba "USUARIOS", colunas A (username) e B (password)

    const response = await sheets.spreadsheets.values.get({
      spreadsheetId,
      range: loginRange,
    });
    const users = response.data.values;

    if (!users || users.length === 0) {
      return res.status(401).json({ message: 'Nenhum usuário encontrado na planilha de login.' });
    }

    // Procura pelo usuário nas linhas da planilha (ignora a primeira linha se for cabeçalho)
    const foundUser = users.slice(1).find( // .slice(1) para pular a linha de cabeçalho, se houver
      (row) => row[0] === username && row[1] === password
    );

    if (foundUser) {
      res.status(200).json({ message: 'Login bem-sucedido!', user: { username } });
    } else {
      res.status(401).json({ message: 'Credenciais inválidas.' });
    }
  } catch (error) {
    console.error('Erro no login via Google Sheets:', error.message);
    res.status(500).json({ message: 'Erro ao tentar fazer login.', error: error.message });
  }
});


// Rota para buscar as listas de dados (funcionarios, pecas, maquinas) do SUPABASE
app.get('/api/data/lists', async (req, res) => {
  try {
    const { data: funcionarios, error: funcError } = await supabase.from('funcionarios').select('nome_completo');
    if (funcError) throw funcError;

    const { data: pecas, error: pecasError } = await supabase.from('pecas').select('codigo_peca, descricao_peca');
    if (pecasError) throw pecasError;

    // Lembre-se que 'tipo_injetora' foi adicionado à tabela maquinas
    const { data: maquinas, error: maquinasError } = await supabase.from('maquinas').select('nome_maquina, tipo_injetora');
    if (maquinasError) throw maquinasError;

    res.status(200).json({ funcionarios, pecas, maquinas });
  } catch (error) {
    console.error('Erro ao buscar listas do banco de dados (Supabase):', error.message);
    res.status(500).json({ message: 'Erro ao buscar listas de dados do Supabase.', error: error.message });
  }
});

// Rota para registrar múltiplos apontamentos de injetora (da fase horária) no SUPABASE
app.post('/api/apontamentos/injetora/batch', async (req, res) => {
  const { apontamentos } = req.body; // Espera um array de apontamentos

  if (!Array.isArray(apontamentos) || apontamentos.length === 0) {
    return res.status(400).json({ message: 'Nenhum apontamento válido fornecido.' });
  }

  try {

    const { data, error } = await supabase.from('apontamentos_injetora').insert(apontamentos);

    if (error) {
      console.error('Erro ao inserir apontamentos batch no Supabase:', error.message);
      return res.status(500).json({ message: 'Erro ao registrar apontamentos.', error: error.message });
    }

    res.status(200).json({ message: 'Apontamentos registrados com sucesso!', data });
  } catch (error) {
    console.error('Erro geral no registro de apontamentos batch:', error.message);
    res.status(500).json({ message: 'Erro interno do servidor.', error: error.message });
  }
});


app.listen(port, () => {
  console.log(`Backend rodando em http://localhost:${port}`);
});