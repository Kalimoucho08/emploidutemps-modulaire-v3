// Gestionnaire centralisé des modales
const ModalManager = {
  openModals: [],          // Liste des modales actuellement ouvertes
  activeModal: null,       // La modale actuellement au premier plan
  zIndexBase: 100,         // z-index de base pour les modales
  zIndexMenu: 1000,        // z-index pour le menu contextuel (supérieur)
  
  // Ouvrir une modale avec gestion de l'état
  open(modalId, options = {}) {
    // Fermer toutes les modales avant d'en ouvrir une nouvelle
    this.closeAll();
    
    // Ajouter la modale à la liste des modales ouvertes
    this.openModals.push(modalId);
    this.activeModal = modalId;
    
    // Obtenir l'élément de la modale
    const modalElement = document.getElementById(modalId);
    if (!modalElement) {
      console.error('Modal element not found:', modalId);
      return;
    }
    
    // Appliquer le z-index approprié
    if (modalId === 'custom-context-menu') {
      modalElement.style.zIndex = this.zIndexMenu;
    } else {
      modalElement.style.zIndex = this.zIndexBase;
    }
    
    // Afficher la modale
    modalElement.classList.add('visible');
    
    console.log('Modal opened:', modalId);
  },
  
  // Fermer une modale spécifique
  close(modalId) {
    const index = this.openModals.indexOf(modalId);
    if (index !== -1) {
      this.openModals.splice(index, 1);
    }
    
    // Si c'était la modale active, définir la nouvelle active
    if (this.activeModal === modalId) {
      this.activeModal = null;
    }
    
    const modalElement = document.getElementById(modalId);
    if (modalElement) {
      modalElement.classList.remove('visible');
    }
    
    console.log('Modal closed:', modalId);
  },
  
  // Fermer toutes les modales
  closeAll() {
    this.openModals.forEach(id => {
      const modalElement = document.getElementById(id);
      if (modalElement) {
        modalElement.classList.remove('visible');
      }
    });
    
    this.openModals = [];
    this.activeModal = null;
    
    console.log('All modals closed');
  },
  
  // Obtenir la modale active
  getActiveModal() {
    return this.activeModal;
  },
  
  // Vérifier si une modale est ouverte
  isOpen(modalId) {
    return this.openModals.includes(modalId);
  }
};
