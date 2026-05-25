# Emploi du temps multi-élèves - Version 3

## Vue d'ensemble

La version 3 est une copie exacte de la version 2 (modulaire-v2) créée le 19/03/2026. Cette version servira de base pour le développement de nouvelles fonctionnalités et améliorations tout en préservant la stabilité de la v2.

## Structure du projet

```
active/modulaire-v3/
├── index.html                    # Application principale
├── style.css                     # Styles principaux
├── README_CHANGEMENTS.md         # Journal des changements de la v2
├── README_V3.md                  # Ce fichier
├── fictif.json                   # Données d'exemple
├── js/                           # Modules JavaScript
│   ├── app.js                    # Initialisation
│   ├── ui.js                     # Rendu de l'interface
│   ├── store.js                  # Gestion d'état
│   ├── modals.js                 # Boîtes de dialogue modales
│   ├── selection.js              # Logique de sélection
│   ├── contextmenu.js            # Menus contextuels
│   ├── eleves.js                 # Gestion des élèves
│   ├── eleves-fiche.js           # Fiches élèves
│   ├── modal.js                  # Utilitaires modales
│   ├── print.js                  # Fonctionnalité d'impression
│   ├── stats.js                  # Statistiques
│   ├── constants.js              # Constantes
│   └── modal-manager.js          # Gestionnaire de modales
└── tests/                        # Tests
    ├── migration-test.js         # Tests de migration
    ├── test-migration.html       # Page de test de migration
    ├── clear-localstorage.html   # Nettoyage localStorage
    └── README.md                 # Documentation des tests
```

## Plan des fonctionnalités à implémenter

**Note importante** : Le développement de la v3 s'arrêtera au stade 4 (performance et optimisation). Les stades 5, 6 et 7 ne sont pas envisagés dans cette version.

### 1. Améliorations de l'interface utilisateur
- **Thème sombre/clair** : Ajout d'un sélecteur de thème
- **Responsive design amélioré** : Meilleure adaptation aux tablettes et mobiles
- **Animations fluides** : Transitions CSS pour les interactions
- **Indicateurs de chargement** : Feedback visuel pendant les opérations

### 2. Gestion des données
- **Export/Import avancé** : Formats JSON, CSV, Excel
- **Sauvegarde automatique** : Auto-save avec historique
- **Synchronisation multi-appareils** : Via IndexedDB ou service worker
- **Gestion des versions de données** : Historique des modifications

### 3. Fonctionnalités pédagogiques
- **Groupes dynamiques** : Création de groupes temporaires
- **Planification par compétences** : Association créneaux-compétences
- **Suivi des présences** : Marqueur d'absence/présence
- **Évaluations intégrées** : Notes et commentaires par créneau

### 4. Performance et optimisation
- **Virtualisation des tableaux** : Rendue partielle pour grands ensembles
- **Cache intelligent** : Mise en cache des données fréquentes
- **Lazy loading** : Chargement à la demande des modules
- **Service Worker** : Application offline-first

### ~~5. Collaboration~~ (Non prévu dans v3)
- ~~Partage de plannings~~ : Génération de liens partageables
- ~~Commentaires collaboratifs~~ : Annotations partagées
- ~~Mode multi-utilisateurs~~ : Édition simultanée (WebSockets)
- ~~Permissions granulaire~~ : Contrôle d'accès par élève/groupe

### ~~6. Accessibilité~~ (Non prévu dans v3)
- ~~Support ARIA complet~~ : Amélioration du lecteur d'écran
- ~~Navigation au clavier~~ : Touches de raccourci
- ~~Contraste amélioré~~ : Palette de couleurs accessibles
- ~~Texte agrandissable~~ : Zoom sans rupture de layout

### ~~7. Intégrations~~ (Non prévu dans v3)
- ~~API externe~~ : Connexion à des systèmes externes (ENT, etc.)
- ~~Calendrier externe~~ : Synchronisation Google Calendar/Outlook
- ~~Notifications~~ : Rappels par email/push
- ~~Rapports automatisés~~ : Génération PDF/Excel programmée

## Principes de développement

### Compatibilité ascendante
- Toutes les données de la v2 doivent être lisibles par la v3
- Les nouvelles fonctionnalités ne doivent pas casser les existantes
- Migration automatique des données si nécessaire

### Architecture modulaire
- Chaque nouvelle fonctionnalité dans son propre module
- Interface claire entre les modules
- Tests unitaires pour chaque module

### Documentation
- JSDoc pour toutes les fonctions
- Guide de développement mis à jour
- Exemples d'utilisation

## Roadmap préliminaire

**Scope réduit** : Le développement s'arrêtera à la Phase 4 (Performance et optimisation). Les phases de collaboration et intégrations externes ne sont pas prévues dans cette v3.

### Phase 1 (Q2 2026) - Fondations
- Refactoring du code pour meilleure modularité
- Ajout du système de thèmes
- Amélioration de l'accessibilité de base
- Tests unitaires de base

### Phase 2 (Q3 2026) - Données
- Système d'export/import avancé (JSON, CSV)
- Sauvegarde automatique avec historique
- Gestion des versions de données locales

### Phase 3 (Q4 2026) - Fonctionnalités pédagogiques
- Groupes dynamiques
- Planification par compétences
- Suivi des présences
- Évaluations intégrées

### Phase 4 (Q1 2027) - Performance et optimisation
- Virtualisation des tableaux pour grands ensembles
- Cache intelligent des données fréquentes
- Lazy loading des modules
- Service Worker pour application offline-first

### ~~Phase 5 (Q2 2027) - Collaboration~~ (Non prévu)
- ~~Partage de plannings~~
- ~~Commentaires collaboratifs~~
- ~~Mode multi-utilisateurs~~

### ~~Phase 6 (Q3 2027) - Intégrations externes~~ (Non prévu)
- ~~API externe~~
- ~~Synchronisation calendrier~~
- ~~Notifications externes~~

## Notes techniques

### Technologies à considérer
- **IndexedDB** pour stockage local avancé (Phase 2)
- **Service Workers** pour fonctionnalités offline (Phase 4)
- **Virtual DOM/rendering** pour performance des tableaux (Phase 4)
- **Web Components** pour réutilisabilité (Phase 1)

### Technologies non prévues dans v3
- **WebSockets** (collaboration en temps réel - hors scope)
- **API externes** (ENT, calendriers externes - hors scope)
- **Notifications push** (hors scope)
- **Authentification multi-utilisateurs** (hors scope)

### Limitations actuelles de la v2
- Pas de support offline complet
- Interface peu adaptée aux mobiles
- Pas de gestion des conflits d'édition
- Performances avec beaucoup d'élèves

### Objectifs de performance
- Temps de chargement < 2s
- Réactivité interface < 100ms
- Support jusqu'à 100 élèves simultanés
- Jusqu'à 1000 créneaux affichés sans lag

## Contribution

Les développements sur la v3 doivent suivre les conventions établies dans AGENTS.md et respecter les règles de qualité du projet.

## Backup et restauration

Un backup complet de la v2 a été créé dans :
`backup/modulaire-v2-backup-20260319_103350/`

Le commit Git initial de la v3 est :
`a7c3c93 - feat: création v3 à partir de v2`

---

*Document créé le 19/03/2026 - Version 3.0.0-alpha*