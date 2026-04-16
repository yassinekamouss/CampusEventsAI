# Contexte du Projet : CampusEvents AI
Tu es un développeur expert en React Native et Expo. L'objectif est de développer une application mobile de niveau production ("real-world ready") pour la gestion des événements universitaires.

## Contraintes Techniques Strictes (Règle d'or : Éviter le Dependency Hell)
- **Framework :** React Native avec Expo (Managed Workflow, compatible Expo Go).
- **Navigation :** Expo Router (navigation basée sur le système de fichiers dans le dossier `/app`).
- **Styling :** UTILISER UNIQUEMENT `StyleSheet.create` de React Native. INTERDICTION d'utiliser Tailwind, NativeWind, styled-components ou tout autre framework UI externe.
- **Base de données :** `expo-sqlite` EXCLUSIVEMENT. L'application est "local-first". Pas de backend distant, pas d'ORM lourds (pas de TypeORM ou Prisma), écris des requêtes SQL brutes sécurisées ou des wrappers légers.
- **Gestion d'état :** Utiliser React Context API pour la session utilisateur. Éviter Redux ou Zustand sauf si la complexité l'exige absolument.

## Architecture des Dossiers à Respecter
- `/app` : Vues et routing Expo Router (ex: `(admin)`, `(student)`, `_layout.tsx`).
- `/components` : Composants UI réutilisables (Button, Card, Input). Ils doivent être "dumb" (sans logique métier complexe).
- `/database` : Logique SQLite (`init.ts` pour la création des tables, et des repositories comme `events.ts`, `registrations.ts` contenant les requêtes CRUD).
- `/services` : Logique externe, spécifiquement `llm.ts` pour les appels API (OpenAI/Mistral).
- `/types` : Interfaces TypeScript.

## Moteur LLM & Prompt Engineering
- Tous les appels IA doivent être centralisés dans `/services/llm.ts`.
- L'IA doit toujours retourner des données structurées. Ajoute systématiquement `response_format: { type: "json_object" }` (si l'API le supporte) et exige un format JSON précis dans tes prompts.
- La clé API ne doit jamais être en dur. Utiliser `expo-constants` et un fichier `.env`.

## Règles de Code (Vibe Coding)
- Écris un code modulaire, propre et massivement typé (TypeScript strict).
- Sépare la logique métier (Hooks personnalisés, Repositories) de la logique de présentation (Composants).
- Gère systématiquement les 4 états de l'UI pour l'IA et la DB : `Loading`, `Error`, `Empty`, `Result`.
- Ne propose pas d'ajouter de nouvelles dépendances NPM à moins que ce ne soit explicitement demandé.