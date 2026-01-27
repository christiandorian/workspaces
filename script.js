/**
 * Design System Template
 * A clean template for designers to build upon
 */

// ============================================
// Utility Functions
// ============================================

/**
 * Debounce function to limit how often a function is called
 */
function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

// ============================================
// Sample Data (Replace with your own)
// ============================================
const flashcards = [
    { term: "Component", definition: "A reusable piece of UI that encapsulates its own structure, style, and behavior" },
    { term: "Design Token", definition: "Named entities that store visual design attributes like colors, typography, and spacing" },
    { term: "Typography", definition: "The art and technique of arranging type to make written language legible and appealing" },
    { term: "Color System", definition: "A structured set of colors used consistently throughout a design system" },
    { term: "Spacing Scale", definition: "A defined set of spacing values used for margins, padding, and gaps" },
    { term: "Grid System", definition: "A structure of horizontal and vertical lines used to arrange content" },
    { term: "Breakpoint", definition: "Specific viewport widths where the layout changes for responsive design" },
    { term: "Accessibility", definition: "The practice of making products usable by people with various abilities" }
];

// ============================================
// State Management
// ============================================
const state = {
    currentIndex: 0,
    isFlipped: false,
    starredCards: new Set(),
    designVariant: 'option-a'
};

// ============================================
// DOM Elements
// ============================================
const elements = {
    // Flashcard elements
    flashcard: document.getElementById('flashcard'),
    cardFront: document.getElementById('card-front'),
    cardBack: document.getElementById('card-back'),
    prevBtn: document.getElementById('prev-btn'),
    nextBtn: document.getElementById('next-btn'),
    starBtn: document.getElementById('star-btn'),
    fullscreenBtn: document.getElementById('fullscreen-btn'),
    tabButtons: document.querySelectorAll('.tab-btn'),
    // Debug modal elements
    menuBtn: document.querySelector('.menu-btn'),
    debugModalOverlay: document.getElementById('debug-modal-overlay'),
    debugModalClose: document.getElementById('debug-modal-close'),
    // Import modal elements
    importModalOverlay: document.getElementById('import-modal-overlay'),
    importCloseBtn: document.getElementById('import-close-btn'),
    importTitleInput: document.getElementById('import-title'),
    importTextarea: document.getElementById('import-textarea'),
    importSubmitBtn: document.getElementById('import-submit-btn'),
    variantSelector: document.getElementById('variant-selector'),
    // Page elements
    setTitle: document.querySelector('.sidebar .set-title'),
    topicsContainer: document.querySelector('.topics-container')
};

// ============================================
// Core Functions
// ============================================

/**
 * Initialize the application
 */
function init() {
    loadDesignVariant();
    loadSavedState();
    updateCard(false);
    attachEventListeners();
    initPanelResize();
    updateTopicsList(flashcards);
}

/**
 * Update the flashcard display
 */
function updateCard(autoExpand = true) {
    const card = flashcards[state.currentIndex];
    
    if (!elements.cardFront || !elements.cardBack) return;
    
    elements.cardFront.textContent = card.term;
    elements.cardBack.textContent = card.definition;
    
    updateStarButton();
    
    if (state.isFlipped) {
        elements.flashcard?.classList.remove('flipped');
        state.isFlipped = false;
    }
    
    animateCardChange();
    updateActiveTocItem(autoExpand);
}

/**
 * Navigate to the previous card
 */
function prevCard() {
    if (state.currentIndex > 0) {
        state.currentIndex--;
    } else {
        state.currentIndex = flashcards.length - 1;
    }
    updateCard();
}

/**
 * Navigate to the next card
 */
function nextCard() {
    if (state.currentIndex < flashcards.length - 1) {
        state.currentIndex++;
    } else {
        state.currentIndex = 0;
    }
    updateCard();
}

/**
 * Flip the flashcard
 */
function flipCard() {
    elements.flashcard?.classList.toggle('flipped');
    state.isFlipped = !state.isFlipped;
}

/**
 * Toggle star/favorite on current card
 */
function toggleStar() {
    const index = state.currentIndex;
    
    if (state.starredCards.has(index)) {
        state.starredCards.delete(index);
    } else {
        state.starredCards.add(index);
    }
    
    updateStarButton();
    saveState();
}

