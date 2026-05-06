/**
 * js/print.js
 * Utilise la fonction d'impression native du navigateur pour éviter les erreurs de sécurité CORS.
 */

const btnPrintTrigger = document.getElementById('btn-print');
const printModal = document.getElementById('print-modal-backdrop');
const printForm = document.getElementById('print-form');
const printDaysGroup = document.getElementById('print-days-group');

// Ouverture de la modale d'impression
btnPrintTrigger.addEventListener('click', () => {
  printDaysGroup.innerHTML = '';
  
  JOURS.forEach(jour => {
    const isCurrent = (jour === currentDay);
    const label = document.createElement('label');
    label.style.display = 'flex';
    label.style.alignItems = 'center';
    label.style.gap = '8px';
    label.innerHTML = `
      <input type="checkbox" class="print-day-cb" value="${jour}" ${isCurrent ? 'checked' : ''}> 
      ${jour.charAt(0).toUpperCase() + jour.slice(1)}
    `;
    printDaysGroup.appendChild(label);
  });
  
  // Remplir la liste déroulante des élèves
  const printEleveSelect = document.getElementById('print-eleve-select');
  printEleveSelect.innerHTML = '<option value="">Tous les élèves</option>';
  state.eleves.filter(e => e.actif).sort((a, b) => a.order - b.order).forEach(eleve => {
    const option = document.createElement('option');
    option.value = eleve.id;
    option.textContent = eleve.prenom || eleve.nom;
    printEleveSelect.appendChild(option);
  });
  
  ModalManager.open('print-modal-backdrop');
});

// Gestion du changement de type d'impression
document.querySelectorAll('input[name="print-type"]').forEach(radio => {
  radio.addEventListener('change', (e) => {
    const printType = e.target.value;
    const printOptionsDays = document.getElementById('print-options-days');
    const printOptionsEleve = document.getElementById('print-options-eleve');
    
    if (printType === 'days') {
      printOptionsDays.style.display = 'block';
      printOptionsEleve.style.display = 'none';
    } else if (printType === 'eleve') {
      printOptionsDays.style.display = 'none';
      printOptionsEleve.style.display = 'block';
    } else {
      printOptionsDays.style.display = 'none';
      printOptionsEleve.style.display = 'none';
    }
  });
});

// Annulation
document.getElementById('btn-print-cancel').addEventListener('click', () => {
  ModalManager.close('print-modal-backdrop');
});

/**
 * Fonction pour générer l'emploi du temps d'un élève spécifique
 * @param {string} eleveId - L'ID de l'élève
 * @returns {string} - HTML de l'emploi du temps de l'élève
 */
