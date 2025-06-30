const express = require('express');
const cors = require('cors');
const { google } = require('googleapis');
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const app = express();
const port = 3001;

app.use(cors({
  origin: 'http://localhost:3000',
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));
app.use(express.json());

// Configuração Google Sheets para Login e Níveis de Acesso
const auth = new google.auth.GoogleAuth({
  credentials: {
    client_email: process.env.GOOGLE_CLIENT_EMAIL,
    private_key: process.env.GOOGLE_PRIVATE_KEY.replace(/\\n/g, '\n'),
  },
  scopes: ['https://www.googleapis.com/auth/spreadsheets'],
});
const sheets = google.sheets({ version: 'v4', auth });
const spreadsheetId = process.env.GOOGLE_SHEET_ID;

// Configuração Supabase para Dados da Aplicação
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY;
// Chave de serviço Supabase (para operações seguras no backend)
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseAnonKey || !supabaseServiceRoleKey) {
  console.error("ERRO: Variáveis de ambiente Supabase não definidas (URL, ANON_KEY, SERVICE_ROLE_KEY).");
  process.exit(1);
}
const supabase = createClient(supabaseUrl, supabaseAnonKey);
const supabaseAdmin = createClient(supabaseUrl, supabaseServiceRoleKey);

// Middleware de autenticação simples (apenas para simular um user no req)
// No mundo real, você usaria JWT ou sessões para gerenciar autenticação
const authenticateToken = async (req, res, next) => {
    // Isso é uma SIMULAÇÃO para ter acesso ao usuário no req.
    // Em produção, você teria um token JWT vindo do cliente
    // e o decodificaria para obter o usuário.
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1]; // "Bearer TOKEN"

    if (token == null) {
        // Se não houver token, tentamos pegar o usuário do localStorage (mock)
        // Isso é apenas para testar localmente. Não faça isso em produção.
        const mockUserString = req.headers['x-mock-user']; // Cabeçalho personalizado para mockar o usuário
        if (mockUserString) {
            try {
                req.user = JSON.parse(mockUserString);
            } catch (e) {
                console.warn("Mock user header mal formatado.");
                req.user = null;
            }
        } else {
            req.user = null; // Sem usuário
        }
        return next();
    }

    // Para um sistema real, você decodificaria o JWT aqui:
    // jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, (err, user) => {
    //   if (err) return res.sendStatus(403);
    //   req.user = user;
    //   next();
    // });
    next(); // Por enquanto, apenas avança para simular autenticação
};

// --- Rota de Login (Atualizada para retornar o nível de acesso) ---
app.post('/login', async (req, res) => {
  const { username, password } = req.body;
  try {
    // Assumimos que a planilha USUARIOS tem 3 colunas: [USERNAME, PASSWORD, NIVEL_ACESSO]
    const loginRange = 'USUARIOS!A:C'; // Adicionado coluna C para NIVEL_ACESSO

    const response = await sheets.spreadsheets.values.get({
      spreadsheetId,
      range: loginRange,
    });
    const users = response.data.values;

    if (!users || users.length < 2) { // Pelo menos um cabeçalho e um usuário
      return res.status(401).json({ message: 'Nenhum usuário encontrado na planilha de login.' });
    }

    // Ignora a primeira linha (cabeçalho)
    const foundUser = users.slice(1).find(
      (row) => row[0] === username && row[1] === password
    );

    if (foundUser) {
      // O nível de acesso é a terceira coluna (índice 2)
      const userLevel = parseInt(foundUser[2], 10); // Converte para número
      res.status(200).json({ message: 'Login bem-sucedido!', user: { username, level: userLevel } });
    } else {
      res.status(401).json({ message: 'Credenciais inválidas.' });
    }
  } catch (error) {
    console.error('Erro no login via Google Sheets:', error.message);
    res.status(500).json({ message: 'Erro ao tentar fazer login.', error: error.message });
  }
});

// --- Rotas para a Meta de Produção ---
let cachedMeta = null; // Cache simples para a meta

