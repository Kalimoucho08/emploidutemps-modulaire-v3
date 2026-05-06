/**
 * js/modals.js
 * Gestion des modales de l'application (paramètres, édition de créneau, édition multiple)
 *
 * Ce fichier gère l'ouverture, la fermeture et le traitement des formulaires
 * dans les différentes fenêtres modales de l'interface utilisateur.
 *
 * Modales gérées :
 * - Modal des paramètres horaires (settings-modal-backdrop)
 * - Modal d'édition de créneau (slot-modal-backdrop)
 * - Modal d'édition multiple (bulk-modal-backdrop)
 *
 * Principes de conception :
 * - Utilisation de currentSlotContext pour stocker le contexte du créneau en cours d'édition
 * - Séparation claire entre la logique d'affichage et la logique de traitement
 * - Réutilisation de la logique de duplication sur plusieurs jours
 */
const settingsModal = document.getElementById('settings-modal-backdrop');

// OUVERTURE DES PARAMÈTRES (DÉSACTIVÉE - DÉPLACÉE DANS PARAMÈTRES GLOBAUX)
// NOTE: Le bouton "Horaires" a été déplacé dans les paramètres globaux (onglet "Jours et horaires")
// L'ancien gestionnaire d'événements est désactivé
// document.getElementById('btn-settings').addEventListener('click', () => {
//   document.getElementById('set-debut').value = state.parametres.heureDebut;
//   document.getElementById('set-fin').value = state.parametres.heureFin;
//   document.getElementById('set-duree').value = state.parametres.dureeCreneau;
//
//   // Charge les paramètres des 3 pauses
//   state.parametres.pauses.forEach((pause, i) => {
//     document.getElementById(`pause-${i}-actif`).checked = pause.actif;
//     document.getElementById(`pause-${i}-nom`).value = pause.nom;
//     document.getElementById(`pause-${i}-debut`).value = pause.debut;
//     document.getElementById(`pause-${i}-fin`).value = pause.fin;
//     document.getElementById(`pause-${i}-couleur`).value = pause.couleur;
//   });
//
//   settingsModal.classList.add('visible');
// });winget install -e --id OpenJS.NodeJS


document.getElementById('btn-settings-cancel').addEventListener('click', () => settingsModal.classList.remove('visible'));

// ENREGISTREMENT DES PARAMÈTRES
document.getElementById('settings-form').addEventListener('submit', e => {
  e.preventDefault();
  state.parametres.heureDebut = document.getElementById('set-debut').value;
  state.parametres.heureFin = document.getElementById('set-fin').value;
  state.parametres.dureeCreneau = parseInt(document.getElementById('set-duree').value, 10);
  
  // Sauvegarde des 3 pauses
  for (let i = 0; i <= 2; i++) {
    state.parametres.pauses[i] = {
      actif: document.getElementById(`pause-${i}-actif`).checked,
      nom: document.getElementById(`pause-${i}-nom`).value || 'Pause',
      debut: document.getElementById(`pause-${i}-debut`).value,
      fin: document.getElementById(`pause-${i}-fin`).value,
      couleur: document.getElementById(`pause-${i}-couleur`).value
    };
  }

  saveState(); 
  HEURES = generateHeures(); 
  clearSelection(); 
  renderTable();
  settingsModal.classList.remove('visible');
});

const slotModal = document.getElementById('slot-modal-backdrop');
let selectedColor = '#bbdefb'; let selectedTextColor = '#000000';

// Fonction pour obtenir la première couleur de la palette dynamique
function getPremiereCouleurPalette() {
  const palette = state?.parametres?.paletteCouleurs || getPaletteCouleursParDefaut();
  return palette[0] || '#bbdefb';
}

// Initialiser avec la première couleur de la palette dynamique
function initialiserCouleursParDefaut() {
  selectedColor = getPremiereCouleurPalette();
  bulkSelectedColor = getPremiereCouleurPalette();
}

// Les écouteurs d'événements pour les palettes de couleurs sont maintenant attachés dans rafraichirPalettesEdition()
// après la génération dynamique des boutons de couleur

// Gestion de l'affichage conditionnel des champs PEC
// Les champs de prise en charge (spécialité, organisme) ne sont affichés
// que lorsque le type de regroupement est "PEC" (prise en charge spécialisée)
document.getElementById('field-regroupement').addEventListener('change', function() {
  const pecFields = document.getElementById('pec-fields');
  if (this.value === 'PEC') {
    pecFields.style.display = 'block';
  } else {
    pecFields.style.display = 'none';
  }
});

