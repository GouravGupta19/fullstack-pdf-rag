'use client';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import React, { useState, useRef, useEffect } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Send, Bot, User, Sparkles } from 'lucide-react';

const ChatComponent = () => {
    const [message, setMessage] = useState('');
    const [messages, setMessages] = useState([]);
    const [loading, setLoading] = useState(false);
    const messagesEndRef = useRef(null);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages, loading]);

    const handleSendChatMessage = async () => {
        if (!message.trim() || loading) return;

        const userMessage = message;
        setMessage('');
        setMessages((prev) => [...prev, { role: 'user', content: userMessage }]);
        setLoading(true);

        try {
            const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
            const res = await fetch(
                `${API_URL}/chat?message=${encodeURIComponent(userMessage)}`
            );

            if (!res.ok) {
                throw new Error(`Server error: ${res.status}`);
            }

            const data = await res.json();

            setMessages((prev) => [
                ...prev,
                {
                    role: 'assistant',
                    content: data?.message,
                    documents: data?.docs,
                },
            ]);
        } catch (error) {
            console.error('Chat error:', error);
            setMessages((prev) => [
                ...prev,
                {
                    role: 'assistant',
                    content: `**Error**: ${error.message}. Make sure the server is running on port 8000.`,
                },
            ]);
        } finally {
            setLoading(false);
        }
    };

    const handleKeyDown = (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSendChatMessage();
        }
    };

    return (
        <div className="flex flex-col h-full bg-[#0c0c0f]">
            {/* Header */}
            <div className="h-14 border-b border-white/5 flex items-center px-6 shrink-0 bg-[#0c0c0f]/80 backdrop-blur-md">
                <h2 className="text-sm font-medium text-slate-200 flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-indigo-400" />
                    Interactive PDF Chat
                </h2>
            </div>

            {/* Messages Area */}
            <div className="flex-1 overflow-y-auto p-6 space-y-6 scroll-smooth">
                {messages.length === 0 ? (
                    <div className="h-full flex flex-col items-center justify-center text-center space-y-4 opacity-50">
                        <Bot className="w-12 h-12 text-slate-400" />
                        <p className="text-sm text-slate-400">Ask a question about your uploaded documents.</p>
                    </div>
                ) : (
                    messages.map((msg, index) => (
                        <div key={index} className={`flex gap-4 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                            {msg.role === 'assistant' && (
                                <div className="w-8 h-8 rounded-full bg-indigo-500/20 border border-indigo-500/30 flex items-center justify-center shrink-0">
                                    <Bot className="w-4 h-4 text-indigo-400" />
                                </div>
                            )}
                            
                            <div className={`max-w-[80%] rounded-2xl p-4 ${
                                msg.role === 'user' 
                                    ? 'bg-indigo-600 text-white rounded-br-sm' 
                                    : 'bg-white/5 border border-white/10 text-slate-200 rounded-bl-sm shadow-sm'
                            }`}>
                                <div className="prose prose-invert prose-sm max-w-none">
                                    <ReactMarkdown remarkPlugins={[remarkGfm]}>
                                        {msg.content}
                                    </ReactMarkdown>
                                </div>
                                
                                {msg.documents && msg.documents.length > 0 && (
                                    <div className="mt-4 pt-4 border-t border-white/10">
                                        <p className="text-xs text-slate-500 font-medium mb-2 uppercase tracking-wider">Sources Retrieved</p>
                                        <div className="flex flex-wrap gap-2">
                                            {msg.documents.map((doc, dIdx) => (
                                                <span key={dIdx} className="inline-flex items-center rounded-md bg-black/40 px-2 py-1 text-[10px] font-medium text-slate-400 border border-white/5 truncate max-w-[200px]" title={doc.pageContent}>
                                                    Chunk {dIdx + 1}
                                                </span>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </div>

                            {msg.role === 'user' && (
                                <div className="w-8 h-8 rounded-full bg-slate-800 flex items-center justify-center shrink-0 border border-white/10">
                                    <User className="w-4 h-4 text-slate-400" />
                                </div>
                            )}
                        </div>
                    ))
                )}
                
                {loading && (
                    <div className="flex gap-4 justify-start">
                        <div className="w-8 h-8 rounded-full bg-indigo-500/20 border border-indigo-500/30 flex items-center justify-center shrink-0">
                            <Bot className="w-4 h-4 text-indigo-400" />
                        </div>
                        <div className="bg-white/5 border border-white/10 rounded-2xl rounded-bl-sm p-4 flex items-center gap-2">
                            <div className="w-2 h-2 rounded-full bg-indigo-400 animate-bounce" style={{ animationDelay: '0ms' }} />
                            <div className="w-2 h-2 rounded-full bg-indigo-400 animate-bounce" style={{ animationDelay: '150ms' }} />
                            <div className="w-2 h-2 rounded-full bg-indigo-400 animate-bounce" style={{ animationDelay: '300ms' }} />
                        </div>
                    </div>
                )}
                <div ref={messagesEndRef} />
            </div>

            {/* Input Area */}
            <div className="p-4 shrink-0 bg-[#0c0c0f]">
                <div className="max-w-4xl mx-auto relative flex items-center">
                    <Input
                        value={message}
                        onChange={(e) => setMessage(e.target.value)}
                        onKeyDown={handleKeyDown}
                        placeholder="Type your question..."
                        disabled={loading}
                        className="w-full bg-white/5 border-white/10 focus-visible:border-indigo-500/50 focus-visible:ring-indigo-500/20 h-12 pr-12 rounded-xl"
                    />
                    <Button 
                        onClick={handleSendChatMessage} 
                        disabled={!message.trim() || loading}
                        size="icon"
                        className="absolute right-1.5 h-9 w-9 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white transition-all disabled:opacity-50"
                    >
                        <Send className="w-4 h-4" />
                    </Button>
                </div>
                <div className="text-center mt-2">
                    <p className="text-[10px] text-slate-500">Groq LLM can make mistakes. Verify important information.</p>
                </div>
            </div>
        </div>
    );
};

export default ChatComponent;