// Rota para obter a meta de produção
app.get('/api/meta-producao', async (req, res) => {
  try {
    if (cachedMeta !== null) {
      return res.status(200).json({ meta: cachedMeta });
    }

    const { data, error } = await supabase.from('configuracoes')
      .select('valor')
      .eq('chave', 'meta_producao_diaria')
      .single(); // Espera apenas um resultado

    if (error && error.code !== 'PGRST116') { // PGRST116 = linha não encontrada
      throw error;
    }

    const meta = data ? data.valor : 1000; // Valor padrão se não encontrada
    cachedMeta = meta; // Cacheia o valor
    res.status(200).json({ meta });

  } catch (error) {
    console.error('Erro ao buscar meta de produção do Supabase:', error.message);
    res.status(500).json({ message: 'Erro ao buscar meta de produção.', error: error.message });
  }
});

// Rota para atualizar a meta de produção
// Adicionamos o middleware authenticateToken para simular o acesso ao req.user
app.post('/api/meta-producao', authenticateToken, async (req, res) => {
  const { meta } = req.body;
  const user = req.user; // Obtém o usuário do middleware (simulado ou real)

  // VERIFICAÇÃO DE NÍVEL DE ACESSO
  // Assumindo que user.level é 2 para gestores
  if (!user || user.level !== 2) {
    return res.status(403).json({ message: 'Acesso negado. Você não tem permissão para alterar a meta.' });
  }

  if (typeof meta !== 'number' || meta < 0) {
    return res.status(400).json({ message: 'Valor de meta inválido. Deve ser um número não negativo.' });
  }

  try {
    // Tenta atualizar a meta existente
    const { data, error: updateError } = await supabaseAdmin.from('configuracoes')
      .update({ valor: meta, ultima_atualizacao: new Date().toISOString(), atualizado_por: user.username || 'Desconhecido' })
      .eq('chave', 'meta_producao_diaria')
      .select();

    if (updateError && updateError.code !== 'PGRST116') { // PGRST116 = linha não encontrada
        throw updateError;
    }

    if (!data || data.length === 0) { // Se não atualizou (não existia), insere
        const { error: insertError } = await supabaseAdmin.from('configuracoes')
            .insert({ chave: 'meta_producao_diaria', valor: meta, atualizado_por: user.username || 'Desconhecido' })
            .select();
        if (insertError) throw insertError;
    }

    cachedMeta = meta; // Atualiza o cache
    res.status(200).json({ success: true, message: 'Meta atualizada com sucesso', meta });

  } catch (error) {
    console.error('Erro ao salvar nova meta no Supabase:', error.message);
    res.status(500).json({ message: 'Erro ao salvar a meta de produção.', error: error.message });
  }
});

// --- Rotas existentes (sem alterações aqui, exceto para o middleware authenticateToken se necessário no futuro) ---

// Rota para buscar listas de dados
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
    console.error('Erro ao buscar listas do Supabase:', error.message);
    res.status(500).json({ message: 'Erro ao buscar listas de dados do Supabase.', error: error.message });
  }
});

// Rota para inserir novo apontamento
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

  // Cálculo da quantidade efetiva
  const quantidade_efetiva = quantidade_injetada - pecas_nc;

  try {
    // Inserir com chave de serviço (supabaseAdmin)
    const { data, error } = await supabaseAdmin
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
          tipo_registro: tipo_registro,
          quantidade_efetiva // Nova coluna
        }
      ])
      .select();

    if (error) {
      console.error('Erro Supabase ao inserir:', error);
      return res.status(500).json({
        message: 'Erro ao inserir apontamento.',
        details: error.message || error.details || error.hint || error.code || 'Detalhes desconhecidos.',
      });
    }

    res.status(201).json(data[0]);
  } catch (error) {
    console.error('Erro geral ao inserir apontamento:', error.message);
    res.status(500).json({ message: 'Erro interno do servidor.', error: error.message });
  }
});

// Rota para buscar apontamentos com filtros
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
      console.error('Erro Supabase ao buscar apontamentos:', error);
      return res.status(500).json({
        message: 'Erro ao buscar apontamentos para o relatório.',
        details: error.message || error.details || error.hint || error.code || 'Detalhes desconhecidos.',
      });
    }

    res.status(200).json(data);
  } catch (error) {
    console.error('Erro geral ao buscar apontamentos:', error.message);
    res.status(500).json({ message: 'Erro interno do servidor.', error: error.message });
  }
});


app.listen(port, () => {
  console.log(`Backend rodando em http://localhost:${port}`);
});