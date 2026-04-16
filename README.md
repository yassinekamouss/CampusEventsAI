# CampusEvents AI — Ingénierie Mobile Local-First & Orchestration RAG

[![Expo](https://img.shields.io/badge/Expo-SDK%20Latest-000000.svg?style=flat-square&logo=expo&logoColor=white)](https://expo.dev)
[![React Native](https://img.shields.io/badge/React_Native-Native-61DAFB.svg?style=flat-square&logo=react&logoColor=black)](https://reactnative.dev)
[![SQLite](https://img.shields.io/badge/SQLite-Local_First-003B57.svg?style=flat-square&logo=sqlite&logoColor=white)](https://sqlite.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-Strict-3178C6.svg?style=flat-square&logo=typescript&logoColor=white)](https://www.typescriptlang.org)
[![Gemini AI](https://img.shields.io/badge/Gemini_AI-3_Flash_Preview-orange.svg?style=flat-square&logo=google-gemini&logoColor=white)](https://deepmind.google/technologies/gemini/)

> **CampusEvents AI** est une application mobile d'ingénierie avancée (niveau Production-Ready) conçue pour centraliser le cycle de vie des événements universitaires. Ce projet se distingue par son architecture **Local-First (SQLite)** garantissant une résilience hors-ligne, couplée à un moteur d'Intelligence Artificielle (RAG) ultra-rapide agissant comme un agenda intelligent pour l'étudiant.

---

## 📑 Table des Matières

1. [Vision et Mission](#-vision-et-mission)
2. [Aperçu de l'Interface (Product Tour)](#-aperçu-de-linterface-product-tour)
3. [Philosophie d'Architecture (Zero-Dependency)](#-philosophie-darchitecture-zero-dependency)
4. [Stack Technique & Choix d'Ingénierie](#-stack-technique--choix-dingénierie)
5. [Fonctionnalités Core & RAG IA (Deep Dive)](#-fonctionnalités-core--rag-ia-deep-dive)
6. [Modélisation & Persistance des Données](#-modélisation--persistance-des-données-sqlite)
7. [Design System & UI/UX](#-design-system--uiux)
8. [Architecture des Dossiers](#-architecture-des-dossiers)
9. [Guide d'Installation (Developer Workflow)](#-guide-dinstallation-developer-workflow)
10. [Roadmap & Évolutions](#-roadmap--évolutions)
11. [Contribution & Licence](#-contribution--licence)
12. [Auteur](#-auteur)

---

## 🎯 Vision et Mission

Au sein des facultés (notamment la FST), la fragmentation de l'information est un anti-pattern chronique : hackathons, workshops et séminaires sont dispersés sur des canaux non structurés. Résultat : une faible pertinence de l'information (un étudiant en informatique est spammé par des événements de biologie) et une déperdition d'engagement.

**La solution CampusEvents AI :** Une plateforme mobile centralisée fonctionnant sur le paradigme *Local-First*. 
* **Pour l'étudiant :** Un catalogue interactif hors-ligne et un assistant IA capable de raisonner sur les événements pour fournir des recommandations personnalisées et une planification sémantique.
* **Pour l'administration :** Un espace de gestion (CRUD) robuste, avec des contraintes d'intégrité strictes.

---

## 🖼️ Aperçu de l'Interface (Product Tour)

L'interface a été conçue sans compromis sur l'ergonomie, avec une hiérarchie visuelle stricte pour minimiser la charge cognitive.

### 🔐 Espace Administrateur : Gouvernance
| **Tableau de Bord** | **Orchestration (CRUD)** | **Validation Stricte** |
| :--- | :--- | :--- |
| ![Admin Dashboard](.docs/placeholder-admin-dash.png) | ![Create Event](.docs/placeholder-admin-create.png) | ![Validation](.docs/placeholder-admin-val.png) |
| *Vue d'ensemble du catalogue avec actions rapides (Modifier/Supprimer).* | *Formulaire de création avec gestion avancée des dates et capacités.* | *Validation en temps réel des champs obligatoires et contraintes logiques.* |

### 🎓 Espace Étudiant : Assistant IA & RAG
| **Catalogue & Filtres** | **Détails & Inscription** | **Assistant Gemini IA** |
| :--- | :--- | :--- |
| ![Student Feed](.docs/placeholder-student-feed.png) | ![Event Details](.docs/placeholder-student-details.png) | ![AI Assistant](.docs/placeholder-ai.png) |
| *Flux d'événements interactif avec puces de filtrage fluides.* | *Gestion d'état des inscriptions (places limitées, conflits).* | *Chatbot sémantique avec parsing JSON natif pour des réponses structurées.* |

*(Note: Remplacer les placeholders par les captures d'écran réelles dans le dossier `.docs/`)*

---

## 🏗️ Philosophie d'Architecture (Zero-Dependency)

Le projet rejette l'approche monolithique et la surcharge de bibliothèques (le fameux *Dependency Hell*) au profit d'une **Clean Architecture** modulaire.

1. **Topologie par Rôle (File-Based Routing) :** L'utilisation d'Expo Router sépare hermétiquement le segment `/(admin)` du segment `/(student)`. Le `AuthContext` évalue la session et bloque les accès non autorisés avant même le montage de l'arbre React.
2. **Repository Pattern :** L'UI ne communique jamais directement avec SQLite. Toutes les requêtes SQL sont abstraites dans des classes de services (ex: `events.ts`, `registrations.ts`), rendant la couche de données agnostique et testable.
3. **Moteur REST Pur :** Contrairement aux implémentations standards qui nécessitent des SDK lourds, l'intégration IA est réalisée via des appels `fetch` HTTP purs, garantissant légèreté et contrôle total sur le payload réseau.

---

## 🛠️ Stack Technique & Choix d'Ingénierie

* **Framework Core :** React Native avec **Expo SDK** (Managed Workflow).
* **Navigation :** **Expo Router** (Typage statique des routes, Deep Linking natif).
* **Base de Données :** **`expo-sqlite`**. Solution de persistance relationnelle, ACID-compliant, permettant des requêtes SQL brutes et des opérations de cascade (ON DELETE CASCADE) directement sur l'appareil.
* **Gestion d'État :** **React Context API** combinée à **`AsyncStorage`** pour une persistance de session sécurisée sans surcharger le bundle.
* **Intelligence Artificielle :** **Google Gemini 3 Flash Preview** (via API REST). Sélectionné pour sa fenêtre de contexte massive et sa vélocité (Time-To-First-Token).
* **UI/Styling :** **React Native StyleSheet** pur + `@expo/vector-icons`. Aucun framework CSS externe, garantissant des performances de rendu natives (60 FPS constants).

---

## 🚀 Fonctionnalités Core & RAG IA (Deep Dive)

L'application transcende le concept de simple "chatbot" en implémentant une architecture **RAG (Retrieval-Augmented Generation) Local-to-Cloud** :

1. **Optimisation du Contexte (Vectorisation Virtuelle) :** Lors d'une requête utilisateur, le Repository SQLite extrait un sous-ensemble sérialisé du catalogue (id, titre, tags, places disponibles).
2. **Prompt Injection Sécurisée :** Ce JSON minimaliste est injecté dans le `SystemPrompt` de Gemini, forçant l'IA à raisonner *exclusivement* sur les données réelles du campus (Zero-Hallucination).
3. **Structured Outputs (JSON) :** Le modèle Gemini est contraint via `response_format: { type: "json_object" }`. L'application parse ce JSON de manière déterministe pour rendre des composants UI interactifs (cartes d'événements) au lieu de simples blocs de texte.
4. **Cache In-Memory & SQLite :** Les résultats des requêtes IA sont hachés et mis en cache dans une table `llm_results`. Une question répétée s'affiche en **0.1s** sans coût réseau ni API.

---

## 🗄️ Modélisation & Persistance des Données (SQLite)

Le schéma relationnel garantit l'intégrité des données sans dépendre d'un serveur externe :
* **Table `events` :** Source de vérité du catalogue.
* **Table `registrations` :** Table de jointure (`eventId`, `userId`) empêchant les doubles inscriptions via contrainte d'unicité.
* **Table `favorites` :** Stockage des signets de l'utilisateur.
* **Trigger Logique :** La suppression d'un événement par un Admin déclenche la suppression en cascade des inscriptions et favoris associés pour éviter la corruption de la base.

---

## 🎨 Design System & UI/UX

L'approche visuelle s'inspire des principes du *Native OS Design* :
* **Typographie & Espacements :** Utilisation stricte des variables de système.
* **Micro-Interactions :** Retours visuels asynchrones (Skeletons de chargement, Toasts non bloquants).
* **États IA Robustes :** Gestion systématique des 4 états UI pour le moteur de recherche : `Loading` (désactivation des triggers), `Error` (Graceful degradation avec retry), `Empty` (Feedback clair), et `Success`.

---

## 📁 Architecture des Dossiers

```text
CampusEventsAI/
├── app/                      # Routage Expo Router (File-based)
│   ├── (admin)/              # Segment protégé Admin (CRUD)
│   ├── (student)/            # Segment protégé Étudiant (Tabs)
│   ├── _layout.tsx           # Entry point & Provider (Auth, SafeArea)
│   └── index.tsx             # Écran de Connexion (Aiguilleur)
├── components/               # UI Réutilisable (EventCard, Badge, Button)
├── database/                 # Couche Data (SQLite)
│   ├── init.ts               # DDL (Création tables) & Seeding
│   ├── events.ts             # Repository Événements
│   ├── registrations.ts      # Repository Inscriptions/Favoris
│   └── llmResults.ts         # Système de Cache RAG
├── hooks/                    # Logique Métier Custom
│   └── useAiAssistant.ts     # Orchestration du cache et du LLM
├── services/                 # Services Externes
│   └── llm.ts                # Appels REST Gemini (Prompt Engineering)
└── store/                    # État Global
    └── AuthContext.tsx       # Persistance Session & Sécurité
```

## ⚙️ Guide d'Installation (Developer Workflow)

### Prérequis
- Node.js (v18+)

- Application **Expo Go** installée sur votre terminal (iOS/Android).

- Clé API Google AI Studio (Gemini).

### Initialisation de l'environnement

1. **Cloner le dépôt :**
```bash
git clone [https://github.com/yassinekamouss/CampusEventsAI.git](https://github.com/yassinekamouss/CampusEventsAI.git)
cd CampusEventsAI
```

2. **Configuration Sécurisée :**
Créer un fichier `.env` à la racine (ne jamais commit ce fichier).
```bash
Créer un fichier .env à la racine (ne jamais commit ce fichier).
```

3. **Installation & Lancement :**
```bash
Installation & Lancement :
```

Note: Le flag `-c` vide le cache de Metro pour assurer l'injection correcte des variables d'environnement.

4. **Connexion :**

- **Admin** : admin@campus.ma / admin123

- **Étudiant** : etudiant@campus.ma / etudiant123

---

## 🗺️ Roadmap & Évolutions

- **[v1.1] Notifications Locales :** Intégration de expo-notifications pour déclencher une alerte hors-ligne 2 heures avant le début d'un événement inscrit.

- **[v1.2] Import/Export Admin :** Possibilité d'exporter le catalogue complet en format JSON pour archivage.

- **[v2.0] Hybrid-Cloud Sync :** Implémentation d'un mécanisme de synchronisation P2P ou via un bucket S3 léger pour partager le SQLite entre plusieurs appareils.

---

## 🤝 Contribution

Ce projet a été développé dans le cadre d'une architecture de démonstration académique poussée au niveau industriel.
Les Pull Requests sont les bienvenues pour optimiser les requêtes SQL ou affiner les prompts du LLM.

---

## 👨‍💻 Auteur

Yassine Kamouss
Élève Ingénieur en Logiciels et Systèmes Intelligents (LSI)
Faculté des Sciences et Techniques (FST) de Tanger

- Spécialiste Full-Stack (Cloud & DevOps)

- Intégrateur d'Architectures RAG & Intelligence Artificielle

"La meilleure dépendance est celle que l'on n'installe pas. Une architecture élégante repose sur la maîtrise des fondamentaux natifs."