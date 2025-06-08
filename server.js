const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

// Middlewares
app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Middleware para servir arquivos estáticos
app.use(express.static(path.join(__dirname, 'public')));

// Rota principal para servir o index.html
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Ler documento de conhecimento
let conhecimentoEscolar = '';
try {
    const caminhoArquivo = path.join(__dirname, 'conhecimento.txt');
    console.log('Tentando ler arquivo:', caminhoArquivo);
    
    conhecimentoEscolar = fs.readFileSync(caminhoArquivo, 'utf8');
    console.log('✅ Documento de conhecimento carregado com sucesso!');
    console.log('Tamanho do documento:', conhecimentoEscolar.length, 'caracteres');
} catch (error) {
    console.log('⚠️ Erro ao ler conhecimento.txt:', error.message);
    console.log('Usando conhecimento padrão resumido.');
    conhecimentoEscolar = `
ENAP - CURSO DE FORMAÇÃO INICIAL CPNU 2024

MATRÍCULA:
- Período: 10 a 18 de março de 2025
- Local: www.enap.gov.br (online)
- Não fazer = eliminação automática

CARREIRAS:
- EPPGG: 580h (abril-julho)
- ACE: 380h (abril-julho) 
- ATI: 440h (abril-julho)
- AIE: 440h (abril-julho)
- ATPS: 440h (abril-julho)

FORMATO:
- 100% presencial em Brasília
- Segunda a sexta, 8h/dia
- Dedicação exclusiva

APROVAÇÃO:
- Média final: 70%
- Por eixo: 60% mínimo
- Frequência: 75% mínimo

AUXÍLIO:
- 50% da remuneração inicial
- Conta corrente obrigatória
- Desconto apenas IR

DOCUMENTOS:
- RG/CNH, foto 3x4
- Dados bancários
- Servidores: licença
- Comissionados: exoneração

CONTATO: www.enap.gov.br - (61) 2020-3000
    `;
}

// Rota para chat
app.post('/api/chat', async (req, res) => {
    try {
        console.log('Body recebido:', req.body);
        console.log('Headers:', req.headers);
        
        const { message } = req.body;
        
        console.log('Mensagem recebida:', message);
        console.log('Google API Key existe?', !!process.env.GOOGLE_API_KEY);
        console.log('Google API Key (primeiros 10 chars):', process.env.GOOGLE_API_KEY?.substring(0, 10));
        
        if (!message) {
            console.log('Mensagem vazia ou undefined');
            return res.status(400).json({ error: 'Mensagem é obrigatória' });
        }

        const systemPrompt = `Você é um assistente virtual especializado no Curso de Formação Inicial da ENAP para aprovados no CPNU/CNU 2024.

CONTEXTO: Você trabalha para a ENAP e deve conversar de forma natural e amigável com candidatos aprovados, como se fosse um colega experiente dando dicas.

CONHECIMENTO ESPECÍFICO DA ENAP E CURSO:
${conhecimentoEscolar}

ESTILO DE COMUNICAÇÃO:
- Seja conversacional e amigável, como um bate-papo informal
- Respostas curtas e diretas (máximo 3-4 frases por resposta)
- Use suas próprias palavras, NUNCA copie e cole trechos longos do documento
- Seja objetivo e vá direto ao ponto
- Use emojis para deixar mais amigável
- Responda apenas o que foi perguntado especificamente
- Se precisar dar mais detalhes, pergunte se a pessoa quer saber mais

COMPORTAMENTO:
- Interprete as informações do documento e explique com suas palavras
- Foque no que é mais importante para a pergunta específica
- Se não souber algo, diga simplesmente "não tenho essa informação" e oriente para o site oficial
- Para perguntas amplas, dê uma resposta resumida e ofereça para detalhar pontos específicos

EXEMPLO DE RESPOSTA BOA:
Pergunta: "Como funciona o curso?"
Resposta: "É um curso de pós-graduação presencial em Brasília, com duração de 3-4 meses dependendo da sua carreira 📚 Você terá aulas todos os dias, de segunda a sexta, e precisa de nota mínima 70% para passar. Quer saber sobre algum aspecto específico?"

NUNCA FAÇA:
- Listas longas com bullets
- Cópias literais do documento
- Respostas com mais de 5 linhas
- Formatação excessiva com títulos e subtítulos`;

        console.log('Enviando mensagem para Google Gemini...');

        // Chama a API Google Gemini
        const response = await fetch('https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'x-goog-api-key': process.env.GOOGLE_API_KEY
            },
            body: JSON.stringify({
                contents: [{
                    parts: [{
                        text: `${systemPrompt}\n\nPergunta do usuário: ${message}`
                    }]
                }],
                generationConfig: {
                    temperature: 0.7,
                    maxOutputTokens: 1024,
                    topP: 0.8
                }
            })
        });

        console.log('Google response status:', response.status);
        
        if (!response.ok) {
            const errorText = await response.text();
            console.error('Google API Error Response:', errorText);
            console.error('Request body enviado:', JSON.stringify({
                contents: [{
                    parts: [{
                        text: `${systemPrompt}\n\nPergunta do usuário: ${message}`
                    }]
                }],
                generationConfig: {
                    temperature: 0.7,
                    maxOutputTokens: 1024,
                    topP: 0.8
                }
            }, null, 2));
            throw new Error(`Erro na API Google: ${response.status} - ${errorText}`);
        }

        const data = await response.json();
        console.log('Google API Success:', data);
        
        const botResponse = data.candidates[0].content.parts[0].text;
        res.json({ response: botResponse });

    } catch (error) {
        console.error('Erro completo:', error);
        res.status(500).json({ 
            error: 'Erro interno do servidor',
            message: 'Tente novamente em alguns momentos'
        });
    }
});

// Rota de saúde
app.get('/api/health', (req, res) => {
    res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

// Rota para atualizar conhecimento
app.post('/api/atualizar-conhecimento', (req, res) => {
    try {
        const { conteudo } = req.body;
        fs.writeFileSync(path.join(__dirname, 'conhecimento.txt'), conteudo, 'utf8');
        
        // Recarrega o conhecimento
        conhecimentoEscolar = conteudo;
        
        res.json({ message: 'Conhecimento atualizado com sucesso!' });
    } catch (error) {
        console.error('Erro ao atualizar conhecimento:', error);
        res.status(500).json({ error: 'Erro ao atualizar conhecimento' });
    }
});

app.listen(PORT, () => {
    console.log(`🚀 Servidor rodando na porta ${PORT}`);
    console.log(`📱 Acesse: http://localhost:${PORT}`);
});
