const express = require('express');
const cors = require('cors');
const { google } = require('googleapis');
const { createClient } = require('@supabase/supabase-js');
const jwt = require('jsonwebtoken');
require('dotenv').config();

const app = express();

app.use(cors({
    origin: process.env.FRONTEND_URL || 'http://localhost:3000',
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
    allowedHeaders: ['Content-Type', 'Authorization'],
}));
app.use(express.json());

const auth = new google.auth.GoogleAuth({
    credentials: {
        client_email: process.env.GOOGLE_CLIENT_EMAIL,
        private_key: process.env.GOOGLE_PRIVATE_KEY.replace(/\\n/g, '\n'),
    },
    scopes: ['https://www.googleapis.com/auth/spreadsheets'],
});
const sheets = google.sheets({ version: 'v4', auth });
const spreadsheetId = process.env.GOOGLE_SHEET_ID;

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY;
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseAnonKey || !supabaseServiceRoleKey) {
    console.error("ERRO: Variáveis de ambiente Supabase não definidas (URL, ANON_KEY, SERVICE_ROLE_KEY).");
    process.exit(1);
}
const supabase = createClient(supabaseUrl, supabaseAnonKey);
const supabaseAdmin = createClient(supabaseUrl, supabaseServiceRoleKey);

const jwtSecret = process.env.JWT_SECRET;
if (!jwtSecret) {
    console.error("ERRO: Variável de ambiente JWT_SECRET não definida.");
    process.exit(1);
}

const authenticateToken = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (token == null) {
        return res.status(401).json({ message: 'Token de autenticação não fornecido.' });
    }

    jwt.verify(token, jwtSecret, (err, user) => {
        if (err) {
            return res.status(403).json({ message: 'Token inválido ou expirado.' });
        }
        req.user = user;
        next();
    });
};

app.post('/login', async (req, res) => {
    const { username, password } = req.body;
    try {
        const loginRange = 'Usuarios!A:C';
        const response = await sheets.spreadsheets.values.get({
            spreadsheetId,
            range: loginRange,
        });
        const users = response.data.values;

        if (!users || users.length < 2) {
            return res.status(401).json({ message: 'Nenhum usuário encontrado na planilha de login.' });
        }

        const foundUser = users.slice(1).find(
            (row) => row[0] === username && row[1] === password
        );

        if (foundUser) {
            const userLevel = parseInt(foundUser[2], 10);
            const userPayload = {
                id: username,
                username: username,
                level: userLevel
            };
            const token = jwt.sign(userPayload, jwtSecret, { expiresIn: '8h' });

            res.status(200).json({
                message: 'Login bem-sucedido!',
                token: token,
                user: { username, level: userLevel }
            });
        } else {
            res.status(401).json({ message: 'Credenciais inválidas.' });
        }
    } catch (error) {
        res.status(500).json({ message: 'Erro ao tentar fazer login.', error: error.message });
    }
});

app.get('/api/meta-producao', async (req, res) => {
    try {
        const { data, error } = await supabase.from('configuracoes')
            .select('valor')
            .eq('chave', 'meta_producao_diaria')
            .single();

        if (error && error.code !== 'PGRST116') throw error;
        
        const meta = data ? data.valor : 1000;
        res.status(200).json({ meta });

    } catch (error) {
        res.status(500).json({ message: 'Erro ao buscar meta de produção.', error: error.message });
    }
});

app.post('/api/meta-producao', authenticateToken, async (req, res) => {
    const user = req.user;
    const { meta } = req.body;

    if (!user || user.level !== 2) {
        return res.status(403).json({ message: 'Acesso negado.' });
    }

    if (typeof meta === 'undefined' || meta === null || isNaN(Number(meta)) || Number(meta) < 0) {
        return res.status(400).json({ message: 'Valor de meta inválido.' });
    }
    const metaValue = Number(meta);

    try {
        const { data, error } = await supabaseAdmin.from('configuracoes')
            .upsert(
                {
                    chave: 'meta_producao_diaria',
                    valor: metaValue,
                    atualizado_por: user.username || 'Desconhecido'
                },
                { onConflict: 'chave', ignoreDuplicates: false }
            )
            .select();

        if (error) throw error;

        res.status(200).json({ success: true, message: 'Meta atualizada com sucesso', meta: data[0].valor });

    } catch (error) {
        res.status(500).json({ message: 'Erro interno do servidor.', error: error.message });
    }
});

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
        res.status(500).json({ message: 'Erro ao buscar listas de dados do Supabase.', error: error.message });
    }
});

