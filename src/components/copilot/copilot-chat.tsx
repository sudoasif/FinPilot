"use client";

import {
  useEffect,
  useRef,
  useState,
  type FormEvent,
  type KeyboardEvent,
} from "react";
import { Bot, Loader2, RotateCcw, Send, Sparkles } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { formatINR } from "@/lib/format";
import { cn, uid } from "@/lib/utils";

interface CopilotContext {
  business: string;
  cash: number;
  income: number;
  expenses: number;
  profit: number;
  outstanding: number;
  overdue: number;
  overdueCount: number;
  openCount: number;
}

interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  mode?: "ai" | "local";
}

const SUGGESTIONS = [
  "How are my finances this month?",
  "Which invoices are overdue?",
  "Where am I overspending?",
  "How much should I set aside for GST?",
];

export function CopilotChat({
  context,
  aiEnabled,
}: {
  context: CopilotContext;
  aiEnabled: boolean;
}) {
  const welcomeId = "welcome";
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: welcomeId,
      role: "assistant",
      content: `Hi Asif — I am looking at ${context.business}'s books. Cash stands at ${formatINR(
        context.cash,
      )}, with ${formatINR(context.outstanding)} outstanding from customers${
        context.overdueCount > 0
          ? ` and ${formatINR(context.overdue)} already overdue`
          : ""
      }.\n\nAsk me about revenue, expenses, invoices, budgets, GST or runway. I will answer from your live numbers.`,
    },
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [messages, loading]);

  const send = async (raw: string) => {
    const text = raw.trim();
    if (!text || loading) return;

    const userMessage: ChatMessage = {
      id: uid("msg"),
      role: "user",
      content: text,
    };
    const next = [...messages, userMessage];
    setMessages(next);
    setInput("");
    setLoading(true);

    try {
      const response = await fetch("/api/copilot", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: next
            .filter((message) => message.id !== welcomeId)
            .map((message) => ({
              role: message.role,
              content: message.content,
            })),
        }),
      });

      if (!response.ok) {
        throw new Error(`Request failed with ${response.status}`);
      }

      const data = (await response.json()) as {
        reply: string;
        mode: "ai" | "local";
      };

      setMessages((current) => [
        ...current,
        {
          id: uid("msg"),
          role: "assistant",
          content: data.reply,
          mode: data.mode,
        },
      ]);
    } catch {
      setMessages((current) => [
        ...current,
        {
          id: uid("msg"),
          role: "assistant",
          content:
            "I could not reach the copilot service just now. Your books are safe — please try again in a moment.",
        },
      ]);
    } finally {
      setLoading(false);
      inputRef.current?.focus();
    }
  };

  const onSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    void send(input);
  };

  const onKeyDown = (event: KeyboardEvent<HTMLTextAreaElement>) => {
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();
      void send(input);
    }
  };

  const reset = () => {
    setMessages((current) => current.slice(0, 1));
    setInput("");
    setLoading(false);
  };

  const hasConversation = messages.length > 1;
  const lastAssistantMode = [...messages]
    .reverse()
    .find((message) => message.role === "assistant" && message.mode)?.mode;

  return (
    <Card className="flex h-[calc(100vh-14rem)] min-h-[560px] flex-col overflow-hidden">
      <div className="flex items-center gap-3 border-b border-slate-100 px-4 py-3">
        <span className="relative flex size-9 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-500 to-violet-600 text-white shadow-sm">
          <Bot className="size-4" />
          <span className="absolute -bottom-0.5 -right-0.5 size-2.5 rounded-full border-2 border-white bg-emerald-500" />
        </span>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold text-slate-900">FinPilot Copilot</p>
          <p className="text-[11px] text-slate-400">
            Reads your local books · answers in INR
          </p>
        </div>
        <Badge variant={aiEnabled ? "success" : "secondary"}>
          {aiEnabled ? "AI model" : "Local analyst"}
        </Badge>
        {hasConversation ? (
          <Button
            type="button"
            variant="ghost"
            size="icon-sm"
            onClick={reset}
            title="Start over"
            aria-label="Start over"
          >
            <RotateCcw className="size-3.5" />
          </Button>
        ) : null}
      </div>

      <div className="flex-1 space-y-4 overflow-y-auto bg-slate-50/50 px-4 py-4">
        {messages.map((message) => (
          <div
            key={message.id}
            className={cn(
              "flex items-end gap-2",
              message.role === "user" ? "justify-end" : "justify-start",
            )}
          >
            {message.role === "assistant" ? (
              <span className="flex size-7 shrink-0 items-center justify-center rounded-lg bg-white text-indigo-500 shadow-sm ring-1 ring-slate-200">
                <Bot className="size-3.5" />
              </span>
            ) : null}
            <div
              className={cn(
                "max-w-[85%] rounded-2xl px-3.5 py-2.5 text-[13px] leading-relaxed shadow-sm",
                message.role === "user"
                  ? "rounded-br-md bg-indigo-600 text-white"
                  : "rounded-bl-md border border-slate-200 bg-white text-slate-700",
              )}
            >
              <MessageBody content={message.content} />
              {message.mode ? (
                <p className="mt-2 flex items-center gap-1 text-[9px] uppercase tracking-wide text-slate-400">
                  <Sparkles className="size-2.5" />
                  {message.mode === "ai" ? "AI model" : "Local analyst"}
                </p>
              ) : null}
            </div>
          </div>
        ))}

        {loading ? (
          <div className="flex items-end gap-2">
            <span className="flex size-7 shrink-0 items-center justify-center rounded-lg bg-white text-indigo-500 shadow-sm ring-1 ring-slate-200">
              <Bot className="size-3.5" />
            </span>
            <div className="flex items-center gap-1.5 rounded-2xl rounded-bl-md border border-slate-200 bg-white px-4 py-3 shadow-sm">
              <span className="size-1.5 animate-bounce rounded-full bg-indigo-400 [animation-delay:-0.2s]" />
              <span className="size-1.5 animate-bounce rounded-full bg-indigo-400 [animation-delay:-0.1s]" />
              <span className="size-1.5 animate-bounce rounded-full bg-indigo-400" />
            </div>
          </div>
        ) : null}

        <div ref={bottomRef} />
      </div>

      <div className="border-t border-slate-100 bg-white p-3">
        {!hasConversation ? (
          <div className="mb-2 flex flex-wrap gap-1.5">
            {SUGGESTIONS.map((suggestion) => (
              <button
                key={suggestion}
                type="button"
                onClick={() => void send(suggestion)}
                disabled={loading}
                className="rounded-full border border-slate-200 bg-white px-2.5 py-1 text-[11px] text-slate-600 transition-colors hover:border-indigo-200 hover:bg-indigo-50 hover:text-indigo-700 disabled:opacity-50"
              >
                {suggestion}
              </button>
            ))}
          </div>
        ) : null}

        <form onSubmit={onSubmit} className="flex items-end gap-2">
          <Textarea
            ref={inputRef}
            value={input}
            onChange={(event) => setInput(event.target.value)}
            onKeyDown={onKeyDown}
            placeholder="Ask about cash flow, invoices, budgets or GST…"
            className="min-h-[42px] resize-none py-2.5"
            rows={1}
            maxLength={2000}
            disabled={loading}
          />
          <Button
            type="submit"
            size="icon"
            className="size-[42px] shrink-0"
            disabled={loading || input.trim().length === 0}
            aria-label="Send message"
          >
            {loading ? (
              <Loader2 className="size-4 animate-spin" />
            ) : (
              <Send className="size-4" />
            )}
          </Button>
        </form>
        <p className="mt-1.5 text-center text-[10px] text-slate-400">
          Enter to send · Shift+Enter for a new line
          {lastAssistantMode === "local"
            ? " · Local analyst answers without sending data anywhere"
            : ""}
        </p>
      </div>
    </Card>
  );
}

function MessageBody({ content }: { content: string }) {
  const lines = content.split("\n");

  return (
    <div className="space-y-1">
      {lines.map((line, index) => {
        if (line.trim() === "") {
          return <div key={index} className="h-1" />;
        }

        const bullet = /^[•\-]\s+/.test(line);
        const numbered = /^\d+\.\s+/.test(line);
        const text = bullet ? line.replace(/^[•\-]\s+/, "") : line;

        return (
          <p
            key={index}
            className={cn(
              (bullet || numbered) && "pl-1",
              line.startsWith("•") && "flex gap-1.5",
            )}
          >
            {line.startsWith("•") ? (
              <span className="mt-[7px] size-1 shrink-0 rounded-full bg-slate-400" />
            ) : null}
            <span>{renderBold(text)}</span>
          </p>
        );
      })}
    </div>
  );
}

function renderBold(text: string) {
  return text.split(/(\*\*[^*]+\*\*)/g).map((part, index) => {
    if (part.startsWith("**") && part.endsWith("**")) {
      return (
        <strong key={index} className="font-semibold">
          {part.slice(2, -2)}
        </strong>
      );
    }
    return <span key={index}>{part}</span>;
  });
}
