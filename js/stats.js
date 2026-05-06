/**
 * js/stats.js - Version 2.0
 * Ce fichier gère le calcul et l'affichage des statistiques complètes pour l'application d'emploi du temps.
 *
 * Fonctionnalités statistiques :
 * - Statistiques par élève (temps total, répartition par type de regroupement, AESH, enseignant)
 * - Statiques enseignant (temps ULIS, co-enseignement, réunions ESS, rencontres partenaires)
 * - Statistiques AESH (répartition par type : AESHi, AESHm, AESHco)
 * - Statistiques PEC (répartition par spécialité et par organisme)
 *
 * Méthodologie de calcul :
 * - Chaque créneau a une durée définie en minutes (par défaut : 15 min)
 * - Les statistiques sont calculées en sommant les durées des créneaux correspondants
 * - Les pourcentages sont calculés par rapport à 24h de semaine scolaire (1440 minutes)
 *
 * Organisation de l'interface :
 * - Utilisation d'onglets pour organiser les différentes vues statistiques
 * - Tableaux avec coloration cohérente pour faciliter la lecture
 * - Affichage des totaux globaux pour synthèse
 */

// Récupération des éléments du DOM pour ouvrir et fermer la fenêtre
const btnStatsTrigger = document.getElementById('btn-stats');
const statsModalBackdrop = document.getElementById('stats-modal-backdrop');
const statsContainer = document.getElementById('stats-container');
const btnStatsClose = document.getElementById('btn-stats-close');

// Ouverture de la modale
btnStatsTrigger.addEventListener('click', () => {
  renderStats(); // On lance le calcul mathématique
  ModalManager.open('stats-modal-backdrop'); // On affiche la fenêtre
});

// Fermeture de la modale
btnStatsClose.addEventListener('click', () => {
  ModalManager.close('stats-modal-backdrop');
});

/**
 * Fonction utilitaire pour convertir un nombre total de minutes en un format lisible "XhYY"
 *
 * Cette fonction formate les durées en heures et minutes pour l'affichage utilisateur.
 * Les durées de 0 minutes sont affichées comme un tiret pour alléger l'interface.
 *
 * @param {number} minutes - Le total de minutes à convertir
 * @returns {string} - La chaîne de caractères formatée (ex: "2h30")
 *
 * Exemples :
 * - 150 minutes -> "2h30"
 * - 90 minutes -> "1h30"
 * - 0 minutes -> "-"
 */
function formatMinutesToHours(minutes) {
  // Si le compteur est à zéro, on affiche un tiret pour que le tableau soit moins surchargé visuellement
  if (minutes === 0) return '-'; 
  
  // Math.floor permet d'obtenir le nombre d'heures pleines
  const h = Math.floor(minutes / 60);
  
  // Le modulo (%) permet de récupérer le reste (les minutes)
  const m = minutes % 60;
  
  // On ajoute un zéro devant les minutes si besoin (ex: "05" au lieu de "5")
  const mStr = m.toString().padStart(2, '0');
  
  return `<span style="font-weight:600;">${h}h${mStr}</span>`;
}

/**
 * Fonction utilitaire pour calculer le pourcentage par rapport aux 24h semaine (1440 minutes)
 * @param {number} minutes - Le nombre de minutes à convertir en pourcentage
 * @returns {string} - Le pourcentage formaté avec 1 décimale
 */
function calculatePercentage(minutes) {
  if (minutes === 0) return '-';
  const percentage = (minutes / 1440) * 100;
  return `<span style="font-size:11px; color:#666;">(${percentage.toFixed(1)}%)</span>`;
}

/**
 * Fonction principale qui calcule et génère le code HTML du tableau de statistiques
 */