/**
 * Update the star button visual state
 */
function updateStarButton() {
    if (!elements.starBtn) return;
    
    const icon = elements.starBtn.querySelector('.material-symbols-rounded');
    if (state.starredCards.has(state.currentIndex)) {
        elements.starBtn.classList.add('starred');
        if (icon) icon.classList.add('filled');
    } else {
        elements.starBtn.classList.remove('starred');
        if (icon) icon.classList.remove('filled');
    }
}

/**
 * Animate card change
 */
function animateCardChange() {
    if (!elements.flashcard) return;
    elements.flashcard.style.animation = 'none';
    elements.flashcard.offsetHeight;
    elements.flashcard.style.animation = 'cardEnter 0.2s ease-out';
}

/**
 * Handle keyboard navigation
 */
function handleKeydown(event) {
    if (event.target.tagName === 'INPUT' || event.target.tagName === 'TEXTAREA') {
        return;
    }
    
    switch(event.key) {
        case 'ArrowLeft':
            prevCard();
            break;
        case 'ArrowRight':
            nextCard();
            break;
        case ' ':
        case 'Enter':
            event.preventDefault();
            flipCard();
            break;
    }
}

/**
 * Handle tab clicks
 */
function handleTabClick(event) {
    const clickedTab = event.currentTarget;
    
    elements.tabButtons.forEach(tab => tab.classList.remove('active'));
    clickedTab.classList.add('active');
}

// ============================================
// Design Variants
// ============================================

/**
 * Set design variant
 */
function setDesignVariant(variant) {
    document.body.classList.remove('option-a', 'option-b', 'option-c', 'option-d', 'option-e');
    document.body.classList.add(variant);
    state.designVariant = variant;
    
    // Update variant selector buttons
    elements.variantSelector?.querySelectorAll('.variant-btn').forEach(btn => {
        btn.classList.toggle('active', btn.dataset.variant === variant);
    });
    
    localStorage.setItem('designVariant', variant);
    
    // Update view based on variant
    if (variant === 'option-b' || variant === 'option-e') {
        updatePanelTermsList();
        updatePanelTitle();
    } else if (variant === 'option-c') {
        updateJourneyView();
    } else if (variant === 'option-d') {
        initTableView();
    }
}

/**
 * Load saved design variant
 */
function loadDesignVariant() {
    const savedVariant = localStorage.getItem('designVariant') || 'option-a';
    setDesignVariant(savedVariant);
}

// ============================================
// Topics List / Sidebar
// ============================================

/**
 * Update topics list in sidebar
 */
function updateTopicsList(cards) {
    const container = document.querySelector('.topics-container');
    if (!container) return;
    
    container.innerHTML = '';
    
    const section = document.createElement('div');
    section.className = 'topic-section';
    
    const header = document.createElement('div');
    header.className = 'topic-header';
    header.innerHTML = `
        <span class="topic-title">All Terms</span>
        <span class="topic-count">${cards.length}</span>
    `;
    
    const list = document.createElement('div');
    list.className = 'topic-terms';
    
    cards.forEach((card, index) => {
        const item = document.createElement('div');
        item.className = 'term-item';
        item.setAttribute('data-index', index);
        item.innerHTML = `
            <span class="term-text">${card.term}</span>
            <span class="term-definition">${card.definition}</span>
        `;
        item.addEventListener('click', () => {
            state.currentIndex = index;
            updateCard();
        });
        list.appendChild(item);
    });
    
    section.appendChild(header);
    section.appendChild(list);
    container.appendChild(section);
}

/**
 * Update active TOC item
 */
function updateActiveTocItem(autoExpand = true) {
    document.querySelectorAll('.term-item').forEach((item, index) => {
        item.classList.toggle('active', index === state.currentIndex);
    });
}

// ============================================
// Panel / Three-Column Layout
// ============================================

/**
 * Update panel terms list (for option-b and option-e)
 */
