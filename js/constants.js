/**
 * js/constants.js
 * Constantes et énumérations pour l'application d'emploi du temps
 * Version 2.0 - Nouvelles structures de données
 */

// Types de regroupement pédagogique
const REGROUPEMENT_TYPES = {
  ULIS: 'ULIS',           // En ULIS
  INCLUSION: 'INCLUSION', // Dans classe de référence
  DECLOISONNEMENT: 'DECLOISONNEMENT', // Mélange de classes
  PEC: 'PEC',             // Prise en charge spécialisée
  AUTRE: 'AUTRE'          // Autre (hors ULIS)
};

// Spécialités PEC (Prise en charge)
const PEC_SPECIALITES = {
  ORTHOPHONISTE: 'orthophoniste',
  PSYCHOMOTRICIEN: 'psychomotricien',
  PSYCHOLOGUE: 'psychologue',
  EDUCATEUR: 'educateur',
  AUTRE: 'autre'
};

// Organismes PEC
const PEC_ORGANISMES = {
  CMPP: 'CMPP',
  CMP: 'CMP',
  SESSAD: 'SESSAD',
  PRIVE: 'prive',
  AUTRE: 'autre'
};

// Types AESH
const AESH_TYPES = {
  INDIVIDUEL: 'AESHi',    // AESH individuel
  MUTUALISE: 'AESHm',     // AESH mutualisé
  COLLECTIF: 'AESHco'     // AESH collectif
};

// Rôles adultes (étendu)
const ROLE_ADULTE = {
  ENSEIGNANT: 'enseignant',
  AESH_CO: 'aeshco',
  AESH_I: 'aeshi',
  AESH_M: 'aeshm',
  SPECIALISTE: 'specialiste',
  AUTRE: 'autre'
};

// Types de créneaux
const CRENEAU_TYPES = {
  FIXE: 'fixe',
  EXCEPTION: 'exception',
  PONCTUEL: 'ponctuel'
};

// Jours de la semaine
const JOURS = ['lundi', 'mardi', 'jeudi', 'vendredi']; // Mercredi optionnel

// Tous les jours complets (pour la configuration)
const JOURS_COMPLETS = ['lundi', 'mardi', 'mercredi', 'jeudi', 'vendredi', 'samedi'];

// Couleurs par défaut par type de regroupement
const COULEURS_PAR_TYPE = {
  [REGROUPEMENT_TYPES.ULIS]: '#fff3e0',
  [REGROUPEMENT_TYPES.INCLUSION]: '#e8f5e9',
  [REGROUPEMENT_TYPES.DECLOISONNEMENT]: '#e3f2fd',
  [REGROUPEMENT_TYPES.PEC]: '#fce4ec',
  [REGROUPEMENT_TYPES.AUTRE]: '#f5f5f5'
};

// Fréquences PEC
const PEC_FREQUENCES = {
  HEBDOMADAIRE: 'hebdomadaire',
  BIMENSUEL: 'bimensuel',
  MENSUEL: 'mensuel',
  PONCTUEL: 'ponctuel'
};

// Lieux PEC
const PEC_LIEUX = {
  ECOLE: 'école',
  CABINET: 'cabinet',
  DOMICILE: 'domicile',
  AUTRE: 'autre'
};

// Niveaux scolaires
const NIVEAUX_SCOLAIRES = [
  'TPS', 'PS', 'MS', 'GS',
  'CP', 'CE1', 'CE2', 'CM1', 'CM2',
  '6ème', '5ème', '4ème', '3ème'
];

// Notifications/plans de suivi
const NOTIFICATIONS_TYPES = {
  PPS: 'PPS',       // Projet Personnalisé de Scolarisation
  PAI: 'PAI',       // Projet d'Accueil Individualisé
  PAP: 'PAP',       // Plan d'Accompagnement Personnalisé
  PPRE: 'PPRE',     // Programme Personnalisé de Réussite Éducative
  ESS: 'ESS'        // Équipe de Suivi de Scolarisation
};

// Groupes par défaut
const GROUPES_DEFAUT = [
  'Groupe A',
  'Groupe B', 
  'Groupe C',
  'Groupe D',
  'Autre'
];

// Durée de créneau par défaut (en minutes)
const DUREE_CRENEAU_DEFAUT = 15;

// Heures de début/fin par défaut
const HEURE_DEBUT_DEFAUT = '08:30';
const HEURE_FIN_DEFAUT = '16:30';

// Version de la structure de données
const DATA_VERSION = '2.0';

// --- Fonctions utilitaires partagees ---

// Retourne la palette de 12 couleurs par defaut
function getPaletteCouleursParDefaut() {
  return [
    '#ffcccc', '#ffcc99', '#ffff99', '#ccffcc', '#ccffff', '#ccccff',
    '#ffccff', '#e6ccff', '#d9d9d9', '#ff9999', '#ffb366', '#ffff66'
  ];
}

// Convertit des minutes en format lisible "XhYY"
function formatMinutesToHours(minutes) {
  if (!minutes || minutes === 0) return '0h';
  var h = Math.floor(minutes / 60);
  var m = minutes % 60;
  if (h === 0) return m + 'min';
  if (m === 0) return h + 'h';
  return h + 'h' + (m < 10 ? '0' : '') + m;
}

// Calcule le pourcentage par rapport a 24h (1440 minutes)
function calculatePercentage(minutes) {
  if (!minutes || minutes === 0) return '0%';
  return Math.round((minutes / 1440) * 100) + '%';
}

// Export des constantes (si utilisation en modules)
if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    REGROUPEMENT_TYPES,
    PEC_SPECIALITES,
    PEC_ORGANISMES,
    AESH_TYPES,
    ROLE_ADULTE,
    CRENEAU_TYPES,
    JOURS,
    JOURS_COMPLETS,
    COULEURS_PAR_TYPE,
    PEC_FREQUENCES,
    PEC_LIEUX,
    NIVEAUX_SCOLAIRES,
    NOTIFICATIONS_TYPES,
    GROUPES_DEFAUT,
    DUREE_CRENEAU_DEFAUT,
    HEURE_DEBUT_DEFAUT,
    HEURE_FIN_DEFAUT,
    DATA_VERSION
  };
}