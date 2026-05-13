/**
 * js/ui.js
 */
let currentDraggedEleveId = null;

/**
 * Obtient la valeur d'une variable CSS avec fallback
 * @param {string} variableName - Nom de la variable CSS (sans '--')
 * @param {string} fallback - Valeur de fallback si la variable n'est pas définie
 * @returns {string} Valeur de la variable ou fallback
 */
function getCssVariable(variableName, fallback) {
  const value = getComputedStyle(document.documentElement).getPropertyValue(`--${variableName}`).trim();
  return value || fallback;
}

/**
 * Obtient la couleur d'un élève en fonction de son index dans la liste des couleurs élèves
 * @param {number} index - Index de l'élève dans la liste des élèves actifs
 * @returns {string} Couleur hexadécimale ou variable CSS
 */
function getCouleurEleve(index) {
  // Utiliser les variables CSS --couleur-palette-1 à --couleur-palette-12
  const paletteIndex = (index % 12) + 1;
  const cssVariable = `couleur-palette-${paletteIndex}`;
  
  // Fallback aux couleurs par défaut si la variable CSS n'est pas définie
  const fallbackColors = ['#4a6fa5', '#28a745', '#dc3545', '#ffc107', '#9c27b0', '#00bcd4'];
  const fallback = fallbackColors[index % fallbackColors.length];
  
  return `var(--${cssVariable}, ${fallback})`;
}

/**
 * Obtient la couleur par défaut pour un type de créneau
 * @param {string} type - Type de créneau ('fixe', 'exception', 'pause')
 * @returns {string} Couleur hexadécimale
 */
function getCouleurCreneau(type) {
  const couleursCreneaux = state.parametres.couleurs?.creneaux;
  if (couleursCreneaux && couleursCreneaux[type]) {
    return couleursCreneaux[type];
  }
  // Fallback aux couleurs par défaut
  const couleursDefaut = {
    fixe: '#4a6fa5',
    exception: '#ffc107',
    pause: '#6c757d'
  };
  return couleursDefaut[type] || '#e0e0e0';
}

/**
 * Obtient la couleur pour un type de regroupement (simplifié)
 * @param {string} regroupementType - Type de regroupement ('ULIS', 'INCLUSION', 'DECLOISONNEMENT', 'PEC', 'AUTRE')
 * @returns {string} Couleur hexadécimale ou variable CSS
 */
function getCouleurParRegroupementType(regroupementType) {
  // Désormais, nous n'utilisons plus l'association couleurs ↔ types de regroupement.
  // Cette fonction est conservée pour compatibilité mais retourne une couleur par défaut.
  // En pratique, les couleurs des créneaux sont définies par leur propriété `couleurIndex`.
  
  // Couleurs par défaut pour chaque type (pour rétrocompatibilité)
  const couleursParType = {
    'ULIS': '#fff3e0',
    'INCLUSION': '#e8f5e9',
    'DECLOISONNEMENT': '#e3f2fd',
    'PEC': '#fce4ec',
    'AUTRE': '#f5f5f5'
  };
  return couleursParType[regroupementType] || '#f5f5f5';
}

/**
 * Obtient la couleur d'un créneau en fonction de son index de couleur (0-11)
 * Utilise la variable CSS --couleur-palette-{index+1} avec fallback à la couleur hexadécimale de la palette.
 * @param {number} couleurIndex - Index de couleur (0-11)
 * @returns {string} Couleur CSS (variable ou hexadécimale)
 */
function getCouleurParIndex(couleurIndex) {
  // S'assurer que l'index est valide (0-11)
  const index = Math.max(0, Math.min(11, couleurIndex));
  const cssVariable = `couleur-palette-${index + 1}`;
  
  // Fallback à la couleur de la palette si la variable CSS n'est pas définie
  const palette = state.parametres.paletteCouleurs || [];
  const fallback = palette[index] || '#cccccc';
  
  return `var(--${cssVariable}, ${fallback})`;
}