function updatePanelTermsList() {
    const container = document.getElementById('panel-terms-list');
    if (!container) return;
    
    container.innerHTML = '';
    
    flashcards.forEach((card, index) => {
    const item = document.createElement('div');
        item.className = 'panel-term-item';
    item.innerHTML = `
            <div class="panel-term-content">
                <span class="panel-term-text">${card.term}</span>
                <span class="panel-term-definition">${card.definition}</span>
            </div>
            <button class="panel-term-star" data-index="${index}">
                <span class="material-symbols-rounded">star</span>
            </button>
        `;
        
        item.querySelector('.panel-term-content').addEventListener('click', () => {
            state.currentIndex = index;
            updateCard();
        });
        
        container.appendChild(item);
    });
}

/**
 * Update panel title
 */
function updatePanelTitle() {
    const titleEl = document.getElementById('panel-set-title');
    if (titleEl) {
        titleEl.textContent = 'Design System Components';
    }
}

/**
 * Initialize panel resize
 */
function initPanelResize() {
    const handles = document.querySelectorAll('.panel-resize-handle');
    
    handles.forEach(handle => {
        let startX, startWidth;
        
        handle.addEventListener('mousedown', (e) => {
            startX = e.clientX;
            document.addEventListener('mousemove', resize);
            document.addEventListener('mouseup', stopResize);
        });
        
        function resize(e) {
            const dx = e.clientX - startX;
            // Handle resize logic here
        }
        
        function stopResize() {
            document.removeEventListener('mousemove', resize);
            document.removeEventListener('mouseup', stopResize);
        }
    });
}

// ============================================
// Journey View (Option C)
// ============================================

/**
 * Update journey view
 */
function updateJourneyView() {
    const container = document.getElementById('journey-topics-container');
    if (!container) return;
    
    container.innerHTML = '';
    
    flashcards.forEach((card, index) => {
    const item = document.createElement('div');
        item.className = 'journey-term-item';
    item.innerHTML = `
            <span class="journey-term-text">${card.term}</span>
                `;
                item.addEventListener('click', () => {
            state.currentIndex = index;
            updateCard();
        });
        container.appendChild(item);
    });
}

// ============================================
// Table View (Option D)
// ============================================

/**
 * Initialize table view
 */
function initTableView() {
    const container = document.getElementById('table-terms-list');
    if (!container) return;
    
    container.innerHTML = '';
    
    flashcards.forEach((card, index) => {
            const row = document.createElement('div');
        row.className = 'table-term-row';
            row.innerHTML = `
            <label class="table-checkbox">
                <input type="checkbox" data-index="${index}">
                <span class="custom-checkbox"></span>
            </label>
            <div class="table-term-content">
                <span class="table-term-text">${card.term}</span>
                <span class="table-term-definition">${card.definition}</span>
            </div>
            <button class="table-term-star" data-index="${index}">
                <span class="material-symbols-rounded">star</span>
            </button>
        `;
        container.appendChild(row);
    });
}

// ============================================
// Modal Functions
// ============================================

/**
 * Open debug modal
 */
function openDebugModal() {
    elements.debugModalOverlay?.classList.add('active');
}

/**
 * Close debug modal
 */
function closeDebugModal() {
    elements.debugModalOverlay?.classList.remove('active');
}

/**
 * Open import modal
 */
function openImportModal() {
    elements.importModalOverlay?.classList.add('active');
}

/**
 * Close import modal
 */
function closeImportModal() {
    elements.importModalOverlay?.classList.remove('active');
}

/**
 * Import flashcards from text
 */
function importFlashcards() {
    const title = elements.importTitleInput?.value || 'Untitled Set';
    const text = elements.importTextarea?.value || '';
    
    if (!text.trim()) {
        alert('Please enter some flashcard content');
        return;
    }
    
    // Parse the text (tab or comma separated)
    const lines = text.split(/[\n;]+/).filter(line => line.trim());
    const newCards = [];
    
    lines.forEach(line => {
        const parts = line.split(/[\t,]/).map(p => p.trim());
        if (parts.length >= 2) {
            newCards.push({
                term: parts[0],
                definition: parts[1]
            });
        }
    });
    
    if (newCards.length > 0) {
        flashcards.length = 0;
        flashcards.push(...newCards);
    state.currentIndex = 0;
        
        // Update all views
        updateCard(false);
        updateTopicsList(flashcards);
        
    if (document.body.classList.contains('option-b') || document.body.classList.contains('option-e')) {
        updatePanelTermsList();
    }
    if (document.body.classList.contains('option-c')) {
        updateJourneyView();
    }
    if (document.body.classList.contains('option-d')) {
        initTableView();
    }
    
        // Save and close
        saveContent(title, flashcards);
        closeImportModal();
    }
}