function generateEleveTimetable(eleveId) {
  const eleve = state.eleves.find(e => e.id === eleveId);
  if (!eleve) return '';
  
  const elevesActifs = state.eleves.filter(e => e.actif && e.id === eleveId).sort((a, b) => a.order - b.order);
  
  if (elevesActifs.length === 0) return '';
  
  let html = `<div class="print-page">
    <h2 style="font-size: 16px;">Emploi du temps - ${eleve.prenom || eleve.nom}${eleve.nom ? ' ' + eleve.nom : ''}${eleve.classe ? ' (' + eleve.classe + ')' : ''}</h2>
    ${eleve.groupe ? `<p style="text-align:center; font-size:12px; margin-bottom:10px;">Groupe : ${eleve.groupe}</p>` : ''}
    <div class="edt-wrapper">`;
  
  // Créer un seul tableau avec tous les jours en colonnes
  html += `<table class="edt-jour" style="width: 100%; border-collapse: collapse;">
    <thead>
      <tr>
        <th class="heure-header" style="width: 80px;">Heure</th>`;
  
  // Ajouter les en-têtes de colonnes pour chaque jour
  JOURS.forEach(jour => {
    const jourMajuscule = jour.charAt(0).toUpperCase() + jour.slice(1);
    html += `<th class="eleve-header" style="width: 150px;">${jourMajuscule}</th>`;
  });
  
  html += `</tr>
    </thead>
    <tbody>`;
  
  // Ajouter les créneaux pour chaque heure
  HEURES.forEach(heure => {
    html += `<tr>
      <td class="heure-cell" style="border: 1px solid #ddd; padding: 4px; text-align: center; font-weight: bold;">${heure}</td>`;
    
    // Ajouter les créneaux pour chaque jour à cette heure
    JOURS.forEach(jour => {
      const creneau = state.creneaux.find(c => c.jour === jour && c.heure === heure && c.eleveId === eleveId);
      
      if (creneau) {
        html += `<td class="slot-cell" style="border: 1px solid #ddd; padding: 4px; background-color:${creneau.color || '#fff'}; color:${creneau.textColor || '#000'}; vertical-align: top;">
          <div class="slot-inner" style="font-size: 11px;">
            <span class="slot-matiere" style="font-weight: bold;">${creneau.matiere || ''}</span><br>`;
            if (creneau.groupe) {
              html += `<span class="slot-groupe" style="font-size: 10px;">(${creneau.groupe})</span><br>`;
            }
            if (creneau.adulte) {
              html += `<span class="slot-adulte-badge" style="font-size: 9px; background-color:${getRoleColor(creneau.roleAdulte)}; padding: 2px 4px; border-radius: 3px;">${creneau.adulte}</span><br>`;
            }
            if (creneau.commentaire) {
              html += `<span style="font-size: 9px; opacity: 0.7;">${creneau.commentaire}</span>`;
            }
            html += `</div>
          </td>`;
      } else {
        html += `<td class="slot-cell" style="border: 1px solid #ddd; padding: 4px;"></td>`;
      }
    });
    
    html += `</tr>`;
  });
  
  html += `</tbody></table>`;
  html += `</div></div>`;
  return html;
}

/**
 * Fonction pour générer l'emploi du temps de l'enseignant
 * @returns {string} - HTML de l'emploi du temps de l'enseignant
 */
function generateEnseignantTimetable() {
  let html = `<div class="print-page">
    <h2>Emploi du temps - Enseignant</h2>
    <div class="edt-wrapper">`;
  
  // Créer un seul tableau avec tous les jours en colonnes
  html += `<table class="edt-jour" style="width: 100%; border-collapse: collapse;">
    <thead>
      <tr>
        <th class="heure-header" style="width: 80px;">Heure</th>`;
  
  // Ajouter les en-têtes de colonnes pour chaque jour
  JOURS.forEach(jour => {
    const jourMajuscule = jour.charAt(0).toUpperCase() + jour.slice(1);
    html += `<th class="eleve-header" style="width: 150px;">${jourMajuscule}</th>`;
  });
  
  html += `</tr>
    </thead>
    <tbody>`;
  
  // Ajouter les créneaux pour chaque heure
  HEURES.forEach(heure => {
    html += `<tr>
      <td class="heure-cell" style="border: 1px solid #ddd; padding: 4px; text-align: center; font-weight: bold;">${heure}</td>`;
    
    // Ajouter les créneaux pour chaque jour à cette heure
    JOURS.forEach(jour => {
      // Trouver tous les créneaux à cette heure pour tous les élèves actifs
      const creneauxAtHeure = state.creneaux.filter(c => 
        c.jour === jour && 
        c.heure === heure && 
        c.roleAdulte === 'enseignant'
      );
      
      if (creneauxAtHeure.length > 0) {
        html += `<td class="slot-cell" style="border: 1px solid #ddd; padding: 4px; vertical-align: top;">`;
        
        // Afficher tous les créneaux à cette heure
        creneauxAtHeure.forEach(creneau => {
          const eleve = state.eleves.find(e => e.id === creneau.eleveId);
          if (eleve && eleve.actif) {
            html += `<div class="slot-inner" style="margin-bottom: 4px; background-color:${creneau.color || '#fff'}; color:${creneau.textColor || '#000'}; font-size: 11px;">
              <span style="font-weight:bold;">${eleve.prenom || eleve.nom}</span>: ${creneau.matiere || ''}`;
            if (creneau.groupe) {
              html += `<span class="slot-groupe" style="font-size: 10px;">(${creneau.groupe})</span>`;
            }
            if (creneau.regroupementType) {
              html += `<span class="slot-type" style="font-size: 10px;">[${creneau.regroupementType}]</span>`;
            }
            html += `</div>`;
          }
        });
        
        html += `</td>`;
      } else {
        html += `<td class="slot-cell" style="border: 1px solid #ddd; padding: 4px;"></td>`;
      }
    });
    
    html += `</tr>`;
  });
  
  html += `</tbody></table>`;
  html += `</div></div>`;
  return html;
}

