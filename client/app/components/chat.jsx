'use client';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import React, { useState } from 'react';

const ChatComponent = () => {
    const [message, setMessage] = useState('');
    const [messages, setMessages] = useState([]);

    console.log({ messages });

    const handleSendChatMessage = async () => {
        setMessages((prev) => [...prev, { role: 'user', content: message }]);

        const res = await fetch(
            `http://localhost:8000/chat?message=${message}`
        );
        const data = await res.json();

        setMessages((prev) => [
            ...prev,
            {
                role: 'assistant',
                content: data?.message,
                documents: data?.docs,
            },
        ]);
    };

    return (
        <div className="p-4">
            <div>
                {messages.map((message, index) => (
                    <pre key={index}>{JSON.stringify(message, null, 2)}</pre>
                ))}
            </div>

            <div className="fixed bottom-4 w-100 flex gap-3">
                <Input
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    placeholder="Type your message here"
                />

                <Button onClick={handleSendChatMessage} disabled={!message.trim()}>
                    Send
                </Button>
            </div>
        </div>
    );
};

export default ChatComponent;