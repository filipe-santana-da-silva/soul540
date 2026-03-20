import { useState, useRef, useEffect } from 'react';
import { useApp } from '@frontend/contexts/AppContext';
import styles from './Chat.module.scss';

type Message = {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
};

const SUGGESTIONS = [
  'Quantos eventos ativos temos?',
  'Quais tarefas sao urgentes?',
  'Como esta o financeiro do mes?',
  'Quais insumos estao em falta?',
  'Resumo geral do negocio',
];

function getMockResponse(input: string, data: { events: number; tasks: number; urgentTasks: number; revenue: number }): string {
  const q = input.toLowerCase();

  if (q.includes('event')) {
    return `Voce tem **${data.events} eventos** cadastrados no sistema. ${data.events > 0 ? 'Os proximos eventos estao sendo monitorados em tempo real. Acesse a pagina de Eventos para mais detalhes.' : 'Nenhum evento cadastrado ainda.'}`;
  }

  if (q.includes('tarefa') || q.includes('task')) {
    return `Ha **${data.tasks} tarefas** no sistema, sendo **${data.urgentTasks}** marcadas como urgentes. Recomendo verificar as tarefas prioritarias no painel de Tarefas para garantir que nada fique pendente.`;
  }

  if (q.includes('financ') || q.includes('receita') || q.includes('dinheiro')) {
    return `A receita total registrada e de **R$ ${data.revenue.toLocaleString('pt-BR')}**. Para uma analise mais detalhada, acesse o painel Financeiro onde voce pode ver graficos de receitas x custos, margem de lucro e muito mais.`;
  }

  if (q.includes('insumo') || q.includes('estoque') || q.includes('falta')) {
    return 'Para verificar o estoque de insumos, acesse a pagina **Estoque de Insumos**. La voce encontra alertas de estoque baixo, datas de validade proximas e o valor total em estoque.';
  }

  if (q.includes('resumo') || q.includes('geral') || q.includes('negocio')) {
    return `Aqui esta um resumo do seu negocio:\n\n• **${data.events} eventos** cadastrados\n• **${data.tasks} tarefas** pendentes (${data.urgentTasks} urgentes)\n• **Receita total:** R$ ${data.revenue.toLocaleString('pt-BR')}\n\nNavegue pelo menu lateral para acessar modulos especificos como Funcionarios, Contratos, Cardapios e mais.`;
  }

  if (q.includes('ola') || q.includes('oi') || q.includes('hello')) {
    return 'Ola! Sou o assistente IA da Soul540. Posso te ajudar com informacoes sobre eventos, tarefas, financeiro, estoque e muito mais. O que deseja saber?';
  }

  return `Entendi sua pergunta sobre "${input}". Esta funcionalidade de IA esta em modo demonstracao. Em breve, terei acesso completo a todos os dados do sistema para fornecer insights mais precisos. Por enquanto, posso te orientar sobre eventos, tarefas, financeiro e estoque!`;
}

