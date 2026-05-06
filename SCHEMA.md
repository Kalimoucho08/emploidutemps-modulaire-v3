# Schema JSON — Emploi du temps modulaire v3

Ce document décrit la structure des données pour qu'un agent (type OpenClaw) puisse :
- **Lire** un export pour comprendre l'emploi du temps
- **Generer** un fichier JSON valide pour importer des donnees

## Structure globale

```json
{
  "_metadata": { ... },
  "dataVersion": "2.0",
  "eleves": [ ... ],
  "creneaux": [ ... ],
  "parametres": { ... },
  "nextEleveIdNum": 14,
  "nextCreneauIdNum": 245
}
```

## _metadata (ajoute a l'export, ignore a l'import)

| Champ | Type | Description |
|-------|------|-------------|
| source | string | Toujours `"emploidutemps-modulaire-v3"` |
| exportDate | string ISO | Date d'export |
| dataVersion | string | Version de la structure |
| totalEleves | number | Nombre d'eleves |
| totalCreneaux | number | Nombre de creneaux |

## eleves[]

Chaque eleve :

| Champ | Type | Obligatoire | Description |
|-------|------|-------------|-------------|
| id | string | Oui | Identifiant unique, ex: `"e1"` |
| nom | string | Oui | Nom et prenom |
| actif | boolean | Oui | Affiche dans l'emploi du temps |
| order | number | Oui | Ordre d'affichage (0 = premier) |
| classe | string | Non | Classe de reference, ex: `"CM1"` |
| ulis | boolean | Non | Est un eleve ULIS |
| groupe | string | Non | Groupe constitue, ex: `"Groupe A"` |

### Champs optionnels (fiche eleve complete)

| Champ | Type | Description |
|-------|------|-------------|
| dateNaissance | string | Format `"JJ/MM/AAAA"` |
| niveauScolaire | string | Niveau, ex: `"CE2"`, `"6eme"` |
| ecoleOrigine | string | Ecole d'origine |
| dateEntreeUlis | string | Date d'entree en ULIS |
| suiviPar | string | Suivi par (enseignant referent...) |
| notifications | array | Types de plans : `["PPS","PAI","PAP","PPRE","ESS"]` |
| aeshType | string | `"AESHi"`, `"AESHm"`, `"AESHco"` |
| aeshNom | string | Nom de l'AESH |
| aeshHeures | string | Volume horaire AESH |
| pecSpecialite | string | Specialite PEC : `"orthophoniste"`, `"psychomotricien"`, `"psychologue"`, `"educateur"` |
| pecOrganisme | string | Organisme : `"CMPP"`, `"CMP"`, `"SESSAD"`, `"prive"` |
| pecFrequence | string | Frequence : `"hebdomadaire"`, `"bimensuel"`, `"mensuel"` |
| pecLieu | string | Lieu : `"ecole"`, `"cabinet"`, `"domicile"` |
| pecDuree | string | Duree de la PEC |
| pecCommentaires | string | Commentaires PEC |
| transport | string | Transport : `"taxi"`, `"bus"`, `"parent"`, etc. |
| restauration | string | Regime de cantine |
| allergies | string | Allergies connues |
| remarques | string | Remarques generales |
| photo | string | Photo (base64 ou URL) |
| tags | array | Mots-cles libres |

## creneaux[]

Chaque creneau :

