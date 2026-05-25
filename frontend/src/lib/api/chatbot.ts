import { fetchWithAuth } from "../api";
import { ChatResponse, ConfirmResponse } from "@/types/chatbot";

const BASE_URL = "/chatbot";

export async function sendChatBotMessage(
  message: string,
  history: { role: string; content: string }[]
): Promise<ChatResponse> {
  return fetchWithAuth<ChatResponse>(`${BASE_URL}/message`, {
    method: "POST",
    body: JSON.stringify({ message, history }),
  });
}

export async function confirmChatBotAction(
  action: string,
  params: Record<string, any>
): Promise<ConfirmResponse> {
  return fetchWithAuth<ConfirmResponse>(`${BASE_URL}/confirm`, {
    method: "POST",
    body: JSON.stringify({ action, params }),
  });
}
