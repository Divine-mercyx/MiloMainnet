
import React, { useEffect, useState } from 'react';
import { MessageSquare, Clock, ArrowRight, Trash2 } from 'lucide-react';
import { ChatSession } from '../types';

interface ActivityPageProps {
  onSelectSession: (sessionId: string) => void;
}

export const ActivityPage: React.FC<ActivityPageProps> = ({ onSelectSession }) => {
  const [sessions, setSessions] = useState<ChatSession[]>([]);

  useEffect(() => {
    const loadSessions = () => {
      try {
        const stored = localStorage.getItem('mylo_chat_sessions');
        if (stored) {
          const parsed = JSON.parse(stored);
          // Sort by newest first
          const sorted = parsed.sort((a: ChatSession, b: ChatSession) => 
            new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
          );
          setSessions(sorted);
        }
      } catch (e) {
        console.error("Failed to load sessions", e);
      }
    };

    loadSessions();
  }, []);

  const handleDelete = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    const updated = sessions.filter(s => s.id !== id);
    setSessions(updated);
    localStorage.setItem('mylo_chat_sessions', JSON.stringify(updated));
  };

  const groupSessions = () => {
    const groups: { [key: string]: ChatSession[] } = {
      'Today': [],
      'Yesterday': [],
      'Previous 7 Days': [],
      'Older': []
    };

    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
    const yesterday = today - 86400000;
    const lastWeek = today - 86400000 * 7;

    sessions.forEach(session => {
      const date = new Date(session.timestamp).getTime();
      if (date >= today) {
        groups['Today'].push(session);
      } else if (date >= yesterday) {
        groups['Yesterday'].push(session);
      } else if (date >= lastWeek) {
        groups['Previous 7 Days'].push(session);
      } else {
        groups['Older'].push(session);
      }
    });

    return groups;
  };

  const grouped = groupSessions();

  return (
    <div className="flex-1 h-full overflow-y-auto p-6 md:p-10">
      <div className="max-w-4xl mx-auto">
        <div className="mb-8">
            <h1 className="text-3xl font-bold text-slate-800 mb-2">Activity History</h1>
            <p className="text-slate-500">Resume your previous conversations with MYLO.</p>
        </div>

        {sessions.length === 0 ? (
           <div className="text-center py-20 bg-white rounded-3xl border border-slate-100 shadow-sm">
              <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-4 text-slate-400">
                  <Clock size={32} />
              </div>
              <h3 className="text-lg font-medium text-slate-600">No activity yet</h3>
              <p className="text-slate-400">Start a conversation with the Assistant to see it here.</p>
           </div>
        ) : (
          <div className="space-y-8">
            {Object.entries(grouped).map(([label, groupSessions]) => (
              groupSessions.length > 0 && (
                <div key={label}>
                  <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-4 pl-1">{label}</h3>
                  <div className="space-y-3">
                    {groupSessions.map(session => (
                      <div 
                        key={session.id}
                        onClick={() => onSelectSession(session.id)}
                        className="group bg-white p-4 rounded-2xl border border-slate-100 shadow-sm hover:shadow-md hover:border-teal-100 transition-all cursor-pointer flex items-center justify-between"
                      >
                        <div className="flex items-center gap-4 overflow-hidden">
                           <div className="w-10 h-10 rounded-xl bg-teal-50 text-[#3B8D85] flex items-center justify-center flex-shrink-0 group-hover:bg-[#3B8D85] group-hover:text-white transition-colors">
                              <MessageSquare size={20} />
                           </div>
                           <div className="min-w-0">
                              <p className="font-semibold text-slate-800 truncate pr-4">{session.preview || 'New Conversation'}</p>
                              <p className="text-xs text-slate-400 flex items-center gap-1">
                                <Clock size={10} />
                                {new Date(session.timestamp).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                                <span className="mx-1">•</span>
                                {session.messages.length} messages
                              </p>
                           </div>
                        </div>
                        
                        <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                            <button 
                                onClick={(e) => handleDelete(e, session.id)}
                                className="p-2 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                            >
                                <Trash2 size={16} />
                            </button>
                            <button className="p-2 text-slate-300 group-hover:text-[#3B8D85]">
                                <ArrowRight size={18} />
                            </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