/**
 * Trouve l'index d'une couleur hexadécimale dans la palette actuelle
 * @param {string} couleurHex - Couleur hexadécimale (ex: #bbdefb)
 * @returns {number} Index (0-11) ou -1 si non trouvée
 */
function trouverIndexCouleur(couleurHex) {
  const palette = state.parametres?.paletteCouleurs || [];
  // Normaliser la couleur (enlever le #, mettre en minuscules)
  const norm = couleurHex?.toLowerCase().replace(/^#/, '');
  for (let i = 0; i < palette.length; i++) {
    const paletteNorm = palette[i]?.toLowerCase().replace(/^#/, '');
    if (paletteNorm === norm) {
      return i;
    }
  }
  return -1;
}

function renderDayTabs() {
  const dayTabsEl = document.getElementById('day-tabs');
  dayTabsEl.innerHTML = '';
  const joursAffiches = state.parametres.joursAffiches || JOURS;
  joursAffiches.forEach(jour => {
    const btn = document.createElement('button');
    btn.className = 'day-tab' + (jour === currentDay ? ' active' : '');
    btn.textContent = jour[0].toUpperCase() + jour.slice(1, 3);
    btn.addEventListener('click', () => { currentDay = jour; renderDayTabs(); clearSelection(); renderTable(); });
    dayTabsEl.appendChild(btn);
  });
}

function renderElevesList() {
  const elevesListEl = document.getElementById('eleves-list');
  elevesListEl.innerHTML = '';
  state.eleves.forEach(eleve => {
    const label = document.createElement('label');
    label.className = 'eleve-pill' + (eleve.actif ? '' : ' inactif');
    
    const cb = document.createElement('input');
    cb.type = 'checkbox'; cb.checked = eleve.actif;
    cb.addEventListener('change', () => { 
      if(isViewMode) { cb.checked = !cb.checked; return; }
      eleve.actif = cb.checked; saveState(); renderElevesList(); renderTable(); 
    });
    
    const span = document.createElement('span');
    span.textContent = eleve.prenom || eleve.nom;
    label.appendChild(cb); label.appendChild(span);
    elevesListEl.appendChild(label);
  });
}

function renderTable() {
  const edtTableEl = document.getElementById('edt-table');
  edtTableEl.innerHTML = '';
  const elevesActifs = state.eleves.filter(e => e.actif).sort((a, b) => a.order - b.order);
  
  const thead = document.createElement('thead');
  const trHead = document.createElement('tr');
  const thHeure = document.createElement('th'); thHeure.className = 'heure-header'; thHeure.textContent = 'Heure';
  trHead.appendChild(thHeure);
  
  elevesActifs.forEach(eleve => {
    const th = document.createElement('th');
    th.className = 'eleve-header'; th.textContent = eleve.prenom || eleve.nom || 'Sans nom';
    th.draggable = true;
    th.addEventListener('dragstart', e => { 
      if(isViewMode) { e.preventDefault(); return; }
      currentDraggedEleveId = eleve.id; 
      e.dataTransfer.setData('text/plain', 'drag'); 
      e.dataTransfer.effectAllowed = 'move';
      th.classList.add('dragging'); 
    });
    th.addEventListener('dragend', () => { th.classList.remove('dragging'); currentDraggedEleveId = null; });
    th.addEventListener('dragover', e => { if(isViewMode) return; e.preventDefault(); e.dataTransfer.dropEffect = 'move'; th.classList.add('drag-over'); });
    th.addEventListener('dragleave', () => th.classList.remove('drag-over'));
    th.addEventListener('drop', e => {
      if(isViewMode) return; e.preventDefault(); th.classList.remove('drag-over');
      const draggedId = currentDraggedEleveId;
      if (!draggedId || draggedId === eleve.id) return;
      const dIdx = elevesActifs.findIndex(e => e.id === draggedId);
      const tIdx = elevesActifs.findIndex(e => e.id === eleve.id);
      const draggedEleve = elevesActifs.splice(dIdx, 1)[0];
      elevesActifs.splice(tIdx, 0, draggedEleve);
      elevesActifs.forEach((el, i) => el.order = i);
      state.eleves.sort((a, b) => a.order - b.order);
      saveState(); renderTable();
    });
    th.addEventListener('dblclick', () => {
      if (!isViewMode && typeof openFicheEleve === 'function') {
        openFicheEleve(eleve.id);
      }
    });
    trHead.appendChild(th);
  });
  thead.appendChild(trHead); edtTableEl.appendChild(thead);

  const tbody = document.createElement('tbody');
  
  let skipGlobalManual = 0; 
  let skipGlobalParam = 0;
  let skipEleves = {};

  // Remplacement du forEach par un for classique pour contrôler finement l'avancée
  for (let i = 0; i < HEURES.length; i++) {
    const heure = HEURES[i];

    // 1. GESTION DES PAUSES AUTOMATIQUES CONFIGURÉES EN PARAMÈTRE (Cantine, Récré)
    if (skipGlobalParam > 0) {
      skipGlobalParam--;
      continue; // Zappe complètement la création de lignes HTML pour gagner de la place !
    }

    const autoPause = state.parametres.pauses.find(p => p.actif && p.debut === heure);
    if (autoPause) {
      let slotsToSkip = 0;
      // Cherche combien de "créneaux" sont mangés par cette pause
      for(let j = i + 1; j < HEURES.length; j++) {
        if (HEURES[j] < autoPause.fin) slotsToSkip++;
        else break;
      }

      const tr = document.createElement('tr');
      const tdHeure = document.createElement('td');
      tdHeure.className = 'heure-cell';
      // Affiche l'heure de début et de fin proprement sur la ligne compressée
      tdHeure.innerHTML = `${formatHeure(autoPause.debut)}<br><span style="font-size:9px; opacity:0.6;">à</span><br>${formatHeure(autoPause.fin)}`;
      tr.appendChild(tdHeure);

      const td = document.createElement('td');
      td.colSpan = elevesActifs.length;
      td.className = 'slot-cell global-slot';
      td.style.backgroundColor = autoPause.couleur || getCouleurCreneau('pause');
      td.style.color = '#000';
      
      const inner = document.createElement('div');
      inner.className = 'slot-inner';
      inner.style.justifyContent = 'center'; inner.style.alignItems = 'center'; inner.style.display = 'flex';
      inner.style.fontSize = '12px'; inner.style.fontWeight = 'bold'; inner.style.letterSpacing = '1px';
      inner.textContent = autoPause.nom;
      
      td.appendChild(inner);
      tr.appendChild(td);
      tbody.appendChild(tr);

      // Met à jour le compteur pour sauter les tours de boucle suivants
      skipGlobalParam = slotsToSkip;
      continue; 
    }

    // 2. GESTION CLASSIQUE DES CRÉNEAUX ET DES PAUSES MANUELLES (Créées au clic)
    const tr = document.createElement('tr');
    
    const tdHeure = document.createElement('td');
    tdHeure.className = 'heure-cell';
    tdHeure.textContent = formatHeure(heure);
    tdHeure.title = "Créer une pause/récréation globale manuelle";
    tdHeure.addEventListener('click', () => { if(!isViewMode) openSlotModal(currentDay, heure, 'GLOBAL'); });
    tr.appendChild(tdHeure);

    if (skipGlobalManual > 0) {
      skipGlobalManual--;
      tbody.appendChild(tr);
      continue; 
    }

    const manualGlobalLesson = findLesson(currentDay, heure, 'GLOBAL');
    
    if (manualGlobalLesson) {
      let rowspan = 1;
      let spannedKeys = [`${currentDay}|${heure}|GLOBAL`];
      
      for (let j = i + 1; j < HEURES.length; j++) {
        const nextL = findLesson(currentDay, HEURES[j], 'GLOBAL');
        if (isSameLesson(manualGlobalLesson, nextL)) {
          rowspan++;
          spannedKeys.push(`${currentDay}|${HEURES[j]}|GLOBAL`);
        } else break;
      }
      if (rowspan > 1) skipGlobalManual = rowspan - 1;

      const td = document.createElement('td');
      td.colSpan = elevesActifs.length;
      td.rowSpan = rowspan;
      td.className = 'slot-cell global-slot';
      td.style.backgroundColor = manualGlobalLesson.color || getCouleurCreneau('pause');
      td.style.color = manualGlobalLesson.textColor || '#000';
      
      const inner = document.createElement('div');
      inner.className = 'slot-inner';
      inner.style.justifyContent = 'center'; inner.style.alignItems = 'center'; inner.style.display = 'flex';
      inner.style.fontSize = '12px'; inner.style.fontWeight = 'bold'; inner.style.letterSpacing = '1px';
      inner.textContent = manualGlobalLesson.matiere || 'PAUSE MANUELLE';
      
      inner.addEventListener('dblclick', () => {
        if(isViewMode) return;
        openSlotModal(currentDay, heure, 'GLOBAL', spannedKeys);
      });
      inner.addEventListener('contextmenu', (e) => {
        if(isViewMode) return;
        e.preventDefault();
        spannedKeys.forEach(k => selectedSlots.add(k)); 
        showContextMenu(e.pageX, e.pageY, currentDay, heure, 'GLOBAL');
      });

      td.appendChild(inner);
      tr.appendChild(td);

    } else {
      elevesActifs.forEach((eleve, eleveIndex) => {
        if (skipEleves[eleve.id] > 0) {
          skipEleves[eleve.id]--;
          return;
        }

        const lesson = findLesson(currentDay, heure, eleve.id);
        let rowspan = 1;
        let spannedKeys = [`${currentDay}|${heure}|${eleve.id}`];

        if (lesson) {
          for (let j = i + 1; j < HEURES.length; j++) {
            // Une pause configurée ou manuelle casse la fusion
            const hasAuto = state.parametres.pauses.find(p => p.actif && p.debut === HEURES[j]);
            if (hasAuto || findLesson(currentDay, HEURES[j], 'GLOBAL')) break;
            
            const nextL = findLesson(currentDay, HEURES[j], eleve.id);
            if (isSameLesson(lesson, nextL)) {
              rowspan++;
              spannedKeys.push(`${currentDay}|${HEURES[j]}|${eleve.id}`);
            } else break;
          }
          if (rowspan > 1) skipEleves[eleve.id] = rowspan - 1;
        }

        const td = document.createElement('td');
        td.className = 'slot-cell';
        td.rowSpan = rowspan;
        
        const inner = document.createElement('div');
        inner.className = 'slot-inner';
        
        const isSelected = spannedKeys.some(k => selectedSlots.has(k));
        if (isSelected) inner.classList.add('selected');

        if (lesson) {
          inner.classList.add('has-lesson');
          // Déterminer la couleur de fond
          let backgroundColor;
          // Priorité 1 : couleurIndex (0-11) qui référence la palette
          if (typeof lesson.couleurIndex === 'number' && lesson.couleurIndex >= 0 && lesson.couleurIndex <= 11) {
            backgroundColor = getCouleurParIndex(lesson.couleurIndex);
            console.log(`Créneau ${lesson.id}: couleurIndex=${lesson.couleurIndex}, backgroundColor=${backgroundColor} (via getCouleurParIndex)`);
          }
          // Priorité 2 : color (peut être un index ou une couleur hexadécimale)
          else if (lesson.color) {
            // Si color est un nombre, le traiter comme un index
            const colorNum = Number(lesson.color);
            if (!isNaN(colorNum) && colorNum >= 0 && colorNum <= 11) {
              backgroundColor = getCouleurParIndex(colorNum);
              console.log(`Créneau ${lesson.id}: color=${lesson.color} (numérique), backgroundColor=${backgroundColor} (via getCouleurParIndex)`);
            } else {
              // Sinon, essayer de trouver l'index correspondant dans la palette
              const index = trouverIndexCouleur(lesson.color);
              if (index >= 0) {
                backgroundColor = getCouleurParIndex(index);
                console.log(`Créneau ${lesson.id}: color=${lesson.color} (hexadécimale), index=${index}, backgroundColor=${backgroundColor} (via getCouleurParIndex)`);
              } else {
                // Si la couleur n'est pas dans la palette, utiliser directement la valeur hexadécimale
                backgroundColor = lesson.color;
                console.log(`Créneau ${lesson.id}: color=${lesson.color} (hexadécimale), non trouvée dans palette, backgroundColor=${backgroundColor} (direct)`);
              }
            }
          }
          // Priorité 3 : couleur par défaut de l'élève
          else {
            backgroundColor = getCouleurEleve(eleveIndex);
            console.log(`Créneau ${lesson.id}: pas de couleur, backgroundColor=${backgroundColor} (couleur élève)`);
          }
          inner.style.backgroundColor = backgroundColor;
          inner.style.color = lesson.textColor || '#000000';
          
          if (lesson.matiere) { const m = document.createElement('div'); m.className = 'slot-matiere'; m.textContent = lesson.matiere; inner.appendChild(m); }
          if (lesson.groupe) { const g = document.createElement('div'); g.className = 'slot-groupe'; g.textContent = lesson.groupe; inner.appendChild(g); }
          if (lesson.adulte) {
            const a = document.createElement('div'); a.className = 'slot-adulte-badge';
            a.style.backgroundColor = lesson.roleAdulte === 'enseignant' ? 'var(--role-enseignant)' : (lesson.roleAdulte === 'aeshco' ? 'var(--role-aeshco)' : 'var(--role-autre)');
            a.textContent = lesson.adulte; inner.appendChild(a);
          }
        }
        
        inner.addEventListener('click', (e) => {
          if (isViewMode) return; 
          e.stopPropagation(); 
          selectSlot(currentDay, heure, eleve.id, e.ctrlKey || e.metaKey, e.shiftKey, spannedKeys); 
        });

        inner.addEventListener('dblclick', (e) => {
          if (isViewMode) return;
          e.stopPropagation();
          
          // Vérifie si tous les créneaux sélectionnés font partie du même bloc fusionné
          const isSingleMergedBlock = spannedKeys.length > 1 &&
            Array.from(selectedSlots).every(key => spannedKeys.includes(key));
          
          // Cas 1 : Double-clic sur un créneau fusionné (spannedKeys.length > 1)
          // → Ouvre l'édition simple avec pré-remplissage des données du premier créneau
          // Ce cas s'applique même si selectedSlots.size > 1, tant que tous les créneaux
          // sélectionnés font partie du même bloc fusionné
          if (isSingleMergedBlock) {
            openSlotModal(currentDay, heure, eleve.id, spannedKeys);
          }
          // Cas 2 : Double-clic avec plusieurs créneaux différents sélectionnés (édition multiple)
          // → Ouvre l'édition multiple avec pré-remplissage intelligent
          else if (selectedSlots.size > 1) {
            // Ajoute les clés fusionnées à la sélection si nécessaire
            spannedKeys.forEach(k => selectedSlots.add(k));
            updateSelectionUI();
            document.getElementById('btn-bulk-edit').click();
          }
          // Cas 3 : Double-clic normal sur un créneau simple
          else {
            openSlotModal(currentDay, heure, eleve.id);
          }
        });

        inner.addEventListener('contextmenu', (e) => {
          if (isViewMode) return; 
          e.preventDefault();
          spannedKeys.forEach(k => selectedSlots.add(k)); 
          updateSelectionUI();
          renderTable();
          showContextMenu(e.pageX, e.pageY, currentDay, heure, eleve.id);
        });
        
        td.appendChild(inner); 
        tr.appendChild(td);
      });
    }
    tbody.appendChild(tr);
  }
  edtTableEl.appendChild(tbody);
}