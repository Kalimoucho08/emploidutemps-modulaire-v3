/**
 * js/parametres.js
 * Gestion des paramètres globaux refondus - Interface unique scrollable
 * Version 3.0 - Palette de 12 couleurs partagée, association par index, champs à afficher
 */

/**
 * Ouvre la modale des paramètres globaux
 */
function ouvrirParametresGlobaux() {
    console.log('Ouverture des paramètres globaux refondus');
    
    // Charger les paramètres actuels dans le formulaire
    chargerParametres();
    
    // Initialiser les interfaces dynamiques
    initialiserPaletteCouleurs();
    initialiserPauses();
    
    // Afficher la modale
    const backdrop = document.getElementById('modal-parametres-globaux-backdrop');
    if (backdrop) {
        backdrop.classList.add('visible');
    } else {
        console.error('Backdrop modal-parametres-globaux-backdrop non trouvé');
    }
}

/**
 * Ferme la modale des paramètres globaux
 */
function fermerParametresGlobaux() {
    console.log('Fermeture des paramètres globaux');
    
    const backdrop = document.getElementById('modal-parametres-globaux-backdrop');
    if (backdrop) {
        backdrop.classList.remove('visible');
    }
}

/**
 * Charge les paramètres depuis state.parametres dans le formulaire
 */
function chargerParametres() {
    if (!state || !state.parametres) return;
    
    const params = state.parametres;
    
    // 1. Jours affichés
    const joursAffiches = params.joursAffiches || ['lundi', 'mardi', 'jeudi', 'vendredi'];
    document.getElementById('param-jour-lundi').checked = joursAffiches.includes('lundi');
    document.getElementById('param-jour-mardi').checked = joursAffiches.includes('mardi');
    document.getElementById('param-jour-mercredi').checked = joursAffiches.includes('mercredi');
    document.getElementById('param-jour-jeudi').checked = joursAffiches.includes('jeudi');
    document.getElementById('param-jour-vendredi').checked = joursAffiches.includes('vendredi');
    document.getElementById('param-jour-samedi').checked = joursAffiches.includes('samedi');
    
    // 2. Horaires
    document.getElementById('param-heure-debut').value = params.heureDebut || '08:30';
    document.getElementById('param-heure-fin').value = params.heureFin || '16:30';
    document.getElementById('param-duree-creneau').value = params.dureeCreneau || '15';
    
    // 3. Palette de 12 couleurs partagée
    const palette = params.paletteCouleurs || getPaletteCouleursParDefaut();
    // La palette sera chargée par initialiserPaletteCouleurs()
    
    // 4. Association couleurs ↔ types de regroupement - SUPPRIMÉE
    
    // 5. Champs à afficher
    const champsAffiches = params.champsAffiches || getChampsAffichesParDefaut();
    
    // Champs élèves de base
    document.getElementById('param-champ-classe').checked = champsAffiches.classe !== false;
    document.getElementById('param-champ-ulis').checked = champsAffiches.ulis !== false;
    document.getElementById('param-champ-groupe').checked = champsAffiches.groupe !== false;
    document.getElementById('param-champ-aesh').checked = champsAffiches.aesh !== false;
    document.getElementById('param-champ-pec').checked = champsAffiches.pec !== false;
    document.getElementById('param-champ-niveau').checked = champsAffiches.niveau !== false;
    
    // Fiche élève complète
    document.getElementById('param-champ-taxi').checked = champsAffiches.taxi !== false;
    document.getElementById('param-champ-cantine').checked = champsAffiches.cantine !== false;
    document.getElementById('param-champ-date-naissance').checked = champsAffiches.dateNaissance !== false;
    document.getElementById('param-champ-date-entree').checked = champsAffiches.dateEntree !== false;
    document.getElementById('param-champ-telephone').checked = champsAffiches.telephone !== false;
    document.getElementById('param-champ-email').checked = champsAffiches.email !== false;
    document.getElementById('param-champ-adresse').checked = champsAffiches.adresse !== false;
    document.getElementById('param-champ-allergies').checked = champsAffiches.allergies !== false;
    document.getElementById('param-champ-regime').checked = champsAffiches.regime !== false;
    document.getElementById('param-champ-medical').checked = champsAffiches.medical !== false;
    
    // Champs créneaux
    document.getElementById('param-champ-matiere').checked = champsAffiches.matiere !== false;
    document.getElementById('param-champ-groupe-creneau').checked = champsAffiches.groupeCreneau !== false;
    document.getElementById('param-champ-adulte').checked = champsAffiches.adulte !== false;
    document.getElementById('param-champ-type').checked = champsAffiches.type !== false;
    document.getElementById('param-champ-regroupement').checked = champsAffiches.regroupement !== false;
    document.getElementById('param-champ-commentaire').checked = champsAffiches.commentaire !== false;
    
    // Modale édition complète
    document.getElementById('param-champ-pec-specialite').checked = champsAffiches.pecSpecialite !== false;
    document.getElementById('param-champ-pec-organisme').checked = champsAffiches.pecOrganisme !== false;
    document.getElementById('param-champ-aesh-type').checked = champsAffiches.aeshType !== false;
    document.getElementById('param-champ-role-adulte').checked = champsAffiches.roleAdulte !== false;
    
    // Droits MDPH
    document.getElementById('param-champ-mdph-ulis').checked = champsAffiches.mdphUlis !== false;
    document.getElementById('param-champ-mdph-sessad').checked = champsAffiches.mdphSessad !== false;
    document.getElementById('param-champ-mdph-aesh').checked = champsAffiches.mdphAesh !== false;
    document.getElementById('param-champ-mdph-transport').checked = champsAffiches.mdphTransport !== false;
    document.getElementById('param-champ-mdph-autre').checked = champsAffiches.mdphAutre !== false;
    
    // 6. Zones d'enseignement réelles
    const zones = params.zonesEnseignement || {};
    document.getElementById('param-academie').value = zones.academie || '';
    document.getElementById('param-departement').value = zones.departement || '';
    document.getElementById('param-ville').value = zones.ville || '';
}

