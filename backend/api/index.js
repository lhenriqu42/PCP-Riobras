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

console.log('Valor de JWT_SECRET carregado:', process.env.JWT_SECRET);

const authenticateToken = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (token == null) {
        return res.status(401).json({ message: 'Token de autenticação não fornecido.' });
    }

    jwt.verify(token, jwtSecret, (err, user) => {
        if (err) {
            console.error("Erro na verificação do token JWT:", err.message);
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
            const token = jwt.sign(userPayload, jwtSecret, { expiresIn: '1h' });

            res.status(200).json({
                message: 'Login bem-sucedido!',
                token: token,
                user: { username, level: userLevel }
            });
        } else {
            res.status(401).json({ message: 'Credenciais inválidas.' });
        }
    } catch (error) {
        console.error('Erro no login via Google Sheets:', error.message);
        res.status(500).json({ message: 'Erro ao tentar fazer login.', error: error.message });
    }
});

app.get('/api/meta-producao', async (req, res) => {
    try {
        const { data, error } = await supabase.from('configuracoes')
            .select('valor')
            .eq('chave', 'meta_producao_diaria')
            .single();

        if (error && error.code !== 'PGRST116') {
            throw error;
        }

        const meta = data ? data.valor : 1000;
        res.status(200).json({ meta });

    } catch (error) {
        console.error('Erro ao buscar meta de produção do Supabase:', error.message);
        res.status(500).json({ message: 'Erro ao buscar meta de produção.', error: error.message });
    }
});

app.post('/api/meta-producao', authenticateToken, async (req, res) => {
    const user = req.user;
    const { meta } = req.body;

    if (!user || user.level !== 2) {
        return res.status(403).json({ message: 'Acesso negado. Você não tem permissão para alterar a meta.' });
    }

    if (typeof meta === 'undefined' || meta === null || isNaN(Number(meta)) || Number(meta) < 0) {
        return res.status(400).json({ message: 'Valor de meta inválido. Deve ser um número não negativo.' });
    }
    const metaValue = Number(meta);

    try {
        const { data, error } = await supabaseAdmin.from('configuracoes')
            .upsert(
                {
                    chave: 'meta_producao_diaria',
                    valor: metaValue,
                    ultima_atualizacao: new Date().toISOString(),
                    atualizado_por: user.username || 'Desconhecido'
                },
                {
                    onConflict: 'chave',
                    ignoreDuplicates: false
                }
            )
            .select();

        if (error) {
            console.error('Erro Supabase ao salvar meta:', error);
            return res.status(500).json({
                message: 'Erro ao salvar a meta de produção.',
                details: error.message || 'Detalhes desconhecidos.'
            });
        }

        res.status(200).json({ success: true, message: 'Meta atualizada com sucesso', meta: data[0].valor });

    } catch (error) {
        console.error('Erro geral ao salvar nova meta no Supabase:', error.message);
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
        console.error('Erro ao buscar listas do Supabase:', error.message);
        res.status(500).json({ message: 'Erro ao buscar listas de dados do Supabase.', error: error.message });
    }
});