app.post('/api/apontamentos/injetora', authenticateToken, async (req, res) => {
    const {
        tipoInjetora, dataApontamento, hora_apontamento, turno, maquina,
        funcionario, peca, quantidade_injetada, pecas_nc, observacoes, tipo_registro
    } = req.body;

    const quantidade_efetiva = quantidade_injetada - pecas_nc;

    try {
        const { data, error } = await supabaseAdmin
            .from('apontamentos_injetora')
            .insert([{
                tipo_injetora: tipoInjetora,
                data_apontamento: dataApontamento,
                hora_apontamento: hora_apontamento,
                turno: turno,
                maquina: maquina,
                funcionario: funcionario,
                peca: peca,
                quantidade_injetada: quantidade_injetada,
                pecas_nc: pecas_nc,
                observacoes: observacoes,
                tipo_registro: tipo_registro,
                quantidade_efetiva
            }])
            .select();

        if (error) throw error;
        res.status(201).json(data[0]);
    } catch (error) {
        res.status(500).json({ message: 'Erro ao inserir apontamento.', details: error.message });
    }
});

app.put('/api/apontamentos/injetora/:id', authenticateToken, async (req, res) => {
    const { id } = req.params;
    const user = req.user;

    if (!user || user.level !== 2) {
        return res.status(403).json({ message: 'Acesso negado.' });
    }

    const {
        quantidade_injetada, pecas_nc, observacoes, tipo_registro, finalizado
    } = req.body;

    const quantidade_efetiva = quantidade_injetada - pecas_nc;

    try {
        const { data, error } = await supabaseAdmin
            .from('apontamentos_injetora')
            .update({
                quantidade_injetada,
                pecas_nc,
                observacoes,
                tipo_registro,
                quantidade_efetiva,
                finalizado,
            })
            .eq('id', id)
            .select();

        if (error) throw error;

        if (!data || data.length === 0) {
            return res.status(404).json({ message: 'Apontamento não encontrado.' });
        }

        res.status(200).json(data[0]);
    } catch (error) {
        res.status(500).json({ message: 'Erro ao atualizar apontamento.', details: error.message });
    }
});

app.delete('/api/apontamentos/injetora/:id', authenticateToken, async (req, res) => {
    const { id } = req.params;
    const user = req.user;

    if (!user || user.level !== 2) {
        return res.status(403).json({ message: 'Acesso negado.' });
    }

    try {
        const { error } = await supabaseAdmin
            .from('apontamentos_injetora')
            .delete()
            .eq('id', id);

        if (error) throw error;
        res.status(204).send();
    } catch (error) {
        res.status(500).json({ message: 'Erro ao deletar apontamento.', details: error.message });
    }
});

app.get('/api/produtos/taxa-nc', authenticateToken, async (req, res) => {
    try {
        const { data: apontamentos, error } = await supabase
            .from('apontamentos_injetora')
            .select('peca, quantidade_injetada, pecas_nc');

        if (error) throw error;

        const produtosData = apontamentos.reduce((acc, apontamento) => {
            const { peca, quantidade_injetada, pecas_nc } = apontamento;
            if (!acc[peca]) {
                acc[peca] = { totalInjetado: 0, totalPecasNC: 0 };
            }
            acc[peca].totalInjetado += quantidade_injetada || 0;
            acc[peca].totalPecasNC += pecas_nc || 0;
            return acc;
        }, {});

        const resultados = Object.keys(produtosData).map(peca => {
            const { totalInjetado, totalPecasNC } = produtosData[peca];
            const taxaNC = totalInjetado > 0 ? (totalPecasNC / totalInjetado) * 100 : 0;
            return {
                peca,
                totalInjetado,
                totalPecasNC,
                taxaNC: parseFloat(taxaNC.toFixed(2))
            };
        });

        res.status(200).json(resultados);
    } catch (error) {
        res.status(500).json({ message: 'Erro ao calcular taxa de NC.', error: error.message });
    }
});

