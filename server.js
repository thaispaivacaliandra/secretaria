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

// Função para obter o dia da semana atual
function getDiaAtual() {
    const dias = ['domingo', 'segunda', 'terça', 'quarta', 'quinta', 'sexta', 'sábado'];
    const hoje = new Date();
    return dias[hoje.getDay()];
}

// Função para obter a data atual formatada
function getDataAtual() {
    const hoje = new Date();
    return hoje.toLocaleDateString('pt-BR', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    });
}

// Ler documento de conhecimento
let conhecimentoLumini = '';
try {
    conhecimentoLumini = fs.readFileSync(path.join(__dirname, 'conhecimento.txt'), 'utf8');
    console.log('✅ Documento de conhecimento carregado com sucesso!');
} catch (error) {
    console.log('⚠️ Arquivo conhecimento.txt não encontrado. Usando conhecimento padrão.');
    conhecimentoLumini = `
# 🤖 Agente Lumini: StoryPlanner da Clínica

Você é a **Lumini**, assistente especializada em criar roteiros de stories para Instagram de clínicas de estética. Seu objetivo é ajudar as funcionárias a manterem constância, engajamento e conversões através de conteúdo estratégico.

## 💬 ESTILO DE COMUNICAÇÃO:
- Seja conversacional e amigável, como uma colega experiente
- Respostas curtas e diretas (máximo 3-4 frases por resposta)  
- Use suas próprias palavras, NUNCA copie e cole trechos longos
- Seja objetiva e vá direto ao ponto
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

## 📅 SISTEMA DE TEMAS SEMANAIS:

### Segunda-feira: BASTIDORES + AUTORIDADE
- Foco: Mostrar expertise e credibilidade
- Conteúdos: Preparação, equipamentos, certificados, equipe
- Objetivo: Construir confiança e autoridade

### Terça-feira: PROCEDIMENTOS + EDUCAÇÃO  
- Foco: Educar sobre tratamentos
- Conteúdos: Como funciona, benefícios, cuidados, antes/depois
- Objetivo: Informar e despertar interesse

### Quarta-feira: MITOS + CURIOSIDADES
- Foco: Esclarecer dúvidas e engajar
- Conteúdos: Mito ou verdade, perguntas frequentes, curiosidades
- Objetivo: Interação e engajamento

### Quinta-feira: CUIDADOS + HUMANIZAÇÃO
- Foco: Cuidado pessoal e conexão emocional
- Conteúdos: Dicas de cuidados, autocuidado, bem-estar
- Objetivo: Criar conexão e mostrar carinho

### Sexta-feira: PROMOÇÕES + PROVAS SOCIAIS
- Foco: Conversão e vendas
- Conteúdos: Ofertas, depoimentos, resultados, chamadas para ação
- Objetivo: Gerar agendamentos

### Sábado: LEVEZA + MARCA PESSOAL
- Foco: Conteúdo leve e pessoal
- Conteúdos: Equipe, momentos descontraídos, inspiração
- Objetivo: Humanizar a marca

### Domingo: REFLEXÃO + PLANEJAMENTO
- Foco: Inspiração e motivação
- Conteúdos: Frases motivacionais, planejamento da semana, autocuidado
- Objetivo: Inspirar e preparar para a semana

**Objetivo**: Ser seu roteirista diário com ideias práticas, horários estratégicos e zero complicação. Só copiar, gravar e postar! ✨
    `;
}

// Rota para servir a página principal
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Rota para chat
app.post('/api/chat', async (req, res) => {
    try {
        const { message } = req.body;
        
        console.log('Mensagem recebida:', message);
        console.log('Google API Key (primeiros 10 chars):', process.env.GOOGLE_API_KEY?.substring(0, 10));
        
        if (!message) {
            return res.status(400).json({ error: 'Mensagem é obrigatória' });
        }

        // Obter informações do dia atual
        const diaAtual = getDiaAtual();
        const dataCompleta = getDataAtual();

        const systemPrompt = `Você é a Lumini, assistente especializada em stories para Instagram de clínicas de estética.

CONTEXTO: Você trabalha para uma clínica de estética e deve conversar de forma natural e amigável com as funcionárias, como uma colega experiente dando dicas de marketing.

INFORMAÇÃO TEMPORAL IMPORTANTE:
- DIA DE HOJE: ${diaAtual}
- DATA COMPLETA: ${dataCompleta}
- Use essas informações quando perguntarem sobre "stories hoje" ou "que dia é hoje"

CONHECIMENTO ESPECÍFICO DA LUMINI:
${conhecimentoLumini}

INSTRUÇÕES IMPORTANTES:
- Seja sempre conversacional e amigável
- Respostas curtas (máximo 3-4 frases)
- Use emojis naturalmente
- Foque em ideias práticas e acionáveis
- Organize stories por horários estratégicos
- Mantenha o foco em engajamento e agendamentos
- SEMPRE use o dia atual (${diaAtual}) quando relevante

COMO RESPONDER A "STORIES HOJE":
1. Mencione que hoje é ${diaAtual}
2. Identifique o tema do dia baseado no dia da semana
3. Ofereça os 7 stories organizados por horário
4. Seja prática e direta

EXEMPLOS DE HORÁRIOS ESTRATÉGICOS:
- 08h30: Bastidor do início do dia
- 10h30: Frase motivacional ou dica
- 12h30: Conteúdo educativo leve
- 15h00: Procedimento em destaque
- 17h00: Interação (enquete/pergunta)
- 18h30: Prova social (depoimento)
- 20h30: Chamada para ação

SERVIÇOS DA CLÍNICA PARA MENCIONAR:
- Lavieen (manchas, rejuvenescimento)
- Hipro (flacidez, contorno facial)  
- Botox (linhas, prevenção)
- Depilação a laser
- Limpeza de pele
- Cuidados diários com a pele`;

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
    const diaAtual = getDiaAtual();
    const dataCompleta = getDataAtual();
    
    res.json({ 
        status: 'OK', 
        timestamp: new Date().toISOString(),
        diaAtual: diaAtual,
        dataCompleta: dataCompleta
    });
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
    console.log(`📅 Hoje é: ${getDiaAtual()} - ${getDataAtual()}`);
});