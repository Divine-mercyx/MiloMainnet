import React from "react";
import { useEffect, useRef } from "react";
import {UserIcon, SendIcon} from "../../assets/icons/icons.tsx";
import type {Message} from "../../types/types.ts";

const ChatArea: React.FC<{
    messages: Message[];
    currentInput: string;
    onInputChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
    onSendMessage: (e: React.FormEvent) => void;
    isLoading: boolean;
}> = ({ messages, currentInput, onInputChange, onSendMessage, isLoading }) => {
    const messagesEndRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    return (
        <>
            <div className="flex flex-col flex-1 h-full">
                <div className="flex-1 overflow-y-auto p-6 space-y-6">
                    {messages.map((msg, index) => (
                        <div key={index} className={`flex items-start gap-4 ${msg.sender === 'user' ? 'justify-end' : ''}`}>
                            {msg.sender === 'bot' && <div className="w-8 h-8 rounded-full bg-milo-purple flex items-center justify-center flex-shrink-0"><UserIcon className="w-5 h-5 text-white"/></div>}
                            <div className={`max-w-md p-4 rounded-2xl ${msg.sender === 'user' ? 'bg-milo-purple text-white rounded-br-none' : 'bg-white shadow-subtle rounded-bl-none'}`}>
                                <p className="text-sm whitespace-pre-wrap">{msg.text}{isLoading && msg.sender === 'bot' && index === messages.length-1 && <span className="inline-block w-2 h-4 bg-milo-text ml-1 animate-pulse"></span>}</p>
                            </div>
                            {msg.sender === 'user' && <div className="w-8 h-8 rounded-full bg-milo-dark-purple flex items-center justify-center flex-shrink-0"><UserIcon className="w-5 h-5 text-white"/></div>}
                        </div>
                    ))}
                    <div ref={messagesEndRef} />
                </div>
                <div className="p-4 bg-white/50 border-t border-gray-200">
                    <form onSubmit={onSendMessage} className="max-w-3xl mx-auto">
                        <div className="relative">
                            <input
                                type="text"
                                value={currentInput}
                                onChange={onInputChange}
                                placeholder="Send a message..."
                                className="w-full py-3 pr-14 pl-4 rounded-full border border-gray-300 focus:outline-none focus:ring-2 focus:ring-milo-purple transition"
                                aria-label="Chat input"
                            />
                            <button type="submit" className="absolute right-2 top-1/2 -translate-y-1/2 w-10 h-10 bg-milo-purple rounded-full text-white flex items-center justify-center hover:opacity-90 disabled:opacity-50 transition" disabled={isLoading || !currentInput} aria-label="Send message">
                                <SendIcon className="w-5 h-5" />
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </>
    )
}
export default ChatArea;