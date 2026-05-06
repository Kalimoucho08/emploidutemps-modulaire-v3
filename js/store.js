/**
 * js/store.js
 * Gère la mémoire, l'historique (UNDO/REDO) et le stockage des données
 * Version 2.0 - Nouvelles structures de données avec migration
 */

const STORAGE_KEY = 'edt_multieleves_data';
// JOURS est defini dans constants.js (charge avant store.js)
let HEURES = []; 
let isViewMode = false;

// NOUVEAU : Mémoire "photographique" du presse-papier
let clipboardData = null; 

let historyStack = [];
let historyIndex = -1;
const MAX_HISTORY = 50; // Nombre de retours en arrière possibles

// Version de l'application (versioning sémantique: MAJEUR.MINEUR.PATCH)
// MAJEUR: Changements incompatibles avec les versions précédentes
// MINEUR: Nouvelles fonctionnalités compatibles avec les versions précédentes
// PATCH: Corrections de bugs compatibles avec les versions précédentes
const APP_VERSION = '2.0.0';

// DATA_VERSION est defini dans constants.js (charge avant store.js)

// Registre des migrations disponibles
// Chaque migration est identifiée par sa version de données cible
const MIGRATIONS = {
  '2.0': migrateState
};

function deepClone(obj) {
  return JSON.parse(JSON.stringify(obj));
}

