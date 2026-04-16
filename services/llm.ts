export type AiActionType = "search" | "recommendation" | "planning" | "qa";

type CatalogueEvent = {
  id: string;
  title: string;
  category: string;
  tags: string[];
  date: string;
};

type GeminiGenerateContentResponse = {
  candidates?: {
    content?: {
      parts?: {
        text?: string;
      }[];
    };
  }[];
};

function getOutputContract(type: AiActionType) {
  switch (type) {
    case "search":
      return `{
  "items": [
    {
      "eventId": "string",
      "justification": "string"
    }
  ]
}`;
    case "recommendation":
      return `{
  "items": [
    {
      "eventId": "string",
      "justification": "string"
    }
  ],
  "strategy": "string"
}`;
    case "planning":
      return `{
  "plan": [
    {
      "date": "YYYY-MM-DD",
      "eventId": "string",
      "justification": "string"
    }
  ],
  "tips": ["string"]
}`;
    case "qa":
      return `{
  "answer": "string",
  "relatedEventIds": ["string"],
  "sources": [
    {
      "eventId": "string",
      "justification": "string"
    }
  ]
}`;
    default:
      return `{
  "items": []
}`;
  }
}

function buildPrompt(
  type: AiActionType,
  userQuery: string,
  catalogueData: CatalogueEvent[],
  userHistory: string | null,
) {
  return [
    "Tu es l'assistant CampusEvents AI.",
    "Objectif: repondre exclusivement a partir du catalogue fourni.",
    "Interdictions: aucun markdown, aucun texte hors JSON, aucune cle non demandee.",
    "Si tu n'as pas assez d'information, renvoie une structure valide avec des tableaux vides.",
    "Tous les eventId doivent exister dans le catalogue fourni.",
    `Mode: ${type}`,
    "Contrat JSON strict a respecter:",
    getOutputContract(type),
    "Catalogue JSON:",
    JSON.stringify(catalogueData),
    "Historique utilisateur:",
    userHistory ?? "null",
    "Question utilisateur:",
    userQuery,
  ].join("\n\n");
}

export async function callGemini(
  type: AiActionType,
  userQuery: string,
  catalogueData: CatalogueEvent[],
  userHistory: string | null = null,
) {
  const apiKey = process.env.EXPO_PUBLIC_GEMINI_API_KEY;

  if (!apiKey) {
    throw new Error(
      "Clé Gemini manquante. Définissez EXPO_PUBLIC_GEMINI_API_KEY.",
    );
  }

  const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-3-flash-preview:generateContent?key=${apiKey}`;
  const prompt = buildPrompt(type, userQuery, catalogueData, userHistory);

  const response = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      contents: [{ parts: [{ text: prompt }] }],
      generationConfig: { responseMimeType: "application/json" },
    }),
  });

  if (!response.ok) {
    const errorBody = await response.text();
    throw new Error(
      `Gemini HTTP ${response.status}: ${errorBody || "Réponse d'erreur vide."}`,
    );
  }

  const data = (await response.json()) as GeminiGenerateContentResponse;
  const rawText = data.candidates?.[0]?.content?.parts?.[0]?.text;

  if (!rawText) {
    throw new Error("Réponse Gemini invalide: contenu JSON absent.");
  }

  try {
    return JSON.parse(rawText) as Record<string, unknown>;
  } catch (error) {
    console.error("Invalid JSON from Gemini:", rawText);
    throw new Error(
      error instanceof Error
        ? `JSON Gemini invalide: ${error.message}`
        : "JSON Gemini invalide.",
    );
  }
}
