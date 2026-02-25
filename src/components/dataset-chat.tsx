"use client";

import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";

type Message = {
  id: string;
  role: "user" | "assistant" | "system";
  content: string;
  createdAt: string;
};

type DatasetChatProps = {
  datasetId: string;
};

export function DatasetChat({ datasetId }: DatasetChatProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const containerRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    async function loadHistory() {
      const res = await fetch(`/api/chat?datasetId=${datasetId}`);
      if (!res.ok) return;
      const data = (await res.json()) as {
        sessionId: string;
        messages: Message[];
      };
      setSessionId(data.sessionId);
      setMessages(data.messages);
      scrollToBottom();
    }
    loadHistory();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [datasetId]);

  function scrollToBottom() {
    requestAnimationFrame(() => {
      if (containerRef.current) {
        containerRef.current.scrollTop = containerRef.current.scrollHeight;
      }
    });
  }

  async function handleSend() {
    if (!input.trim()) return;
    const userText = input.trim();
    setInput("");

    const optimisticMessage: Message = {
      id: `temp-${Date.now()}`,
      role: "user",
      content: userText,
      createdAt: new Date().toISOString(),
    };
    setMessages((prev) => [...prev, optimisticMessage]);
    scrollToBottom();

    setLoading(true);
    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          datasetId,
          sessionId,
          message: userText,
        }),
      });
      const data = (await res.json()) as {
        sessionId: string;
        messages: Message[];
      };
      setSessionId(data.sessionId);
      setMessages(data.messages);
      scrollToBottom();
    } catch {
      // On error, keep optimistic message and append a lightweight error.
      setMessages((prev) => [
        ...prev,
        {
          id: `error-${Date.now()}`,
          role: "assistant",
          content:
            "I ran into an error reaching the server. Please try again in a moment.",
          createdAt: new Date().toISOString(),
        },
      ]);
      scrollToBottom();
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex h-full flex-col rounded-2xl border bg-card/70">
      <div
        ref={containerRef}
        className="flex-1 space-y-3 overflow-y-auto p-4 text-sm"
      >
        {messages.length === 0 ? (
          <div className="mt-10 text-center text-xs text-muted-foreground">
            Ask a question about this dataset. For example:
            <div className="mt-2 space-y-1">
              <p>• “Summarize the distribution of values per column.”</p>
              <p>• “Find rows where product name starts with ‘ASUS ROG Strix’.”</p>
              <p>• “What are the biggest outliers in this file?”</p>
            </div>
          </div>
        ) : (
          messages.map((m) => (
            <div key={m.id} className="space-y-1">
              <div className="text-[11px] font-medium text-muted-foreground">
                {m.role === "user" ? "You" : "AI assistant"}
              </div>
              <div
                className={
                  m.role === "user"
                    ? "rounded-2xl bg-primary/10 px-3 py-2 text-sm"
                    : "rounded-2xl bg-muted px-3 py-2 text-sm"
                }
              >
                {m.content}
              </div>
            </div>
          ))
        )}
      </div>
      <div className="border-t p-3">
        <div className="flex items-end gap-2">
          <Textarea
            rows={2}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Ask a question about this dataset…"
            className="min-h-[48px] resize-none text-sm"
          />
          <Button
            size="sm"
            className="shrink-0"
            onClick={handleSend}
            disabled={loading || !input.trim()}
          >
            {loading ? "Thinking…" : "Send"}
          </Button>
        </div>
      </div>
    </div>
  );
}

