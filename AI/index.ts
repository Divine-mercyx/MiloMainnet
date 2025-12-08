// Refactored AI module for frontend use
export { routeIntent } from './router';
export { handleCommand } from './commandHandler';
export { handleConversation } from './conversationHandler';
export { transcribeAudio } from './transcribeHandler';
export { AIProcessor } from './processor';
export type { CommandResult, ConversationResult, TranscriptionResult } from '../types/types';