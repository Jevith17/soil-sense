import React, { useState, useRef, useEffect } from 'react';
import { 
  MessageSquare, 
  Send, 
  Database, 
  RefreshCw, 
  AlertTriangle, 
  Check, 
  X,
  FileQuestion,
  Terminal,
  HelpCircle
} from 'lucide-react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { SectionHeader } from '@/components/ui/SectionHeader';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { api } from '@/lib/api';

interface ChatMessage {
  id: string;
  sender: 'user' | 'assistant';
  text: string;
  timestamp: string;
  hasCommandIntent?: boolean;
  commandDetected?: string;
  suggestedAction?: {
    action_type: string;
    duration_minutes: number;
    requires_confirmation: boolean;
  };
  confirmed?: boolean;
  cancelled?: boolean;
  dataSources?: string[];
}

export default function ProcessAssistantPage() {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'welcome',
      sender: 'assistant',
      text: "SoilSense Process Assistant active. Telemetry queries are evaluated directly against your local database tables. You can inquire about root-zone water balance, nutrient saturation, or historical actuation records.",
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      dataSources: ['SoilSense Operational Database']
    }
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSendMessage = async (queryText?: string) => {
    const q = queryText || input;
    if (!q.trim() || loading) return;

    const userMsg: ChatMessage = {
      id: Date.now().toString(),
      sender: 'user',
      text: q,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    setMessages((prev) => [...prev, userMsg]);
    setInput('');
    setLoading(true);

    try {
      const res = await api.chatCopilot(q);
      const assistantMsg: ChatMessage = {
        id: (Date.now() + 1).toString(),
        sender: 'assistant',
        text: res.reply,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        hasCommandIntent: res.has_command_intent,
        commandDetected: res.command_detected,
        suggestedAction: res.suggested_action,
        dataSources: res.data_sources_used
      };
      setMessages((prev) => [...prev, assistantMsg]);
    } catch (err: any) {
      setMessages((prev) => [
        ...prev,
        {
          id: (Date.now() + 1).toString(),
          sender: 'assistant',
          text: `Telemetry query error: ${err.message}`,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        }
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleConfirmAction = async (msgId: string, actionType: string) => {
    try {
      await api.sendCommand({
        action_type: actionType,
        reason: 'Authorized via SoilSense Process Assistant command'
      });
      setMessages((prev) =>
        prev.map((m) =>
          m.id === msgId ? { ...m, confirmed: true } : m
        )
      );
    } catch (err: any) {
      alert(`Safety interlock blocked action: ${err.message}`);
    }
  };

  const handleCancelAction = (msgId: string) => {
    setMessages((prev) =>
      prev.map((m) =>
        m.id === msgId ? { ...m, cancelled: true } : m
      )
    );
  };

  const engineeringQueries = [
    "Why is irrigation recommended?",
    "Why is fertigation not recommended?",
    "What caused the moisture drop?",
    "Compare today with yesterday.",
    "What happened after the last irrigation?",
    "What happens if irrigation runs for 10 minutes?",
    "Turn the pump on"
  ];

  return (
    <DashboardLayout title="SoilSense — Process Assistant">
      <div className="space-y-4 flex flex-col h-[calc(100vh-7.5rem)]">
        {/* Header */}
        <SectionHeader
          title="Process Assistant"
          moduleIndex={4}
          subtitle="Grounded agronomic telemetry assistant querying database readings, mass balance calculations, and actuator records."
          actions={
            <div className="flex items-center gap-1.5 font-mono text-xs text-stone-600 bg-stone-100 px-2.5 py-1 rounded border border-stone-200">
              <Database className="h-3.5 w-3.5 text-forest-700" />
              <span>Grounded Telemetry Bus</span>
            </div>
          }
        />

        {/* Practical Engineering Query Chips */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 text-xs">
          <span className="font-mono text-[10px] uppercase font-bold text-stone-500 shrink-0">
            ENGINEERING QUERIES:
          </span>
          {engineeringQueries.map((q, idx) => (
            <button
              key={idx}
              onClick={() => handleSendMessage(q)}
              className="bg-white hover:bg-stone-100 text-stone-700 hover:text-stone-900 px-2.5 py-1 rounded border border-stone-300 font-mono text-[11px] shrink-0 transition-colors shadow-2xs"
            >
              {q}
            </button>
          ))}
        </div>

        {/* Chat Stream Area */}
        <div className="flex-1 bg-white border border-stone-200 rounded-lg p-5 overflow-y-auto space-y-4 shadow-2xs font-mono text-xs">
          {messages.map((m) => {
            const isUser = m.sender === 'user';
            return (
              <div key={m.id} className={`flex ${isUser ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-2xl rounded p-4 space-y-2 border ${
                  isUser
                    ? 'bg-forest-800 text-white border-forest-900 shadow-xs'
                    : 'bg-stone-50 text-stone-800 border-stone-200 shadow-2xs'
                }`}>
                  <div className={`flex items-center justify-between border-b pb-1 text-[10px] ${
                    isUser ? 'border-forest-700/60 text-forest-200' : 'border-stone-200 text-stone-500'
                  }`}>
                    <span className="font-bold uppercase tracking-wider">
                      {isUser ? 'Operator Inquiry' : 'SoilSense Assistant'}
                    </span>
                    <span>{m.timestamp}</span>
                  </div>

                  <p className="whitespace-pre-line text-[11px] leading-relaxed font-sans">
                    {m.text}
                  </p>

                  {/* Operational Command Detected Box with CONFIRM / CANCEL */}
                  {m.hasCommandIntent && (
                    <div className="mt-3 p-3 rounded bg-amber-50 border border-amber-300 text-amber-900 font-sans space-y-2">
                      <div className="flex items-center gap-1.5 font-bold font-mono text-xs text-amber-800">
                        <AlertTriangle className="h-4 w-4" />
                        <span>OPERATIONAL REQUEST DETECTED: {m.commandDetected}</span>
                      </div>
                      <p className="text-xs text-amber-800/90 leading-relaxed">
                        Physical actuators cannot execute automatically from chat conversation. Operator authorization is mandatory.
                      </p>

                      {!m.confirmed && !m.cancelled && (
                        <div className="flex items-center gap-2 pt-1 font-mono">
                          <button
                            onClick={() => handleConfirmAction(m.id, m.suggestedAction?.action_type || 'MANUAL_ON')}
                            className="px-3 py-1.5 rounded bg-forest-800 hover:bg-forest-900 text-white font-medium text-xs shadow-xs transition-colors"
                          >
                            CONFIRM EXECUTION
                          </button>
                          <button
                            onClick={() => handleCancelAction(m.id)}
                            className="px-3 py-1.5 rounded bg-white hover:bg-stone-50 text-stone-700 border border-stone-300 text-xs transition-colors"
                          >
                            CANCEL
                          </button>
                        </div>
                      )}

                      {m.confirmed && (
                        <div className="text-[11px] font-mono text-forest-800 font-semibold flex items-center gap-1 pt-1">
                          <Check className="h-3.5 w-3.5" /> Action authorized and logged to command audit trail.
                        </div>
                      )}

                      {m.cancelled && (
                        <div className="text-[11px] font-mono text-stone-500 italic pt-1">
                          Command cancelled. Actuators remain safely unchanged.
                        </div>
                      )}
                    </div>
                  )}

                  {/* Telemetry Sources */}
                  {m.dataSources && m.dataSources.length > 0 && (
                    <div className="pt-1 text-[10px] text-stone-500 flex items-center gap-1 font-mono">
                      <Database className="h-2.5 w-2.5" />
                      <span>Data bus: {m.dataSources.join(', ')}</span>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
          {loading && (
            <div className="flex justify-start">
              <div className="bg-stone-50 border border-stone-200 rounded p-3 text-xs font-mono text-stone-500 flex items-center gap-2">
                <RefreshCw className="h-3.5 w-3.5 animate-spin text-forest-700" />
                <span>Querying telemetry records...</span>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Input Bar */}
        <div className="flex items-center gap-2">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
            placeholder="Type a technical query (e.g. 'Why is irrigation recommended?' or 'Compare today with yesterday')..."
            className="flex-1 bg-white border border-stone-300 rounded px-4 py-2.5 text-xs text-stone-900 placeholder-stone-400 outline-none focus:border-forest-600 transition-colors font-mono shadow-2xs"
          />
          <button
            onClick={() => handleSendMessage()}
            disabled={!input.trim() || loading}
            className="px-4 py-2.5 rounded bg-forest-800 hover:bg-forest-900 text-white font-mono text-xs font-medium transition-colors disabled:opacity-40 shadow-xs"
          >
            <Send className="h-4 w-4" />
          </button>
        </div>
      </div>
    </DashboardLayout>
  );
}
