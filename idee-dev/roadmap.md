# Roadmap — Emploi du Temps Modulaire v3

> Synthèse des retours, bugs et propositions d'évolution consolidés en juin 2026.

---

## 1. Visibilité des intervenants

- Couleurs spécifiques par rôle : Enseignant, AESHco, Autre
- L'information "adulte intervenant" doit être plus visible dans la case
- **Pistes ergonomiques** :
  - Filtre de vue pour isoler l'emploi du temps d'un adulte spécifique
  - Détection de conflits : alerte visuelle si un même adulte est assigné à deux élèves différents sur le même créneau
  - Badges distinctifs (pastilles de couleur ou bordures renforcées)

## 2. Personnalisation visuelle

- Palette de couleurs de fond plus étendue et contrastée (noir, plusieurs gris, etc.)
- **Pistes ergonomiques** :
  - Thème sombre/clair global
  - Contraste dynamique du texte : police automatiquement blanc ou noir selon la clarté du fond

## 3. Édition rapide & en masse

- Appliquer une case (matière/adulte/couleur) à plusieurs jours via des cases à cocher
- **Pistes ergonomiques** :
  - Drag & Drop : déplacer un créneau, copier avec Alt
  - Redimensionnement à la souris : étirer le bas d'une case pour changer sa durée

## 4. Gestion du temps & grille

- Taille des créneaux paramétrable (10, 15, 20 min…)
- Horaires de début et fin paramétrables par jour (ou sélection de jours)
- Créneaux récréation et pause méridienne (cantine), transférables à une sélection de jours
- **Pistes ergonomiques** :
  - Échelle de temps dynamique : la grille s'adapte si un jour commence plus tard
  - Ligne de temps actuelle : ligne rouge indiquant l'heure en temps réel

## 5. Module élèves — Refonte

### Champs à ajouter
- Nom, prénom
- Date de naissance
- Taxi (oui/non) + compagnie si oui
- Cantine (oui/non)
- Numéro de téléphone urgence
- Nombre d'années en ULIS
- Date d'entrée dans cette ULIS
- Date limite des droits MDPH : ULIS, SESSAD, AESH/i-m, transport, autre

### Interface édition élèves — Refonte complète

1. **Ouverture du module** → liste des élèves actuels avec :
   - Boutons : Supprimer, Modifier, Actif/Inactif
   - Bouton "Nouvel élève"
   - Bouton fermer (croix)
2. **Supprimer** → message d'alerte de confirmation
3. **Modifier** → ouvre le module avec champs pré-remplis
4. **Nouvel élève** → ouvre le module avec champs vides
5. **Double-clic sur l'en-tête de colonne élève** → ouvre directement la fiche en mode édition

### Bugs à corriger
- L'édition d'un élève ne pré-remplit pas les champs du formulaire
- Le module statistique ne s'ouvre pas directement (apparaît au-dessus de l'éditeur élève)
- `Clear local storage` + F5 ne règle pas le problème de stats
- Dans les horaires, "pause" de l'après-midi doit être renommée "récréation"

## 6. Impression

- **PDF vectoriel** : ne pas faire une copie d'écran, reconstruire un PDF complet
- Une journée entière doit tenir sur un A4 (portrait ou paysage)
- Les parties statistiques ne doivent pas être tronquées sur plusieurs pages
- **Ajout** : imprimer les fiches élèves (une ou une sélection)
- **Pistes ergonomiques** :
  - Aperçu avant impression (modale)
  - Options : un élève, une classe, tableau complet

## 7. Sauvegarde & portabilité

- Import / export de la base de données (JSON)
- **Pistes ergonomiques** :
  - Auto-save avec indicateur visuel ("Sauvegardé")
  - Historique Undo/Redo (Ctrl+Z)

## 8. Architecture & modularisation

- Découper l'index et les JS : modulariser davantage
- Recherche de bibliothèques open source (MIT) pour simplifier le code et la maintenance

### Bibliothèques recommandées (MIT)

| Bibliothèque | Usage | Intérêt |
|---|---|---|
| **FullCalendar v6** | Moteur de grille/calendrier | Vues par ressource (élèves), drag & drop natif, redimensionnement, créneaux variables |
| **Interact.js** | Alternative légère | Glisser-déposer + redimensionnement sans imposer un calendrier complet |
| **pdfmake** | PDF vectoriel | Construction PDF depuis JSON, texte sélectionnable, pagination A4 propre |
| **jsPDF + AutoTable** | PDF tableaux | Optimisé pour les tableaux complexes, sauts de page, styles |
| **Day.js** | Gestion des dates/heures | 2 kB, calculs de créneaux (8h30 + 20 min = 8h50) |
| **Alpine.js** | Réactivité / état | Binding données ↔ HTML sans bundler, intégrable dans un fichier .html |

### Plan de transformation proposé

1. **Phase 1 — Socle de données & réactivité** : Alpine.js + Day.js, restructuration du state (séparer paramètres globaux des événements)
2. **Phase 2 — Interface & ergonomie** : Palette étendue, contraste auto, badges intervenants, Interact.js
3. **Phase 3 — Édition avancée** : Modales, application multi-jours, créneaux globaux (eleveId: null)
4. **Phase 4 — Portabilité** : Import/Export JSON, FileReader, validation schéma
5. **Phase 5 — Moteur PDF** : pdfmake ou jsPDF-AutoTable, rendu vectoriel A4

### Format de données proposé

```javascript
{
  id: "evt_123",
  eleveId: "e1",             // null si créneau global (récréation/pause)
  jour: "lundi",
  heureDebut: "08:30",
  duree: 20,                 // minutes
  matiere: "Français",
  intervenant: { nom: "Mme X", role: "enseignant" },
  couleur: "#2c3e50"
}
```