function renderStats() {
  // 1. On nettoie l'ancienne vue pour éviter de superposer les tableaux
  statsContainer.innerHTML = '';

  // 2. On récupère la durée paramétrée d'un créneau (ex: 15 minutes)
  const dureeCreneau = parseInt(state.parametres.dureeCreneau, 10);

  // 3. Sécurité : S'il n'y a aucun élève dans la base, on affiche un message d'information
  if (!state.eleves || state.eleves.length === 0) {
    statsContainer.innerHTML = '<p style="font-size: 13px; color: #777; text-align:center;">Aucun élève enregistré pour le moment.</p>';
    return;
  }

  // 4. Création du conteneur principal avec onglets
  const container = document.createElement('div');
  container.style.width = '100%';
  
  // Création des onglets
  const tabsContainer = document.createElement('div');
  tabsContainer.style.display = 'flex';
  tabsContainer.style.marginBottom = '20px';
  tabsContainer.style.borderBottom = '1px solid #ccc';
  
  const tabs = [
    { id: 'eleves', label: 'Statistiques par élève', active: true },
    { id: 'enseignant', label: 'Statistiques enseignant', active: false },
    { id: 'aesh', label: 'Statistiques AESH', active: false },
    { id: 'pec', label: 'Statistiques PEC', active: false }
  ];
  
  const contentContainer = document.createElement('div');
  contentContainer.id = 'stats-content-container';
  
  tabs.forEach(tab => {
    const tabEl = document.createElement('button');
    tabEl.textContent = tab.label;
    tabEl.style.padding = '8px 16px';
    tabEl.style.border = 'none';
    tabEl.style.background = tab.active ? '#007acc' : '#f0f0f0';
    tabEl.style.color = tab.active ? 'white' : '#333';
    tabEl.style.cursor = 'pointer';
    tabEl.style.marginRight = '4px';
    tabEl.style.borderRadius = '4px 4px 0 0';
    tabEl.style.fontSize = '12px';
    
    tabEl.addEventListener('click', () => {
      // Mettre à jour l'état des onglets
      tabs.forEach(t => t.active = false);
      tab.active = true;
      
      // Mettre à jour l'affichage des onglets
      tabsContainer.querySelectorAll('button').forEach((btn, index) => {
        btn.style.background = tabs[index].active ? '#007acc' : '#f0f0f0';
        btn.style.color = tabs[index].active ? 'white' : '#333';
      });
      
      // Afficher le contenu correspondant
      renderTabContent(tab.id);
    });
    
    tabsContainer.appendChild(tabEl);
  });
  
  container.appendChild(tabsContainer);
  container.appendChild(contentContainer);
  statsContainer.appendChild(container);
  
  // 5. Afficher le contenu de l'onglet par défaut
  renderTabContent('eleves');
  
  /**
   * Fonction pour afficher le contenu d'un onglet spécifique
   */
  function renderTabContent(tabId) {
    contentContainer.innerHTML = '';
    
    switch(tabId) {
      case 'eleves':
        renderElevesStats();
        break;
      case 'enseignant':
        renderEnseignantStats();
        break;
      case 'aesh':
        renderAeshStats();
        break;
      case 'pec':
        renderPecStats();
        break;
    }
  }
  
  /**
   * Statistiques détaillées par élève
   */
  function renderElevesStats() {
    const table = document.createElement('table');
    table.style.width = '100%';
    table.style.borderCollapse = 'collapse';
    table.style.fontSize = '11px';
    table.style.marginTop = '10px';

    // En-tête du tableau avec toutes les colonnes
    table.innerHTML = `
      <thead>
        <tr style="background-color: #f0f0f0; border-bottom: 2px solid #ccc;">
          <th style="padding: 8px; text-align: left; border-right: 1px solid #ddd;">Élève</th>
          <th style="padding: 8px; text-align: center; border-right: 1px solid #ddd;">Total</th>
          <th style="padding: 8px; text-align: center; border-right: 1px solid #ddd; color: #e65100;">ULIS</th>
          <th style="padding: 8px; text-align: center; border-right: 1px solid #ddd; color: #1b5e20;">Inclusion</th>
          <th style="padding: 8px; text-align: center; border-right: 1px solid #ddd; color: #0d47a1;">Décloison.</th>
          <th style="padding: 8px; text-align: center; border-right: 1px solid #ddd; color: #6a1b9a;">PEC</th>
          <th style="padding: 8px; text-align: center; border-right: 1px solid #ddd; color: #333;">Autre</th>
          <th style="padding: 8px; text-align: center; border-right: 1px solid #ddd; color: #e65100;">AESHco</th>
          <th style="padding: 8px; text-align: center; border-right: 1px solid #ddd; color: #ff9800;">AESHi/m</th>
          <th style="padding: 8px; text-align: center; color: #1b5e20;">Enseignant</th>
        </tr>
      </thead>
      <tbody></tbody>
    `;

    const tbody = table.querySelector('tbody');

    // Boucle de calcul pour chaque élève
    state.eleves.forEach(eleve => {
      if (!eleve.actif) return;

      const creneauxEleve = state.creneaux.filter(c => c.eleveId === eleve.id);

      // Initialisation des compteurs
      let totalMinutes = 0;
      let ulisMinutes = 0;
      let inclusionMinutes = 0;
      let decloisonnementMinutes = 0;
      let pecMinutes = 0;
      let regulierMinutes = 0;
      let aeshcoMinutes = 0;
      let aeshiMinutes = 0;
      let enseignantMinutes = 0;

      // Analyse de chaque créneau
      creneauxEleve.forEach(creneau => {
        totalMinutes += dureeCreneau;

        // Type de regroupement
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

        // Type AESH
        switch(creneau.typeAESH) {
          case 'AESHco':
            aeshcoMinutes += dureeCreneau;
            break;
          case 'AESHi':
          case 'AESHm':
            aeshiMinutes += dureeCreneau;
            break;
        }

        // Rôle adulte
        if (creneau.roleAdulte === 'enseignant') {
          enseignantMinutes += dureeCreneau;
        }
      });

      // Création de la ligne HTML
      const tr = document.createElement('tr');
      tr.style.borderBottom = '1px solid #eee';

      tr.innerHTML = `
        <td style="padding: 8px; border-right: 1px solid #ddd;">
          <strong>${eleve.prenom || eleve.nom}</strong>
          ${eleve.ulis ? '<span style="color:#e91e63; font-size:10px; margin-left:4px;">(ULIS)</span>' : ''}
        </td>
        <td style="padding: 8px; text-align: center; border-right: 1px solid #ddd; background-color: #fafafa;">
          ${formatMinutesToHours(totalMinutes)}<br>
          ${calculatePercentage(totalMinutes)}
        </td>
        <td style="padding: 8px; text-align: center; border-right: 1px solid #ddd; color: #e65100;">
          ${formatMinutesToHours(ulisMinutes)}<br>
          ${calculatePercentage(ulisMinutes)}
        </td>
        <td style="padding: 8px; text-align: center; border-right: 1px solid #ddd; color: #1b5e20;">
          ${formatMinutesToHours(inclusionMinutes)}<br>
          ${calculatePercentage(inclusionMinutes)}
        </td>
        <td style="padding: 8px; text-align: center; border-right: 1px solid #ddd; color: #0d47a1;">
          ${formatMinutesToHours(decloisonnementMinutes)}<br>
          ${calculatePercentage(decloisonnementMinutes)}
        </td>
        <td style="padding: 8px; text-align: center; border-right: 1px solid #ddd; color: #6a1b9a;">
          ${formatMinutesToHours(pecMinutes)}<br>
          ${calculatePercentage(pecMinutes)}
        </td>
        <td style="padding: 8px; text-align: center; border-right: 1px solid #ddd; color: #333;">
          ${formatMinutesToHours(regulierMinutes)}<br>
          ${calculatePercentage(regulierMinutes)}
        </td>
        <td style="padding: 8px; text-align: center; border-right: 1px solid #ddd; color: #e65100;">
          ${formatMinutesToHours(aeshcoMinutes)}<br>
          ${calculatePercentage(aeshcoMinutes)}
        </td>
        <td style="padding: 8px; text-align: center; border-right: 1px solid #ddd; color: #ff9800;">
          ${formatMinutesToHours(aeshiMinutes)}<br>
          ${calculatePercentage(aeshiMinutes)}
        </td>
        <td style="padding: 8px; text-align: center; color: #1b5e20;">
          ${formatMinutesToHours(enseignantMinutes)}<br>
          ${calculatePercentage(enseignantMinutes)}
        </td>
      `;
      
      tbody.appendChild(tr);
    });

    // Ajouter un total général
    const totalRow = document.createElement('tr');
    totalRow.style.backgroundColor = '#f8f8f8';
    totalRow.style.borderTop = '2px solid #ccc';
    
    // Calculer les totaux globaux
    let globalTotal = 0;
    let globalUlis = 0;
    let globalInclusion = 0;
    let globalDecloisonnement = 0;
    let globalPec = 0;
    let globalRegulier = 0;
    let globalAeshco = 0;
    let globalAeshi = 0;
    let globalEnseignant = 0;
    
    state.eleves.forEach(eleve => {
      if (!eleve.actif) return;
      const creneauxEleve = state.creneaux.filter(c => c.eleveId === eleve.id);
      
      creneauxEleve.forEach(creneau => {
        globalTotal += dureeCreneau;
        
        switch(creneau.regroupementType) {
          case 'ULIS': globalUlis += dureeCreneau; break;
          case 'INCLUSION': globalInclusion += dureeCreneau; break;
          case 'DECLOISONNEMENT': globalDecloisonnement += dureeCreneau; break;
          case 'PEC': globalPec += dureeCreneau; break;
          case 'AUTRE': globalRegulier += dureeCreneau; break;
        }
        
        switch(creneau.typeAESH) {
          case 'AESHco': globalAeshco += dureeCreneau; break;
          case 'AESHi':
          case 'AESHm': globalAeshi += dureeCreneau; break;
        }
        
        if (creneau.roleAdulte === 'enseignant') {
          globalEnseignant += dureeCreneau;
        }
      });
    });
    
    totalRow.innerHTML = `
      <td style="padding: 8px; border-right: 1px solid #ddd; font-weight: bold;">TOTAL GÉNÉRAL</td>
      <td style="padding: 8px; text-align: center; border-right: 1px solid #ddd; font-weight: bold; background-color: #e8f5e8;">
        ${formatMinutesToHours(globalTotal)}
      </td>
      <td style="padding: 8px; text-align: center; border-right: 1px solid #ddd; font-weight: bold; color: #e65100;">
        ${formatMinutesToHours(globalUlis)}
      </td>
      <td style="padding: 8px; text-align: center; border-right: 1px solid #ddd; font-weight: bold; color: #1b5e20;">
        ${formatMinutesToHours(globalInclusion)}
      </td>
      <td style="padding: 8px; text-align: center; border-right: 1px solid #ddd; font-weight: bold; color: #0d47a1;">
        ${formatMinutesToHours(globalDecloisonnement)}
      </td>
      <td style="padding: 8px; text-align: center; border-right: 1px solid #ddd; font-weight: bold; color: #6a1b9a;">
        ${formatMinutesToHours(globalPec)}
      </td>
      <td style="padding: 8px; text-align: center; border-right: 1px solid #ddd; font-weight: bold; color: #333;">
        ${formatMinutesToHours(globalRegulier)}
      </td>
      <td style="padding: 8px; text-align: center; border-right: 1px solid #ddd; font-weight: bold; color: #e65100;">
        ${formatMinutesToHours(globalAeshco)}
      </td>
      <td style="padding: 8px; text-align: center; border-right: 1px solid #ddd; font-weight: bold; color: #ff9800;">
        ${formatMinutesToHours(globalAeshi)}
      </td>
      <td style="padding: 8px; text-align: center; font-weight: bold; color: #1b5e20;">
        ${formatMinutesToHours(globalEnseignant)}
      </td>
    `;
    
    tbody.appendChild(totalRow);
    contentContainer.appendChild(table);
  }
  
  /**
   * Statistiques pour l'enseignant
   */
  function renderEnseignantStats() {
    const container = document.createElement('div');
    container.style.padding = '20px';
    
    // Calculer les totaux
    let totalMinutes = 0;
    let ulisMinutes = 0;
    let coenseignementMinutes = 0;
    let reunionsESSMinutes = 0;
    let rencontresPartenairesMinutes = 0;
    
    // Analyser tous les créneaux
    state.creneaux.forEach(creneau => {
      totalMinutes += dureeCreneau;
      
      // Type de regroupement
      switch(creneau.regroupementType) {
        case 'ULIS':
          ulisMinutes += dureeCreneau;
          break;
        case 'INCLUSION':
          // Inclusion peut être considérée comme co-enseignement
          coenseignementMinutes += dureeCreneau;
          break;
      }
      
      // Pour les réunions ESS et rencontres partenaires, on pourrait utiliser un champ spécifique
      // Pour l'instant, on utilise le champ commentaire ou un champ dédié
      if (creneau.commentaire && creneau.commentaire.toLowerCase().includes('réunion ess')) {
        reunionsESSMinutes += dureeCreneau;
      }
      if (creneau.commentaire && creneau.commentaire.toLowerCase().includes('rencontre')) {
        rencontresPartenairesMinutes += dureeCreneau;
      }
    });
    
    // Créer le tableau de statistiques
    const table = document.createElement('table');
    table.style.width = '100%';
    table.style.borderCollapse = 'collapse';
    table.style.fontSize = '12px';
    table.style.marginTop = '10px';
    
    table.innerHTML = `
      <thead>
        <tr style="background-color: #f0f0f0; border-bottom: 2px solid #ccc;">
          <th style="padding: 8px; text-align: left; border-right: 1px solid #ddd;">Catégorie</th>
          <th style="padding: 8px; text-align: center; border-right: 1px solid #ddd;">Temps hebdomadaire</th>
          <th style="padding: 8px; text-align: center;">Pourcentage du temps total</th>
        </tr>
      </thead>
      <tbody>
        <tr style="border-bottom: 1px solid #eee;">
          <td style="padding: 8px; border-right: 1px solid #ddd;"><strong>ULIS (enseignement direct)</strong></td>
          <td style="padding: 8px; text-align: center; border-right: 1px solid #ddd; color: #e65100;">${formatMinutesToHours(ulisMinutes)}</td>
          <td style="padding: 8px; text-align: center;">${totalMinutes > 0 ? ((ulisMinutes / totalMinutes) * 100).toFixed(1) + '%' : '0%'}</td>
        </tr>
        <tr style="border-bottom: 1px solid #eee;">
          <td style="padding: 8px; border-right: 1px solid #ddd;"><strong>Co-enseignement (inclusion)</strong></td>
          <td style="padding: 8px; text-align: center; border-right: 1px solid #ddd; color: #1b5e20;">${formatMinutesToHours(coenseignementMinutes)}</td>
          <td style="padding: 8px; text-align: center;">${totalMinutes > 0 ? ((coenseignementMinutes / totalMinutes) * 100).toFixed(1) + '%' : '0%'}</td>
        </tr>
        <tr style="border-bottom: 1px solid #eee;">
          <td style="padding: 8px; border-right: 1px solid #ddd;"><strong>Réunions ESS</strong></td>
          <td style="padding: 8px; text-align: center; border-right: 1px solid #ddd; color: #0d47a1;">${formatMinutesToHours(reunionsESSMinutes)}</td>
          <td style="padding: 8px; text-align: center;">${totalMinutes > 0 ? ((reunionsESSMinutes / totalMinutes) * 100).toFixed(1) + '%' : '0%'}</td>
        </tr>
        <tr style="border-bottom: 1px solid #eee;">
          <td style="padding: 8px; border-right: 1px solid #ddd;"><strong>Rencontres partenaires</strong></td>
          <td style="padding: 8px; text-align: center; border-right: 1px solid #ddd; color: #6a1b9a;">${formatMinutesToHours(rencontresPartenairesMinutes)}</td>
          <td style="padding: 8px; text-align: center;">${totalMinutes > 0 ? ((rencontresPartenairesMinutes / totalMinutes) * 100).toFixed(1) + '%' : '0%'}</td>
        </tr>
        <tr style="background-color: #f8f8f8; border-top: 2px solid #ccc;">
          <td style="padding: 8px; border-right: 1px solid #ddd; font-weight: bold;">TOTAL</td>
          <td style="padding: 8px; text-align: center; border-right: 1px solid #ddd; font-weight: bold;">${formatMinutesToHours(totalMinutes)}</td>
          <td style="padding: 8px; text-align: center; font-weight: bold;">100%</td>
        </tr>
      </tbody>
    `;
    
    container.appendChild(table);
    
    // Ajouter une note explicative
    const note = document.createElement('p');
    note.style.fontSize = '11px';
    note.style.color = '#666';
    note.style.marginTop = '20px';
    note.innerHTML = '<strong>Note :</strong> Les statistiques sont calculées sur la base de tous les créneaux de la semaine. Les pourcentages représentent la répartition du temps de l\'enseignant entre les différentes activités.';
    
    container.appendChild(note);
    contentContainer.appendChild(container);
  }
  
  /**
   * Statistiques AESH
   */
  function renderAeshStats() {
    const container = document.createElement('div');
    container.style.padding = '20px';
    
    // Calculer les totaux par type AESH
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
    
    // Créer le tableau de statistiques
    const table = document.createElement('table');
    table.style.width = '100%';
    table.style.borderCollapse = 'collapse';
    table.style.fontSize = '12px';
    table.style.marginTop = '10px';
    
    table.innerHTML = `
      <thead>
        <tr style="background-color: #f0f0f0; border-bottom: 2px solid #ccc;">
          <th style="padding: 8px; text-align: left; border-right: 1px solid #ddd;">Type d'AESH</th>
          <th style="padding: 8px; text-align: center; border-right: 1px solid #ddd;">Description</th>
          <th style="padding: 8px; text-align: center; border-right: 1px solid #ddd;">Temps hebdomadaire</th>
          <th style="padding: 8px; text-align: center;">Pourcentage du temps AESH</th>
        </tr>
      </thead>
      <tbody>
        <tr style="border-bottom: 1px solid #eee;">
          <td style="padding: 8px; border-right: 1px solid #ddd;"><strong>AESHco</strong></td>
          <td style="padding: 8px; border-right: 1px solid #ddd; font-size: 11px;">Accompagnement collectif (groupe classe)</td>
          <td style="padding: 8px; text-align: center; border-right: 1px solid #ddd; color: #e65100;">${formatMinutesToHours(aeshcoMinutes)}</td>
          <td style="padding: 8px; text-align: center;">${totalAeshMinutes > 0 ? ((aeshcoMinutes / totalAeshMinutes) * 100).toFixed(1) + '%' : '0%'}</td>
        </tr>
        <tr style="border-bottom: 1px solid #eee;">
          <td style="padding: 8px; border-right: 1px solid #ddd;"><strong>AESHi</strong></td>
          <td style="padding: 8px; border-right: 1px solid #ddd; font-size: 11px;">Accompagnement individuel (1 élève)</td>
          <td style="padding: 8px; text-align: center; border-right: 1px solid #ddd; color: #ff9800;">${formatMinutesToHours(aeshiMinutes)}</td>
          <td style="padding: 8px; text-align: center;">${totalAeshMinutes > 0 ? ((aeshiMinutes / totalAeshMinutes) * 100).toFixed(1) + '%' : '0%'}</td>
        </tr>
        <tr style="border-bottom: 1px solid #eee;">
          <td style="padding: 8px; border-right: 1px solid #ddd;"><strong>AESHm</strong></td>
          <td style="padding: 8px; border-right: 1px solid #ddd; font-size: 11px;">Accompagnement mutualisé (2-3 élèves)</td>
          <td style="padding: 8px; text-align: center; border-right: 1px solid #ddd; color: #ff5722;">${formatMinutesToHours(aeshmMinutes)}</td>
          <td style="padding: 8px; text-align: center;">${totalAeshMinutes > 0 ? ((aeshmMinutes / totalAeshMinutes) * 100).toFixed(1) + '%' : '0%'}</td>
        </tr>
        <tr style="background-color: #f8f8f8; border-top: 2px solid #ccc;">
          <td style="padding: 8px; border-right: 1px solid #ddd; font-weight: bold;">TOTAL AESH</td>
          <td style="padding: 8px; text-align: center; border-right: 1px solid #ddd; font-weight: bold;">${formatMinutesToHours(totalAeshMinutes)}</td>
          <td style="padding: 8px; text-align: center; font-weight: bold;">100%</td>
          <td style="padding: 8px; text-align: center; font-weight: bold;">${totalAeshMinutes > 0 ? calculatePercentage(totalAeshMinutes) : '-'}</td>
        </tr>
      </tbody>
    `;
    
    container.appendChild(table);
    
    // Ajouter une note explicative
    const note = document.createElement('p');
    note.style.fontSize = '11px';
    note.style.color = '#666';
    note.style.marginTop = '20px';
    note.innerHTML = '<strong>Note :</strong> Les statistiques AESH sont calculées sur la base de tous les créneaux où un type d\'AESH est spécifié. AESHco = accompagnement collectif, AESHi = individuel, AESHm = mutualisé.';
    
    container.appendChild(note);
    contentContainer.appendChild(container);
  }
  
  /**
   * Statistiques PEC (prise en charge)
   */
  function renderPecStats() {
    const container = document.createElement('div');
    container.style.padding = '20px';
    
    // Calculer les totaux par spécialité et organisme
    let orthophonisteMinutes = 0;
    let psychomotricienMinutes = 0;
    let psychologueMinutes = 0;
    let educateurMinutes = 0;
    let autreMinutes = 0;
    
    let cmppMinutes = 0;
    let cmpMinutes = 0;
    let sessadMinutes = 0;
    let priveMinutes = 0;
    let autreOrgMinutes = 0;
    
    state.creneaux.forEach(creneau => {
      if (creneau.regroupementType === 'PEC') {
        // Spécialité
        switch(creneau.pecSpecialite) {
          case 'orthophoniste':
            orthophonisteMinutes += dureeCreneau;
            break;
          case 'psychomotricien':
            psychomotricienMinutes += dureeCreneau;
            break;
          case 'psychologue':
            psychologueMinutes += dureeCreneau;
            break;
          case 'educateur':
            educateurMinutes += dureeCreneau;
            break;
          case 'autre':
            autreMinutes += dureeCreneau;
            break;
        }
        
        // Organisme
        switch(creneau.pecOrganisme) {
          case 'CMPP':
            cmppMinutes += dureeCreneau;
            break;
          case 'CMP':
            cmpMinutes += dureeCreneau;
            break;
          case 'SESSAD':
            sessadMinutes += dureeCreneau;
            break;
          case 'privé':
            priveMinutes += dureeCreneau;
            break;
          case 'autre':
            autreOrgMinutes += dureeCreneau;
            break;
        }
      }
    });
    
    const totalPecMinutes = orthophonisteMinutes + psychomotricienMinutes + psychologueMinutes + 
                           educateurMinutes + autreMinutes;
    
    // Créer le tableau de statistiques par spécialité
    const tableSpe = document.createElement('table');
    tableSpe.style.width = '100%';
    tableSpe.style.borderCollapse = 'collapse';
    tableSpe.style.fontSize = '12px';
    tableSpe.style.marginTop = '10px';
    tableSpe.style.marginBottom = '30px';
    
    tableSpe.innerHTML = `
      <thead>
        <tr style="background-color: #f0f0f0; border-bottom: 2px solid #ccc;">
          <th colspan="4" style="padding: 8px; text-align: left; border-right: 1px solid #ddd; background-color: #e8f5e8;">
            <strong>Répartition par spécialité PEC</strong>
          </th>
        </tr>
        <tr style="background-color: #f8f8f8; border-bottom: 1px solid #ccc;">
          <th style="padding: 8px; text-align: left; border-right: 1px solid #ddd;">Spécialité</th>
          <th style="padding: 8px; text-align: center; border-right: 1px solid #ddd;">Temps hebdomadaire</th>
          <th style="padding: 8px; text-align: center; border-right: 1px solid #ddd;">Pourcentage du temps PEC</th>
          <th style="padding: 8px; text-align: center;">Pourcentage du temps total</th>
        </tr>
      </thead>
      <tbody>
        <tr style="border-bottom: 1px solid #eee;">
          <td style="padding: 8px; border-right: 1px solid #ddd;"><strong>Orthophoniste</strong></td>
          <td style="padding: 8px; text-align: center; border-right: 1px solid #ddd; color: #4caf50;">${formatMinutesToHours(orthophonisteMinutes)}</td>
          <td style="padding: 8px; text-align: center; border-right: 1px solid #ddd;">${totalPecMinutes > 0 ? ((orthophonisteMinutes / totalPecMinutes) * 100).toFixed(1) + '%' : '0%'}</td>
          <td style="padding: 8px; text-align: center;">${calculatePercentage(orthophonisteMinutes)}</td>
        </tr>
        <tr style="border-bottom: 1px solid #eee;">
          <td style="padding: 8px; border-right: 1px solid #ddd;"><strong>Psychomotricien</strong></td>
          <td style="padding: 8px; text-align: center; border-right: 1px solid #ddd; color: #2196f3;">${formatMinutesToHours(psychomotricienMinutes)}</td>
          <td style="padding: 8px; text-align: center; border-right: 1px solid #ddd;">${totalPecMinutes > 0 ? ((psychomotricienMinutes / totalPecMinutes) * 100).toFixed(1) + '%' : '0%'}</td>
          <td style="padding: 8px; text-align: center;">${calculatePercentage(psychomotricienMinutes)}</td>
        </tr>
        <tr style="border-bottom: 1px solid #eee;">
          <td style="padding: 8px; border-right: 1px solid #ddd;"><strong>Psychologue</strong></td>
          <td style="padding: 8px; text-align: center; border-right: 1px solid #ddd; color: #9c27b0;">${formatMinutesToHours(psychologueMinutes)}</td>
          <td style="padding: 8px; text-align: center; border-right: 1px solid #ddd;">${totalPecMinutes > 0 ? ((psychologueMinutes / totalPecMinutes) * 100).toFixed(1) + '%' : '0%'}</td>
          <td style="padding: 8px; text-align: center;">${calculatePercentage(psychologueMinutes)}</td>
        </tr>
        <tr style="border-bottom: 1px solid #eee;">
          <td style="padding: 8px; border-right: 1px solid #ddd;"><strong>Éducateur</strong></td>
          <td style="padding: 8px; text-align: center; border-right: 1px solid #ddd; color: #ff5722;">${formatMinutesToHours(educateurMinutes)}</td>
          <td style="padding: 8px; text-align: center; border-right: 1px solid #ddd;">${totalPecMinutes > 0 ? ((educateurMinutes / totalPecMinutes) * 100).toFixed(1) + '%' : '0%'}</td>
          <td style="padding: 8px; text-align: center;">${calculatePercentage(educateurMinutes)}</td>
        </tr>
        <tr style="border-bottom: 1px solid #eee;">
          <td style="padding: 8px; border-right: 1px solid #ddd;"><strong>Autre</strong></td>
          <td style="padding: 8px; text-align: center; border-right: 1px solid #ddd; color: #607d8b;">${formatMinutesToHours(autreMinutes)}</td>
          <td style="padding: 8px; text-align: center; border-right: 1px solid #ddd;">${totalPecMinutes > 0 ? ((autreMinutes / totalPecMinutes) * 100).toFixed(1) + '%' : '0%'}</td>
          <td style="padding: 8px; text-align: center;">${calculatePercentage(autreMinutes)}</td>
        </tr>
        <tr style="background-color: #f8f8f8; border-top: 2px solid #ccc;">
          <td style="padding: 8px; border-right: 1px solid #ddd; font-weight: bold;">TOTAL PEC</td>
          <td style="padding: 8px; text-align: center; border-right: 1px solid #ddd; font-weight: bold;">${formatMinutesToHours(totalPecMinutes)}</td>
          <td style="padding: 8px; text-align: center; border-right: 1px solid #ddd; font-weight: bold;">100%</td>
          <td style="padding: 8px; text-align: center; font-weight: bold;">${totalPecMinutes > 0 ? calculatePercentage(totalPecMinutes) : '-'}</td>
        </tr>
      </tbody>
    `;
    
    container.appendChild(tableSpe);
    
    // Créer le tableau de statistiques par organisme
    const tableOrg = document.createElement('table');
    tableOrg.style.width = '100%';
    tableOrg.style.borderCollapse = 'collapse';
    tableOrg.style.fontSize = '12px';
    tableOrg.style.marginTop = '10px';
    
    tableOrg.innerHTML = `
      <thead>
        <tr style="background-color: #f0f0f0; border-bottom: 2px solid #ccc;">
          <th colspan="4" style="padding: 8px; text-align: left; border-right: 1px solid #ddd; background-color: #e8f5e8;">
            <strong>Répartition par organisme PEC</strong>
          </th>
        </tr>
        <tr style="background-color: #f8f8f8; border-bottom: 1px solid #ccc;">
          <th style="padding: 8px; text-align: left; border-right: 1px solid #ddd;">Organisme</th>
          <th style="padding: 8px; text-align: center; border-right: 1px solid #ddd;">Temps hebdomadaire</th>
          <th style="padding: 8px; text-align: center; border-right: 1px solid #ddd;">Pourcentage du temps PEC</th>
          <th style="padding: 8px; text-align: center;">Pourcentage du temps total</th>
        </tr>
      </thead>
      <tbody>
        <tr style="border-bottom: 1px solid #eee;">
          <td style="padding: 8px; border-right: 1px solid #ddd;"><strong>CMPP</strong></td>
          <td style="padding: 8px; text-align: center; border-right: 1px solid #ddd; color: #4caf50;">${formatMinutesToHours(cmppMinutes)}</td>
          <td style="padding: 8px; text-align: center; border-right: 1px solid #ddd;">${totalPecMinutes > 0 ? ((cmppMinutes / totalPecMinutes) * 100).toFixed(1) + '%' : '0%'}</td>
          <td style="padding: 8px; text-align: center;">${calculatePercentage(cmppMinutes)}</td>
        </tr>
        <tr style="border-bottom: 1px solid #eee;">
          <td style="padding: 8px; border-right: 1px solid #ddd;"><strong>CMP</strong></td>
          <td style="padding: 8px; text-align: center; border-right: 1px solid #ddd; color: #2196f3;">${formatMinutesToHours(cmpMinutes)}</td>
          <td style="padding: 8px; text-align: center; border-right: 1px solid #ddd;">${totalPecMinutes > 0 ? ((cmpMinutes / totalPecMinutes) * 100).toFixed(1) + '%' : '0%'}</td>
          <td style="padding: 8px; text-align: center;">${calculatePercentage(cmpMinutes)}</td>
        </tr>
        <tr style="border-bottom: 1px solid #eee;">
          <td style="padding: 8px; border-right: 1px solid #ddd;"><strong>SESSAD</strong></td>
          <td style="padding: 8px; text-align: center; border-right: 1px solid #ddd; color: #9c27b0;">${formatMinutesToHours(sessadMinutes)}</td>
          <td style="padding: 8px; text-align: center; border-right: 1px solid #ddd;">${totalPecMinutes > 0 ? ((sessadMinutes / totalPecMinutes) * 100).toFixed(1) + '%' : '0%'}</td>
          <td style="padding: 8px; text-align: center;">${calculatePercentage(sessadMinutes)}</td>
        </tr>
        <tr style="border-bottom: 1px solid #eee;">
          <td style="padding: 8px; border-right: 1px solid #ddd;"><strong>Privé</strong></td>
          <td style="padding: 8px; text-align: center; border-right: 1px solid #ddd; color: #ff5722;">${formatMinutesToHours(priveMinutes)}</td>
          <td style="padding: 8px; text-align: center; border-right: 1px solid #ddd;">${totalPecMinutes > 0 ? ((priveMinutes / totalPecMinutes) * 100).toFixed(1) + '%' : '0%'}</td>
          <td style="padding: 8px; text-align: center;">${calculatePercentage(priveMinutes)}</td>
        </tr>
        <tr style="border-bottom: 1px solid #eee;">
          <td style="padding: 8px; border-right: 1px solid #ddd;"><strong>Autre</strong></td>
          <td style="padding: 8px; text-align: center; border-right: 1px solid #ddd; color: #607d8b;">${formatMinutesToHours(autreOrgMinutes)}</td>
          <td style="padding: 8px; text-align: center; border-right: 1px solid #ddd;">${totalPecMinutes > 0 ? ((autreOrgMinutes / totalPecMinutes) * 100).toFixed(1) + '%' : '0%'}</td>
          <td style="padding: 8px; text-align: center;">${calculatePercentage(autreOrgMinutes)}</td>
        </tr>
        <tr style="background-color: #f8f8f8; border-top: 2px solid #ccc;">
          <td style="padding: 8px; border-right: 1px solid #ddd; font-weight: bold;">TOTAL PEC</td>
          <td style="padding: 8px; text-align: center; border-right: 1px solid #ddd; font-weight: bold;">${formatMinutesToHours(totalPecMinutes)}</td>
          <td style="padding: 8px; text-align: center; border-right: 1px solid #ddd; font-weight: bold;">100%</td>
          <td style="padding: 8px; text-align: center; font-weight: bold;">${totalPecMinutes > 0 ? calculatePercentage(totalPecMinutes) : '-'}</td>
        </tr>
      </tbody>
    `;
    
    container.appendChild(tableOrg);
    
    // Ajouter une note explicative
    const note = document.createElement('p');
    note.style.fontSize = '11px';
    note.style.color = '#666';
    note.style.marginTop = '20px';
    note.innerHTML = '<strong>Note :</strong> Les statistiques PEC sont calculées sur la base de tous les créneaux de type PEC. Les pourcentages représentent la répartition du temps de prise en charge par spécialité et par organisme.';
    
    container.appendChild(note);
    contentContainer.appendChild(container);
  }
}