function addMinutes(timeStr, mins) {
  let [h, m] = timeStr.split(':').map(Number);
  m += Number(mins);
  h += Math.floor(m / 60);
  m = m % 60;
  return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`;
}

function generateHeures() {
  const p = state.parametres;
  let hList = [];
  let current = p.heureDebut;
  while (current < p.heureFin) {
    hList.push(current);
    current = addMinutes(current, p.dureeCreneau);
  }
  return hList;
}

function formatHeure(hhmm) { 
  const [h, m] = hhmm.split(':'); 
  return `${parseInt(h, 10)}h${m === '00' ? '' : m}`; 
}

function findLesson(jour, heure, eleveId) { 
  return state.creneaux.find(c => c.jour === jour && c.heure === heure && c.eleveId === eleveId) || null; 
}

/**
 * Crée un nouveau créneau avec tous les champs nécessaires
 */
function createNewCreneau(jour, heure, eleveId, options = {}) {
  const id = 'c' + state.nextCreneauIdNum++;
  const eleve = state.eleves.find(e => e.id === eleveId);
  
  const defaultOptions = {
    matiere: '',
    groupe: '',
    adulte: '',
    type: 'fixe',
    commentaire: '',
    color: '',
    textColor: '',
    // Nouveaux champs v2.0
    regroupementType: eleve?.ulis ? 'ULIS' : 'AUTRE',
    roleAdulte: 'enseignant',
    duree: state.parametres.dureeCreneau || 15,
    // Champs PEC
    pecSpecialite: '',
    pecOrganisme: '',
    pecFrequence: '',
    pecLieu: '',
    // Métadonnées
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    // Champs silencieux pour futures fonctionnalités
    salle: '',
    effectif: '',
    ressources: [],
    evaluation: '',
    lienDocument: '',
    pieceJointe: '',
    priorite: '',
    statut: '',
    rappel: '',
    tags: [],
    recurrence: '',
    dateFin: '',
    objectifs: '',
    competences: []
  };
  
  return {
    id,
    jour,
    heure,
    eleveId,
    ...defaultOptions,
    ...options
  };
}

function isSameLesson(l1, l2) {
  if (!l1 && !l2) return true; 
  if (!l1 || !l2) return false;
  return l1.matiere === l2.matiere &&
         l1.groupe === l2.groupe &&
         l1.adulte === l2.adulte &&
         l1.color === l2.color &&
         l1.textColor === l2.textColor &&
         l1.commentaire === l2.commentaire;
}

// NOUVEAU : Fonction radar pour détecter les récréations et la cantine
function isPauseTime(heure) {
  if (!state.parametres || !state.parametres.pauses) return false;
  return state.parametres.pauses.some(p => p.actif && heure >= p.debut && heure < p.fin);
}

/**
 * Migration des données existantes vers la nouvelle structure v2.0
 * Ajoute les champs manquants et convertit les anciennes valeurs
 *
 * Cette fonction est appelée automatiquement lors du chargement des données
 * si la version des données est inférieure à '2.0'. Elle garantit
 * la compatibilité ascendante avec les anciennes versions de l'application.
 *
 * @param {Object} oldState - L'état à migrer (peut être de version 1.0 ou antérieure)
 * @returns {Object} - L'état migré vers la version 2.0
 */
function migrateState(oldState) {
  // Version de la structure de données (pour migrations futures)
  // Cette propriété permet de suivre l'évolution du schéma de données
  if (!oldState.dataVersion) {
    oldState.dataVersion = '1.0';
  }
  
  // Migration des élèves
  // Ajout des nouveaux champs pour la gestion des AESH-M/I et PEC
  if (oldState.eleves && oldState.eleves.length > 0) {
    oldState.eleves.forEach(eleve => {
      // ======== SÉPARATION NOM/PRÉNOM ========
      if (eleve.nom && !eleve.prenom) {
        const parts = eleve.nom.trim().split(' ');
        if (parts.length > 1) {
          eleve.prenom = parts[0];
          eleve.nom = parts.slice(1).join(' ');
        } else {
          eleve.prenom = eleve.nom;
          eleve.nom = '';
        }
      }
      if (eleve.prenom === undefined) eleve.prenom = '';
      
      // Champs AESH-M/I (Accompagnant des Élèves en Situation de Handicap)
      // Ces champs permettent de gérer les accompagnants mutualisés entre plusieurs élèves
      if (eleve.aeshType === undefined) eleve.aeshType = '';
      if (eleve.aeshNom === undefined) eleve.aeshNom = '';
      if (eleve.aeshHeures === undefined) eleve.aeshHeures = 0;
      if (eleve.aeshMutualiseAvec === undefined) eleve.aeshMutualiseAvec = [];
      
      // Champs PEC (Prise En Charge spécialisée)
      // Ces champs permettent de gérer les interventions des spécialistes (orthophoniste, psychomotricien, etc.)
      if (eleve.pecSpecialite === undefined) eleve.pecSpecialite = '';
      if (eleve.pecOrganisme === undefined) eleve.pecOrganisme = '';
      if (eleve.pecFrequence === undefined) eleve.pecFrequence = '';
      if (eleve.pecLieu === undefined) eleve.pecLieu = '';
      if (eleve.pecHeures === undefined) eleve.pecHeures = 0;
      
      // Niveau scolaire de l'élève (TPS, PS, MS, GS, CP, CE1, CE2, CM1, CM2)
      if (eleve.niveau === undefined) eleve.niveau = '';
      
      // Notifications/plans de suivi (PPS, PAI, PAP, PPRE, ESS)
      // Ces champs permettent de gérer les dispositifs d'aide et de suivi
      if (eleve.notifications === undefined) eleve.notifications = [];
      
      // Champs silencieux pour futures fonctionnalités
      if (eleve.photo === undefined) eleve.photo = '';
      if (eleve.dateNaissance === undefined) eleve.dateNaissance = '';
      if (eleve.allergies === undefined) eleve.allergies = '';
      if (eleve.regimeAlimentaire === undefined) eleve.regimeAlimentaire = '';
      if (eleve.informationsMedicales === undefined) eleve.informationsMedicales = '';
      if (eleve.transport === undefined) eleve.transport = '';
      if (eleve.adresse === undefined) eleve.adresse = '';
      if (eleve.telephone === undefined) eleve.telephone = '';
      if (eleve.emailParents === undefined) eleve.emailParents = '';
      if (eleve.remarques === undefined) eleve.remarques = '';
      if (eleve.dateEntree === undefined) eleve.dateEntree = '';
      if (eleve.dateSortie === undefined) eleve.dateSortie = '';
      if (eleve.enseignantReference === undefined) eleve.enseignantReference = '';
      if (eleve.dispositifSuivi === undefined) eleve.dispositifSuivi = '';
      if (eleve.piecesJointes === undefined) eleve.piecesJointes = [];
      if (eleve.tags === undefined) eleve.tags = [];
      if (eleve.actifDepuis === undefined) eleve.actifDepuis = '';
      if (eleve.inactifDepuis === undefined) eleve.inactifDepuis = '';
      if (eleve.derniereModification === undefined) eleve.derniereModification = '';
      if (eleve.modifiePar === undefined) eleve.modifiePar = '';
      
      // ======== NOUVEAUX CHAMPS FICHE ÉLÈVE ========
      // Transport
      if (eleve.taxi === undefined) eleve.taxi = false;
      if (eleve.taxiCompagnie === undefined) eleve.taxiCompagnie = '';
      
      // Restauration
      if (eleve.cantine === undefined) eleve.cantine = false;
      
      // Téléphone d'urgence
      if (eleve.telephoneUrgence === undefined) eleve.telephoneUrgence = '';
      
      // Parcours ULIS
      if (eleve.anneesUlis === undefined) eleve.anneesUlis = 0;
      if (eleve.dateEntreeUlis === undefined) eleve.dateEntreeUlis = '';
      
      // Droits MDPH (structure complète)
      if (!eleve.droitsMdhph) {
        eleve.droitsMdhph = {
          ulis: { date: '', type: '' },
          sessad: { date: '', type: '' },
          aesh: { date: '', type: '' },
          transport: { date: '', type: '' },
          autre: { date: '', type: '', description: '' }
        };
      } else {
        // Migration si structure partielle existante
        if (!eleve.droitsMdhph.ulis) eleve.droitsMdhph.ulis = { date: '', type: '' };
        if (!eleve.droitsMdhph.sessad) eleve.droitsMdhph.sessad = { date: '', type: '' };
        if (!eleve.droitsMdhph.aesh) eleve.droitsMdhph.aesh = { date: '', type: '' };
        if (!eleve.droitsMdhph.transport) eleve.droitsMdhph.transport = { date: '', type: '' };
        if (!eleve.droitsMdhph.autre) eleve.droitsMdhph.autre = { date: '', type: '', description: '' };
      }
    });
  }
  
  // Migration des créneaux
  // Ajout des nouveaux champs pour les types de regroupement et les métadonnées
  if (oldState.creneaux && oldState.creneaux.length > 0) {
    oldState.creneaux.forEach(creneau => {
      // Type de regroupement pédagogique
      // Définit le contexte pédagogique du créneau : ULIS, INCLUSION, DECLOISONNEMENT, PEC ou AUTRE
      if (creneau.regroupementType === undefined) {
        // Déduire le type basé sur les champs existants
        // Cette logique permet de convertir les anciennes données sans perte d'information
        if (creneau.sessionType === 'ULIS') {
          creneau.regroupementType = 'ULIS';
        } else if (creneau.sessionType === 'INCLUSION') {
          creneau.regroupementType = 'INCLUSION';
        } else if (creneau.sessionType === 'DECLOISONNEMENT') {
          creneau.regroupementType = 'DECLOISONNEMENT';
        } else if (creneau.pecSpe) {
          creneau.regroupementType = 'PEC';
        } else {
          creneau.regroupementType = 'AUTRE';
        }
      }
      
      // Rôle adulte (enseignant, AESHco, AESHi, AESHm, spécialiste, autre)
      // Permet de distinguer les différents types d'intervenants sur le créneau
      if (creneau.roleAdulte === undefined) {
        // Déduire le rôle basé sur le champ adulte
        // Analyse le contenu du champ "adulte" pour déterminer le rôle approprié
        if (creneau.adulte && creneau.adulte.toLowerCase().includes('aesh')) {
          creneau.roleAdulte = 'aeshco';
        } else if (creneau.pecSpe) {
          creneau.roleAdulte = 'specialiste';
        } else {
          creneau.roleAdulte = 'enseignant';
        }
      }
      
      // Champs PEC (si créneau PEC)
      // Migration des anciens champs pecSpe et pecOrg vers pecSpecialite et pecOrganisme
      if (creneau.regroupementType === 'PEC') {
        if (creneau.pecSpecialite === undefined) creneau.pecSpecialite = creneau.pecSpe || '';
        if (creneau.pecOrganisme === undefined) creneau.pecOrganisme = creneau.pecOrg || '';
        if (creneau.pecFrequence === undefined) creneau.pecFrequence = '';
        if (creneau.pecLieu === undefined) creneau.pecLieu = '';
      }
      
      // Durée (en minutes)
      // La durée est maintenant stockée explicitement au lieu d'être déduite des paramètres
      if (creneau.duree === undefined) creneau.duree = oldState.parametres?.dureeCreneau || 15;
      
      // Couleur par défaut basée sur le type de regroupement
      // Attribution automatique de couleurs cohérentes selon le type pédagogique
      if (!creneau.color && creneau.regroupementType) {
        const couleursParType = {
          'ULIS': '#fff3e0',        // Orange clair pour ULIS
          'INCLUSION': '#e8f5e9',     // Vert clair pour inclusion
          'DECLOISONNEMENT': '#e3f2fd', // Bleu clair pour décloisonnement
          'PEC': '#fce4ec',           // Rose clair pour PEC
          'AUTRE': '#f5f5f5'      // Gris clair pour autre
        };
        creneau.color = couleursParType[creneau.regroupementType] || '#f5f5f5';
      }
      
      // Ajouter un index de couleur basé sur le type de regroupement
      // Pour la nouvelle palette de couleurs (tableau de 15 couleurs)
      if (creneau.couleurIndex === undefined) {
        // Déterminer l'index basé sur le type de regroupement
        const indexParType = {
          'ULIS': 0,
          'INCLUSION': 1,
          'DECLOISONNEMENT': 2,
          'PEC': 3,
          'AUTRE': 4
        };
        creneau.couleurIndex = indexParType[creneau.regroupementType] || 4;
      }
      
      // Champs silencieux pour futures fonctionnalités
      if (creneau.salle === undefined) creneau.salle = '';
      if (creneau.effectif === undefined) creneau.effectif = '';
      if (creneau.ressources === undefined) creneau.ressources = [];
      if (creneau.evaluation === undefined) creneau.evaluation = '';
      if (creneau.lienDocument === undefined) creneau.lienDocument = '';
      if (creneau.pieceJointe === undefined) creneau.pieceJointe = '';
      if (creneau.priorite === undefined) creneau.priorite = '';
      if (creneau.statut === undefined) creneau.statut = '';
      if (creneau.rappel === undefined) creneau.rappel = '';
      if (creneau.tags === undefined) creneau.tags = [];
      if (creneau.recurrence === undefined) creneau.recurrence = '';
      if (creneau.dateFin === undefined) creneau.dateFin = '';
      if (creneau.objectifs === undefined) creneau.objectifs = '';
      if (creneau.competences === undefined) creneau.competences = [];
    });
  }
  
  // Migration des paramètres
  // Ajout des nouvelles configurations pour AESH, PEC et statistiques
  if (oldState.parametres) {
    // Ajouter les paramètres AESH
    // Liste des types d'AESH disponibles dans l'interface
    if (oldState.parametres.aeshTypes === undefined) {
      oldState.parametres.aeshTypes = ['AESHi', 'AESHm', 'AESHco'];
    }
    
    // Ajouter les paramètres PEC
    // Liste des spécialités et organismes PEC disponibles dans l'interface
    if (oldState.parametres.pecSpecialites === undefined) {
      oldState.parametres.pecSpecialites = ['orthophoniste', 'psychomotricien', 'psychologue', 'educateur', 'autre'];
    }
    
    // Ajouter les paramètres de statistiques
    // Configuration pour le calcul des statistiques (heures de référence, inclusions/exclusions)
    if (oldState.parametres.statsConfig === undefined) {
      oldState.parametres.statsConfig = {
        heuresSemaine: 24, // 24h semaine scolaire (référence pour les pourcentages)
        inclurePauses: false, // Ne pas inclure les pauses dans les statistiques
        inclurePEC: true,    // Inclure les créneaux PEC dans les statistiques
        inclureAESH: true    // Inclure les créneaux avec AESH dans les statistiques
      };
    }
    
    // Migration de la palette de couleurs vers la nouvelle structure simplifiée
    // Conversion de l'ancienne structure vers un tableau de 12 couleurs (réduction de 15 à 12)
    console.log('Migration couleurs:', { paletteCouleurs: oldState.parametres.paletteCouleurs, couleursRegroupement: oldState.parametres.couleursRegroupement });
    if (oldState.parametres.couleurs && oldState.parametres.couleurs.paletteCouleurs) {
      // Si l'ancienne structure existe, extraire les couleurs pour créer un tableau
      console.log('Migration de l\'ancienne structure couleurs vers la nouvelle palette de 12 couleurs...');
      const anciennePalette = oldState.parametres.couleurs.paletteCouleurs;
      // Créer un tableau de 12 couleurs en préservant les anciennes valeurs
      const couleursParDefaut = [
        '#ffcccc', '#ffcc99', '#ffff99', '#ccffcc', '#ccffff', '#ccccff',
        '#ffccff', '#e6ccff', '#d9d9d9', '#ff9999', '#ffb366', '#ffff66'
      ];
      
      // Mapper les anciennes couleurs aux positions correspondantes
      const nouvellePalette = [...couleursParDefaut];
      if (anciennePalette.ulis) nouvellePalette[0] = anciennePalette.ulis;
      if (anciennePalette.inclusion) nouvellePalette[1] = anciennePalette.inclusion;
      if (anciennePalette.decloisonnement) nouvellePalette[2] = anciennePalette.decloisonnement;
      if (anciennePalette.pec) nouvellePalette[3] = anciennePalette.pec;
      if (anciennePalette.regulier) nouvellePalette[4] = anciennePalette.regulier;
      if (anciennePalette.enseignant) nouvellePalette[5] = anciennePalette.enseignant;
      if (anciennePalette.aeshco) nouvellePalette[6] = anciennePalette.aeshco;
      if (anciennePalette.autre) nouvellePalette[7] = anciennePalette.autre;
      
      oldState.parametres.paletteCouleurs = nouvellePalette;
      // Supprimer l'ancienne structure couleurs pour simplifier
      delete oldState.parametres.couleurs;
    } else if (oldState.parametres.paletteCouleurs && Array.isArray(oldState.parametres.paletteCouleurs)) {
      // Si paletteCouleurs est déjà un tableau, réduire de 15 à 12 couleurs si nécessaire
      console.log('Palette de couleurs déjà au format tableau, vérification de la taille...');
      if (oldState.parametres.paletteCouleurs.length > 12) {
        console.log('Réduction de la palette de 15 à 12 couleurs...');
        oldState.parametres.paletteCouleurs = oldState.parametres.paletteCouleurs.slice(0, 12);
      } else if (oldState.parametres.paletteCouleurs.length < 12) {
        console.log('Extension de la palette à 12 couleurs...');
        const couleursParDefaut = [
          '#ffcccc', '#ffcc99', '#ffff99', '#ccffcc', '#ccffff', '#ccccff',
          '#ffccff', '#e6ccff', '#d9d9d9', '#ff9999', '#ffb366', '#ffff66'
        ];
        // Combiner les couleurs existantes avec les couleurs par défaut
        const nouvellePalette = [...oldState.parametres.paletteCouleurs];
        for (let i = nouvellePalette.length; i < 12; i++) {
          nouvellePalette.push(couleursParDefaut[i]);
        }
        oldState.parametres.paletteCouleurs = nouvellePalette;
      }
    } else if (oldState.parametres.paletteCouleurs && typeof oldState.parametres.paletteCouleurs === 'object') {
      // Si paletteCouleurs est un objet (ancien format), convertir en tableau de 12 couleurs
      console.log('Conversion de l\'objet paletteCouleurs vers un tableau de 12 couleurs...');
      const anciennePalette = oldState.parametres.paletteCouleurs;
      const couleursParDefaut = [
        '#ffcccc', '#ffcc99', '#ffff99', '#ccffcc', '#ccffff', '#ccccff',
        '#ffccff', '#e6ccff', '#d9d9d9', '#ff9999', '#ffb366', '#ffff66'
      ];
      
      const nouvellePalette = [...couleursParDefaut];
      if (anciennePalette.ulis) nouvellePalette[0] = anciennePalette.ulis;
      if (anciennePalette.inclusion) nouvellePalette[1] = anciennePalette.inclusion;
      if (anciennePalette.decloisonnement) nouvellePalette[2] = anciennePalette.decloisonnement;
      if (anciennePalette.pec) nouvellePalette[3] = anciennePalette.pec;
      if (anciennePalette.regulier) nouvellePalette[4] = anciennePalette.regulier;
      if (anciennePalette.enseignant) nouvellePalette[5] = anciennePalette.enseignant;
      if (anciennePalette.aeshco) nouvellePalette[6] = anciennePalette.aeshco;
      if (anciennePalette.autre) nouvellePalette[7] = anciennePalette.autre;
      
      oldState.parametres.paletteCouleurs = nouvellePalette;
    } else if (!oldState.parametres.paletteCouleurs) {
      // Si aucune palette n'existe, créer un tableau de 12 couleurs par défaut
      oldState.parametres.paletteCouleurs = [
        '#ffcccc', // 0: Couleur 1 (rouge clair)
        '#ffcc99', // 1: Couleur 2 (orange clair)
        '#ffff99', // 2: Couleur 3 (jaune clair)
        '#ccffcc', // 3: Couleur 4 (vert clair)
        '#ccffff', // 4: Couleur 5 (bleu clair)
        '#ccccff', // 5: Couleur 6 (bleu violet)
        '#ffccff', // 6: Couleur 7 (rose clair)
        '#e6ccff', // 7: Couleur 8 (violet clair)
        '#d9d9d9', // 8: Couleur 9 (gris clair)
        '#ff9999', // 9: Couleur 10 (rouge vif)
        '#ffb366', // 10: Couleur 11 (orange vif)
        '#ffff66'  // 11: Couleur 12 (jaune vif)
      ];
    }
    
    // Validation et correction de la palette de couleurs
    if (!oldState.parametres.paletteCouleurs || !Array.isArray(oldState.parametres.paletteCouleurs)) {
      oldState.parametres.paletteCouleurs = [
        '#ffcccc', '#ffcc99', '#ffff99', '#ccffcc', '#ccffff', '#ccccff',
        '#ffccff', '#e6ccff', '#d9d9d9', '#ff9999', '#ffb366', '#ffff66'
      ];
    } else if (oldState.parametres.paletteCouleurs.length !== 12) {
      console.log('Correction de la taille de paletteCouleurs:', oldState.parametres.paletteCouleurs.length);
      const couleursParDefaut = [
        '#ffcccc', '#ffcc99', '#ffff99', '#ccffcc', '#ccffff', '#ccccff',
        '#ffccff', '#e6ccff', '#d9d9d9', '#ff9999', '#ffb366', '#ffff66'
      ];
      // Ajuster la taille à 12
      const nouvellePalette = [...oldState.parametres.paletteCouleurs];
      while (nouvellePalette.length < 12) {
        nouvellePalette.push(couleursParDefaut[nouvellePalette.length]);
      }
      if (nouvellePalette.length > 12) {
        nouvellePalette.length = 12;
      }
      oldState.parametres.paletteCouleurs = nouvellePalette;
    }
    
    // Supprimer l'ancienne structure couleurs si elle existe
    if (oldState.parametres.couleurs) {
      delete oldState.parametres.couleurs;
    }
    
    // Migration des nouveaux paramètres globaux (modale refondue)
    // Jours affichés : initialiser avec joursActifs ou JOURS
    if (!oldState.parametres.joursAffiches) {
      oldState.parametres.joursAffiches = oldState.joursActifs || [...JOURS];
    }
    // Champs à afficher (unifié)
    if (!oldState.parametres.champsAffiches) {
      oldState.parametres.champsAffiches = {
        // Champs élèves de base
        classe: true,
        ulis: true,
        groupe: true,
        aesh: true,
        pec: true,
        niveau: true,
        
        // Fiche élève complète
        taxi: true,
        cantine: true,
        dateNaissance: true,
        dateEntree: true,
        telephone: true,
        email: true,
        adresse: true,
        allergies: true,
        regime: true,
        medical: true,
        
        // Champs créneaux
        matiere: true,
        groupeCreneau: true,
        adulte: true,
        type: true,
        regroupement: true,
        commentaire: true,
        
        // Modale édition complète
        pecSpecialite: true,
        pecOrganisme: true,
        aeshType: true,
        roleAdulte: true,
        
        // Droits MDPH
        mdphUlis: true,
        mdphSessad: true,
        mdphAesh: true,
        mdphTransport: true,
        mdphAutre: true
      };
    }
    // Zones d'enseignement réelles
    if (!oldState.parametres.zonesEnseignement) {
      oldState.parametres.zonesEnseignement = {
        academie: '',
        departement: '',
        ville: ''
      };
    }
    
    // Champs silencieux pour futures fonctionnalités
    if (oldState.parametres.theme === undefined) oldState.parametres.theme = 'clair';
    if (oldState.parametres.langue === undefined) oldState.parametres.langue = 'fr';
    if (oldState.parametres.fuseauHoraire === undefined) oldState.parametres.fuseauHoraire = 'Europe/Paris';
    if (oldState.parametres.joursFeries === undefined) oldState.parametres.joursFeries = [];
    if (oldState.parametres.vacancesScolaires === undefined) oldState.parametres.vacancesScolaires = [];
    if (oldState.parametres.horairesSpeciaux === undefined) oldState.parametres.horairesSpeciaux = [];
    if (oldState.parametres.notifications === undefined) {
      oldState.parametres.notifications = { enabled: true, email: '', sms: false };
    }
    if (oldState.parametres.sauvegardeAutomatique === undefined) {
      oldState.parametres.sauvegardeAutomatique = { enabled: false, frequence: 'quotidien', heure: '18:00' };
    }
    if (oldState.parametres.integrationCloud === undefined) {
      oldState.parametres.integrationCloud = { provider: '', apiKey: '', autoSync: false };
    }
  }
  
  // Migration des métadonnées système
  if (!oldState.metadonneesSysteme) {
    oldState.metadonneesSysteme = {
      versionApplication: '2.0.0',
      versionDonnees: '2.0',
      dateCreation: new Date().toISOString(),
      derniereMigration: '',
      migrationsAppliquees: [],
      statistiquesUtilisation: { sessions: 0, creneauxCrees: 0, derniereConnexion: '' }
    };
  }
  
  // Mettre à jour la version
  // Indique que la migration a été effectuée avec succès
  oldState.dataVersion = '2.0';
  
  return oldState;
}

/**
 * Applique les migrations chaînées pour mettre à jour les données vers la version actuelle
 * Cette fonction vérifie la version des données et applique toutes les migrations nécessaires
 * dans l'ordre chronologique pour garantir la compatibilité ascendante
 *
 * @param {Object} oldState - L'état à migrer
 * @returns {Object} - L'état migré vers la version actuelle
 */
function applyMigrations(oldState) {
  // Déterminer la version actuelle des données
  const currentVersion = oldState.dataVersion || '1.0';
  
  // Si les données sont déjà à jour, ne rien faire
  if (currentVersion === DATA_VERSION) {
    return oldState;
  }
  
  // Déterminer le chemin de migration
  const migrationPath = getMigrationPath(currentVersion, DATA_VERSION);
  
  if (migrationPath.length === 0) {
    console.warn(`Aucun chemin de migration trouvé de ${currentVersion} vers ${DATA_VERSION}`);
    return oldState;
  }
  
  // Appliquer chaque migration dans l'ordre
  let migratedState = oldState;
  for (const targetVersion of migrationPath) {
    const migrationFunction = MIGRATIONS[targetVersion];
    
    if (!migrationFunction) {
      console.error(`Migration vers la version ${targetVersion} non trouvée`);
      continue;
    }
    
    console.log(`Application de la migration vers la version ${targetVersion}...`);
    migratedState = migrationFunction(migratedState);
    
    // Enregistrer la migration dans les métadonnées
    recordMigration(migratedState, targetVersion);
  }
  
  // Mettre à jour la version des données
  migratedState.dataVersion = DATA_VERSION;
  
  return migratedState;
}

/**
 * Détermine le chemin de migration entre deux versions
 * Cette fonction identifie les étapes intermédiaires nécessaires pour migrer
 * d'une version à une autre en respectant l'ordre chronologique
 *
 * @param {string} fromVersion - Version de départ
 * @param {string} toVersion - Version cible
 * @returns {Array<string>} - Liste des versions intermédiaires à appliquer
 */
function getMigrationPath(fromVersion, toVersion) {
  // Liste des versions disponibles triées par ordre chronologique
  const availableVersions = Object.keys(MIGRATIONS).sort(compareVersions);
  
  // Filtrer les versions supérieures à la version de départ
  const versionsToApply = availableVersions.filter(v => compareVersions(v, fromVersion) > 0);
  
  // Filtrer les versions inférieures ou égales à la version cible
  const migrationPath = versionsToApply.filter(v => compareVersions(v, toVersion) <= 0);
  
  return migrationPath;
}

/**
 * Compare deux versions de données
 * Retourne -1 si v1 < v2, 0 si v1 == v2, 1 si v1 > v2
 *
 * @param {string} v1 - Première version
 * @param {string} v2 - Deuxième version
 * @returns {number} - Résultat de la comparaison
 */
function compareVersions(v1, v2) {
  const parts1 = v1.split('.').map(Number);
  const parts2 = v2.split('.').map(Number);
  
  for (let i = 0; i < Math.max(parts1.length, parts2.length); i++) {
    const num1 = parts1[i] || 0;
    const num2 = parts2[i] || 0;
    
    if (num1 < num2) return -1;
    if (num1 > num2) return 1;
  }
  
  return 0;
}

/**
 * Enregistre une migration dans les métadonnées système
 * Cette fonction permet de suivre l'historique des migrations appliquées
 *
 * @param {Object} state - L'état actuel
 * @param {string} version - La version de la migration appliquée
 */
function recordMigration(state, version) {
  if (!state.metadonneesSysteme) {
    state.metadonneesSysteme = {
      versionApplication: APP_VERSION,
      versionDonnees: DATA_VERSION,
      dateCreation: new Date().toISOString(),
      derniereMigration: '',
      migrationsAppliquees: [],
      statistiquesUtilisation: { sessions: 0, creneauxCrees: 0, derniereConnexion: '' }
    };
  }
  
  // Ajouter la migration à l'historique
  state.metadonneesSysteme.migrationsAppliquees.push({
    version: version,
    date: new Date().toISOString(),
    applicationVersion: APP_VERSION
  });
  
  // Mettre à jour la date de dernière migration
  state.metadonneesSysteme.derniereMigration = new Date().toISOString();
  
  // Mettre à jour la version des données
  state.metadonneesSysteme.versionDonnees = version;
}

function defaultState() {
  const defaultEleves = [
    { nom: 'Dupont', prenom: 'Enza', order: 0 },
    { nom: 'Martin', prenom: 'Kendji', order: 1 },
    { nom: 'Bernard', prenom: 'Lenny', order: 2 },
    { nom: 'Petit', prenom: 'Maé', order: 3 },
    { nom: 'Robert', prenom: 'Axel', order: 4 },
    { nom: 'Richard', prenom: 'Cynaëlle', order: 5 },
    { nom: 'Durand', prenom: 'Magdalena', order: 6 }
  ];
  const eleves = defaultEleves.map((eleve, i) => ({
    id: 'e' + (i + 1),
    nom: eleve.nom,
    prenom: eleve.prenom,
    actif: true,
    order: eleve.order,
    classe: '',
    ulis: false,
    groupe: '',
    // Nouveaux champs AESH-M/I
    aeshType: '',
    aeshNom: '',
    aeshHeures: 0,
    aeshMutualiseAvec: [],
    // Nouveaux champs PEC
    pecSpecialite: '',
    pecOrganisme: '',
    pecFrequence: '',
    pecLieu: '',
    pecHeures: 0,
    // Niveau scolaire
    niveau: '',
    // Notifications
    notifications: [],
    // Champs silencieux pour futures fonctionnalités
    photo: '',
    dateNaissance: '',
    allergies: '',
    regimeAlimentaire: '',
    informationsMedicales: '',
    transport: '',
    adresse: '',
    telephone: '',
    emailParents: '',
    remarques: '',
    dateEntree: '',
    dateSortie: '',
    enseignantReference: '',
    dispositifSuivi: '',
    piecesJointes: [],
    tags: [],
    actifDepuis: '',
    inactifDepuis: '',
    derniereModification: '',
    modifiePar: '',
    // Nouveaux champs fiche élève
    taxi: false,
    taxiCompagnie: '',
    cantine: false,
    telephoneUrgence: '',
    anneesUlis: 0,
    dateEntreeUlis: '',
    droitsMdhph: {
      ulis: { date: '', type: '' },
      sessad: { date: '', type: '' },
      aesh: { date: '', type: '' },
      transport: { date: '', type: '' },
      autre: { date: '', type: '', description: '' }
    }
  }));
  
  return {
    eleves,
    joursActifs: [...JOURS],
    creneaux: [],
    nextEleveIdNum: eleves.length + 1,
    nextCreneauIdNum: 1,
    dataVersion: '2.0',
    parametres: {
      heureDebut: '08:30',
      heureFin: '16:30',
      dureeCreneau: 15,
      pauses: [
        { actif: true, nom: 'Récréation', debut: '10:00', fin: '10:15', couleur: '#e0e0e0' },
        { actif: true, nom: 'Pause Méridienne', debut: '12:00', fin: '13:30', couleur: '#fff9c4' },
        { actif: false, nom: 'Récréation', debut: '15:00', fin: '15:15', couleur: '#e0e0e0' }
      ],
      // Nouveaux paramètres
      aeshTypes: ['AESHi', 'AESHm', 'AESHco'],
      pecSpecialites: ['orthophoniste', 'psychomotricien', 'psychologue', 'educateur', 'autre'],
      pecOrganismes: ['CMPP', 'CMP', 'SESSAD', 'prive', 'autre'],
      statsConfig: {
        heuresSemaine: 24,
        inclurePauses: false,
        inclurePEC: true,
        inclureAESH: true
      },
      // Paramètres globaux refondus (nouvelle structure)
      joursAffiches: ['lundi', 'mardi', 'jeudi', 'vendredi'],
      // Palette de 12 couleurs partagée (réduite de 15 à 12)
      paletteCouleurs: [
        '#ffcccc', // 0: Couleur 1 (rouge clair)
        '#ffcc99', // 1: Couleur 2 (orange clair)
        '#ffff99', // 2: Couleur 3 (jaune clair)
        '#ccffcc', // 3: Couleur 4 (vert clair)
        '#ccffff', // 4: Couleur 5 (bleu clair)
        '#ccccff', // 5: Couleur 6 (bleu violet)
        '#ffccff', // 6: Couleur 7 (rose clair)
        '#e6ccff', // 7: Couleur 8 (violet clair)
        '#d9d9d9', // 8: Couleur 9 (gris clair)
        '#ff9999', // 9: Couleur 10 (rouge vif)
        '#ffb366', // 10: Couleur 11 (orange vif)
        '#ffff66'  // 11: Couleur 12 (jaune vif)
      ],
      // Champs à afficher (unifié)
      champsAffiches: {
        // Champs élèves de base
        classe: true,
        ulis: true,
        groupe: true,
        aesh: true,
        pec: true,
        niveau: true,
        
        // Fiche élève complète
        taxi: true,
        cantine: true,
        dateNaissance: true,
        dateEntree: true,
        telephone: true,
        email: true,
        adresse: true,
        allergies: true,
        regime: true,
        medical: true,
        
        // Champs créneaux
        matiere: true,
        groupeCreneau: true,
        adulte: true,
        type: true,
        regroupement: true,
        commentaire: true,
        
        // Modale édition complète
        pecSpecialite: true,
        pecOrganisme: true,
        aeshType: true,
        roleAdulte: true,
        
        // Droits MDPH
        mdphUlis: true,
        mdphSessad: true,
        mdphAesh: true,
        mdphTransport: true,
        mdphAutre: true
      },
      // Zones d'enseignement réelles
      zonesEnseignement: {
        academie: '',
        departement: '',
        ville: ''
      },
      // Champs silencieux pour futures fonctionnalités
      theme: 'clair',
      langue: 'fr',
      fuseauHoraire: 'Europe/Paris',
      joursFeries: [],
      vacancesScolaires: [],
      horairesSpeciaux: [],
      notifications: { enabled: true, email: '', sms: false },
      sauvegardeAutomatique: { enabled: false, frequence: 'quotidien', heure: '18:00' },
      integrationCloud: { provider: '', apiKey: '', autoSync: false }
    },
    // Métadonnées système
    metadonneesSysteme: {
      versionApplication: '2.0.0',
      versionDonnees: '2.0',
      dateCreation: new Date().toISOString(),
      derniereMigration: '',
      migrationsAppliquees: [],
      statistiquesUtilisation: { sessions: 0, creneauxCrees: 0, derniereConnexion: '' }
    }
  };
}

/**
 * Valide les données importées depuis un fichier JSON
 * Vérifie que toutes les propriétés requises sont présentes et valides
 * 
 * @param {Object} data - Les données à valider
 * @returns {Object} - Résultat de la validation { isValid: boolean, error: string, message: string }
 */
function validateImportedData(data) {
  const errors = [];
  
  // Vérifier que data est un objet
  if (!data || typeof data !== 'object') {
    return {
      isValid: false,
      error: 'INVALID_DATA_TYPE',
      message: 'Les données importées ne sont pas un objet valide.'
    };
  }
  
  // Vérifier la présence des propriétés principales
  if (!Array.isArray(data.eleves)) {
    errors.push('La propriété "eleves" doit être un tableau.');
  }
  
  if (!Array.isArray(data.creneaux)) {
    errors.push('La propriété "creneaux" doit être un tableau.');
  }
  
  // Accepter soit joursActifs (v1) soit parametres.joursAffiches (v2)
  if (!Array.isArray(data.joursActifs) && !Array.isArray(data.parametres?.joursAffiches)) {
    errors.push('Les jours affiches sont manquants (propriete "joursActifs" ou "parametres.joursAffiches").');
  }
  
  // Vérifier les élèves
  if (Array.isArray(data.eleves)) {
    data.eleves.forEach((eleve, index) => {
      if (!eleve.id) {
        errors.push(`L'élève à l'index ${index} n'a pas d'ID.`);
      }
      if (!eleve.nom && !eleve.prenom) {
        errors.push(`L'élève à l'index ${index} n'a ni nom ni prénom.`);
      }
      if (typeof eleve.actif !== 'boolean') {
        errors.push(`L'élève "${eleve.prenom || eleve.nom || index}" a une propriété "actif" invalide.`);
      }
      if (typeof eleve.order !== 'number') {
        errors.push(`L'élève "${eleve.prenom || eleve.nom || index}" a une propriété "order" invalide.`);
      }
      
      // Vérifier la structure des droits MDPH
      if (eleve.droitsMdhph) {
        const droitsTypes = ['ulis', 'sessad', 'aesh', 'transport', 'autre'];
        droitsTypes.forEach(type => {
          if (!eleve.droitsMdhph[type] || typeof eleve.droitsMdhph[type] !== 'object' || 
              !eleve.droitsMdhph[type].hasOwnProperty('date') || !eleve.droitsMdhph[type].hasOwnProperty('type')) {
            errors.push(`L'élève "${eleve.prenom || eleve.nom || index}" a une structure de droits MDPH incomplète pour "${type}".`);
          }
        });
      }
    });
  }
  
  // Vérifier les créneaux
  if (Array.isArray(data.creneaux)) {
    data.creneaux.forEach((creneau, index) => {
      if (!creneau.id) {
        errors.push(`Le créneau à l'index ${index} n'a pas d'ID.`);
      }
      if (!creneau.jour) {
        errors.push(`Le créneau "${creneau.id || index}" n'a pas de jour.`);
      }
      if (!creneau.heure) {
        errors.push(`Le créneau "${creneau.id || index}" n'a pas d'heure.`);
      }
      if (!creneau.eleveId) {
        errors.push(`Le créneau "${creneau.id || index}" n'a pas d'ID d'élève.`);
      }
      
      // Vérifier que l'élève existe
      if (creneau.eleveId && Array.isArray(data.eleves)) {
        const eleveExists = data.eleves.some(e => e.id === creneau.eleveId);
        if (!eleveExists) {
          errors.push(`Le créneau "${creneau.id}" référence un élève inexistant (${creneau.eleveId}).`);
        }
      }
    });
  }
  
  // Vérifier les paramètres
  if (data.parametres) {
    if (!data.parametres.heureDebut) {
      errors.push('Le paramètre "heureDebut" est manquant.');
    }
    if (!data.parametres.heureFin) {
      errors.push('Le paramètre "heureFin" est manquant.');
    }
    if (!data.parametres.dureeCreneau) {
      errors.push('Le paramètre "dureeCreneau" est manquant.');
    }
  }
  
  // Retourner le résultat
  if (errors.length > 0) {
    return {
      isValid: false,
      error: 'VALIDATION_FAILED',
      message: `Erreurs de validation des données importées :\n${errors.join('\n')}`
    };
  }
  
  return {
    isValid: true,
    error: null,
    message: 'Les données importées sont valides.'
  };
}

