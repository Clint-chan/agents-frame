// Chat message type
export interface Message {
  id: string;
  type: "user" | "ai" | "tool";
  content: string;
  toolCall?: { calls: any[] };
  chunks?: ChunkInfo[];
  agent_id?: string;
  run_id?: string;
}

// Knowledge chunk type
export interface ChunkInfo {
  index: number;
  chunk_id: string;
  content: string;
  document_id: string;
  document_name: string;
  image_id?: string;
  positions: any[];
  similarity: number;
}

// Chat component props
export interface ChatComponentProps {
  threadId: string;
}