/**
 * Fonction pour générer l'emploi du temps des AESH
 * @param {string} aeshType - Le type d'AESH ('AESHco', 'AESHi', 'AESHm')
 * @returns {string} - HTML de l'emploi du temps de l'AESH
 */
function generateAESHTimetable(aeshType) {
  const typeLabel = {
    'AESHco': 'AESHco (Accompagnement collectif)',
    'AESHi': 'AESHi (Accompagnement individuel)',
    'AESHm': 'AESHm (Accompagnement mutualisé)'
  };
  
  let html = `<div class="print-page">
    <h2>Emploi du temps - ${typeLabel[aeshType]}</h2>
    <div class="edt-wrapper">`;
  
  // Créer un seul tableau avec tous les jours en colonnes
  html += `<table class="edt-jour" style="width: 100%; border-collapse: collapse;">
    <thead>
      <tr>
        <th class="heure-header" style="width: 80px;">Heure</th>`;
  
  // Ajouter les en-têtes de colonnes pour chaque jour
  JOURS.forEach(jour => {
    const jourMajuscule = jour.charAt(0).toUpperCase() + jour.slice(1);
    html += `<th class="eleve-header" style="width: 150px;">${jourMajuscule}</th>`;
  });
  
  html += `</tr>
    </thead>
    <tbody>`;
  
  // Ajouter les créneaux pour chaque heure
  HEURES.forEach(heure => {
    html += `<tr>
      <td class="heure-cell" style="border: 1px solid #ddd; padding: 4px; text-align: center; font-weight: bold;">${heure}</td>`;
    
    // Ajouter les créneaux pour chaque jour à cette heure
    JOURS.forEach(jour => {
      // Trouver tous les créneaux à cette heure pour ce type d'AESH
      const creneauxAtHeure = state.creneaux.filter(c => 
        c.jour === jour && 
        c.heure === heure && 
        c.typeAESH === aeshType
      );
      
      if (creneauxAtHeure.length > 0) {
        html += `<td class="slot-cell" style="border: 1px solid #ddd; padding: 4px; vertical-align: top;">`;
        
        // Afficher tous les créneaux à cette heure
        creneauxAtHeure.forEach(creneau => {
          const eleve = state.eleves.find(e => e.id === creneau.eleveId);
          if (eleve && eleve.actif) {
            html += `<div class="slot-inner" style="margin-bottom: 4px; background-color:${creneau.color || '#fff'}; color:${creneau.textColor || '#000'}; font-size: 11px;">
              <span style="font-weight:bold;">${eleve.prenom || eleve.nom}</span>: ${creneau.matiere || ''}`;
            if (creneau.groupe) {
              html += `<span class="slot-groupe" style="font-size: 10px;">(${creneau.groupe})</span>`;
            }
            if (creneau.regroupementType) {
              html += `<span class="slot-type" style="font-size: 10px;">[${creneau.regroupementType}]</span>`;
            }
            html += `</div>`;
          }
        });
        
        html += `</td>`;
      } else {
        html += `<td class="slot-cell" style="border: 1px solid #ddd; padding: 4px;"></td>`;
      }
    });
    
    html += `</tr>`;
  });
  
  html += `</tbody></table>`;
  html += `</div></div>`;
  return html;
}

/**
 * Fonction pour obtenir la couleur en fonction du rôle adulte
 * @param {string} role - Le rôle de l'adulte
 * @returns {string} - La couleur CSS
 */
function getRoleColor(role) {
  const colors = {
    'enseignant': '#4caf50',
    'aeshco': '#ff9800',
    'autre': '#9c27b0'
  };
  return colors[role] || '#9c27b0';
}

/**
 * Fonction pour générer l'impression des statistiques
 * @returns {string} - HTML des statistiques
 */