/**
 * Applique la configuration des champs créneau (masquage/désactivation)
 */
function appliquerConfigurationChampsCreneau() {
  // Récupérer la configuration des champs (par défaut tous activés)
  // Utiliser la structure unifiée state.parametres.champsAffiches.creneau
  const config = state.parametres.champsAffiches?.creneau || {
    matiere: true,
    groupe: true,
    adulte: true,
    type: true,
    regroupement: true,
    commentaire: true
  };
  
  // Masquer/désactiver les champs selon la configuration
  const champsMapping = {
    matiere: ['field-matiere', 'label-matiere'],
    groupe: ['field-groupe', 'label-groupe'],
    adulte: ['field-adulte', 'label-adulte', 'field-role-adulte', 'label-role-adulte'],
    type: ['field-type', 'label-type'],
    regroupement: ['field-regroupement', 'label-regroupement'],
    commentaire: ['field-commentaire', 'label-commentaire']
  };
  
  Object.entries(champsMapping).forEach(([champ, ids]) => {
    const estActif = config[champ] !== false; // true par défaut
    ids.forEach(id => {
      const element = document.getElementById(id);
      if (element) {
        if (element.tagName === 'LABEL') {
          element.style.display = estActif ? '' : 'none';
        } else {
          element.style.display = estActif ? '' : 'none';
          element.disabled = !estActif;
        }
      }
    });
  });
  
  // Gérer les champs spéciaux (PEC et AESH)
  const pecActif = config.regroupement !== false; // Si regroupement est désactivé, PEC aussi
  const pecFields = document.getElementById('pec-fields');
  if (pecFields) {
    pecFields.style.display = pecActif ? '' : 'none';
  }
  
  const aeshActif = config.regroupement !== false; // AESH lié au regroupement
  const aeshField = document.getElementById('field-aesh-type');
  if (aeshField) {
    aeshField.style.display = aeshActif ? '' : 'none';
    aeshField.disabled = !aeshActif;
  }
}

/**
 * Ouvre la modal d'édition de créneau
 *
 * Cette fonction prépare et affiche le formulaire d'édition pour un créneau spécifique.
 * Elle gère deux cas distincts : les créneaux d'élève et les pauses globales.
 *
 * @param {string} jour - Le jour de la semaine (lundi, mardi, jeudi, vendredi)
 * @param {string} heure - L'heure du créneau (format HH:MM)
 * @param {string} eleveId - L'identifiant de l'élève ou 'GLOBAL' pour une pause
 * @param {Array} spannedKeys - Liste des clés des créneaux fusionnés (pour les pauses)
 */