function loadState() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return defaultState();
    
    const parsed = JSON.parse(raw);
    
    // Appliquer les migrations chaînées si nécessaire
    let data = parsed;
    if (!parsed.dataVersion || parsed.dataVersion !== DATA_VERSION) {
      const migrated = applyMigrations(parsed);
      // Sauvegarder la version migrée
      localStorage.setItem(STORAGE_KEY, JSON.stringify(migrated));
      data = migrated;
    }
    
    // Valider les données importées (après migration pour être plus permissif)
    const validationResult = validateImportedData(data);
    if (!validationResult.isValid) {
      console.error('Erreur de validation des données:', validationResult.error);
      alert(validationResult.message);
      // En cas d'erreur, retourner à l'état par défaut
      return defaultState();
    }
    
    // Compléter les paramètres manquants
    if (!data.parametres) {
      data.parametres = { heureDebut: '08:30', heureFin: '16:30', dureeCreneau: 15 };
    }
    if (!data.parametres.pauses) {
      data.parametres.pauses = [
        { actif: true, nom: 'Récréation', debut: '10:00', fin: '10:15', couleur: '#e0e0e0' },
        { actif: true, nom: 'Pause Méridienne', debut: '12:00', fin: '13:30', couleur: '#fff9c4' },
        { actif: false, nom: 'Récréation', debut: '15:00', fin: '15:15', couleur: '#e0e0e0' }
      ];
    }
    
    // Compléter la palette de couleurs si manquante
    if (!data.parametres.paletteCouleurs || !Array.isArray(data.parametres.paletteCouleurs)) {
      data.parametres.paletteCouleurs = defaultState().parametres.paletteCouleurs;
    }
    
    // S'assurer que dataVersion est présente
    if (!data.dataVersion) {
      data.dataVersion = DATA_VERSION;
    }
    
    return data;
  } catch (e) {
    console.error('Erreur lors du chargement de l\'état:', e);
    return defaultState();
  }
}

