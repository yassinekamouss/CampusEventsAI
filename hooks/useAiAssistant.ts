import { useCallback, useState } from "react";

import { getAllEvents } from "@/database/events";
import { getCachedResult, saveLlmResult } from "@/database/llmResults";
import { AiActionType, callGemini } from "@/services/llm";

type AssistantData = Record<string, unknown> | null;

function parseEventTags(tags: string | null) {
  if (!tags) return [] as string[];
  try {
    const parsed = JSON.parse(tags) as unknown;
    if (!Array.isArray(parsed)) return [] as string[];
    return parsed.filter((item): item is string => typeof item === "string");
  } catch {
    return [] as string[];
  }
}

function findFirstEventId(payload: unknown): string | null {
  if (!payload || typeof payload !== "object") return null;

  if (Array.isArray(payload)) {
    for (const item of payload) {
      const found = findFirstEventId(item);
      if (found) return found;
    }
    return null;
  }

  const record = payload as Record<string, unknown>;

  if (typeof record.eventId === "string" && record.eventId.trim().length > 0) {
    return record.eventId;
  }

  for (const value of Object.values(record)) {
    const found = findFirstEventId(value);
    if (found) return found;
  }

  return null;
}

export function useAiAssistant() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<AssistantData>(null);

  const executeAction = useCallback(
    async (type: AiActionType, query: string) => {
      const normalizedQuery = query.trim();

      if (normalizedQuery.length === 0) {
        setError("Veuillez saisir une requête.");
        setData(null);
        return;
      }

      setIsLoading(true);
      setError(null);

      try {
        const cached = await getCachedResult(type, normalizedQuery);

        if (cached?.outputText) {
          const parsed = JSON.parse(cached.outputText) as Record<
            string,
            unknown
          >;
          setData(parsed);
          return;
        }

        const events = await getAllEvents();
        const cleanedCatalogue = events.map((event) => ({
          id: event.id,
          title: event.title,
          category: event.category,
          tags: parseEventTags(event.tags),
          date: event.startDateTime,
        }));

        const response = await callGemini(
          type,
          normalizedQuery,
          cleanedCatalogue,
        );

        await saveLlmResult({
          type,
          inputText: normalizedQuery,
          outputText: JSON.stringify(response),
          eventId: findFirstEventId(response),
        });

        setData(response);
      } catch (e) {
        console.error("Assistant execution failed:", e);
        setData(null);
        setError(
          e instanceof Error
            ? e.message
            : "Une erreur est survenue pendant la requête IA.",
        );
      } finally {
        setIsLoading(false);
      }
    },
    [],
  );

  return {
    executeAction,
    isLoading,
    error,
    data,
  };
}