function openSlotModal(jour, heure, eleveId, spannedKeys = null) {
  currentSlotContext = { jour, heure, eleveId, spannedKeys };
  
  if (eleveId === 'GLOBAL') {
    document.getElementById('modal-subtitle').textContent = `PAUSE GLOBALE MANUELLE - ${jour} à ${formatHeure(heure)}`;
    document.getElementById('label-groupe').style.display = 'none';
    document.getElementById('label-adulte').style.display = 'none';
    document.getElementById('label-type').style.display = 'none';
    document.getElementById('field-matiere').placeholder = "Ex : Récréation, Cantine...";
  } else {
    const eleve = state.eleves.find(e => e.id === eleveId);
    document.getElementById('modal-subtitle').textContent = `${eleve.prenom || eleve.nom} - ${jour} à ${formatHeure(heure)}`;
    document.getElementById('label-groupe').style.display = 'flex';
    document.getElementById('label-adulte').style.display = 'flex';
    document.getElementById('label-type').style.display = 'flex';
    document.getElementById('field-matiere').placeholder = "";
  }
  
  const lesson = findLesson(jour, heure, eleveId);
  if (lesson) {
    document.getElementById('field-matiere').value = lesson.matiere || '';
    document.getElementById('field-groupe').value = lesson.groupe || '';
    document.getElementById('field-adulte').value = lesson.adulte || '';
    document.getElementById('field-role-adulte').value = lesson.roleAdulte || 'enseignant';
    document.getElementById('field-type').value = lesson.type || 'fixe';
    document.getElementById('field-regroupement').value = lesson.regroupementType || 'AUTRE';
    document.getElementById('field-pec-specialite').value = lesson.pecSpecialite || '';
    document.getElementById('field-pec-organisme').value = lesson.pecOrganisme || '';
    document.getElementById('field-aesh-type').value = lesson.aeshType || '';
    document.getElementById('field-commentaire').value = lesson.commentaire || '';
    selectedColor = lesson.color || '#bbdefb'; selectedTextColor = lesson.textColor || '#000000';
    
    // Afficher/masquer les champs PEC en fonction du type de regroupement
    const pecFields = document.getElementById('pec-fields');
    if (lesson.regroupementType === 'PEC') {
      pecFields.style.display = 'block';
    } else {
      pecFields.style.display = 'none';
    }
  } else {
    document.getElementById('slot-form').reset();
    document.getElementById('field-role-adulte').value = 'enseignant';
    document.getElementById('field-regroupement').value = 'AUTRE';
    document.getElementById('field-aesh-type').value = '';
    document.getElementById('pec-fields').style.display = 'none';
  }

  document.querySelectorAll('#color-palette .color-option').forEach(b => {
    b.classList.remove('selected'); if (b.getAttribute('data-color') === selectedColor) b.classList.add('selected');
  });
  document.querySelectorAll('#text-color-palette .text-color-option').forEach(b => {
    b.classList.remove('selected'); if (b.getAttribute('data-color') === selectedTextColor) b.classList.add('selected');
  });

  const dupGroup = document.getElementById('duplicate-days-group');
  dupGroup.innerHTML = '';
  JOURS.forEach(j => {
    if (j !== jour) dupGroup.innerHTML += `<label><input type="checkbox" value="${j}" class="dup-day-cb"> ${j[0].toUpperCase() + j.slice(1)}</label>`;
  });

  slotModal.classList.add('visible');
  
  // Appliquer la configuration des champs créneau
  appliquerConfigurationChampsCreneau();
}

document.getElementById('btn-cancel').addEventListener('click', () => slotModal.classList.remove('visible'));