/**
 * Sauvegarde les paramètres depuis le formulaire vers state.parametres
 */
function sauvegarderParametres() {
    console.log('Sauvegarde des paramètres globaux refondus - début');
    
    // 1. Jours affichés
    const joursAffiches = [];
    if (document.getElementById('param-jour-lundi').checked) joursAffiches.push('lundi');
    if (document.getElementById('param-jour-mardi').checked) joursAffiches.push('mardi');
    if (document.getElementById('param-jour-mercredi').checked) joursAffiches.push('mercredi');
    if (document.getElementById('param-jour-jeudi').checked) joursAffiches.push('jeudi');
    if (document.getElementById('param-jour-vendredi').checked) joursAffiches.push('vendredi');
    if (document.getElementById('param-jour-samedi').checked) joursAffiches.push('samedi');
    
    // 2. Horaires
    const heureDebut = document.getElementById('param-heure-debut').value;
    const heureFin = document.getElementById('param-heure-fin').value;
    const dureeCreneau = document.getElementById('param-duree-creneau').value;
    
    // 3. Palette de 12 couleurs partagée
    const paletteCouleurs = [];
    for (let i = 0; i < 12; i++) {
        const input = document.getElementById(`param-couleur-${i}`);
        if (input) {
            paletteCouleurs.push(input.value);
        } else {
            // Fallback aux couleurs par défaut
            paletteCouleurs.push(getPaletteCouleursParDefaut()[i]);
        }
    }
    console.log('Nouvelle palette sauvegardée:', paletteCouleurs);
    
    // 4. Association couleurs ↔ types de regroupement - SUPPRIMÉE
    // Nous ne gérons plus l'association entre couleurs et types de regroupement
    
    // 5. Champs à afficher
    const champsAffiches = {
        // Champs élèves de base
        classe: document.getElementById('param-champ-classe').checked,
        ulis: document.getElementById('param-champ-ulis').checked,
        groupe: document.getElementById('param-champ-groupe').checked,
        aesh: document.getElementById('param-champ-aesh').checked,
        pec: document.getElementById('param-champ-pec').checked,
        niveau: document.getElementById('param-champ-niveau').checked,
        
        // Fiche élève complète
        taxi: document.getElementById('param-champ-taxi').checked,
        cantine: document.getElementById('param-champ-cantine').checked,
        dateNaissance: document.getElementById('param-champ-date-naissance').checked,
        dateEntree: document.getElementById('param-champ-date-entree').checked,
        telephone: document.getElementById('param-champ-telephone').checked,
        email: document.getElementById('param-champ-email').checked,
        adresse: document.getElementById('param-champ-adresse').checked,
        allergies: document.getElementById('param-champ-allergies').checked,
        regime: document.getElementById('param-champ-regime').checked,
        medical: document.getElementById('param-champ-medical').checked,
        
        // Champs créneaux
        matiere: document.getElementById('param-champ-matiere').checked,
        groupeCreneau: document.getElementById('param-champ-groupe-creneau').checked,
        adulte: document.getElementById('param-champ-adulte').checked,
        type: document.getElementById('param-champ-type').checked,
        regroupement: document.getElementById('param-champ-regroupement').checked,
        commentaire: document.getElementById('param-champ-commentaire').checked,
        
        // Modale édition complète
        pecSpecialite: document.getElementById('param-champ-pec-specialite').checked,
        pecOrganisme: document.getElementById('param-champ-pec-organisme').checked,
        aeshType: document.getElementById('param-champ-aesh-type').checked,
        roleAdulte: document.getElementById('param-champ-role-adulte').checked,
        
        // Droits MDPH
        mdphUlis: document.getElementById('param-champ-mdph-ulis').checked,
        mdphSessad: document.getElementById('param-champ-mdph-sessad').checked,
        mdphAesh: document.getElementById('param-champ-mdph-aesh').checked,
        mdphTransport: document.getElementById('param-champ-mdph-transport').checked,
        mdphAutre: document.getElementById('param-champ-mdph-autre').checked
    };
    
    // 6. Zones d'enseignement réelles
    const zonesEnseignement = {
        academie: document.getElementById('param-academie').value,
        departement: document.getElementById('param-departement').value,
        ville: document.getElementById('param-ville').value
    };
    
    // 7. Pauses (gérées séparément)
    const pauses = sauvegarderPausesConfiguration();
    
    // Mettre à jour state.parametres
    if (!state.parametres) state.parametres = {};
    
    state.parametres.joursAffiches = joursAffiches;
    state.parametres.heureDebut = heureDebut;
    state.parametres.heureFin = heureFin;
    state.parametres.dureeCreneau = dureeCreneau;
    state.parametres.paletteCouleurs = paletteCouleurs;
    state.parametres.champsAffiches = champsAffiches;
    state.parametres.zonesEnseignement = zonesEnseignement;
    state.parametres.pauses = pauses;
    
    // Supprimer l'ancien champ demiJournee s'il existe
    if (state.parametres.demiJournee !== undefined) {
        delete state.parametres.demiJournee;
    }
    
    // Sauvegarder l'état
    saveState();
    
    console.log('Appel de appliquerCouleurs()...');
    // Appliquer les couleurs immédiatement
    appliquerCouleurs();
    
    // PROPAGATION DES CHANGEMENTS DE CONFIGURATION DES CHAMPS
    console.log('Propagation des changements de configuration des champs...');
    
    // 1. Appliquer la configuration des champs créneau (si une modale d'édition est ouverte)
    if (typeof appliquerConfigurationChampsCreneau === 'function') {
        console.log('Appel de appliquerConfigurationChampsCreneau()');
        appliquerConfigurationChampsCreneau();
    }
    
    // 2. Appliquer la configuration des champs élève (si une fiche élève est ouverte)
    if (typeof appliquerConfigurationChampsEleve === 'function') {
        console.log('Appel de appliquerConfigurationChampsEleve()');
        appliquerConfigurationChampsEleve();
    }
    
    // 3. Recharger l'interface principale si nécessaire
    if (typeof renderAll === 'function') {
        console.log('Appel de renderAll()');
        renderAll();
    } else if (typeof renderTable === 'function') {
        console.log('Appel de renderTable()');
        renderTable();
    }
    
    // Fermer la modale
    fermerParametresGlobaux();
    
    alert('Paramètres globaux sauvegardés avec succès !');
    console.log('Sauvegarde des paramètres globaux refondus - fin');
}

