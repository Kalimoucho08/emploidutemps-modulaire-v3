/**
 * js/selection.js
 * Gère la sélection native (au clic ou Shift+Clic) et le verrouillage complet du Mode Consultation.
 */
let selectedSlots = new Set();
let lastSelectedSlot = null;

const btnViewMode = document.getElementById('btn-view-mode');
const btnBulkEdit = document.getElementById('btn-bulk-edit');

// BASCULE : Mode Édition <-> Mode Consultation
btnViewMode.addEventListener('click', () => {
  isViewMode = !isViewMode; // Variable globale issue de store.js
  
  if (isViewMode) {
    btnViewMode.classList.add('active'); 
    btnViewMode.innerHTML = '✏️ Passer en Édition';
    document.getElementById('normal-hint').style.display = 'none'; 
    document.getElementById('view-hint').style.display = 'inline';
    clearSelection(); // On vide les sélections en entrant en mode vue
  } else {
    btnViewMode.classList.remove('active'); 
    btnViewMode.innerHTML = '🔒 Mode Consultation';
    document.getElementById('normal-hint').style.display = 'inline'; 
    document.getElementById('view-hint').style.display = 'none';
  }
  
  // Désactive le bouton d'édition multiple si on est en consultation
  btnBulkEdit.disabled = isViewMode || selectedSlots.size === 0;
});

// GESTION DU CLIC SUR UNE CASE (SÉLECTION NATIVE)
// NOUVEAU : Ajout du paramètre spannedKeys pour gérer les cases fusionnées
function selectSlot(jour, heure, eleveId, addToSelection = false, rangeSelection = false, spannedKeys = null) {
  // Sécurité anti-clic en mode consultation
  if (isViewMode) return; 
  if (eleveId === 'GLOBAL') return;
  
  const key = `${jour}|${heure}|${eleveId}`;
  
  // Si aucune clé fusionnée n'est fournie, on utilise la clé simple
  const keysToToggle = spannedKeys && spannedKeys.length > 0 ? spannedKeys : [key];

  // LOGIQUE DU RECTANGLE DE SÉLECTION (SHIFT + CLIC)
  if (rangeSelection && lastSelectedSlot) {
    const [lastJour, lastHeure, lastEleveId] = lastSelectedSlot.split('|');

    if (lastJour === jour) {
      const lastHeureIndex = HEURES.indexOf(lastHeure);
      const currentHeureIndex = HEURES.indexOf(heure);

      const elevesActifs = state.eleves.filter(e => e.actif).sort((a, b) => a.order - b.order);
      const lastEleveIndex = elevesActifs.findIndex(e => e.id === lastEleveId);
      const currentEleveIndex = elevesActifs.findIndex(e => e.id === eleveId);

      // Si on trouve bien les coordonnées du premier clic et du deuxième clic
      if (lastHeureIndex !== -1 && currentHeureIndex !== -1 && lastEleveIndex !== -1 && currentEleveIndex !== -1) {
        const minH = Math.min(lastHeureIndex, currentHeureIndex);
        const maxH = Math.max(lastHeureIndex, currentHeureIndex);
        const minE = Math.min(lastEleveIndex, currentEleveIndex);
        const maxE = Math.max(lastEleveIndex, currentEleveIndex);

        if (!addToSelection) selectedSlots.clear();

        // On remplit le rectangle
        for (let h = minH; h <= maxH; h++) {
          for (let e = minE; e <= maxE; e++) {
            selectedSlots.add(`${jour}|${HEURES[h]}|${elevesActifs[e].id}`);
          }
        }
        lastSelectedSlot = key; // On mémorise la case exacte cliquée
        updateSelectionUI();
        renderTable();
        return;
      }
    }
  }

  // LOGIQUE DU CLIC STANDARD OU CTRL+CLIC (GESTION DES BLOCS FUSIONNÉS)
  if (!addToSelection && !rangeSelection) selectedSlots.clear();
  
  // Si au moins une sous-case du bloc est déjà sélectionnée, on désélectionne tout le bloc
  const isSelected = keysToToggle.some(k => selectedSlots.has(k));
  if (isSelected) {
    keysToToggle.forEach(k => selectedSlots.delete(k));
  } else {
    keysToToggle.forEach(k => selectedSlots.add(k));
  }

  lastSelectedSlot = keysToToggle[keysToToggle.length - 1];
  updateSelectionUI();
  renderTable();
}

function clearSelection() {
  selectedSlots.clear(); 
  lastSelectedSlot = null; 
  updateSelectionUI(); 
  renderTable();
}

document.getElementById('btn-clear-selection').addEventListener('click', clearSelection);

function updateSelectionUI() {
  document.getElementById('selected-count').textContent = selectedSlots.size;
  document.getElementById('selection-count').textContent = selectedSlots.size;
  
  if(selectedSlots.size > 0 && !isViewMode) {
    document.getElementById('selection-bar').classList.add('visible');
    btnBulkEdit.disabled = false;
  } else {
    document.getElementById('selection-bar').classList.remove('visible');
    btnBulkEdit.disabled = true;
  }
}