document.getElementById('slot-form').addEventListener('submit', e => {
  e.preventDefault();
  const { jour, eleveId, spannedKeys } = currentSlotContext;
  const matiere = document.getElementById('field-matiere').value.trim();
  const groupe = document.getElementById('field-groupe').value.trim();
  const adulte = document.getElementById('field-adulte').value.trim();
  const commentaire = document.getElementById('field-commentaire').value.trim();
  const regroupement = document.getElementById('field-regroupement').value;
  const pecSpecialite = document.getElementById('field-pec-specialite').value;
  const pecOrganisme = document.getElementById('field-pec-organisme').value;
  const aeshType = document.getElementById('field-aesh-type').value;
  
  const keysToUpdate = spannedKeys || [`${jour}|${currentSlotContext.heure}|${eleveId}`];

  // Trouver l'index de la couleur sélectionnée dans la palette
  const palette = state.parametres?.paletteCouleurs || [];
  let couleurIndex = -1;
  if (selectedColor) {
    // Normaliser la couleur pour la comparaison
    const selectedColorNorm = selectedColor?.toLowerCase().replace(/^#/, '');
    for (let i = 0; i < palette.length; i++) {
      const paletteColorNorm = palette[i]?.toLowerCase().replace(/^#/, '');
      if (paletteColorNorm === selectedColorNorm) {
        couleurIndex = i;
        break;
      }
    }
  }

  const saveToDay = (targetJour) => {
    keysToUpdate.forEach(keyStr => {
      const [, h, eId] = keyStr.split('|');
      let lesson = findLesson(targetJour, h, eId);
      
      // Vérifier s'il y a des modifications (champs texte OU couleur)
      const hasModifications = matiere || groupe || adulte || commentaire ||
                             (selectedColor && selectedColor !== '#bbdefb') ||
                             (selectedTextColor && selectedTextColor !== '#000000');
      
      // Pour les pauses globales (eId === 'GLOBAL'), on crée toujours le créneau si nécessaire
      if (eId === 'GLOBAL' || hasModifications) {
        if (!lesson) {
          lesson = { id: 'c' + state.nextCreneauIdNum++, jour: targetJour, heure: h, eleveId: eId };
          state.creneaux.push(lesson);
        }
        lesson.matiere = matiere; lesson.groupe = groupe; lesson.adulte = adulte;
        lesson.roleAdulte = document.getElementById('field-role-adulte').value;
        lesson.type = document.getElementById('field-type').value;
        lesson.regroupementType = regroupement;
        lesson.pecSpecialite = pecSpecialite;
        lesson.pecOrganisme = pecOrganisme;
        lesson.aeshType = aeshType;
        // Sauvegarder l'index de couleur si trouvé, sinon la chaîne hexadécimale
        if (couleurIndex >= 0) {
          lesson.couleurIndex = couleurIndex;
          lesson.color = selectedColor; // Garder pour compatibilité
        } else {
          lesson.color = selectedColor;
          delete lesson.couleurIndex; // Supprimer l'index si la couleur n'est pas dans la palette
        }
        lesson.textColor = selectedTextColor; lesson.commentaire = commentaire;
      } else if (lesson) {
        // Supprimer le créneau uniquement s'il existe et qu'il n'y a aucune modification
        state.creneaux = state.creneaux.filter(c => !(c.jour === targetJour && c.heure === h && c.eleveId === eId));
      }
    });
  };

  saveToDay(jour);
  document.querySelectorAll('.dup-day-cb:checked').forEach(cb => saveToDay(cb.value));
  saveState(); renderTable(); slotModal.classList.remove('visible');
});

document.getElementById('btn-delete-slot').addEventListener('click', () => {
  const keysToUpdate = currentSlotContext.spannedKeys || [`${currentSlotContext.jour}|${currentSlotContext.heure}|${currentSlotContext.eleveId}`];
  keysToUpdate.forEach(keyStr => {
    const [j, h, eId] = keyStr.split('|');
    state.creneaux = state.creneaux.filter(c => !(c.jour === j && c.heure === h && c.eleveId === eId));
  });
  saveState(); renderTable(); slotModal.classList.remove('visible');
});

const bulkModalBackdrop = document.getElementById('bulk-modal-backdrop');
const bulkForm = document.getElementById('bulk-form');
let bulkSelectedColor = null;
let bulkSelectedTextColor = null;

function buildBulkTypeSelect() {
  var sel = document.getElementById('bulk-type');
  sel.innerHTML = '<option value="">— ne pas modifier —</option>';
  sel.innerHTML += '<option value="fixe">Fixe</option><option value="exception">Exception</option><option value="ponctuel">Ponctuel</option>';
}

function buildBulkColorPalettes() {
  var palette = state.parametres?.paletteCouleurs || getPaletteCouleursParDefaut();
  var fondPal = document.getElementById('bulk-color-palette');
  var textePal = document.getElementById('bulk-text-color-palette');

  fondPal.innerHTML = '';
  palette.forEach(function(c) {
    var btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'color-option';
    btn.setAttribute('data-color', c);
    btn.style.backgroundColor = c;
    btn.title = c;
    btn.addEventListener('click', function() {
      fondPal.querySelectorAll('.color-option').forEach(function(b) { b.classList.remove('selected'); });
      btn.classList.add('selected');
      bulkSelectedColor = c;
    });
    fondPal.appendChild(btn);
  });
  // Bouton "ne pas modifier"
  var clearBtn = document.createElement('button');
  clearBtn.type = 'button';
  clearBtn.className = 'color-option';
  clearBtn.style.backgroundColor = '#eee';
  clearBtn.style.fontSize = '14px';
  clearBtn.style.lineHeight = '24px';
  clearBtn.textContent = '✕';
  clearBtn.title = 'Ne pas modifier';
  clearBtn.addEventListener('click', function() {
    fondPal.querySelectorAll('.color-option').forEach(function(b) { b.classList.remove('selected'); });
    bulkSelectedColor = null;
  });
  fondPal.appendChild(clearBtn);

  textePal.innerHTML = '';
  var texteCouleurs = ['#000000', '#ffffff', '#333333', '#0d47a1', '#c62828', '#2e7d32'];
  texteCouleurs.forEach(function(c) {
    var btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'text-color-option';
    btn.setAttribute('data-color', c);
    btn.style.backgroundColor = c;
    btn.style.color = (c === '#ffffff' || c === '#fff') ? '#000' : '#fff';
    btn.title = c;
    btn.textContent = c.substring(0,2);
    btn.addEventListener('click', function() {
      textePal.querySelectorAll('.text-color-option').forEach(function(b) { b.classList.remove('selected'); });
      btn.classList.add('selected');
      bulkSelectedTextColor = c;
    });
    textePal.appendChild(btn);
  });
  var clearBtnT = document.createElement('button');
  clearBtnT.type = 'button';
  clearBtnT.className = 'text-color-option';
  clearBtnT.style.backgroundColor = '#eee';
  clearBtnT.style.color = '#000';
  clearBtnT.style.fontSize = '14px';
  clearBtnT.textContent = '✕';
  clearBtnT.title = 'Ne pas modifier';
  clearBtnT.addEventListener('click', function() {
    textePal.querySelectorAll('.text-color-option').forEach(function(b) { b.classList.remove('selected'); });
    bulkSelectedTextColor = null;
  });
  textePal.appendChild(clearBtnT);
}

document.getElementById('btn-bulk-edit').addEventListener('click', function() {
  if (selectedSlots.size === 0) return;
  bulkForm.reset();
  document.getElementById('bulk-role-adulte').value = '';
  document.getElementById('bulk-count').textContent = selectedSlots.size;
  bulkSelectedColor = null;
  bulkSelectedTextColor = null;
  buildBulkTypeSelect();
  buildBulkColorPalettes();
  bulkModalBackdrop.classList.add('visible');
});

document.getElementById('btn-bulk-cancel').addEventListener('click', function() {
  bulkModalBackdrop.classList.remove('visible');
});

bulkForm.addEventListener('submit', function(e) {
  e.preventDefault();

  var newMatiere = document.getElementById('bulk-matiere').value.trim() || null;
  var newGroupe = document.getElementById('bulk-groupe').value.trim() || null;
  var newAdulte = document.getElementById('bulk-adulte').value.trim() || null;
  var newRoleAdulte = document.getElementById('bulk-role-adulte').value || null;
  var newType = document.getElementById('bulk-type').value || null;
  var newRegroupement = document.getElementById('bulk-regroupement').value || null;
  var newAeshType = document.getElementById('bulk-aesh-type').value || null;
  var newCommentaire = document.getElementById('bulk-commentaire').value.trim() || null;
  var newColor = bulkSelectedColor;
  var newTextColor = bulkSelectedTextColor;

  var hasModif = newMatiere || newGroupe || newAdulte || newRoleAdulte || newType || newRegroupement || newAeshType || newColor || newTextColor || newCommentaire;
  if (!hasModif) { bulkModalBackdrop.classList.remove('visible'); return; }

  selectedSlots.forEach(function(key) {
    var parts = key.split('|');
    var jour = parts[0], heure = parts[1], eleveId = parts[2];
    var lesson = findLesson(jour, heure, eleveId);

    if (!lesson) {
      lesson = {
        id: 'c' + state.nextCreneauIdNum++,
        jour: jour, heure: heure, eleveId: eleveId,
        matiere: newMatiere || '',
        groupe: newGroupe || '',
        adulte: newAdulte || '',
        roleAdulte: newRoleAdulte || 'enseignant',
        type: newType || 'fixe',
        regroupementType: newRegroupement || 'AUTRE',
        aeshType: newAeshType || '',
        color: newColor || (state.parametres?.paletteCouleurs || getPaletteCouleursParDefaut())[0],
        textColor: newTextColor || '#000000',
        commentaire: newCommentaire || ''
      };
      state.creneaux.push(lesson);
    } else {
      if (newMatiere !== null) lesson.matiere = newMatiere;
      if (newGroupe !== null) lesson.groupe = newGroupe;
      if (newAdulte !== null) { lesson.adulte = newAdulte; if (newRoleAdulte !== null) lesson.roleAdulte = newRoleAdulte; }
      if (newRoleAdulte !== null && newAdulte === null) lesson.roleAdulte = newRoleAdulte;
      if (newType !== null) lesson.type = newType;
      if (newRegroupement !== null) lesson.regroupementType = newRegroupement;
      if (newAeshType !== null) lesson.aeshType = newAeshType;
      if (newColor !== null) lesson.color = newColor;
      if (newTextColor !== null) lesson.textColor = newTextColor;
      if (newCommentaire !== null) lesson.commentaire = newCommentaire;

      if (!lesson.matiere && !lesson.groupe && !lesson.adulte && !lesson.commentaire) {
        state.creneaux = state.creneaux.filter(function(c) { return c.id !== lesson.id; });
      }
    }
  });

  saveState(); renderTable(); bulkModalBackdrop.classList.remove('visible'); clearSelection();
});

document.getElementById('btn-bulk-delete').addEventListener('click', function() {
  if (!confirm('Supprimer les ' + selectedSlots.size + ' créneaux sélectionnés ?')) return;
  selectedSlots.forEach(function(key) {
    var parts = key.split('|');
    var jour = parts[0], heure = parts[1], eleveId = parts[2];
    state.creneaux = state.creneaux.filter(function(c) { return !(c.jour === jour && c.heure === heure && c.eleveId === eleveId); });
  });
  saveState(); renderTable(); bulkModalBackdrop.classList.remove('visible'); clearSelection();
});

/**
 * Rafraîchit les palettes de couleurs dans les modales d'édition (slot et bulk)
 * en utilisant la palette dynamique de state.parametres.paletteCouleurs.
 * Cette fonction doit être appelée après chaque modification de la palette.
 */
function rafraichirPalettesEdition() {
  // Palette de couleurs de fond (12 couleurs)
  const palette = state.parametres?.paletteCouleurs || getPaletteCouleursParDefaut();
  
  // Palette de couleurs de texte (4 couleurs fixes)
  const paletteTexte = ['#000000', '#ffffff', '#333333', '#0d47a1'];
  
  // Mettre à jour la palette de la modale d'édition simple
  const containerCouleur = document.getElementById('color-palette');
  const containerTexte = document.getElementById('text-color-palette');
  const containerBulkCouleur = document.getElementById('bulk-color-palette');
  const containerBulkTexte = document.getElementById('bulk-text-color-palette');
  
  if (containerCouleur) {
    containerCouleur.innerHTML = '';
    palette.forEach((couleur, index) => {
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'color-option';
      btn.setAttribute('data-color', couleur);
      btn.style.backgroundColor = couleur;
      containerCouleur.appendChild(btn);
    });
  }
  
  if (containerTexte) {
    containerTexte.innerHTML = '';
    paletteTexte.forEach((couleur, index) => {
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'text-color-option';
      btn.setAttribute('data-color', couleur);
      btn.style.backgroundColor = couleur;
      btn.style.color = (couleur === '#ffffff' ? 'black' : 'white');
      btn.textContent = index === 0 ? 'N' : index === 1 ? 'B' : index === 2 ? 'G' : 'M';
      containerTexte.appendChild(btn);
    });
  }
  
  if (containerBulkCouleur) {
    containerBulkCouleur.innerHTML = '';
    palette.forEach((couleur, index) => {
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'color-option';
      btn.setAttribute('data-color', couleur);
      btn.style.backgroundColor = couleur;
      containerBulkCouleur.appendChild(btn);
    });
  }
  
  if (containerBulkTexte) {
    containerBulkTexte.innerHTML = '';
    paletteTexte.forEach((couleur, index) => {
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'text-color-option';
      btn.setAttribute('data-color', couleur);
      btn.style.backgroundColor = couleur;
      btn.style.color = (couleur === '#ffffff' ? 'black' : 'white');
      btn.textContent = index === 0 ? 'N' : index === 1 ? 'B' : index === 2 ? 'G' : 'M';
      containerBulkTexte.appendChild(btn);
    });
  }
  
  // Réattacher les événements de clic
  document.querySelectorAll('#color-palette .color-option').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('#color-palette .color-option').forEach(b => b.classList.remove('selected'));
      btn.classList.add('selected'); selectedColor = btn.getAttribute('data-color');
    });
  });
  document.querySelectorAll('#text-color-palette .text-color-option').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('#text-color-palette .text-color-option').forEach(b => b.classList.remove('selected'));
      btn.classList.add('selected'); selectedTextColor = btn.getAttribute('data-color');
    });
  });
  // Les palettes bulk sont gerees par buildBulkColorPalettes() dans openBulkModal
   
  // Mettre à jour les couleurs sélectionnées par défaut avec la première couleur de la palette
  initialiserCouleursParDefaut();
   
  console.log('Palettes d\'édition rafraîchies avec la palette dynamique');
}

// Appeler rafraichirPalettesEdition au chargement initial si state est prêt
if (typeof state !== 'undefined' && state.parametres) {
  setTimeout(() => rafraichirPalettesEdition(), 100);
}