// ============================================
// State Persistence
// ============================================

/**
 * Save state to localStorage
 */
function saveState() {
    localStorage.setItem('flashcardState', JSON.stringify({
        currentIndex: state.currentIndex,
        starredCards: [...state.starredCards]
    }));
}

/**
 * Load saved state from localStorage
 */
function loadSavedState() {
    const saved = localStorage.getItem('flashcardState');
    if (saved) {
        try {
            const data = JSON.parse(saved);
            state.currentIndex = data.currentIndex || 0;
            state.starredCards = new Set(data.starredCards || []);
        } catch (e) {
            console.error('Error loading saved state:', e);
        }
    }
}

/**
 * Save content to localStorage
 */
function saveContent(title, cards) {
    localStorage.setItem('flashcardContent', JSON.stringify({
        title,
        flashcards: cards,
        savedAt: new Date().toISOString()
    }));
}

// ============================================
// Event Listeners
// ============================================

function attachEventListeners() {
    // Navigation
    elements.prevBtn?.addEventListener('click', prevCard);
    elements.nextBtn?.addEventListener('click', nextCard);
    
    // Flashcard flip
    elements.flashcard?.addEventListener('click', flipCard);
    
    // Star button
    elements.starBtn?.addEventListener('click', (event) => {
        event.stopPropagation();
        toggleStar();
    });
    
    // Tab navigation
    elements.tabButtons?.forEach(btn => {
        btn.addEventListener('click', handleTabClick);
    });
    
    // Keyboard
    document.addEventListener('keydown', handleKeydown);
    
    // Debug modal
    elements.menuBtn?.addEventListener('click', openDebugModal);
    elements.debugModalClose?.addEventListener('click', closeDebugModal);
    elements.debugModalOverlay?.addEventListener('click', (event) => {
        if (event.target === elements.debugModalOverlay) {
            closeDebugModal();
        }
    });

    // Import modal
    elements.importCloseBtn?.addEventListener('click', closeImportModal);
    elements.importModalOverlay?.addEventListener('click', (event) => {
        if (event.target === elements.importModalOverlay) {
            closeImportModal();
        }
    });
    elements.importSubmitBtn?.addEventListener('click', importFlashcards);
    
    // Variant selector
    elements.variantSelector?.querySelectorAll('.variant-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            setDesignVariant(btn.dataset.variant);
        });
    });
    
    // Close modals with Escape
    document.addEventListener('keydown', (event) => {
        if (event.key === 'Escape') {
            if (elements.debugModalOverlay?.classList.contains('active')) {
                closeDebugModal();
            } else if (elements.importModalOverlay?.classList.contains('active')) {
                closeImportModal();
            }
        }
    });
    
    // Import modal navigation
    const importOpenBtn = document.getElementById('import-open-btn');
    const importBackBtn = document.getElementById('import-back-btn');
    const modalStepMain = document.getElementById('modal-step-main');
    const modalStepImport = document.getElementById('modal-step-import');
    const headerMain = document.getElementById('header-main');
    const headerImport = document.getElementById('header-import');
    
    importOpenBtn?.addEventListener('click', () => {
        modalStepMain?.classList.add('hidden');
        modalStepImport?.classList.remove('hidden');
        headerMain?.classList.add('hidden');
        headerImport?.classList.remove('hidden');
    });
    
    importBackBtn?.addEventListener('click', () => {
        modalStepImport?.classList.add('hidden');
        modalStepMain?.classList.remove('hidden');
        headerImport?.classList.add('hidden');
        headerMain?.classList.remove('hidden');
    });
}

// ============================================
// Initialize App
// ============================================

document.addEventListener('DOMContentLoaded', init);
