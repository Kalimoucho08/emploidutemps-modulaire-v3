/**
 * js/eleves-fiche.js
 * Gestion de la fiche complète des élèves (affichage, sauvegarde, impression)
 */

/**
 * Vérifie si une date est expirée (avant aujourd'hui)
 */
function isDateExpired(dateStr) {
  if (!dateStr) return false;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const date = new Date(dateStr);
  return date < today;
}

/**
 * Retourne le style pour afficher une date MDPH (rouge si expirée)
 */
function getMdphDateStyle(dateStr) {
  if (isDateExpired(dateStr)) {
    return 'color: #c62828; font-weight: bold; background: #ffcdd2; border: 2px solid #c62828;';
  }
  return '';
}

/**
 * Affiche le tableau des droits MDPH dans un formulaire
 * @param {string} prefix - Préfixe des IDs ('eleve' ou 'fiche')
 * @param {Object} droits - Objet des droits MDPH
 */
function renderDroitsMdphTable(prefix, droits) {
  const tableBody = document.getElementById(prefix + '-mdph-table');
  if (!tableBody) return;

  tableBody.innerHTML = '';

  const types = [
    { key: 'ulis', label: 'ULIS' },
    { key: 'sessad', label: 'SESSAD' },
    { key: 'aesh', label: 'AESH' },
    { key: 'transport', label: 'Transport' },
    { key: 'autre', label: 'Autre' }
  ];

  types.forEach(({ key, label }) => {
    const droit = droits?.[key] || { date: '', type: '' };
    const dateStyle = getMdphDateStyle(droit.date);

    const tr = document.createElement('tr');
    tr.style.cssText = 'background: ' + (key === 'autre' ? '#fff' : '#f9f9f9');

    tr.innerHTML = `
      <td style="padding: 6px;"><strong>${label}</strong>${key === 'autre' && droit.description ? '<br><span style="font-size:10px; color:#666;">' + droit.description + '</span>' : ''}</td>
      <td style="padding: 6px;">
        <input type="date" id="${prefix}-mdph-${key}-date" value="${droit.date}" style="${dateStyle}">
      </td>
      <td style="padding: 6px;">
        <select id="${prefix}-mdph-${key}-type">
          <option value="">Non renseigné</option>
          <option value="notifie" ${droit.type === 'notifie' ? 'selected' : ''}>Notifié</option>
          <option value="en_attente" ${droit.type === 'en_attente' ? 'selected' : ''}>En attente</option>
          <option value="renouvellement" ${droit.type === 'renouvellement' ? 'selected' : ''}>Renouvellement</option>
          <option value="refuse" ${droit.type === 'refuse' ? 'selected' : ''}>Refusé</option>
        </select>
      </td>
    `;

    tableBody.appendChild(tr);
    });
  }
  
  /**
   * Applique la configuration des champs élève (masquage/désactivation)
   */
  function appliquerConfigurationChampsEleve() {
    // Récupérer la configuration des champs (par défaut tous activés)
    // Utiliser la structure unifiée state.parametres.champsAffiches.eleve
    const config = state.parametres.champsAffiches?.eleve || {
      classe: true,
      ulis: true,
      groupe: true,
      aesh: true,
      pec: true,
      niveau: true
    };
    
    // Masquer/désactiver les champs selon la configuration
    const champsMapping = {
      classe: ['fiche-eleve-classe', 'label-classe'],
      ulis: ['fiche-eleve-ulis', 'label-ulis'],
      groupe: ['fiche-eleve-groupe', 'label-groupe'],
      aesh: ['fiche-eleve-aesh-type', 'fiche-eleve-aesh-nom', 'fiche-eleve-aesh-heures', 'fiche-eleve-aesh-mutualise', 'label-aesh'],
      pec: ['fiche-eleve-pec-specialite', 'fiche-eleve-pec-organisme', 'fiche-eleve-pec-frequence', 'fiche-eleve-pec-lieu', 'fiche-eleve-pec-heures', 'label-pec'],
      niveau: ['fiche-eleve-niveau', 'label-niveau']
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
  }
  
  /**
   * Ouvre la fiche complète d'un élève
   * @param {string} eleveId - ID de l'élève
   */
  function openFicheEleve(eleveId) {
  let eleve;
  
  if (eleveId === 'new') {
    // Création d'un nouvel élève
    eleve = {
      id: 'e' + state.nextEleveIdNum++,
      prenom: '',
      nom: '',
      classe: '',
      dateNaissance: '',
      groupe: '',
      niveau: '',
      anneesUlis: 0,
      dateEntreeUlis: '',
      taxi: false,
      taxiCompagnie: '',
      cantine: false,
      telephoneUrgence: '',
      telephone: '',
      emailParents: '',
      adresse: '',
      aeshType: '',
      aeshNom: '',
      aeshHeures: 0,
      aeshMutualiseAvec: [],
      pecSpecialite: '',
      pecOrganisme: '',
      pecFrequence: '',
      pecLieu: '',
      pecHeures: 0,
      ulis: false,
      actif: true,
      droitsMdhph: {
        ulis: { date: '', type: '' },
        sessad: { date: '', type: '' },
        aesh: { date: '', type: '' },
        transport: { date: '', type: '' },
        autre: { date: '', type: '', description: '' }
      },
      notifications: [],
      allergies: '',
      regimeAlimentaire: '',
      informationsMedicales: '',
      remarques: '',
      enseignantReference: '',
      order: state.eleves.length
    };
  } else {
    // Édition d'un élève existant
    eleve = state.eleves.find(e => e.id === eleveId);
    if (!eleve) return;
  }
  
  // Titre de la fiche
  document.getElementById('fiche-eleve-title').textContent = `Fiche Élève - ${eleve.prenom || eleve.nom || 'Sans nom'}`;

  // Stocker l'ID de l'élève en cours d'édition
  let hiddenId = document.getElementById('fiche-eleve-edit-id');
  if (!hiddenId) {
    hiddenId = document.createElement('input');
    hiddenId.type = 'hidden';
    hiddenId.id = 'fiche-eleve-edit-id';
    document.getElementById('fiche-eleve-modal-backdrop').appendChild(hiddenId);
  }
  hiddenId.value = eleveId;

  // Informations personnelles
  document.getElementById('fiche-eleve-prenom').value = eleve.prenom || '';
  document.getElementById('fiche-eleve-nom').value = eleve.nom || '';
  document.getElementById('fiche-eleve-date-naissance').value = eleve.dateNaissance || '';
  document.getElementById('fiche-eleve-classe').value = eleve.classe || '';
  document.getElementById('fiche-eleve-groupe').value = eleve.groupe || '';
  document.getElementById('fiche-eleve-niveau').value = eleve.niveau || '';

  // Parcours scolaire
  document.getElementById('fiche-eleve-ulis').value = eleve.ulis ? 'true' : 'false';
  document.getElementById('fiche-eleve-annees-ulis').value = eleve.anneesUlis || 0;
  document.getElementById('fiche-eleve-date-entree-ulis').value = eleve.dateEntreeUlis || '';
  document.getElementById('fiche-eleve-date-entree').value = eleve.dateEntree || '';

  // Transport
  document.getElementById('fiche-eleve-taxi').checked = eleve.taxi || false;
  document.getElementById('fiche-eleve-taxi-compagnie').value = eleve.taxiCompagnie || '';
  document.getElementById('fiche-taxi-details').style.display = eleve.taxi ? 'block' : 'none';

  // Restauration
  document.getElementById('fiche-eleve-cantine').checked = eleve.cantine || false;

  // Contacts
  document.getElementById('fiche-eleve-telephone-urgence').value = eleve.telephoneUrgence || '';
  document.getElementById('fiche-eleve-telephone').value = eleve.telephone || '';
  document.getElementById('fiche-eleve-email').value = eleve.emailParents || '';
  document.getElementById('fiche-eleve-adresse').value = eleve.adresse || '';

  // AESH
  document.getElementById('fiche-eleve-aesh-type').value = eleve.aeshType || '';
  document.getElementById('fiche-eleve-aesh-nom').value = eleve.aeshNom || '';
  document.getElementById('fiche-eleve-aesh-heures').value = eleve.aeshHeures || 0;
  document.getElementById('fiche-eleve-aesh-mutualise').value = (eleve.aeshMutualiseAvec || []).join(', ');

  // PEC
  document.getElementById('fiche-eleve-pec-specialite').value = eleve.pecSpecialite || '';
  document.getElementById('fiche-eleve-pec-organisme').value = eleve.pecOrganisme || '';
  document.getElementById('fiche-eleve-pec-frequence').value = eleve.pecFrequence || '';
  document.getElementById('fiche-eleve-pec-lieu').value = eleve.pecLieu || '';
  document.getElementById('fiche-eleve-pec-heures').value = eleve.pecHeures || 0;

  // Droits MDPH
  const droits = eleve.droitsMdhph || {
    ulis: { date: '', type: '' },
    sessad: { date: '', type: '' },
    aesh: { date: '', type: '' },
    transport: { date: '', type: '' },
    autre: { date: '', type: '', description: '' }
  };

  document.getElementById('fiche-mdph-ulis-date').value = droits.ulis.date || '';
  document.getElementById('fiche-mdph-ulis-type').value = droits.ulis.type || '';
  document.getElementById('fiche-mdph-sessad-date').value = droits.sessad.date || '';
  document.getElementById('fiche-mdph-sessad-type').value = droits.sessad.type || '';
  document.getElementById('fiche-mdph-aesh-date').value = droits.aesh.date || '';
  document.getElementById('fiche-mdph-aesh-type').value = droits.aesh.type || '';
  document.getElementById('fiche-mdph-transport-date').value = droits.transport.date || '';
  document.getElementById('fiche-mdph-transport-type').value = droits.transport.type || '';
  document.getElementById('fiche-mdph-autre-date').value = droits.autre.date || '';
  document.getElementById('fiche-mdph-autre-type').value = droits.autre.type || '';
  document.getElementById('fiche-mdph-autre-description').value = droits.autre.description || '';

  // Notifications
  const notifs = eleve.notifications || [];
  document.getElementById('fiche-eleve-notif-pps').checked = notifs.includes('PPS');
  document.getElementById('fiche-eleve-notif-pai').checked = notifs.includes('PAI');
  document.getElementById('fiche-eleve-notif-pap').checked = notifs.includes('PAP');
  document.getElementById('fiche-eleve-notif-ppre').checked = notifs.includes('PPRE');
  document.getElementById('fiche-eleve-notif-ess').checked = notifs.includes('ESS');

  // Autres infos
  document.getElementById('fiche-eleve-allergies').value = eleve.allergies || '';
  document.getElementById('fiche-eleve-regime').value = eleve.regimeAlimentaire || '';
  document.getElementById('fiche-eleve-medical').value = eleve.informationsMedicales || '';
  document.getElementById('fiche-eleve-remarques').value = eleve.remarques || '';
  document.getElementById('fiche-eleve-actif').value = eleve.actif ? 'true' : 'false';
  document.getElementById('fiche-eleve-enseignant').value = eleve.enseignantReference || '';

  // Ouvrir la modale
  ModalManager.open('fiche-eleve-modal-backdrop');
  
  // Appliquer la configuration des champs
  appliquerConfigurationChampsEleve();
}

/**
 * Sauvegarde la fiche élève
 */
function saveFicheEleve() {
  const hiddenId = document.getElementById('fiche-eleve-edit-id');
  if (!hiddenId || !hiddenId.value) {
    alert('Erreur : impossible de trouver l\'ID de l\'élève.');
    return;
  }

  const isNewStudent = hiddenId.value === 'new';
  let eleve;

  if (isNewStudent) {
    // Création d'un nouvel élève
    const prenom = document.getElementById('fiche-eleve-prenom').value.trim();
    const nom = document.getElementById('fiche-eleve-nom').value.trim();

    if (!prenom && !nom) {
      alert('Veuillez saisir au moins un prénom ou un nom.');
      return;
    }

    const maxOrder = Math.max(...state.eleves.map(e => e.order), -1);
    eleve = {
      id: 'e' + state.nextEleveIdNum++,
      prenom,
      nom,
      order: maxOrder + 1,
      actif: true
    };

    state.eleves.push(eleve);
    hiddenId.value = eleve.id;
  } else {
    // Édition d'un élève existant
    const eleveId = hiddenId.value;
    eleve = state.eleves.find(e => e.id === eleveId);
    if (!eleve) {
      alert('Erreur : élève non trouvé.');
      return;
    }
  }

  // Informations personnelles
  eleve.prenom = document.getElementById('fiche-eleve-prenom').value.trim();
  eleve.nom = document.getElementById('fiche-eleve-nom').value.trim();
  eleve.dateNaissance = document.getElementById('fiche-eleve-date-naissance').value;
  eleve.classe = document.getElementById('fiche-eleve-classe').value.trim();
  eleve.groupe = document.getElementById('fiche-eleve-groupe').value.trim();
  eleve.niveau = document.getElementById('fiche-eleve-niveau').value;

  // Parcours scolaire
  eleve.ulis = document.getElementById('fiche-eleve-ulis').value === 'true';
  eleve.anneesUlis = parseInt(document.getElementById('fiche-eleve-annees-ulis').value) || 0;
  eleve.dateEntreeUlis = document.getElementById('fiche-eleve-date-entree-ulis').value;
  eleve.dateEntree = document.getElementById('fiche-eleve-date-entree').value;

  // Transport
  eleve.taxi = document.getElementById('fiche-eleve-taxi').checked;
  eleve.taxiCompagnie = document.getElementById('fiche-eleve-taxi-compagnie').value.trim();

  // Restauration
  eleve.cantine = document.getElementById('fiche-eleve-cantine').checked;

  // Contacts
  eleve.telephoneUrgence = document.getElementById('fiche-eleve-telephone-urgence').value.trim();
  eleve.telephone = document.getElementById('fiche-eleve-telephone').value.trim();
  eleve.emailParents = document.getElementById('fiche-eleve-email').value.trim();
  eleve.adresse = document.getElementById('fiche-eleve-adresse').value.trim();

  // AESH
  eleve.aeshType = document.getElementById('fiche-eleve-aesh-type').value;
  eleve.aeshNom = document.getElementById('fiche-eleve-aesh-nom').value.trim();
  eleve.aeshHeures = parseFloat(document.getElementById('fiche-eleve-aesh-heures').value) || 0;
  const mutualiseStr = document.getElementById('fiche-eleve-aesh-mutualise').value.trim();
  eleve.aeshMutualiseAvec = mutualiseStr ? mutualiseStr.split(',').map(s => s.trim()).filter(s => s) : [];

  // PEC
  eleve.pecSpecialite = document.getElementById('fiche-eleve-pec-specialite').value;
  eleve.pecOrganisme = document.getElementById('fiche-eleve-pec-organisme').value;
  eleve.pecFrequence = document.getElementById('fiche-eleve-pec-frequence').value.trim();
  eleve.pecLieu = document.getElementById('fiche-eleve-pec-lieu').value.trim();
  eleve.pecHeures = parseFloat(document.getElementById('fiche-eleve-pec-heures').value) || 0;

  // Droits MDPH
  eleve.droitsMdhph = {
    ulis: {
      date: document.getElementById('fiche-mdph-ulis-date').value,
      type: document.getElementById('fiche-mdph-ulis-type').value
    },
    sessad: {
      date: document.getElementById('fiche-mdph-sessad-date').value,
      type: document.getElementById('fiche-mdph-sessad-type').value
    },
    aesh: {
      date: document.getElementById('fiche-mdph-aesh-date').value,
      type: document.getElementById('fiche-mdph-aesh-type').value
    },
    transport: {
      date: document.getElementById('fiche-mdph-transport-date').value,
      type: document.getElementById('fiche-mdph-transport-type').value
    },
    autre: {
      date: document.getElementById('fiche-mdph-autre-date').value,
      type: document.getElementById('fiche-mdph-autre-type').value,
      description: document.getElementById('fiche-mdph-autre-description').value.trim()
    }
  };

  // Notifications
  const notifs = [];
  if (document.getElementById('fiche-eleve-notif-pps').checked) notifs.push('PPS');
  if (document.getElementById('fiche-eleve-notif-pai').checked) notifs.push('PAI');
  if (document.getElementById('fiche-eleve-notif-pap').checked) notifs.push('PAP');
  if (document.getElementById('fiche-eleve-notif-ppre').checked) notifs.push('PPRE');
  if (document.getElementById('fiche-eleve-notif-ess').checked) notifs.push('ESS');
  eleve.notifications = notifs;

  // Autres infos
  eleve.allergies = document.getElementById('fiche-eleve-allergies').value.trim();
  eleve.regimeAlimentaire = document.getElementById('fiche-eleve-regime').value.trim();
  eleve.informationsMedicales = document.getElementById('fiche-eleve-medical').value.trim();
  eleve.remarques = document.getElementById('fiche-eleve-remarques').value.trim();
  eleve.actif = document.getElementById('fiche-eleve-actif').value === 'true';
  eleve.enseignantReference = document.getElementById('fiche-eleve-enseignant').value.trim();

  // Sauvegarder
  saveState();
  renderElevesList();
  renderTable();
  alert('✅ Fiche élève sauvegardée avec succès !');
}

/**
 * Ferme la fiche élève
 */
function closeFicheEleve() {
  ModalManager.close('fiche-eleve-modal-backdrop');
}

/**
 * Imprime la fiche élève en PDF
 */
function printFicheEleve() {
  const hiddenId = document.getElementById('fiche-eleve-edit-id');
  if (!hiddenId || !hiddenId.value) {
    alert('Erreur : impossible de trouver l\'ID de l\'élève.');
    return;
  }

  const eleveId = hiddenId.value;
  const eleve = state.eleves.find(e => e.id === eleveId);
  if (!eleve) return;

  const printWindow = window.open('', '_blank');
  const today = new Date().toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit', year: 'numeric' });

  // Déterminer les styles pour les dates expirées
  const formatDate = (dateStr) => {
    if (!dateStr) return '-';
    const date = new Date(dateStr);
    const formatted = date.toLocaleDateString('fr-FR');
    if (isDateExpired(dateStr)) {
      return `<span style="color: #c62828; font-weight: bold;">${formatted} ⚠️ EXPIRÉ</span>`;
    }
    return formatted;
  };

  const printContent = `
<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8">
  <title>Fiche Élève - ${eleve.prenom || eleve.nom}</title>
  <style>
    * { box-sizing: border-box; }
    body { font-family: Arial, sans-serif; font-size: 12px; color: #333; line-height: 1.4; padding: 20px; }
    h1 { text-align: center; color: #0d47a1; border-bottom: 3px solid #0d47a1; padding-bottom: 10px; margin-bottom: 20px; }
    h2 { color: #0d47a1; border-bottom: 2px solid #0d47a1; padding-bottom: 5px; margin-top: 20px; font-size: 14px; }
    .section { margin-bottom: 15px; padding: 10px; background: #f9f9f9; border-radius: 4px; }
    .grid-2 { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; }
    .row { margin: 5px 0; }
    .label { font-weight: bold; display: inline-block; min-width: 180px; }
    .value { display: inline-block; }
    table { width: 100%; border-collapse: collapse; margin-top: 10px; }
    th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
    th { background: #0d47a1; color: white; }
    .badge { display: inline-block; padding: 2px 8px; border-radius: 12px; font-size: 10px; margin: 2px; }
    .badge-ulis { background: #fff3e0; color: #ff6f00; }
    .badge-pps { background: #e3f2fd; color: #0d47a1; }
    .badge-pai { background: #fce4ec; color: #c2185b; }
    .footer { margin-top: 30px; text-align: center; font-size: 10px; color: #999; }
    @media print { body { padding: 0; } }
  </style>
</head>
<body>
  <h1>📄 Fiche Élève</h1>
  
  <div class="section">
    <div class="grid-2">
      <div class="row"><span class="label">Nom :</span> <span class="value">${eleve.nom || '-'}</span></div>
      <div class="row"><span class="label">Prénom :</span> <span class="value">${eleve.prenom || '-'}</span></div>
      <div class="row"><span class="label">Date de naissance :</span> <span class="value">${eleve.dateNaissance ? new Date(eleve.dateNaissance).toLocaleDateString('fr-FR') : '-'}</span></div>
      <div class="row"><span class="label">Classe :</span> <span class="value">${eleve.classe || '-'}</span></div>
      <div class="row"><span class="label">Groupe :</span> <span class="value">${eleve.groupe || '-'}</span></div>
      <div class="row"><span class="label">Niveau :</span> <span class="value">${eleve.niveau || '-'}</span></div>
    </div>
  </div>
  
  <h2>🏫 Parcours scolaire</h2>
  <div class="section">
    <div class="row"><span class="label">Élève ULIS :</span> <span class="value">${eleve.ulis ? '✅ Oui' : '❌ Non'}</span></div>
    <div class="row"><span class="label">Années en ULIS :</span> <span class="value">${eleve.anneesUlis || 0}</span></div>
    <div class="row"><span class="label">Date entrée ULIS :</span> <span class="value">${eleve.dateEntreeUlis ? new Date(eleve.dateEntreeUlis).toLocaleDateString('fr-FR') : '-'}</span></div>
    <div class="row"><span class="label">Date entrée école :</span> <span class="value">${eleve.dateEntree ? new Date(eleve.dateEntree).toLocaleDateString('fr-FR') : '-'}</span></div>
  </div>
  
  <h2>🚗 Transport</h2>
  <div class="section">
    <div class="row"><span class="label">Taxi scolaire :</span> <span class="value">${eleve.taxi ? '✅ Oui' : '❌ Non'}</span></div>
    ${eleve.taxi ? `<div class="row"><span class="label">Compagnie :</span> <span class="value">${eleve.taxiCompagnie || '-'}</span></div>` : ''}
  </div>
  
  <h2>🍽️ Restauration</h2>
  <div class="section">
    <div class="row"><span class="label">Cantine :</span> <span class="value">${eleve.cantine ? '✅ Oui' : '❌ Non'}</span></div>
  </div>
  
  <h2>📞 Contacts</h2>
  <div class="section">
    <div class="row"><span class="label">Téléphone urgence :</span> <span class="value">${eleve.telephoneUrgence || '-'}</span></div>
    <div class="row"><span class="label">Téléphone principal :</span> <span class="value">${eleve.telephone || '-'}</span></div>
    <div class="row"><span class="label">Email parents :</span> <span class="value">${eleve.emailParents || '-'}</span></div>
    <div class="row"><span class="label">Adresse :</span> <span class="value">${eleve.adresse || '-'}</span></div>
  </div>
  
  <h2>🤝 Accompagnement (AESH)</h2>
  <div class="section">
    <div class="row"><span class="label">Type :</span> <span class="value">${eleve.aeshType || '-'}</span></div>
    <div class="row"><span class="label">Nom de l'AESH :</span> <span class="value">${eleve.aeshNom || '-'}</span></div>
    <div class="row"><span class="label">Heures/semaine :</span> <span class="value">${eleve.aeshHeures || 0}h</span></div>
    <div class="row"><span class="label">Mutualisé avec :</span> <span class="value">${(eleve.aeshMutualiseAvec || []).join(', ') || '-'}</span></div>
  </div>
  
  <h2>🏥 Prise en charge (PEC)</h2>
  <div class="section">
    <div class="row"><span class="label">Spécialité :</span> <span class="value">${eleve.pecSpecialite || '-'}</span></div>
    <div class="row"><span class="label">Organisme :</span> <span class="value">${eleve.pecOrganisme || '-'}</span></div>
    <div class="row"><span class="label">Fréquence :</span> <span class="value">${eleve.pecFrequence || '-'}</span></div>
    <div class="row"><span class="label">Lieu :</span> <span class="value">${eleve.pecLieu || '-'}</span></div>
    <div class="row"><span class="label">Heures/semaine :</span> <span class="value">${eleve.pecHeures || 0}h</span></div>
  </div>
  
  <h2>📜 Droits MDPH</h2>
  <div class="section" style="border: 2px solid #ff9800; background: #fff3e0;">
    <table>
      <thead>
        <tr>
          <th>Type de droit</th>
          <th>Date limite</th>
          <th>Décision</th>
        </tr>
      </thead>
      <tbody>
        <tr>
          <td>ULIS</td>
          <td>${formatDate(eleve.droitsMdhph?.ulis?.date)}</td>
          <td>${eleve.droitsMdhph?.ulis?.type || '-'}</td>
        </tr>
        <tr>
          <td>SESSAD</td>
          <td>${formatDate(eleve.droitsMdhph?.sessad?.date)}</td>
          <td>${eleve.droitsMdhph?.sessad?.type || '-'}</td>
        </tr>
        <tr>
          <td>AESH</td>
          <td>${formatDate(eleve.droitsMdhph?.aesh?.date)}</td>
          <td>${eleve.droitsMdhph?.aesh?.type || '-'}</td>
        </tr>
        <tr>
          <td>Transport</td>
          <td>${formatDate(eleve.droitsMdhph?.transport?.date)}</td>
          <td>${eleve.droitsMdhph?.transport?.type || '-'}</td>
        </tr>
        <tr>
          <td>Autre (${eleve.droitsMdhph?.autre?.description || '-'})</td>
          <td>${formatDate(eleve.droitsMdhph?.autre?.date)}</td>
          <td>${eleve.droitsMdhph?.autre?.type || '-'}</td>
        </tr>
      </tbody>
    </table>
  </div>
  
  <h2>📝 Autres informations</h2>
  <div class="section">
    <div class="row"><span class="label">Notifications :</span> <span class="value">
      ${(eleve.notifications || []).map(n => `<span class="badge badge-pps">${n}</span>`).join('') || '-'}
    </span></div>
    <div class="row"><span class="label">Allergies :</span> <span class="value">${eleve.allergies || '-'}</span></div>
    <div class="row"><span class="label">Régime alimentaire :</span> <span class="value">${eleve.regimeAlimentaire || '-'}</span></div>
    <div class="row"><span class="label">Informations médicales :</span> <span class="value">${eleve.informationsMedicales || '-'}</span></div>
    <div class="row"><span class="label">Remarques :</span> <span class="value">${eleve.remarques || '-'}</span></div>
    <div class="row"><span class="label">Enseignant de référence :</span> <span class="value">${eleve.enseignantReference || '-'}</span></div>
    <div class="row"><span class="label">Statut :</span> <span class="value">${eleve.actif ? '✅ Actif' : '❌ Inactif'}</span></div>
  </div>
  
  <div class="footer">
    <p>Fiche générée le ${today} | Emploi du temps multi-élèves v2.0</p>
  </div>
</body>
</html>
  `;

  printWindow.document.write(printContent);
  printWindow.document.close();
  printWindow.print();
}

// Écouteurs d'événements pour la fiche élève
document.addEventListener('DOMContentLoaded', () => {
  // Bouton fermer
  document.getElementById('btn-fiche-cancel')?.addEventListener('click', closeFicheEleve);
  
  // Bouton sauvegarder
  document.getElementById('btn-fiche-save')?.addEventListener('click', saveFicheEleve);
  
  // Bouton imprimer
  document.getElementById('btn-fiche-print')?.addEventListener('click', printFicheEleve);
  
  // Gestion du champ taxi
  document.getElementById('fiche-eleve-taxi')?.addEventListener('change', (e) => {
    const details = document.getElementById('fiche-taxi-details');
    if (details) {
      details.style.display = e.target.checked ? 'block' : 'none';
    }
  });
});