function generateStatsPrint() {
  const dureeCreneau = parseInt(state.parametres.dureeCreneau, 10);
  
  let html = `<div class="print-page">
    <h2>Statistiques et Compteurs d'heures</h2>
    <p style="text-align:center; font-size:12px; margin-bottom:15px;">Généré le ${new Date().toLocaleDateString('fr-FR')}</p>`;
  
  // Statistiques par élève
  html += `<h3 style="margin:15px 0 10px 0;">Statistiques par élève</h3>`;
  html += `<table class="edt-jour" style="margin-bottom:20px;">
    <thead>
      <tr style="background-color: #f0f0f0; border-bottom: 2px solid #ccc;">
        <th style="padding: 8px; text-align: left; border-right:1px solid #ddd;">Élève</th>
        <th style="padding: 8px; text-align: center; border-right:1px solid #ddd;">Total</th>
        <th style="padding: 8px; text-align: center; border-right:1px solid #ddd; color: #e65100;">ULIS</th>
        <th style="padding: 8px; text-align: center; border-right:1px solid #ddd; color: #1b5e20;">Inclusion</th>
        <th style="padding: 8px; text-align: center; border-right:1px solid #ddd; color: #0d47a1;">Décloison.</th>
        <th style="padding: 8px; text-align: center; border-right:1px solid #ddd; color: #6a1b9a;">PEC</th>
        <th style="padding: 8px; text-align: center; border-right:1px solid #ddd; color: #333;">Régulier</th>
        <th style="padding: 8px; text-align: center; border-right:1px solid #ddd; color: #e65100;">AESHco</th>
        <th style="padding: 8px; text-align: center; border-right:1px solid #ddd; color: #ff9800;">AESHi/m</th>
        <th style="padding: 8px; text-align: center; color: #1b5e20;">Enseignant</th>
      </tr>
    </thead>
    <tbody>`;
  
  // Calculer les statistiques pour chaque élève
  state.eleves.forEach(eleve => {
    if (!eleve.actif) return;
    
    const creneauxEleve = state.creneaux.filter(c => c.eleveId === eleve.id);
    
    let totalMinutes = 0;
    let ulisMinutes = 0;
    let inclusionMinutes = 0;
    let decloisonnementMinutes = 0;
    let pecMinutes = 0;
    let regulierMinutes = 0;
    let aeshcoMinutes = 0;
    let aeshiMinutes = 0;
    let enseignantMinutes = 0;
    
    creneauxEleve.forEach(creneau => {
      totalMinutes += dureeCreneau;
      
      switch(creneau.regroupementType) {
        case 'ULIS':
          ulisMinutes += dureeCreneau;
          break;
        case 'INCLUSION':
          inclusionMinutes += dureeCreneau;
          break;
        case 'DECLOISONNEMENT':
          decloisonnementMinutes += dureeCreneau;
          break;
        case 'PEC':
          pecMinutes += dureeCreneau;
          break;
        case 'AUTRE':
        default:
          regulierMinutes += dureeCreneau;
          break;
      }
      
      switch(creneau.typeAESH) {
        case 'AESHco':
          aeshcoMinutes += dureeCreneau;
          break;
        case 'AESHi':
        case 'AESHm':
          aeshiMinutes += dureeCreneau;
          break;
      }
      
      if (creneau.roleAdulte === 'enseignant') {
        enseignantMinutes += dureeCreneau;
      }
    });
    
    html += `<tr style="border-bottom: 1px solid #eee;">
      <td style="padding: 8px; border-right:1px solid #ddd;">
        <strong>${eleve.prenom || eleve.nom}</strong>
        ${eleve.ulis ? '<span style="color:#e91e63; font-size:10px; margin-left:4px;">(ULIS)</span>' : ''}
      </td>
      <td style="padding: 8px; text-align: center; border-right:1px solid #ddd; background-color: #fafafa;">
        ${formatMinutesToHours(totalMinutes)}<br>
        ${calculatePercentage(totalMinutes)}
      </td>
      <td style="padding: 8px; text-align: center; border-right:1px solid #ddd; color: #e65100;">
        ${formatMinutesToHours(ulisMinutes)}<br>
        ${calculatePercentage(ulisMinutes)}
      </td>
      <td style="padding: 8px; text-align: center; border-right:1px solid #ddd; color: #1b5e20;">
        ${formatMinutesToHours(inclusionMinutes)}<br>
        ${calculatePercentage(inclusionMinutes)}
      </td>
      <td style="padding: 8px; text-align: center; border-right:1px solid #ddd; color: #0d47a1;">
        ${formatMinutesToHours(decloisonnementMinutes)}<br>
        ${calculatePercentage(decloisonnementMinutes)}
      </td>
      <td style="padding: 8px; text-align: center; border-right:1px solid #ddd; color: #6a1b9a;">
        ${formatMinutesToHours(pecMinutes)}<br>
        ${calculatePercentage(pecMinutes)}
      </td>
      <td style="padding: 8px; text-align: center; border-right:1px solid #ddd; color: #333;">
        ${formatMinutesToHours(regulierMinutes)}<br>
        ${calculatePercentage(regulierMinutes)}
      </td>
      <td style="padding: 8px; text-align: center; border-right:1px solid #ddd; color: #e65100;">
        ${formatMinutesToHours(aeshcoMinutes)}<br>
        ${calculatePercentage(aeshcoMinutes)}
      </td>
      <td style="padding: 8px; text-align: center; border-right:1px solid #ddd; color: #ff9800;">
        ${formatMinutesToHours(aeshiMinutes)}<br>
        ${calculatePercentage(aeshiMinutes)}
      </td>
      <td style="padding: 8px; text-align: center; color: #1b5e20;">
        ${formatMinutesToHours(enseignantMinutes)}<br>
        ${calculatePercentage(enseignantMinutes)}
      </td>
    </tr>`;
  });
  
  html += `</tbody></table>`;
  
  // Statistiques AESH
  html += `<h3 style="margin:15px 0 10px 0;">Statistiques AESH</h3>`;
  html += `<table class="edt-jour" style="margin-bottom:20px;">
    <thead>
      <tr style="background-color: #f0f0f0; border-bottom: 2px solid #ccc;">
        <th style="padding: 8px; text-align: left; border-right:1px solid #ddd;">Type d'AESH</th>
        <th style="padding: 8px; text-align: center; border-right:1px solid #ddd;">Description</th>
        <th style="padding: 8px; text-align: center; border-right:1px solid #ddd;">Temps hebdomadaire</th>
        <th style="padding: 8px; text-align: center;">Pourcentage du temps AESH</th>
      </tr>
    </thead>
    <tbody>`;
  
  // Calculer les totaux AESH
  let aeshcoMinutes = 0;
  let aeshiMinutes = 0;
  let aeshmMinutes = 0;
  
  state.creneaux.forEach(creneau => {
    switch(creneau.typeAESH) {
      case 'AESHco':
        aeshcoMinutes += dureeCreneau;
        break;
      case 'AESHi':
        aeshiMinutes += dureeCreneau;
        break;
      case 'AESHm':
        aeshmMinutes += dureeCreneau;
        break;
    }
  });
  
  const totalAeshMinutes = aeshcoMinutes + aeshiMinutes + aeshmMinutes;
  
  html += `<tr style="border-bottom: 1px solid #eee;">
    <td style="padding: 8px; border-right:1px solid #ddd;"><strong>AESHco</strong></td>
    <td style="padding: 8px; border-right:1px solid #ddd; font-size: 11px;">Accompagnement collectif (groupe classe)</td>
    <td style="padding: 8px; text-align: center; border-right:1px solid #ddd; color: #e65100;">${formatMinutesToHours(aeshcoMinutes)}</td>
    <td style="padding: 8px; text-align: center;">${totalAeshMinutes > 0 ? ((aeshcoMinutes / totalAeshMinutes) * 100).toFixed(1) + '%' : '0%'}</td>
  </tr>`;
  html += `<tr style="border-bottom: 1px solid #eee;">
    <td style="padding: 8px; border-right:1px solid #ddd;"><strong>AESHi</strong></td>
    <td style="padding: 8px; border-right:1px solid #ddd; font-size: 11px;">Accompagnement individuel (1 élève)</td>
    <td style="padding: 8px; text-align: center; border-right:1px solid #ddd; color: #ff9800;">${formatMinutesToHours(aeshiMinutes)}</td>
    <td style="padding: 8px; text-align: center;">${totalAeshMinutes > 0 ? ((aeshiMinutes / totalAeshMinutes) * 100).toFixed(1) + '%' : '0%'}</td>
  </tr>`;
  html += `<tr style="border-bottom: 1px solid #eee;">
    <td style="padding: 8px; border-right:1px solid #ddd;"><strong>AESHm</strong></td>
    <td style="padding: 8px; border-right:1px solid #ddd; font-size: 11px;">Accompagnement mutualisé (2-3 élèves)</td>
    <td style="padding: 8px; text-align: center; border-right:1px solid #ddd; color: #ff5722;">${formatMinutesToHours(aeshmMinutes)}</td>
    <td style="padding: 8px; text-align: center;">${totalAeshMinutes > 0 ? ((aeshmMinutes / totalAeshMinutes) * 100).toFixed(1) + '%' : '0%'}</td>
  </tr>`;
  html += `<tr style="background-color: #f8f8f8; border-top: 2px solid #ccc;">
    <td style="padding: 8px; border-right:1px solid #ddd; font-weight: bold;">TOTAL AESH</td>
    <td style="padding: 8px; text-align: center; border-right:1px solid #ddd; font-weight: bold;">${formatMinutesToHours(totalAeshMinutes)}</td>
    <td style="padding: 8px; text-align: center; font-weight: bold;">100%</td>
    <td style="padding: 8px; text-align: center; font-weight: bold;">${totalAeshMinutes > 0 ? calculatePercentage(totalAeshMinutes) : '-'}</td>
  </tr>`;
  
  html += `</tbody></table>`;
  
  // Statistiques enseignants
  html += `<h3 style="margin:15px 0 10px 0;">Statistiques enseignants</h3>`;
  html += `<table class="edt-jour" style="margin-bottom:20px;">
    <thead>
      <tr style="background-color: #f0f0f0; border-bottom: 2px solid #ccc;">
        <th style="padding: 8px; text-align: left; border-right:1px solid #ddd;">Enseignant</th>
        <th style="padding: 8px; text-align: center; border-right:1px solid #ddd;">Temps hebdomadaire</th>
        <th style="padding: 8px; text-align: center;">Pourcentage</th>
      </tr>
    </thead>
    <tbody>`;
  
  // Calculer les totaux enseignants
  let enseignantTotalMinutes = 0;
  const enseignantsMap = new Map();
  
  state.creneaux.forEach(creneau => {
    if (creneau.roleAdulte === 'enseignant' && creneau.adulte) {
      enseignantTotalMinutes += dureeCreneau;
      if (!enseignantsMap.has(creneau.adulte)) {
        enseignantsMap.set(creneau.adulte, 0);
      }
      enseignantsMap.set(creneau.adulte, enseignantsMap.get(creneau.adulte) + dureeCreneau);
    }
  });
  
  // Afficher les statistiques par enseignant
  enseignantsMap.forEach((minutes, enseignant) => {
    html += `<tr style="border-bottom: 1px solid #eee;">
      <td style="padding: 8px; border-right:1px solid #ddd;"><strong>${enseignant}</strong></td>
      <td style="padding: 8px; text-align: center; border-right:1px solid #ddd; color: #1b5e20;">${formatMinutesToHours(minutes)}</td>
      <td style="padding: 8px; text-align: center;">${enseignantTotalMinutes > 0 ? ((minutes / enseignantTotalMinutes) * 100).toFixed(1) + '%' : '0%'}</td>
    </tr>`;
  });
  
  html += `<tr style="background-color: #f8f8f8; border-top: 2px solid #ccc;">
    <td style="padding: 8px; border-right:1px solid #ddd; font-weight: bold;">TOTAL</td>
    <td style="padding: 8px; text-align: center; border-right:1px solid #ddd; font-weight: bold;">${formatMinutesToHours(enseignantTotalMinutes)}</td>
    <td style="padding: 8px; text-align: center; font-weight: bold;">${enseignantTotalMinutes > 0 ? calculatePercentage(enseignantTotalMinutes) : '-'}</td>
  </tr>`;
  
  html += `</tbody></table>`;
  
  // Statistiques prise en charge
  html += `<h3 style="margin:15px 0 10px 0;">Statistiques prise en charge</h3>`;
  html += `<table class="edt-jour" style="margin-bottom:20px;">
    <thead>
      <tr style="background-color: #f0f0f0; border-bottom: 2px solid #ccc;">
        <th style="padding: 8px; text-align: left; border-right:1px solid #ddd;">Type de prise en charge</th>
        <th style="padding: 8px; text-align: center; border-right:1px solid #ddd;">Nombre d'élèves</th>
        <th style="padding: 8px; text-align: center; border-right:1px solid #ddd;">Temps hebdomadaire</th>
        <th style="padding: 8px; text-align: center;">Pourcentage du temps total</th>
      </tr>
    </thead>
    <tbody>`;
  
  // Calculer les statistiques de prise en charge
  const priseEnChargeTypes = ['ULIS', 'INCLUSION', 'DECLOISONNEMENT', 'PEC', 'AUTRE'];
  let totalPriseEnChargeMinutes = 0;
  let priseEnChargeData = {};
  
  priseEnChargeTypes.forEach(type => {
    priseEnChargeData[type] = 0;
  });
  
  state.creneaux.forEach(creneau => {
    if (creneau.regroupementType && priseEnChargeTypes.includes(creneau.regroupementType)) {
      priseEnChargeData[creneau.regroupementType] += dureeCreneau;
      totalPriseEnChargeMinutes += dureeCreneau;
    }
  });
  
  // Afficher les statistiques par type de prise en charge
  priseEnChargeTypes.forEach(type => {
    const typeLabels = {
      'ULIS': 'ULIS',
      'INCLUSION': 'Inclusion',
      'DECLOISONNEMENT': 'Décloisonnement',
      'PEC': 'PEC',
      'AUTRE': 'Autre'
    };
    
    html += `<tr style="border-bottom: 1px solid #eee;">
      <td style="padding: 8px; border-right:1px solid #ddd;"><strong>${typeLabels[type]}</strong></td>
      <td style="padding: 8px; text-align: center; border-right:1px solid #ddd;">${priseEnChargeData[type]} élève(s)</td>
      <td style="padding: 8px; text-align: center; border-right:1px solid #ddd;">${formatMinutesToHours(priseEnChargeData[type])}</td>
      <td style="padding: 8px; text-align: center;">${totalPriseEnChargeMinutes > 0 ? ((priseEnChargeData[type] / totalPriseEnChargeMinutes) * 100).toFixed(1) + '%' : '0%'}</td>
    </tr>`;
  });
  
  html += `<tr style="background-color: #f8f8f8; border-top: 2px solid #ccc;">
    <td style="padding: 8px; border-right:1px solid #ddd; font-weight: bold;">TOTAL</td>
    <td style="padding: 8px; text-align: center; border-right:1px solid #ddd; font-weight: bold;">${formatMinutesToHours(totalPriseEnChargeMinutes)}</td>
    <td style="padding: 8px; text-align: center; font-weight: bold;">${totalPriseEnChargeMinutes > 0 ? calculatePercentage(totalPriseEnChargeMinutes) : '-'}</td>
    <td style="padding: 8px; text-align: center; font-weight: bold;">100%</td>
  </tr>`;
  
  html += `</tbody></table>`;
  
  html += `</div>`;
  return html;
}

