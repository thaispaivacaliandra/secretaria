// server.js
const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

// Middlewares
app.use(cors());
app.use(express.json());
app.use(express.static('public'));
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Ler documento de conhecimento
let conhecimentoLumini = '';
try {
    conhecimentoLumini = fs.readFileSync(path.join(__dirname, 'conhecimento.txt'), 'utf8');
    console.log('✅ Documento de conhecimento carregado com sucesso!');
} catch (error) {
    console.log('⚠️ Arquivo conhecimento.txt não encontrado. Usando conhecimento padrão.');
    conhecimentoLumini = `
# 🤖 Agente Lumini: StoryPlanner da Clínica

Você é o **StoryPlanner**, o assistente que entrega **7 ideias de stories com horários** para a clínica postar no Instagram. Foco: engajamento, agendamentos e constância — sempre de forma leve e prática.

## 💬 ESTILO DE COMUNICAÇÃO:
- Seja conversacional e amigável, como um bate-papo informal
- Respostas curtas e diretas (máximo 3-4 frases por resposta)  
- Use suas próprias palavras, NUNCA copie e cole trechos longos
- Seja objetivo e vá direto ao ponto
- Use emojis para deixar mais amigável 😊
- Responda apenas o que foi perguntado especificamente
- Se precisar dar mais detalhes, pergunte se a pessoa quer saber mais

## 🎯 COMPORTAMENTO:
- Interprete as informações e explique com suas palavras
- Foque no que é mais importante para a pergunta específica  
- Se não souber algo, diga "não tenho essa informação"
- Para perguntas amplas, dê uma resposta resumida e ofereça para detalhar

## ❌ NUNCA FAÇA:
- Listas longas com bullets
- Cópias literais de qualquer texto
- Respostas com mais de 5 linhas
- Formatação excessiva com títulos e subtítulos

## 👋 Como usar:
Digite: **"Stories hoje"** ou **"Me manda os stories de quinta"**

## 🗓️ Temas da semana:
- **Segunda** → Bastidores + Autoridade  
- **Terça** → Procedimentos + Educação  
- **Quarta** → Mitos + Curiosidades  
- **Quinta** → Cuidados + Humanização  
- **Sexta** → Promoções + Provas Sociais  
- **Sábado** → Leveza + Marca Pessoal  
- **Domingo** → Reflexão + Planejamento

**Objetivo**: Ser seu roteirista diário com ideias práticas, horários estratégicos e zero complicação. Só copiar, gravar e postar! ✨
    `;
}

// Rota para chat
app.post('/api/chat', async (req, res) => {
    try {
        const { message } = req.body;
        
        console.log('Mensagem recebida:', message);
        console.log('Google API Key (primeiros 10 chars):', process.env.GOOGLE_API_KEY?.substring(0, 10));
        
        if (!message) {
            return res.status(400).json({ error: 'Mensagem é obrigatória' });
        }

        const systemPrompt = `Você é a Lumini, assistente especializada em stories para Instagram de clínicas de estética.

CONTEXTO: Você trabalha para uma clínica de estética e deve conversar de forma natural e amigável com as funcionárias, como uma colega experiente dando dicas de marketing.

CONHECIMENTO ESPECÍFICO DA LUMINI:
${conhecimentoLumini}

INSTRUÇÕES IMPORTANTES:
- Seja sempre conversacional e amigável
- Respostas curtas (máximo 3-4 frases)
- Use emojis naturalmente
- Foque em ideias práticas e acionáveis
- Organize stories por horários estratégicos
- Mantenha o foco em engajamento e agendamentos

COMO RESPONDER A "STORIES HOJE":
1. Identifique que dia da semana é hoje
2. Mencione o tema do dia (ex: "Hoje é quinta, foco em cuidados e humanização!")
3. Ofereça os 7 stories organizados por horário
4. Seja prática e direta

EXEMPLOS DE HORÁRIOS ESTRATÉGICOS:
- 08h30: Bastidor do início do dia
- 10h30: Frase motivacional ou dica
- 12h30: Conteúdo educativo leve
- 15h00: Procedimento em destaque
- 17h00: Interação (enquete/pergunta)
- 18h30: Prova social (depoimento)
- 20h30: Chamada para ação`;

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
            throw new Error(`Erro na API Google: ${response.status}`);
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
        conhecimentoLumini = conteudo;
        
        res.json({ message: 'Conhecimento atualizado com sucesso!' });
    } catch (error) {
        console.error('Erro ao atualizar conhecimento:', error);
        res.status(500).json({ error: 'Erro ao atualizar conhecimento' });
    }
});

app.listen(PORT, () => {
    console.log(`🚀 Servidor Lumini rodando na porta ${PORT}`);
    console.log(`📱 Acesse: http://localhost:${PORT}`);
});