app.post('/api/apontamentos/injetora', authenticateToken, async (req, res) => {
    console.log('Payload recebido no backend para /api/apontamentos/injetora:', req.body);

    const {
        tipoInjetora,
        dataApontamento,
        hora_apontamento,
        turno,
        maquina,
        funcionario,
        peca,
        quantidade_injetada,
        pecas_nc,
        observacoes,
        tipo_registro
    } = req.body;

    console.log('Valor de hora_apontamento recebido:', hora_apontamento);
    const quantidade_efetiva = quantidade_injetada - pecas_nc;

    try {
        const { data, error } = await supabaseAdmin
            .from('apontamentos_injetora')
            .insert([
                {
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

app.put('/api/apontamentos/injetora/:id', authenticateToken, async (req, res) => {
    const { id } = req.params;
    const user = req.user;

    if (!user || user.level !== 2) {
        return res.status(403).json({ message: 'Acesso negado. Você não tem permissão para editar apontamentos.' });
    }

    const {
        tipoInjetora,
        dataApontamento,
        hora_apontamento,
        turno,
        maquina,
        funcionario,
        peca,
        quantidade_injetada,
        pecas_nc,
        observacoes,
        tipo_registro
    } = req.body;

    const quantidade_efetiva = quantidade_injetada - pecas_nc;

    try {
        const { data, error } = await supabaseAdmin
            .from('apontamentos_injetora')
            .update({
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
                quantidade_efetiva: quantidade_efetiva
            })
            .eq('id', id)
            .select();

        if (error) {
            if (error.code === 'PGRST116') {
                return res.status(404).json({ message: 'Apontamento não encontrado para atualização.' });
            }
            return res.status(500).json({
                message: 'Erro ao atualizar apontamento.',
                details: error.message || 'Detalhes desconhecidos.',
            });
        }

        if (!data || data.length === 0) {
            return res.status(404).json({ message: 'Apontamento não encontrado para atualização ou nenhum dado foi alterado.' });
        }

        res.status(200).json(data[0]);
    } catch (error) {
        console.error('Erro geral ao atualizar apontamento:', error.message);
        res.status(500).json({ message: 'Erro interno do servidor.', error: error.message });
    }
});

app.delete('/api/apontamentos/injetora/:id', authenticateToken, async (req, res) => {
    const { id } = req.params;
    const user = req.user;

    if (!user || user.level !== 2) {
        return res.status(403).json({ message: 'Acesso negado. Você não tem permissão para deletar apontamentos.' });
    }

    try {
        const { error } = await supabaseAdmin
            .from('apontamentos_injetora')
            .delete()
            .eq('id', id);

        if (error) {
            if (error.code === 'PGRST116') {
                return res.status(404).json({ message: 'Apontamento não encontrado para exclusão.' });
            }
            return res.status(500).json({
                message: 'Erro ao deletar apontamento.',
                details: error.message || 'Detalhes desconhecidos.',
            });
        }

        res.status(204).send();

    } catch (error) {
        console.error('Erro geral ao deletar apontamento:', error.message);
        res.status(500).json({ message: 'Erro interno do servidor.', error: error.message });
    }
});

app.get('/api/produtos/taxa-nc', authenticateToken, async (req, res) => {
    try {
        const { data: apontamentos, error } = await supabase
            .from('apontamentos_injetora')
            .select('peca, quantidade_injetada, pecas_nc');

        if (error) {
            console.error('Erro Supabase ao buscar apontamentos para taxa NC:', error);
            return res.status(500).json({
                message: 'Erro ao buscar dados para calcular a taxa de peças não conformes.',
                details: error.message || error.details || error.hint || error.code || 'Detalhes desconhecidos.',
            });
        }
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
        console.error('Erro geral ao calcular taxa de peças não conformes:', error.message);
        res.status(500).json({ message: 'Erro interno do servidor.', error: error.message });
    }
});

app.get('/api/apontamentos/injetora', async (req, res) => {
    const { dataApontamento, turno, maquina, funcionario, peca } = req.query;

    try {
        let query = supabase.from('apontamentos_injetora').select('*');

        if (dataApontamento) {
            query = query.eq('data_apontamento', dataApontamento);
        }
        if (turno) {
            query = query.eq('turno', turno);
        }
        if (maquina) {
            query = query.eq('maquina', maquina);
        }
        if (funcionario) {
            query = query.eq('funcionario', funcionario);
        }
        if (peca) {
            query = query.eq('peca', peca);
        }

        query = query.order('hora_apontamento', { ascending: true });

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

app.put('/api/apontamentos/injetora/:id', authenticateToken, async (req, res) => {
    const { id } = req.params;
    const { quantidade_injetada, pecas_nc, observacoes, tipo_registro } = req.body;

    const quantidade_efetiva = quantidade_injetada - pecas_nc;

    try {
        const { data, error } = await supabaseAdmin
            .from('apontamentos_injetora')
            .update({
                quantidade_injetada: quantidade_injetada,
                pecas_nc: pecas_nc,
                observacoes: observacoes,
                tipo_registro: tipo_registro,
                quantidade_efetiva: quantidade_efetiva,
                ultima_atualizacao: new Date().toISOString()
            })
            .eq('id', id)
            .select();

        if (error) {
            console.error('Erro Supabase ao atualizar apontamento:', error);
            return res.status(500).json({
                message: 'Erro ao atualizar apontamento.',
                details: error.message || error.details || error.hint || error.code || 'Detalhes desconhecidos.',
            });
        }

        if (data.length === 0) {
            return res.status(404).json({ message: 'Apontamento não encontrado.' });
        }

        res.status(200).json(data[0]);
    } catch (error) {
        console.error('Erro geral ao atualizar apontamento:', error.message);
        res.status(500).json({ message: 'Erro interno do servidor.', error: error.message });
    }
});

app.get('/api/setores', authenticateToken, async (req, res) => {
    try {
        const { data, error } = await supabase
            .from('setores')
            .select('*')
            .order('nome_setor', { ascending: true });

        if (error) {
            console.error('Erro Supabase ao buscar setores:', error);
            return res.status(500).json({
                message: 'Erro ao buscar lista de setores.',
                details: error.message || 'Detalhes desconhecidos.',
            });
        }
        res.status(200).json(data);
    } catch (error) {
        console.error('Erro geral ao buscar setores:', error.message);
        res.status(500).json({ message: 'Erro interno do servidor.', error: error.message });
    }
});

app.post('/api/improdutividade', authenticateToken, async (req, res) => {
    const { setor_id, apontamento_injetora_id, data_improdutividade, hora_improdutividade, causa, pecas_transferidas } = req.body;
    const usuario_registro = req.user ? req.user.username : 'Desconhecido';

    if (!setor_id || !apontamento_injetora_id || !data_improdutividade || !hora_improdutividade || pecas_transferidas === undefined || pecas_transferidas === null) {
        return res.status(400).json({ message: 'Campos obrigatórios faltando: setor_id, apontamento_injetora_id, data_improdutividade, hora_improdutividade, pecas_transferidas.' });
    }

    try {
        const { data: improdutividadeData, error: improdutividadeError } = await supabaseAdmin
            .from('improdutividade_setor')
            .insert([
                {
                    setor_id: setor_id,
                    apontamento_injetora_id: apontamento_injetora_id,
                    data_improdutividade: data_improdutividade,
                    hora_improdutividade: hora_improdutividade,
                    causa: causa,
                    pecas_transferidas: pecas_transferidas,
                    usuario_registro: usuario_registro
                }
            ])
            .select();

        if (improdutividadeError) {
            console.error('Erro Supabase ao inserir improdutividade:', improdutividadeError);
            return res.status(500).json({
                message: 'Erro ao registrar improdutividade.',
                details: improdutividadeError.message || improdutividadeError.details || improdutividadeError.hint || improdutividadeError.code || 'Detalhes desconhecidos.',
            });
        }

        const { data: apontamentoData, error: apontamentoError } = await supabaseAdmin
            .from('apontamentos_injetora')
            .select('pecas_nc_transferidas')
            .eq('id', apontamento_injetora_id)
            .single();

        if (apontamentoError && apontamentoError.code !== 'PGRST116') {
            console.error('Erro Supabase ao buscar apontamento para atualização:', apontamentoError);
            return res.status(500).json({ message: 'Erro ao buscar apontamento para atualização.' });
        }

        const currentPecasNCTransferidas = apontamentoData ? (apontamentoData.pecas_nc_transferidas || 0) : 0;
        const newPecasNCTransferidas = currentPecasNCTransferidas + pecas_transferidas;

        const { error: updateError } = await supabaseAdmin
            .from('apontamentos_injetora')
            .update({ pecas_nc_transferidas: newPecasNCTransferidas })
            .eq('id', apontamento_injetora_id);

        if (updateError) {
            console.error('Erro Supabase ao atualizar pecas_nc_transferidas:', updateError);
            return res.status(500).json({
                message: 'Erro ao atualizar contagem de peças NC transferidas no apontamento.',
                details: updateError.message || updateError.details || updateError.hint || updateError.code || 'Detalhes desconhecidos.',
            });
        }

        res.status(201).json(improdutividadeData[0]);
    } catch (error) {
        console.error('Erro geral ao registrar improdutividade e atualizar apontamento:', error.message);
        res.status(500).json({ message: 'Erro interno do servidor.', error: error.message });
    }
});


app.get('/api/improdutividade/analise', authenticateToken, async (req, res) => {
    const { dataInicio, dataFim, setorId } = req.query;

    try {
        let query = supabase
            .from('improdutividade_setor')
            .select(`
                *,
                setores (
                    nome_setor
                )
            `);

        if (dataInicio && dataFim) {
            query = query.gte('data_improdutividade', dataInicio).lte('data_improdutividade', dataFim);
        }
        if (setorId) {
            query = query.eq('setor_id', setorId);
        }

        const { data, error } = await query.order('data_improdutividade', { ascending: true }).order('hora_improdutividade', { ascending: true });

        if (error) {
            console.error('Erro Supabase ao buscar dados de improdutividade para análise:', error);
            return res.status(500).json({
                message: 'Erro ao buscar dados de improdutividade.',
                details: error.message || error.details || error.hint || error.code || 'Detalhes desconhecidos.',
            });
        }

        res.status(200).json(data);
    } catch (error) {
        console.error('Erro geral ao buscar dados de improdutividade para análise:', error.message);
        res.status(500).json({ message: 'Erro interno do servidor.', error: error.message });
    }
});


const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
    console.log(`Servidor rodando na porta ${PORT}`);
});

module.exports = app;