/**
 * Initialise la palette de 12 couleurs dans l'interface
 */
function initialiserPaletteCouleurs() {
    var container = document.getElementById('palette-couleurs-container');
    if (!container) return;

    container.innerHTML = '';

    var palette = state.parametres?.paletteCouleurs || getPaletteCouleursParDefaut();

    for (var i = 0; i < 12; i++) {
        var couleur = palette[i] || '#ffffff';

        var wrap = document.createElement('div');
        wrap.style.cssText = 'position:relative;display:inline-flex;';

        var input = document.createElement('input');
        input.type = 'color';
        input.id = 'param-couleur-' + i;
        input.value = couleur;
        input.title = 'Couleur ' + (i + 1) + ': ' + couleur;
        input.style.cssText = 'width:36px;height:36px;border-radius:6px;border:2px solid #ddd;cursor:pointer;padding:0;';
        // Masquer le wrapper par défaut du navigateur
        input.setAttribute('data-index', i);
        wrap.appendChild(input);
        container.appendChild(wrap);
    }

    // Bouton de reinitialisation
    var btnReset = document.getElementById('btn-reset-palette');
    if (btnReset) {
        btnReset.addEventListener('click', function() {
            var paletteDefaut = getPaletteCouleursParDefaut();
            for (var i = 0; i < 12; i++) {
                var input = document.getElementById('param-couleur-' + i);
                if (input) {
                    input.value = paletteDefaut[i];
                }
            }
        });
    }
}

