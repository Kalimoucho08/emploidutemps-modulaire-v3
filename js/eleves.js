/**
 * js/eleves.js
 * Gestion de la modale "Gestion des élèves" (liste uniquement - édition via fiche complète)
 */

const elevesModalBackdrop = document.getElementById('eleves-modal-backdrop');

/**
 * Ouvre la modale de gestion des élèves
 */
function openElevesModal() {
  ModalManager.open('eleves-modal-backdrop');
  renderElevesListModal();
}

/**
 * Ferme la modale de gestion des élèves
 */
function closeElevesModal() {
  ModalManager.close('eleves-modal-backdrop');
}

/**
 * Construit la liste des élèves avec les boutons d'action
 */
function renderElevesListModal() {
  const listEl = document.getElementById('eleves-list-modal');
  listEl.innerHTML = '';
  document.getElementById('eleves-count').textContent = state.eleves.length;

  if (state.eleves.length === 0) {
    listEl.innerHTML = '<div style="font-size: 13px; color: #999; text-align: center; padding: 40px;">Aucun élève. Utilisez la fiche complète pour en ajouter.</div>';
    return;
  }

  const elevesTries = [...state.eleves].sort((a, b) => a.order - b.order);

  elevesTries.forEach((eleve, index) => {
    const div = document.createElement('div');
    div.style.cssText = 'display: flex; justify-content: space-between; align-items: center; padding: 10px 12px; background: ' + (eleve.actif ? '#f9f9f9' : '#f0f0f0') + '; border: 1px solid #ddd; border-radius: 6px; font-size: 13px; cursor: pointer;';
    div.style.borderColor = eleve.actif ? '#ddd' : '#ccc';

    if (!eleve.actif) div.style.opacity = '0.7';

    // Zone info (cliquable pour éditer)
    const infoDiv = document.createElement('div');
    infoDiv.style.cssText = 'flex: 1; margin-right: 12px;';
    infoDiv.addEventListener('click', () => openFicheEleve(eleve.id));

    let infoHtml = `<strong>${eleve.prenom || eleve.nom || 'Sans nom'}</strong>`;
    if (eleve.nom) infoHtml += `<br><span style="font-size:11px; color:#666;">${eleve.nom}</span>`;

    let tags = [];
    if (eleve.classe) tags.push(`<span style="background:#e3f2fd; color:#0d47a1; padding:2px 6px; border-radius:4px; font-size:10px;">${eleve.classe}</span>`);
    if (eleve.groupe) tags.push(`<span style="background:#e8f5e9; color:#2e7d32; padding:2px 6px; border-radius:4px; font-size:10px;">${eleve.groupe}</span>`);
    if (eleve.ulis) tags.push(`<span style="background:#fff3e0; color:#ff6f00; padding:2px 6px; border-radius:4px; font-size:10px; font-weight:bold;">ULIS</span>`);
    if (!eleve.actif) tags.push(`<span style="background:#eeeeee; color:#666; padding:2px 6px; border-radius:4px; font-size:10px;">Inactif</span>`);

    if (tags.length > 0) infoHtml += `<br><div style="display:flex; gap:4px; flex-wrap:wrap; margin-top:4px;">${tags.join('')}</div>`;

    infoDiv.innerHTML = infoHtml;

    // Zone actions
    const actionsDiv = document.createElement('div');
    actionsDiv.style.cssText = 'display: flex; gap: 4px; align-items: center;';

    const btnFiche = document.createElement('button');
    btnFiche.textContent = '📄';
    btnFiche.style.cssText = 'padding: 4px 8px; font-size: 12px; background: #9c27b0; border-color: #7b1fa2; color: white;';
    btnFiche.title = 'Fiche complète';
    btnFiche.onclick = (e) => { e.stopPropagation(); openFicheEleve(eleve.id); };

    const btnDelete = document.createElement('button');
    btnDelete.textContent = '❌';
    btnDelete.style.cssText = 'padding: 4px 8px; font-size: 12px; background: var(--danger); border-color: #b71c1c; color: white;';
    btnDelete.title = 'Supprimer';
    btnDelete.onclick = (e) => { e.stopPropagation(); deleteEleveConfirm(eleve.id); };

    actionsDiv.appendChild(btnFiche);
    actionsDiv.appendChild(btnDelete);

    div.appendChild(infoDiv);
    div.appendChild(actionsDiv);
    listEl.appendChild(div);
  });
}

/**
 * Supprime un élève après confirmation
 */
function deleteEleveConfirm(eleveId) {
  if (!confirm(`Supprimer cet élève ? Tous ses créneaux disparaîtront.`)) return;
  
  state.eleves = state.eleves.filter(e => e.id !== eleveId);
  state.creneaux = state.creneaux.filter(c => c.eleveId !== eleveId); // Supprime ses créneaux associés
  
  // Re-lisse l'ordre (0, 1, 2...)
  state.eleves.sort((a, b) => a.order - b.order).forEach((e, idx) => e.order = idx);
  
  saveState();
  renderElevesListModal();
  renderElevesList();
  renderTable();
  clearSelection();
}

// Écouteur pour le bouton "+ Ajouter un élève" dans la modale
document.getElementById('btn-add-eleve-in-modal')?.addEventListener('click', () => {
  openFicheEleve('new');
});

// Écouteur pour le bouton principal "Gestion des élèves"
document.getElementById('btn-add-eleve').addEventListener('click', () => openElevesModal());

// Écouteur pour le bouton "Fermer" de la modale
document.getElementById('btn-eleve-cancel').addEventListener('click', () => closeElevesModal());
