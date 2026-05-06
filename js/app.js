/**
 * js/app.js
 * Fichier d'initialisation globale et de gestion des actions générales.
 */

['dragenter', 'dragover', 'dragleave', 'drop'].forEach(evt => {
  window.addEventListener(evt, e => e.preventDefault(), false);
  document.addEventListener(evt, e => e.preventDefault(), false);
});

document.getElementById('btn-reset').addEventListener('click', () => {
  if (confirm("Attention, voulez-vous vraiment TOUT effacer (élèves et créneaux) ? Cette action est irréversible.")) {
    localStorage.removeItem(STORAGE_KEY);
    state = defaultState();
    HEURES = generateHeures();
    saveState(); 
    renderAll();
  }
});

// EXPORTER
document.getElementById('btn-export').addEventListener('click', function() {
  var exportData = JSON.parse(JSON.stringify(state));
  exportData._metadata = {
    source: 'emploidutemps-modulaire-v3',
    exportDate: new Date().toISOString(),
    dataVersion: state.dataVersion || '2.0',
    totalEleves: state.eleves ? state.eleves.length : 0,
    totalCreneaux: state.creneaux ? state.creneaux.length : 0
  };

  var jsonStr = JSON.stringify(exportData, null, 2);
  var dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(jsonStr);
  var dlAnchorElem = document.createElement('a');
  dlAnchorElem.setAttribute('href', dataStr);
  var dateStr = new Date().toISOString().split('T')[0];
  dlAnchorElem.setAttribute('download', 'emploi_du_temps_' + dateStr + '.json');
  dlAnchorElem.click();
});

// IMPORTER
var importInput = document.getElementById('import-file');
document.getElementById('btn-import').addEventListener('click', function() { importInput.click(); });

importInput.addEventListener('change', function(e) {
  var file = e.target.files[0];
  if (!file) return;

  var reader = new FileReader();
  reader.onload = function(event) {
    try {
      var importedData = JSON.parse(event.target.result);

      // Retirer les metadonnees d'export
      delete importedData._metadata;

      // Validation
      if (typeof validateImportedData === 'function') {
        var validation = validateImportedData(importedData);
        if (!validation.isValid) {
          alert('Fichier invalide :\n' + validation.message);
          return;
        }
      } else if (!importedData.eleves || !importedData.creneaux) {
        alert('Erreur : Ce fichier ne correspond pas a un emploi du temps valide.');
        return;
      }

      // Appliquer les migrations si necessaire
      if (typeof applyMigrations === 'function' && importedData.dataVersion) {
        importedData = applyMigrations(importedData);
      }

      state = importedData;
      saveState(true);
      HEURES = generateHeures();
      if (typeof initialiserParametres === 'function') initialiserParametres();
      renderAll();
      alert('Donnees chargees avec succes ! ' + state.eleves.length + ' eleves, ' + state.creneaux.length + ' creneaux.');
    } catch(err) {
      alert('Erreur lors de la lecture du fichier JSON : ' + err.message);
    }
  };
  reader.readAsText(file);
  importInput.value = '';
});

// ==========================================
// PARAMÈTRES GLOBAUX
// ==========================================

const btnParametresGlobaux = document.getElementById('btn-parametres-globaux');
if (btnParametresGlobaux) {
    console.log('Attachement de l\'écouteur pour le bouton paramètres globaux');
    btnParametresGlobaux.addEventListener('click', ouvrirParametresGlobaux);
} else {
    console.error('Bouton paramètres globaux non trouvé dans le DOM');
}

// Écouteur d'événement pour le formulaire des paramètres globaux
const parametresGlobauxForm = document.getElementById('parametres-globaux-form');
if (parametresGlobauxForm) {
    console.log('Attachement de l\'écouteur pour le formulaire paramètres globaux');
    parametresGlobauxForm.addEventListener('submit', (e) => {
        e.preventDefault();
        console.log('Soumission du formulaire paramètres globaux');
        if (typeof sauvegarderParametres === 'function') {
            sauvegarderParametres();
        } else {
            console.error('La fonction sauvegarderParametres n\'est pas définie');
        }
    });
} else {
    console.error('Formulaire paramètres globaux non trouvé dans le DOM');
}

// Écouteur d'événement pour le bouton annuler des paramètres globaux
const btnParametresAnnuler = document.getElementById('btn-parametres-annuler');
if (btnParametresAnnuler) {
    console.log('Attachement de l\'écouteur pour le bouton annuler paramètres globaux');
    btnParametresAnnuler.addEventListener('click', () => {
        if (typeof annulerParametres === 'function') {
            annulerParametres();
        } else {
            console.error('La fonction annulerParametres n\'est pas définie');
        }
    });
} else {
    console.error('Bouton annuler paramètres globaux non trouvé dans le DOM');
}

// ==========================================
// RACCOURCIS CLAVIER (Avec Intelligence Complète)
// ==========================================

document.getElementById('btn-undo').addEventListener('click', undoAction);
document.getElementById('btn-redo').addEventListener('click', redoAction);

