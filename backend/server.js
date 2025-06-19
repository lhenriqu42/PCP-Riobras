require('dotenv').config();
const express = require('express');
const { google } = require('googleapis');
const cors = require('cors');

const app = express();
const port = 3001;

app.use(cors());
app.use(express.json());

// =========================================================
//autenticação google login
// =========================================================
const authLogin = new google.auth.GoogleAuth({
    credentials: {
        client_email: process.env.GOOGLE_CLIENT_EMAIL, 
        private_key: process.env.GOOGLE_PRIVATE_KEY.replace(/\\n/g, '\n'), 
    },
    scopes: ['https://www.googleapis.com/auth/spreadsheets.readonly'],
});

const sheetsLogin = google.sheets({ version: 'v4', auth: authLogin });
const spreadsheetIdLogin = process.env.GOOGLE_SHEET_ID;
const rangeLogin = 'Usuarios!A:B';

// =========================================================
// autenticação google dados
// =========================================================
const authSheetsProducao = new google.auth.GoogleAuth({
    credentials: {
        client_email: process.env.GOOGLE_CLIENT_EMAIL_SHEETS,
        private_key: process.env.GOOGLE_PRIVATE_KEY_SHEETS.replace(/\\n/g, '\n'),
    },
    scopes: ['https://www.googleapis.com/auth/spreadsheets'],
});


const sheetsProducao = google.sheets({ version: 'v4', auth: authSheetsProducao });
const spreadsheetIdProducao = process.env.GOOGLE_SHEET_ID_PRODUCAO; 

app.post('/login', async (req, res) => {
    const { username, password } = req.body;

    if (!username || !password) {
        return res.status(400).json({ message: 'Usuário e senha são obrigatórios.' });
    }

    try {
        const response = await sheetsLogin.spreadsheets.values.get({
            spreadsheetId: spreadsheetIdLogin,
            range: rangeLogin,
        });

        const users = response.data.values;
        if (!users || users.length === 0) {
            return res.status(500).json({ message: 'Nenhum usuário encontrado no Google Sheets.' });
        }
        const userFound = users.find(
            (row) => row[0] === username && row[1] === password //KKKKKKKK
        );

        if (userFound) {
            return res.status(200).json({ message: 'Login bem-sucedido!', user: { username: userFound[0] } });
        } else {
            return res.status(401).json({ message: 'Usuário ou senha incorretos.' });
        }
    } catch (error) {
        console.error('Erro ao processar login:', error);
        return res.status(500).json({ message: 'Erro interno do servidor.' });
    }
});

app.get('/api/data/lists', async (req, res) => {
    try {
        const funcionariosResponse = await sheetsProducao.spreadsheets.values.get({
            spreadsheetId: spreadsheetIdProducao,
            range: 'FUNCIONARIOS!A:A', 
        });
        const funcionarios = funcionariosResponse.data.values ? funcionariosResponse.data.values.flat() : [];

        const pecasResponse = await sheetsProducao.spreadsheets.values.get({
            spreadsheetId: spreadsheetIdProducao,
            range: 'PECAS!A:A',
        });
        const pecas = pecasResponse.data.values ? pecasResponse.data.values.flat() : [];

        const maquinasResponse = await sheetsProducao.spreadsheets.values.get({
            spreadsheetId: spreadsheetIdProducao,
            range: 'MAQUINAS!A:A', 
        });
        const maquinas = maquinasResponse.data.values ? maquinasResponse.data.values.flat() : [];
        res.json({ funcionarios, pecas, maquinas });
    } catch (error) {
        console.error('Erro ao obter listas de dados:', error);
        res.status(500).json({ message: 'Erro ao obter listas de dados', error: error.message });
    }
});

app.post('/api/apontamentos/injetora', async (req, res) => {
    try {
        const { maquina, funcionario, peca, quantidade, tempoProducao, observacoes } = req.body;

        if (!maquina || !funcionario || !peca || !quantidade || !tempoProducao) {
            return res.status(400).json({ message: 'Todos os campos obrigatórios devem ser preenchidos.' });
        }
        const range = 'APONTAMENTOS_INJETORA!A:H'; 

        const now = new Date();
        const dateTime = now.toLocaleString('pt-BR'); 

        
        const values = [
            [
                `ID-${Date.now()}`, 
                dateTime,
                maquina,
                funcionario,
                peca,
                quantidade,
                tempoProducao,
                observacoes || ''
            ]
        ];

        const resource = {
            values,
        };

        const result = await sheetsProducao.spreadsheets.values.append({
            spreadsheetId: spreadsheetIdProducao,
            range,
            valueInputOption: 'RAW',
            resource,
        });

        res.status(200).json({ message: 'Apontamento registrado com sucesso!', data: result.data });

    } catch (error) {
        console.error('Erro ao registrar apontamento da injetora:', error);
        res.status(500).json({ message: 'Erro ao registrar apontamento da injetora', error: error.message });
    }
});


app.listen(port, () => {
    console.log(`Backend rodando em http://localhost:${port}`);
});