/**
 * Fonction utilitaire pour convertir un nombre total de minutes en un format lisible "XhYY"
 */
function formatMinutesToHours(minutes) {
  if (minutes === 0) return '-';
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  const mStr = m.toString().padStart(2, '0');
  return `<span style="font-weight:600;">${h}h${mStr}</span>`;
}

/**
 * Fonction utilitaire pour calculer le pourcentage par rapport aux 24h semaine (1440 minutes)
 */
function calculatePercentage(minutes) {
  if (minutes === 0) return '-';
  const percentage = (minutes / 1440) * 100;
  return `<span style="font-size:11px; color:#666;">(${percentage.toFixed(1)}%)</span>`;
}

// Traitement et déclenchement de l'impression native
printForm.addEventListener('submit', (e) => {
  e.preventDefault();
  
  const printType = document.querySelector('input[name="print-type"]:checked').value;
  printModal.classList.remove('visible');

  if (typeof clearSelection === 'function') clearSelection();
  
  // On applique la classe CSS qui cache l'interface pour ne montrer que la page blanche
  document.body.classList.add('is-printing');
  
  const exportContainer = document.getElementById('export-container');
  exportContainer.innerHTML = '';
  exportContainer.style.display = 'block'; 
  
  let htmlContent = '';
  
  // Générer le contenu en fonction du type d'impression
  if (printType === 'days') {
    const selectedCbs = document.querySelectorAll('.print-day-cb:checked');
    if (selectedCbs.length === 0) {
      alert("Veuillez sélectionner au moins un jour.");
      document.body.classList.remove('is-printing');
      exportContainer.style.display = 'none';
      return;
    }

    const selectedDays = Array.from(selectedCbs).map(cb => cb.value);
    const originalDay = currentDay;
    
    // Construction des tableaux pour chaque jour sélectionné
    for (let i = 0; i < selectedDays.length; i++) {
      const jour = selectedDays[i];
      
      // On simule le changement de jour pour que le script calcule la grille
      currentDay = jour;
      renderTable(); 
      
      const pageWrapper = document.createElement('div');
      pageWrapper.className = 'print-page';
      
      const jourMajuscule = jour.charAt(0).toUpperCase() + jour.slice(1);
      pageWrapper.innerHTML = '<h2>Emploi du temps - ' + jourMajuscule + '</h2>';
      
      const wrapperDiv = document.createElement('div');
      wrapperDiv.className = 'edt-wrapper';
      
      // Clonage du tableau généré
      const tableClone = document.getElementById('edt-table').cloneNode(true);
      tableClone.removeAttribute('id'); 
      wrapperDiv.appendChild(tableClone);
      
      pageWrapper.appendChild(wrapperDiv);
      exportContainer.appendChild(pageWrapper);
    }
    
    currentDay = originalDay;
    renderDayTabs(); 
    renderTable();
  } else if (printType === 'eleve') {
    const selectedEleveId = document.getElementById('print-eleve-select').value;
    
    if (selectedEleveId !== '') {
      // Imprimer l'emploi du temps d'un élève spécifique
      htmlContent = generateEleveTimetable(selectedEleveId);
    } else {
      // Imprimer tous les élèves actifs
      const elevesActifs = state.eleves.filter(e => e.actif).sort((a, b) => a.order - b.order);
      elevesActifs.forEach((eleve, index) => {
        if (index > 0) {
          htmlContent += '<div style="page-break-after: always;"></div>';
        }
        htmlContent += generateEleveTimetable(eleve.id);
      });
    }
    
    exportContainer.innerHTML = htmlContent;
  } else if (printType === 'enseignant') {
    htmlContent = generateEnseignantTimetable();
    exportContainer.innerHTML = htmlContent;
  } else if (printType === 'aeshco') {
    htmlContent = generateAESHTimetable('AESHco');
    exportContainer.innerHTML = htmlContent;
  } else if (printType === 'aeshi') {
    htmlContent = generateAESHTimetable('AESHi');
    exportContainer.innerHTML = htmlContent;
  } else if (printType === 'aeshm') {
    htmlContent = generateAESHTimetable('AESHm');
    exportContainer.innerHTML = htmlContent;
  } else if (printType === 'stats') {
    htmlContent = generateStatsPrint();
    exportContainer.innerHTML = htmlContent;
  }

  // On lance l'impression native du navigateur avec un léger délai 
  // pour laisser le temps à Chrome d'afficher les tableaux HTML
  setTimeout(() => {
    window.print();

    // NETTOYAGE : Une fois la fenêtre d'impression fermée, on restaure l'interface
    exportContainer.style.display = 'none';
    exportContainer.innerHTML = '';
    document.body.classList.remove('is-printing');

  }, 300);
});