document.addEventListener('keydown', (e) => {
  if (e.ctrlKey || e.metaKey) {
    
    // Ctrl + Z
    if (e.key.toLowerCase() === 'z') { e.preventDefault(); undoAction(); }
    
    // Ctrl + Y
    if (e.key.toLowerCase() === 'y') { e.preventDefault(); redoAction(); }

    // Ctrl + C (Copie Intégrale)
    if (e.key.toLowerCase() === 'c' && selectedSlots.size > 0 && !isViewMode) {
      e.preventDefault();
      clipboardData = [];
      let involvedIndices = new Set();
      
      const firstKey = Array.from(selectedSlots)[0];
      const [ctxJour, , ctxEleveId] = firstKey.split('|');
      
      Array.from(selectedSlots).forEach(key => {
        const [j, h, eId] = key.split('|');
        if (j !== ctxJour || eId !== ctxEleveId) return; 
        
        let startIndex = HEURES.indexOf(h);
        if (startIndex === -1) return;
        
        involvedIndices.add(startIndex);
        let lesson = findLesson(j, h, eId);
        if (lesson) {
          for (let i = startIndex + 1; i < HEURES.length; i++) {
            let nextLesson = findLesson(j, HEURES[i], eId);
            if (nextLesson && isSameLesson(lesson, nextLesson)) {
              involvedIndices.add(i);
            } else {
              break;
            }
          }
        }
      });

      if (involvedIndices.size > 0) {
        let indices = Array.from(involvedIndices).sort((a,b) => a - b);
        let minIndex = indices[0];
        let maxIndex = indices[indices.length - 1];
        
        for (let i = minIndex; i <= maxIndex; i++) {
          if (isPauseTime(HEURES[i])) continue;
          let l = findLesson(ctxJour, HEURES[i], ctxEleveId);
          clipboardData.push({ offset: i - minIndex, lesson: l ? deepClone(l) : null });
        }
      }
    }

    // Ctrl + V (Collage Protégé et Groupé)
    if (e.key.toLowerCase() === 'v' && selectedSlots.size > 0 && clipboardData && clipboardData.length > 0 && !isViewMode) {
      e.preventDefault();
      
      let startingPoints = {};
      Array.from(selectedSlots).forEach(key => {
        const [j, h, eId] = key.split('|');
        if (eId === 'GLOBAL') return;
        let index = HEURES.indexOf(h);
        if (!startingPoints[eId] || index < startingPoints[eId].startIndex) {
          startingPoints[eId] = { j, startIndex: index };
        }
      });

      let conflicts = false;
      let outOfBounds = false;
      let overlapGlobal = false;

      // 1. Analyse
      Object.keys(startingPoints).forEach(eId => {
        let pt = startingPoints[eId];
        clipboardData.forEach(item => {
          let targetIndex = pt.startIndex + item.offset;
          if (targetIndex >= HEURES.length) {
            if (item.lesson !== null) outOfBounds = true;
          } else {
            let targetHeure = HEURES[targetIndex];
            if (item.lesson && isPauseTime(targetHeure)) overlapGlobal = true;
            if (item.lesson && findLesson(pt.j, targetHeure, eId)) conflicts = true;
          }
        });
      });

      // 2. Alertes
      if (outOfBounds) { alert("🛑 Impossible : Le bloc collé dépasse la fin de la journée."); return; }
      if (overlapGlobal) { alert("🛑 Impossible : Le bloc empiète sur une pause/cantine."); return; }
      if (conflicts) {
        if (!confirm("⚠️ Vous allez écraser des créneaux existants. Continuer ?")) return;
      }

      // 3. Exécution
      Object.keys(startingPoints).forEach(eId => {
        let pt = startingPoints[eId];
        let idMap = {};

        clipboardData.forEach(item => {
          let targetIndex = pt.startIndex + item.offset;
          if (targetIndex >= HEURES.length) return;
          let targetHeure = HEURES[targetIndex];

          if (isPauseTime(targetHeure)) return;

          state.creneaux = state.creneaux.filter(c => !(c.jour === pt.j && c.heure === targetHeure && c.eleveId === eId));

          if (item.lesson) {
            let oldId = item.lesson.id;
            if (!idMap[oldId]) idMap[oldId] = 'c' + state.nextCreneauIdNum++;
            
            let newLesson = deepClone(item.lesson);
            newLesson.id = idMap[oldId];
            newLesson.jour = pt.j;
            newLesson.heure = targetHeure;
            newLesson.eleveId = eId;
            state.creneaux.push(newLesson);
          }
        });
      });
      
      saveState();
      renderTable();
      if (typeof clearSelection === 'function') clearSelection();
    }
  }
});

function renderAll() {
  if (typeof renderDayTabs === 'function') renderDayTabs();
  if (typeof renderElevesList === 'function') renderElevesList();
  if (typeof renderTable === 'function') renderTable();
  if (typeof updateUndoRedoUI === 'function') updateUndoRedoUI();
}

renderAll();