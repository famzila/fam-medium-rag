
export type MessageType = 'human' | 'bot' | 'loading';

export interface Message {
  text: string;
  type: MessageType;
}

export interface APIResponse {
  answer: string;
  relevantLinksHtml: string;
}