export default function Chat() {
  const { events, tasks, finances } = useApp();
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '0',
      role: 'assistant',
      content: 'Ola! Sou o assistente IA da **Soul540**. Posso ajudar com informacoes sobre eventos, tarefas, financeiro e muito mais. O que deseja saber?',
      timestamp: new Date(),
    },
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const appData = {
    events: events.length,
    tasks: tasks.filter((t) => t.status !== 'done').length,
    urgentTasks: tasks.filter((t) => t.priority === 'urgent' && t.status !== 'done').length,
    revenue: finances.filter((f) => f.type === 'revenue').reduce((acc, f) => acc + f.amount, 0),
  };

  const sendMessage = async (text: string) => {
    if (!text.trim() || isLoading) return;

    const userMsg: Message = { id: Date.now().toString(), role: 'user', content: text, timestamp: new Date() };
    setMessages((prev) => [...prev, userMsg]);
    setInput('');
    setIsLoading(true);

    await new Promise((r) => setTimeout(r, 800 + Math.random() * 600));

    const response = getMockResponse(text, appData);
    const aiMsg: Message = { id: (Date.now() + 1).toString(), role: 'assistant', content: response, timestamp: new Date() };
    setMessages((prev) => [...prev, aiMsg]);
    setIsLoading(false);
    inputRef.current?.focus();
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage(input);
    }
  };

  const formatContent = (text: string) => {
    return text.split('\n').map((line, i) => {
      const formatted = line.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
      return <p key={i} dangerouslySetInnerHTML={{ __html: formatted }} />;
    });
  };

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <div className={styles.headerInfo}>
          <div className={styles.aiAvatar}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2a2 2 0 0 1 2 2c0 .74-.4 1.39-1 1.73V7h1a7 7 0 0 1 7 7h1a1 1 0 0 1 1 1v3a1 1 0 0 1-1 1h-1v1a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-1H2a1 1 0 0 1-1-1v-3a1 1 0 0 1 1-1h1a7 7 0 0 1 7-7h1V5.73c-.6-.34-1-.99-1-1.73a2 2 0 0 1 2-2z"/><circle cx="8.5" cy="13.5" r="1.5"/><circle cx="15.5" cy="13.5" r="1.5"/></svg>
          </div>
          <div>
            <h1 className={styles.title}>Chat IA</h1>
            <p className={styles.subtitle}>Assistente inteligente da Soul540 (modo demo)</p>
          </div>
        </div>
        <button className={styles.btnClear} onClick={() => setMessages([{ id: '0', role: 'assistant', content: 'Conversa reiniciada! Como posso te ajudar?', timestamp: new Date() }])}>
          Limpar conversa
        </button>
      </div>

      <div className={styles.chatArea}>
        <div className={styles.messages}>
          {messages.map((msg) => (
            <div key={msg.id} className={`${styles.message} ${msg.role === 'user' ? styles.messageUser : styles.messageAI}`}>
              {msg.role === 'assistant' && (
                <div className={styles.msgAvatar}>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2a2 2 0 0 1 2 2c0 .74-.4 1.39-1 1.73V7h1a7 7 0 0 1 7 7h1a1 1 0 0 1 1 1v3a1 1 0 0 1-1 1h-1v1a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-1H2a1 1 0 0 1-1-1v-3a1 1 0 0 1 1-1h1a7 7 0 0 1 7-7h1V5.73c-.6-.34-1-.99-1-1.73a2 2 0 0 1 2-2z"/></svg>
                </div>
              )}
              <div className={styles.msgBubble}>
                <div className={styles.msgContent}>{formatContent(msg.content)}</div>
                <div className={styles.msgTime}>
                  {msg.timestamp.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                </div>
              </div>
            </div>
          ))}

          {isLoading && (
            <div className={`${styles.message} ${styles.messageAI}`}>
              <div className={styles.msgAvatar}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2a2 2 0 0 1 2 2c0 .74-.4 1.39-1 1.73V7h1a7 7 0 0 1 7 7h1a1 1 0 0 1 1 1v3a1 1 0 0 1-1 1h-1v1a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-1H2a1 1 0 0 1-1-1v-3a1 1 0 0 1 1-1h1a7 7 0 0 1 7-7h1V5.73c-.6-.34-1-.99-1-1.73a2 2 0 0 1 2-2z"/></svg>
              </div>
              <div className={styles.msgBubble}>
                <div className={styles.typing}>
                  <span /><span /><span />
                </div>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {messages.length <= 1 && (
          <div className={styles.suggestions}>
            <p className={styles.suggestionsTitle}>Sugestoes:</p>
            <div className={styles.suggestionsList}>
              {SUGGESTIONS.map((s) => (
                <button key={s} className={styles.suggestionBtn} onClick={() => sendMessage(s)}>
                  {s}
                </button>
              ))}
            </div>
          </div>
        )}

        <div className={styles.inputArea}>
          <input
            ref={inputRef}
            className={styles.input}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Digite sua pergunta..."
            disabled={isLoading}
          />
          <button
            className={styles.sendBtn}
            onClick={() => sendMessage(input)}
            disabled={!input.trim() || isLoading}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/></svg>
          </button>
        </div>
        <p className={styles.disclaimer}>Modo demonstracao — respostas simuladas com base nos dados do sistema</p>
      </div>
    </div>
  );
}
