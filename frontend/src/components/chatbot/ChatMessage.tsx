import React from "react";
import { ChatMessage as ChatMessageType } from "@/types/chatbot";
import { Button } from "@/components/ui/Button";
import { Sparkles, User, Check, X, AlertTriangle, File as FileIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { Markdown } from "./Markdown";

interface ChatMessageProps {
  message: ChatMessageType;
  onConfirm?: (action: string, params: Record<string, any>) => void;
  onCancel?: () => void;
  isActionLoading?: boolean;
}

export default function ChatMessage({
  message,
  onConfirm,
  onCancel,
  isActionLoading = false,
}: ChatMessageProps) {
  const isUser = message.role === "user";

  return (
    <div
      className={cn(
        "flex w-full gap-3 py-2 animate-in fade-in slide-in-from-bottom-2 duration-200",
        isUser ? "justify-end" : "justify-start"
      )}
    >
      {/* Icon Avatar */}
      {!isUser && (
        <div className="flex h-8 w-8 shrink-0 select-none items-center justify-center rounded-lg bg-indigo-50 border border-indigo-100 text-indigo-600 shadow-xs">
          <Sparkles size={15} />
        </div>
      )}

      {/* Message Box */}
      <div className="flex flex-col gap-2 max-w-[85%]">
        <div
          className={cn(
            "rounded-2xl px-4 py-2.5 shadow-xs transition-all",
            isUser
              ? "bg-gradient-to-tr from-indigo-600 to-indigo-500 text-white rounded-br-none"
              : "bg-slate-50 border border-slate-100 text-slate-700 rounded-bl-none"
          )}
        >
          {/* Markdown Content */}
          <div className={cn("text-[13px]", isUser ? "[&_*]:text-white" : "")}>
            <Markdown content={message.content} />
          </div>

          {/* Attached File Badge */}
          {message.file && (
            <div
              className={cn(
                "mt-2.5 p-2 rounded-xl flex items-center gap-2 border text-xs transition-all",
                isUser
                  ? "bg-white/10 border-white/10 text-white"
                  : "bg-indigo-50/40 border-indigo-100/50 text-indigo-700"
              )}
            >
              <FileIcon size={14} className={isUser ? "text-white" : "text-indigo-500"} />
              <div className="flex flex-col">
                <span className="font-semibold truncate max-w-[200px]">{message.file.name}</span>
                <span className={cn("text-[9px]", isUser ? "text-white/60" : "text-slate-400")}>
                  Justificatif attaché
                </span>
              </div>
            </div>
          )}
        </div>

        {/* Confirmation Buttons for Actions */}
        {message.type === "confirmation" && message.actionData && onConfirm && onCancel && (
          <div className="bg-amber-50/70 border border-amber-200/60 rounded-xl p-3.5 mt-1 space-y-3 shadow-xs animate-in zoom-in-95 duration-200">
            <div className="flex items-start gap-2 text-amber-800">
              <AlertTriangle size={16} className="shrink-0 mt-0.5" />
              <div className="text-xs font-semibold font-poppins leading-tight">
                Cette action va modifier vos données. Confirmez-vous ?
              </div>
            </div>
            
            <div className="flex items-center gap-2">
              <Button
                size="sm"
                onClick={() =>
                  onConfirm(message.actionData!.action, message.actionData!.params)
                }
                disabled={isActionLoading}
                className="bg-emerald-600 hover:bg-emerald-700 text-white font-medium text-xs px-3 h-8 gap-1.5 shadow-sm hover:shadow-md transition-all font-poppins"
              >
                <Check size={14} />
                {isActionLoading ? "Validation..." : "Confirmer"}
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={onCancel}
                disabled={isActionLoading}
                className="bg-white hover:bg-slate-50 border-slate-200 text-slate-600 font-medium text-xs px-3 h-8 gap-1.5 shadow-sm font-poppins"
              >
                <X size={14} />
                Annuler
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* User Avatar */}
      {isUser && (
        <div className="flex h-8 w-8 shrink-0 select-none items-center justify-center rounded-lg bg-indigo-600 text-white shadow-sm">
          <User size={15} />
        </div>
      )}
    </div>
  );
}