/**
 * Retourne les champs à afficher par défaut (tous cochés)
 */
function getChampsAffichesParDefaut() {
    return {
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

/**
 * Initialise l'interface des pauses (cantine, récréation, APC, périscolaire)
 */
function initialiserPauses() {
    const container = document.getElementById('pauses-container');
    if (!container) return;
    
    // Vérifier si le bouton d'ajout existe déjà pour éviter de le recréer
    const existingBtn = container.querySelector('#btn-ajouter-pause');
    
    // Nettoyer uniquement les éléments de pause existants, pas le bouton d'ajout
    const existingPauseItems = container.querySelectorAll('.pause-item');
    existingPauseItems.forEach(item => item.remove());
    
    const pauses = state.parametres?.pauses || [];
    
    // Pauses par défaut
    const pausesParDefaut = [
        { id: 'cantine', nom: 'Cantine', heureDebut: '12:00', heureFin: '13:30', affichee: true },
        { id: 'recreation-matin', nom: 'Récréation matin', heureDebut: '10:15', heureFin: '10:30', affichee: true },
        { id: 'recreation-aprem', nom: 'Récréation après-midi', heureDebut: '15:15', heureFin: '15:30', affichee: true },
        { id: 'apc', nom: 'APC', heureDebut: '16:30', heureFin: '17:00', affichee: false },
        { id: 'periscolaire', nom: 'Périscolaire', heureDebut: '17:00', heureFin: '18:00', affichee: false }
    ];
    
    // Fusionner avec les pauses existantes
    const pausesAffichees = pauses.length > 0 ? pauses : pausesParDefaut;
    
    pausesAffichees.forEach((pause, index) => {
        const div = document.createElement('div');
        div.className = 'pause-item';
        div.style.display = 'flex';
        div.style.alignItems = 'center';
        div.style.gap = '8px';
        div.style.marginBottom = '8px';
        div.style.padding = '8px';
        div.style.backgroundColor = '#f9f9f9';
        div.style.borderRadius = '4px';
        
        div.innerHTML = `
            <input type="checkbox" id="pause-${pause.id}" ${pause.affichee ? 'checked' : ''} style="margin: 0;">
            <label for="pause-${pause.id}" style="flex: 1; font-size: 12px; font-weight: 600;">${pause.nom}</label>
            <input type="time" id="pause-${pause.id}-debut" value="${pause.heureDebut}" style="width: 80px; padding: 2px 4px; font-size: 12px;">
            <span style="font-size: 12px;">à</span>
            <input type="time" id="pause-${pause.id}-fin" value="${pause.heureFin}" style="width: 80px; padding: 2px 4px; font-size: 12px;">
        `;
        
        container.appendChild(div);
    });
    
    // Bouton "+ajouter une pause" pour ajouter une nouvelle pause personnalisée
    // Créer le bouton uniquement s'il n'existe pas déjà
    let btnAjouterPause = existingBtn;
    if (!btnAjouterPause) {
        btnAjouterPause = document.createElement('button');
        btnAjouterPause.type = 'button';
        btnAjouterPause.id = 'btn-ajouter-pause'; // AJOUT DE L'ID
        btnAjouterPause.className = 'btn-ajouter-pause';
        btnAjouterPause.textContent = '+ Ajouter une pause';
        btnAjouterPause.style.marginTop = '12px';
        btnAjouterPause.style.padding = '8px 12px';
        btnAjouterPause.style.backgroundColor = '#4CAF50';
        btnAjouterPause.style.color = '#ffffff';
        btnAjouterPause.style.border = 'none';
        btnAjouterPause.style.borderRadius = '4px';
        btnAjouterPause.style.cursor = 'pointer';
        btnAjouterPause.style.fontWeight = '600';
        
        // Attacher l'événement de clic avec capture: true pour s'exécuter avant l'écouteur global
        btnAjouterPause.addEventListener('click', (event) => {
            console.log('DEBUG: Bouton +ajouter une pause cliqué', event);
            console.log('DEBUG: event.target:', event.target);
            console.log('DEBUG: event.currentTarget:', event.currentTarget);
            
            // Empêcher le comportement par défaut et la propagation
            event.preventDefault();
            event.stopPropagation();
            console.log('DEBUG: event.preventDefault() et event.stopPropagation() appelés');
            
            // Générer un ID unique pour la nouvelle pause
            const newPauseId = `pause-${Date.now()}`;
            console.log('DEBUG: Appel de prompt()...');
            const newNom = prompt('Nom de la nouvelle pause :', 'Nouvelle pause');
            console.log('DEBUG: prompt() retourné:', newNom);
            if (!newNom) return;
            
            // Créer la nouvelle pause avec des valeurs par défaut
            const nouvellePause = {
                id: newPauseId,
                nom: newNom,
                heureDebut: '09:00',
                heureFin: '09:30',
                affichee: true
            };
            
            // Ajouter la nouvelle pause à la liste
            state.parametres.pauses.push(nouvellePause);
            
            // Rafraîchir l'interface pour afficher la nouvelle pause
            initialiserPauses();
            
            // Sauvegarder l'état
            saveState();
            
            console.log(`Nouvelle pause ajoutée : ${newNom} (${newPauseId})`);
        }, { capture: true }); // Utiliser la phase de capture
        
        container.appendChild(btnAjouterPause);
    }
}

/**
 * Sauvegarde la configuration des pauses
 */
function sauvegarderPausesConfiguration() {
    const pauses = [];
    
    // Pauses par défaut avec leurs IDs
    const pausesIds = ['cantine', 'recreation-matin', 'recreation-aprem', 'apc', 'periscolaire'];
    const noms = {
        'cantine': 'Cantine',
        'recreation-matin': 'Récréation matin',
        'recreation-aprem': 'Récréation après-midi',
        'apc': 'APC',
        'periscolaire': 'Périscolaire'
    };
    
    pausesIds.forEach(id => {
        const checkbox = document.getElementById(`pause-${id}`);
        const debut = document.getElementById(`pause-${id}-debut`);
        const fin = document.getElementById(`pause-${id}-fin`);
        
        if (checkbox && debut && fin) {
            pauses.push({
                id: id,
                nom: noms[id],
                heureDebut: debut.value,
                heureFin: fin.value,
                affichee: checkbox.checked
            });
        }
    });
    
    return pauses;
}

/**
 * Trouve l'index d'une couleur hexadécimale dans la palette actuelle
 * @param {string} couleurHex - Couleur hexadécimale (ex: #bbdefb)
 * @param {Array<string>} palette - Palette de couleurs (12 éléments)
 * @returns {number} Index (0-11) ou -1 si non trouvée
 */
function trouverIndexCouleurDansPalette(couleurHex, palette) {
    if (!couleurHex || !palette) return -1;
    // Normaliser la couleur (enlever le #, mettre en minuscules)
    const norm = couleurHex.toLowerCase().replace(/^#/, '');
    for (let i = 0; i < palette.length; i++) {
        const paletteNorm = palette[i]?.toLowerCase().replace(/^#/, '');
        if (paletteNorm === norm) {
            return i;
        }
    }
    return -1;
}

/**
 * Applique les couleurs de la palette via les variables CSS
 * Met également à jour les créneaux existants pour utiliser les index de palette
 */
function appliquerCouleurs() {
    console.log('appliquerCouleurs() appelée');
    // S'assurer que state.parametres existe
    if (!state.parametres) state.parametres = {};
    
    // Valider et compléter la palette de couleurs (doit être un tableau de 12 éléments)
    if (!Array.isArray(state.parametres.paletteCouleurs) || state.parametres.paletteCouleurs.length !== 12) {
        state.parametres.paletteCouleurs = getPaletteCouleursParDefaut();
    }
    
    const palette = state.parametres.paletteCouleurs;
    console.log('Palette actuelle:', palette);
    
    // Définir les variables CSS pour les 12 couleurs
    console.log('Définition des variables CSS avec palette:', palette);
    for (let i = 0; i < 12; i++) {
        const varName = `--couleur-palette-${i + 1}`;
        const varValue = palette[i];
        document.documentElement.style.setProperty(varName, varValue);
        console.log(`  ${varName} = ${varValue}`);
    }
    // Vérification rapide
    setTimeout(() => {
        for (let i = 0; i < 12; i++) {
            const varName = `--couleur-palette-${i + 1}`;
            const computed = getComputedStyle(document.documentElement).getPropertyValue(varName);
            if (computed.trim() === '') {
                console.warn(`Variable CSS ${varName} non définie`);
            } else {
                console.log(`Variable CSS ${varName} = ${computed}`);
            }
        }
    }, 100);
    
    // Mettre à jour les créneaux existants pour utiliser les index de palette
    // Cela permet aux créneaux existants de s'adapter aux nouvelles couleurs
    let updatedCount = 0;
    let fallbackCount = 0;
    if (Array.isArray(state.creneaux)) {
        console.log(`Nombre de créneaux: ${state.creneaux.length}`);
        state.creneaux.forEach(creneau => {
            // Si le créneau a une couleur hexadécimale (lesson.color) mais pas d'index (couleurIndex)
            // ou si la couleur hexadécimale correspond à une couleur de la palette
            if (creneau.color && typeof creneau.couleurIndex !== 'number') {
                const index = trouverIndexCouleurDansPalette(creneau.color, palette);
                console.log(`Créneau ${creneau.id}: color=${creneau.color}, couleurIndex=${creneau.couleurIndex}, index trouvé=${index}`);
                if (index >= 0) {
                    creneau.couleurIndex = index;
                    updatedCount++;
                    console.log(`Créneau ${creneau.id}: couleur ${creneau.color} → index ${index}`);
                } else {
                    // Couleur hexadécimale non trouvée dans la palette (ex: #bbdefb)
                    // On assigne un index par défaut (0) et on met à jour la couleur hexadécimale
                    creneau.couleurIndex = 0;
                    creneau.color = palette[0];
                    fallbackCount++;
                    console.log(`Créneau ${creneau.id}: couleur ${creneau.color} non trouvée → index 0 (${palette[0]})`);
                }
            }
            // Si le créneau a un index mais que la couleur hexadécimale ne correspond pas à la palette
            // (par exemple après modification de la palette), on peut mettre à jour la couleur hexadécimale
            else if (typeof creneau.couleurIndex === 'number' && creneau.couleurIndex >= 0 && creneau.couleurIndex <= 11) {
                const nouvelleCouleur = palette[creneau.couleurIndex];
                if (nouvelleCouleur && creneau.color !== nouvelleCouleur) {
                    creneau.color = nouvelleCouleur;
                    updatedCount++;
                    console.log(`Créneau ${creneau.id}: index ${creneau.couleurIndex} → couleur ${nouvelleCouleur}`);
                }
            }
        });
    }
    
    // Rafraîchir les palettes d'édition (slot-modal et bulk-modal) pour qu'elles utilisent les nouvelles couleurs
    if (typeof rafraichirPalettesEdition === 'function') {
        rafraichirPalettesEdition();
    }
    
    // Sauvegarder l'état pour persister les éventuelles corrections
    saveState();
    
    console.log(`Couleurs appliquées via variables CSS. ${updatedCount} créneaux mis à jour, ${fallbackCount} créneaux avec couleur non trouvée assignés à l'index 0.`);
    
    // Rafraîchir l'interface si la fonction renderTable existe
    if (typeof renderTable === 'function') {
        renderTable();
    }
}

/**
 * Annule les modifications et ferme la modale
 */
function annulerParametres() {
    fermerParametresGlobaux();
    console.log('Modifications annulées');
}

/**
 * Initialise les paramètres globaux et applique les couleurs au chargement
 * Cette fonction est appelée depuis app.js après le chargement de l'état
 */
function initialiserParametres() {
    // S'assurer que state.parametres existe
    if (!state.parametres) state.parametres = {};
    
    // Appliquer les couleurs (ce qui garantit que les variables CSS sont définies)
    appliquerCouleurs();
    
    console.log('Paramètres initialisés et couleurs appliquées');
}
