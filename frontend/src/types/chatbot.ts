export interface ChatMessage {
  id: string;
  role: "user" | "assistant" | "system";
  content: string;
  type?: "text" | "confirmation";
  actionData?: {
    action: string;
    params: Record<string, any>;
  };
  file?: {
    name: string;
    path: string;
  };
  timestamp: Date;
}

export interface ChatResponse {
  type: "text" | "confirmation";
  content: string;
  action_data?: {
    action: string;
    params: Record<string, any>;
  };
}

export interface ConfirmResponse {
  success: boolean;
  message: string;
}
