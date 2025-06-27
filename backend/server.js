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
app.use(express.json()); // Para parsear o corpo das requisições JSON. ESTA LINHA DEVE VIR ANTES DAS ROTAS QUE USAM REQ.BODY

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
    const loginRange = 'USUARIOS!A:B'; 

    const response = await sheets.spreadsheets.values.get({
      spreadsheetId,
      range: loginRange,
    });
    const users = response.data.values;

    if (!users || users.length === 0) {
      return res.status(401).json({ message: 'Nenhum usuário encontrado na planilha de login.' });
    }

    const foundUser = users.slice(1).find( 
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

// Rota para buscar listas de dados (funcionários, peças, máquinas)
app.get('/api/data/lists', async (req, res) => {
  try {
    const { data: funcionarios, error: funcError } = await supabase.from('funcionarios').select('nome_completo');
    if (funcError) throw funcError;

    const { data: pecas, error: pecasError } = await supabase.from('pecas').select('codigo_peca, descricao_peca');
    if (pecasError) throw pecasError;

    const { data: maquinas, error: maquinasError } = await supabase.from('maquinas').select('nome_maquina, tipo_injetora');
    if (maquinasError) throw maquinasError;

    res.status(200).json({ funcionarios, pecas, maquinas });
  } catch (error) {
    console.error('Erro ao buscar listas do banco de dados (Supabase):', error.message);
    res.status(500).json({ message: 'Erro ao buscar listas de dados do Supabase.', error: error.message });
  }
});

// Rota para INSERIR um novo apontamento de injetora (MÉTODO POST)
app.post('/api/apontamentos/injetora', async (req, res) => {
  const {
    tipoInjetora,
    dataApontamento,
    horaApontamento,
    turno,
    maquina,
    funcionario,
    peca,
    quantidade_injetada,
    pecas_nc,
    observacoes,
    tipo_registro 
  } = req.body;

  // Adicionado logs para depuração
  console.log("Recebendo payload para apontamento:", req.body); 
  console.log("Tentando inserir no Supabase..."); 

  try {
    const { data, error } = await supabase
      .from('apontamentos_injetora')
      .insert([
        {
          tipo_injetora: tipoInjetora,
          data_apontamento: dataApontamento,
          hora_apontamento: horaApontamento,
          turno: turno,
          maquina: maquina,
          funcionario: funcionario,
          peca: peca,
          quantidade_injetada: quantidade_injetada,
          pecas_nc: pecas_nc,
          observacoes: observacoes,
          tipo_registro: tipo_registro 
        }
      ])
      .select(); 

    if (error) {
      console.error('ERRO DETALHADO SUPABASE AO INSERIR:', error); // Melhor log de erro
      return res.status(500).json({
        message: 'Erro ao inserir apontamento da injetora.',
        details: error.message || error.details || error.hint || error.code || 'Detalhes do erro desconhecidos.',
      });
    }

    res.status(201).json(data[0]); 
  } catch (error) {
    console.error('Erro GERAL ao inserir apontamento da injetora:', error.message);
    res.status(500).json({ message: 'Erro interno do servidor.', error: error.message });
  }
});

// Rota para BUSCAR apontamentos da injetora com filtros (MÉTODO GET)
app.get('/api/apontamentos/injetora', async (req, res) => {
  const { dataInicio, dataFim, peca, tipoInjetora, turno } = req.query;

  try {
    let query = supabase.from('apontamentos_injetora').select('*');

    if (dataInicio && dataFim) {
      query = query.gte('data_apontamento', dataInicio).lte('data_apontamento', dataFim);
    }

    if (peca) {
      query = query.eq('peca', peca);
    }

    if (tipoInjetora) {
      query = query.eq('tipo_injetora', tipoInjetora);
    }

    if (turno) {
      query = query.eq('turno', turno);
    }

    query = query
      .order('data_apontamento', { ascending: true })
      .order('hora_apontamento', { ascending: true });

    const { data, error } = await query;

    if (error) {
      console.error('Erro ao buscar apontamentos da injetora no Supabase:', error);
      return res.status(500).json({
        message: 'Erro ao buscar apontamentos para o relatório.',
        details: error.message || error.details || error.hint || error.code || 'Detalhes do erro desconhecidos.',
      });
    }

    res.status(200).json(data);
  } catch (error) {
    console.error('Erro geral ao buscar apontamentos para o relatório:', error.message);
    res.status(500).json({ message: 'Erro interno do servidor.', error: error.message });
  }
});


app.listen(port, () => {
  console.log(`Backend rodando em http://localhost:${port}`);
});