function saveState(recordHistory = true) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  
  if (recordHistory) {
    if (historyIndex < historyStack.length - 1) {
      historyStack = historyStack.slice(0, historyIndex + 1);
    }
    historyStack.push(deepClone(state));
    
    if (historyStack.length > MAX_HISTORY) {
      historyStack.shift(); 
    } else {
      historyIndex++;
    }
    updateUndoRedoUI();
  }
}

function undoAction() {
  if (historyIndex > 0) {
    historyIndex--;
    state = deepClone(historyStack[historyIndex]);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    HEURES = generateHeures();
    if (typeof renderAll === 'function') renderAll();
    updateUndoRedoUI();
  }
}

function redoAction() {
  if (historyIndex < historyStack.length - 1) {
    historyIndex++;
    state = deepClone(historyStack[historyIndex]);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    HEURES = generateHeures();
    if (typeof renderAll === 'function') renderAll();
    updateUndoRedoUI();
  }
}

function updateUndoRedoUI() {
  const btnUndo = document.getElementById('btn-undo');
  const btnRedo = document.getElementById('btn-redo');
  if(btnUndo) btnUndo.disabled = (historyIndex <= 0);
  if(btnRedo) btnRedo.disabled = (historyIndex >= historyStack.length - 1);
}

/**
 * Vérifie que currentDay est un jour valide parmi les jours affichés
 * Si ce n'est pas le cas, le remplace par le premier jour affiché
 */
function validerCurrentDay() {
  const joursAffiches = state.parametres.joursAffiches || JOURS;
  if (!joursAffiches.includes(currentDay)) {
    currentDay = joursAffiches.length > 0 ? joursAffiches[0] : JOURS[0];
  }
}

let state = loadState();
// Initialiser currentDay avec le premier jour affiché, ou le premier jour de JOURS par défaut
let currentDay = (state.parametres.joursAffiches && state.parametres.joursAffiches.length > 0)
  ? state.parametres.joursAffiches[0]
  : JOURS[0];
let currentSlotContext = null;
HEURES = generateHeures();

// Appeler initialiserParametres() pour appliquer les couleurs au chargement
if (typeof initialiserParametres === 'function') {
    initialiserParametres();
}

historyStack.push(deepClone(state));
historyIndex = 0;