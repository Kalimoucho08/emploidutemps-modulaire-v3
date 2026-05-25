/**
 * js/contextmenu.js
 * Gère le clic droit et les actions rapides
 */

const contextMenu = document.getElementById('custom-context-menu');
const menuEdit = document.getElementById('menu-edit');
const menuCopy = document.getElementById('menu-copy');
const menuPaste = document.getElementById('menu-paste');
const menuDupWeek = document.getElementById('menu-duplicate-week');
const menuDelete = document.getElementById('menu-delete');

let ctxJour, ctxHeure, ctxEleveId;
let ctxLessonToCopy = null; 

function getTargetKeys() {
  const clickedKey = `${ctxJour}|${ctxHeure}|${ctxEleveId}`;
  if (typeof selectedSlots !== 'undefined' && selectedSlots.has(clickedKey)) {
    return Array.from(selectedSlots);
  }
  return [clickedKey];
}

function showContextMenu(x, y, jour, heure, eleveId) {
  ctxJour = jour; 
  ctxHeure = heure; 
  ctxEleveId = eleveId;
  ctxLessonToCopy = null;
  
  let lesson = findLesson(jour, heure, eleveId);
  const clickedKey = `${ctxJour}|${ctxHeure}|${ctxEleveId}`;
  
  if (!lesson && typeof selectedSlots !== 'undefined' && selectedSlots.has(clickedKey)) {
    for (let key of selectedSlots) {
      const [j, h, eId] = key.split('|');
      const l = findLesson(j, h, eId);
      if (l) { lesson = l; break; }
    }
  }
  
  if (lesson) ctxLessonToCopy = lesson;

  if (!ctxLessonToCopy && eleveId !== 'GLOBAL') {
    menuCopy.classList.add('disabled');
  } else {
    menuCopy.classList.remove('disabled');
  }
  
  if (!clipboardData || clipboardData.length === 0) {
    menuPaste.classList.add('disabled');
  } else {
    menuPaste.classList.remove('disabled');
  }

  contextMenu.style.left = x + 'px';
  contextMenu.style.top = y + 'px';
  ModalManager.open('custom-context-menu');
}

function hideContextMenu() {
    console.log('DEBUG contextmenu.js: hideContextMenu() appelé');
    ModalManager.close('custom-context-menu');
}
document.addEventListener('click', hideContextMenu);

menuEdit.addEventListener('click', () => {
  if(isViewMode) return;
  const targets = getTargetKeys();
  if (targets.length > 1) {
    document.getElementById('btn-bulk-edit').click();
  } else {
    if (typeof openSlotModal === 'function') openSlotModal(ctxJour, ctxHeure, ctxEleveId);
  }
});

// ACTION : Copier Intégral (Scanne les queues de blocs)
menuCopy.addEventListener('click', () => {
  if(isViewMode || menuCopy.classList.contains('disabled')) return;
  
  clipboardData = []; 
  let involvedIndices = new Set();
  const targets = getTargetKeys();

  targets.forEach(key => {
    const [j, h, eId] = key.split('|');
    if (j !== ctxJour || eId !== ctxEleveId) return; // On copie sur une seule colonne
    
    let startIndex = HEURES.indexOf(h);
    if (startIndex === -1) return;
    
    involvedIndices.add(startIndex);
    let lesson = findLesson(j, h, eId);
    
    // Si c'est un bloc fusionné, on cherche jusqu'où il descend
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
      if (isPauseTime(HEURES[i])) continue; // On ne copie pas les récréations
      
      let l = findLesson(ctxJour, HEURES[i], ctxEleveId);
      clipboardData.push({ offset: i - minIndex, lesson: l ? deepClone(l) : null });
    }
  }
});

// ACTION : Coller Sécurisé et Unifié
menuPaste.addEventListener('click', () => {
  if(isViewMode || menuPaste.classList.contains('disabled') || !clipboardData || clipboardData.length === 0) return;
  
  const targets = getTargetKeys(); 
  
  // NOUVEAU : On ne retient que le point le plus haut de chaque colonne (Évite l'effet "multi-collage décalé")
  let startingPoints = {};
  targets.forEach(key => {
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

  // 1. ANALYSE (Détection d'écrasement ou de dépassement)
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

  // 2. ALERTES
  if (outOfBounds) { alert("🛑 Impossible : Le bloc collé dépasse la fin de journée."); return; }
  if (overlapGlobal) { alert("🛑 Impossible : Le bloc empiète sur une récréation ou la cantine."); return; }
  if (conflicts) {
    if (!confirm("⚠️ Vous allez écraser des créneaux existants. Continuer ?")) return;
  }

  // 3. EXÉCUTION DU COLLAGE
  Object.keys(startingPoints).forEach(eId => {
    let pt = startingPoints[eId];
    let idMap = {}; // Permet de conserver les blocs fusionnés intacts

    clipboardData.forEach(item => {
      let targetIndex = pt.startIndex + item.offset;
      if (targetIndex >= HEURES.length) return;
      let targetHeure = HEURES[targetIndex];

      if (isPauseTime(targetHeure)) return;

      // On vide la case
      state.creneaux = state.creneaux.filter(c => !(c.jour === pt.j && c.heure === targetHeure && c.eleveId === eId));

      // On y met la nouvelle leçon
      if (item.lesson) {
        let oldId = item.lesson.id;
        if (!idMap[oldId]) idMap[oldId] = 'c' + state.nextCreneauIdNum++;
        
        let newLesson = deepClone(item.lesson);
        newLesson.id = idMap[oldId]; // Applique le même ID pour fusionner le bloc
        newLesson.jour = pt.j;
        newLesson.heure = targetHeure;
        newLesson.eleveId = eId;
        state.creneaux.push(newLesson);
      }
    });
  });

  saveState(); 
  if (typeof renderTable === 'function') renderTable();
  if (typeof clearSelection === 'function') clearSelection();
});

menuDelete.addEventListener('click', () => {
  if(isViewMode) return;
  const targets = getTargetKeys();
  targets.forEach(key => {
    const [j, h, eId] = key.split('|');
    state.creneaux = state.creneaux.filter(c => !(c.jour === j && c.heure === h && c.eleveId === eId));
  });
  saveState();
  if (typeof renderTable === 'function') renderTable();
  if (typeof clearSelection === 'function') clearSelection();
});

menuDupWeek.addEventListener('click', () => {
  if(isViewMode) return;
  const targets = getTargetKeys();
  targets.forEach(key => {
    const [originalJour, h, eId] = key.split('|');
    const lesson = findLesson(originalJour, h, eId);
    if (lesson) {
      JOURS.forEach(otherDay => {
        if (otherDay !== originalJour) {
           let dest = findLesson(otherDay, h, eId);
           if (!dest) {
             dest = { id: 'c' + state.nextCreneauIdNum++, jour: otherDay, heure: h, eleveId: eId };
             state.creneaux.push(dest);
           }
           dest.matiere = lesson.matiere;
           dest.groupe = lesson.groupe;
           dest.adulte = lesson.adulte;
           dest.roleAdulte = lesson.roleAdulte;
           dest.type = lesson.type;
           dest.color = lesson.color;
           dest.textColor = lesson.textColor;
           dest.commentaire = lesson.commentaire;
        }
      });
    }
  });
  saveState();
  if (typeof renderTable === 'function') renderTable();
  if (typeof clearSelection === 'function') clearSelection();
});