| Champ | Type | Obligatoire | Description |
|-------|------|-------------|-------------|
| id | string | Oui | Identifiant unique, ex: `"c1"` |
| jour | string | Oui | Jour : `"lundi"`, `"mardi"`, `"mercredi"`, `"jeudi"`, `"vendredi"` |
| heure | string | Oui | Heure format `"HH:MM"`, ex: `"08:30"` |
| eleveId | string | Oui | Reference a `eleves[].id` |
| matiere | string | Non | Matiere ou activite |
| groupe | string | Non | Groupe de travail |
| adulte | string | Non | Nom de l'intervenant |
| roleAdulte | string | Non | Role : `"enseignant"`, `"aeshco"`, `"aeshi"`, `"aeshm"`, `"specialiste"`, `"autre"` |
| type | string | Non | Type : `"fixe"`, `"exception"`, `"ponctuel"` |
| regroupementType | string | Non | Regroupement : `"ULIS"`, `"INCLUSION"`, `"DECLOISONNEMENT"`, `"PEC"`, `"AUTRE"` |
| aeshType | string | Non | Type AESH : `"AESHi"`, `"AESHm"`, `"AESHco"` |
| couleurIndex | number | Non | Index dans la palette (0-11) |
| color | string | Non | Couleur de fond hex, ex: `"#ffcccc"` |
| textColor | string | Non | Couleur de texte hex, ex: `"#000000"` |
| commentaire | string | Non | Commentaire libre |

### Champs silencieux (reserves pour usage futur)

`salle`, `effectif`, `ressources`, `evaluation`, `competences`

## parametres

| Champ | Type | Description |
|-------|------|-------------|
| joursAffiches | array | Jours affiches, ex: `["lundi","mardi","jeudi","vendredi"]` |
| heureDebut | string | Heure de debut, ex: `"08:30"` |
| heureFin | string | Heure de fin, ex: `"16:30"` |
| dureeCreneau | number | Duree en minutes, ex: `15` |
| paletteCouleurs | array | 12 couleurs hex, ex: `["#ffcccc","#ffcc99",...]` |
| zonesEnseignement | object | `{academie, departement, ville}` |
| champsAffiches | object | Visibilite des champs (voir ci-dessous) |
| pauses | array | Pauses configurees (creneaux sans cours) |
| stats | object | Config des statistiques |

### champsAffiches

Objet avec des booleens pour chaque champ affichable :

```
elevesBase: { classe, ulis, groupe, aesh, dateNaissance, ecoleOrigine }
elevesFiche: { dateEntreeUlis, suiviPar, notifications, aeshType, aeshNom, aeshHeures, pecSpecialite, pecOrganisme, pecFrequence, pecLieu, pecDuree, pecCommentaires, transport, restauration, allergies, remarques }
creneaux: { adulte, roleAdulte, type, regroupementType, aeshType, couleurFond, couleurTexte, commentaire, salle, effectif, ressources, evaluation, competences }
```

## Exemple minimal (import valide)

```json
{
  "dataVersion": "2.0",
  "eleves": [
    { "id": "e1", "nom": "Alice", "actif": true, "order": 0, "classe": "CM1", "ulis": true, "groupe": "Groupe A" },
    { "id": "e2", "nom": "Bob", "actif": true, "order": 1, "classe": "CM2", "ulis": false, "groupe": "Groupe B" }
  ],
  "creneaux": [
    { "id": "c1", "jour": "lundi", "heure": "08:30", "eleveId": "e1", "matiere": "Francais", "type": "fixe" }
  ],
  "parametres": {
    "joursAffiches": ["lundi","mardi","jeudi","vendredi"],
    "heureDebut": "08:30",
    "heureFin": "16:30",
    "dureeCreneau": 15,
    "paletteCouleurs": ["#ffcccc","#ffcc99","#ffff99","#ccffcc","#ccffff","#ccccff","#ffccff","#e6ccff","#d9d9d9","#ff9999","#ffb366","#ffff66"]
  },
  "nextEleveIdNum": 3,
  "nextCreneauIdNum": 2
}
```

## Utilisation avec OpenClaw

**Generer un fichier** : produire un JSON conforme au schema ci-dessus, puis l'importer via le bouton "📂 Charger".

**Analyser un fichier** : lire le JSON exporte. Les champs cles pour l'analyse sont :
- `eleves[].ulis`, `eleves[].classe` pour identifier les eleves ULIS
- `creneaux[].regroupementType` pour distinguer ULIS / INCLUSION / PEC
- `creneaux[].adulte`, `creneaux[].roleAdulte` pour identifier les intervenants
- `parametres.paletteCouleurs` pour decoder les `couleurIndex`