app.get('/api/apontamentos/injetora', async (req, res) => {
    const { dataApontamento, turno, maquina } = req.query;
    try {
        let query = supabase.from('apontamentos_injetora').select('*');
        if (dataApontamento) query = query.eq('data_apontamento', dataApontamento);
        if (turno) query = query.eq('turno', turno);
        if (maquina) query = query.eq('maquina', maquina);
        
        query = query.order('hora_apontamento', { ascending: true });

        const { data, error } = await query;
        if (error) throw error;
        res.status(200).json(data);
    } catch (error) {
        res.status(500).json({ message: 'Erro ao buscar apontamentos.', details: error.message });
    }
});

app.get('/api/setores', authenticateToken, async (req, res) => {
    try {
        const { data, error } = await supabase
            .from('setores')
            .select('*')
            .order('nome_setor', { ascending: true });

        if (error) throw error;
        res.status(200).json(data);
    } catch (error) {
        res.status(500).json({ message: 'Erro ao buscar setores.', details: error.message });
    }
});

app.post('/api/improdutividade', authenticateToken, async (req, res) => {
    let { setor_id, apontamento_injetora_id, data_improdutividade, hora_improdutividade, causa, pecas_transferidas } = req.body;
    const usuario_registro = req.user ? req.user.username : 'Desconhecido';
    const numPecasRegistrar = Number(pecas_transferidas);

    if (!apontamento_injetora_id || !data_improdutividade || !hora_improdutividade || !numPecasRegistrar || numPecasRegistrar <= 0) {
        return res.status(400).json({ message: 'Campos obrigatórios faltando ou inválidos.' });
    }

    try {
        if (!setor_id) {
            const { data: producaoSetor, error: setorError } = await supabaseAdmin
                .from('setores')
                .select('id')
                .ilike('nome_setor', 'produção')
                .single();

            if (setorError || !producaoSetor) {
                return res.status(404).json({ message: 'Setor "Produção" não encontrado no banco de dados. Por favor, selecione um setor válido.' });
            }
            setor_id = producaoSetor.id;
        }

        const { data: improdutividadeData, error: improdutividadeError } = await supabaseAdmin
            .from('improdutividade_setor')
            .insert([{
                setor_id,
                apontamento_injetora_id,
                data_improdutividade,
                hora_improdutividade,
                causa,
                pecas_transferidas: numPecasRegistrar,
                usuario_registro
            }])
            .select();

        if (improdutividadeError) {
            return res.status(500).json({ message: 'Erro ao registrar a improdutividade.', details: improdutividadeError.message });
        }

        res.status(201).json(improdutividadeData[0]);
    } catch (error) {
        res.status(500).json({ message: 'Erro interno do servidor.', error: error.message });
    }
});

app.get('/api/improdutividade/analise', authenticateToken, async (req, res) => {
    const { dataInicio, dataFim, setorId } = req.query;

    try {
        let query = supabase
            .from('improdutividade_setor')
            .select(`*, setores(nome_setor)`);

        if (dataInicio && dataFim) {
            query = query.gte('data_improdutividade', dataInicio).lte('data_improdutividade', dataFim);
        }
        if (setorId) {
            query = query.eq('setor_id', setorId);
        }

        const { data, error } = await query.order('data_improdutividade', { ascending: true }).order('hora_improdutividade', { ascending: true });

        if (error) throw error;
        res.status(200).json(data);
    } catch (error) {
        res.status(500).json({ message: 'Erro ao buscar dados de improdutividade.', details: error.message });
    }
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
    console.log(`Servidor rodando na porta ${PORT}`);
});

module.exports = app;