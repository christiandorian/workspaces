/**
 * Q-Chat - Quizlet NotebookLM
 * AI-powered study assistant
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
// Notebook State
// ============================================
const notebookState = {
    workspaceTitle: 'Untitled notebook',
    sources: [],
    chatMessages: [],
    activeStudyModes: [],
    selectedSources: new Set(),
    recommendedSources: []
};

// ============================================
// DOM Elements
// ============================================
const elements = {
    // Notebook elements
    workspaceTitle: document.getElementById('workspace-title'),
    addSourcesBtn: document.querySelector('.add-sources-btn'),
    uploadSourceBtn: document.querySelector('.upload-source-btn'),
    addNoteBtn: document.querySelector('.add-note-btn'),
    studioCards: document.querySelectorAll('.studio-card'),
    // Recommended sources
    recommendedSection: document.getElementById('recommended-sources'),
    recommendedList: document.getElementById('recommended-list'),
    closeRecommended: document.getElementById('close-recommended'),
    seeMoreRecommended: document.getElementById('see-more-recommended'),
    // Chat elements
    chatInput: document.querySelector('.chat-input'),
    chatSubmitBtn: document.querySelector('.chat-submit-btn'),
    chatContent: document.querySelector('.chat-content'),
    chatEmptyState: document.querySelector('.chat-empty-state'),
    // Debug modal
    menuBtn: document.querySelector('.menu-btn'),
    debugModalOverlay: document.getElementById('debug-modal-overlay'),
    debugModalClose: document.getElementById('debug-modal-close'),
    debugResetBtn: document.getElementById('debug-reset-btn')
};

// ============================================
// Core Functions
// ============================================

/**
 * Handle workspace title editing
 */
function handleTitleEdit() {
    const title = elements.workspaceTitle;
    if (!title) return;
    
    // Save title when user presses Enter or loses focus
    const saveTitle = () => {
        const newTitle = title.textContent.trim();
        if (newTitle && newTitle !== notebookState.workspaceTitle) {
            notebookState.workspaceTitle = newTitle;
            saveNotebookState();
        } else if (!newTitle) {
            // Restore previous title if empty
            title.textContent = notebookState.workspaceTitle;
        }
    };
    
    title.addEventListener('blur', saveTitle);
    title.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            title.blur();
        }
        if (e.key === 'Escape') {
            title.textContent = notebookState.workspaceTitle;
            title.blur();
        }
    });
}

/**
 * Generate recommended Quizlet sources based on uploaded documents
 */
async function generateRecommendedSources() {
    if (notebookState.sources.length === 0) return;
    
    try {
        // Get the first source to base recommendations on
        const firstSource = notebookState.sources[0];
        
        const response = await fetch('/api/generate-recommendations', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                source: firstSource
            })
        });
        
        if (!response.ok) {
            throw new Error('Failed to generate recommendations');
        }
        
        const data = await response.json();
        notebookState.recommendedSources = data.recommendations || [];
        
        renderRecommendedSources();
        saveNotebookState();
        
    } catch (error) {
        console.error('Recommendation generation error:', error);
    }
}

/**
 * Render recommended sources
 */
function renderRecommendedSources() {
    if (!elements.recommendedSection || !elements.recommendedList) return;
    
    if (notebookState.recommendedSources.length === 0) {
        elements.recommendedSection.style.display = 'none';
        return;
    }
    
    elements.recommendedSection.style.display = 'block';
    
    // Show first 3 recommendations
    const visibleRecommendations = notebookState.recommendedSources.slice(0, 3);
    
    elements.recommendedList.innerHTML = visibleRecommendations.map(rec => {
        const iconMap = {
            'flashcards': 'style',
            'notes': 'edit_note',
            'textbook': 'menu_book'
        };
        const icon = iconMap[rec.type] || 'style';
        
        return `
            <div class="recommended-item" data-recommendation-id="${rec.id}">
                <div class="recommended-icon">
                    <span class="material-symbols-rounded">${icon}</span>
                </div>
                <div class="recommended-info">
                    <div class="recommended-title">${rec.title}</div>
                    <div class="recommended-meta">${rec.meta}</div>
                </div>
                <button class="recommended-add-btn" onclick="addRecommendedSource('${rec.id}')" title="Add to sources">
                    <span class="material-symbols-rounded">add</span>
                </button>
            </div>
        `;
    }).join('');
}

/**
 * Add a recommended source to the sources list
 */
function addRecommendedSource(recommendationId) {
    const recommendation = notebookState.recommendedSources.find(r => r.id === recommendationId);
    if (!recommendation) return;
    
    // Create a source from the recommendation
    const source = {
        id: `source-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        name: recommendation.title,
        type: 'quizlet-set',
        size: 0,
        uploadedAt: new Date().toISOString(),
        content: recommendation.description || '',
        contentPreview: recommendation.description || 'Quizlet study set',
        quizletUrl: recommendation.url,
        selected: true,
        isQuizletSet: true
    };
    
    notebookState.sources.push(source);
    notebookState.selectedSources.add(source.id);
    
    renderSources();
    updateChatInputState();
    saveNotebookState();
    
    showNotification(`Added: ${recommendation.title}`);
}

/**
 * Close recommended sources section
 */
function closeRecommendedSources() {
    if (elements.recommendedSection) {
        elements.recommendedSection.style.display = 'none';
    }
}

/**
 * Initialize the notebook application
 */
function initNotebook() {
    loadNotebookState();
    attachNotebookListeners();
    handleTitleEdit();
    
    // Set workspace title
    if (elements.workspaceTitle) {
        elements.workspaceTitle.textContent = notebookState.workspaceTitle;
    }
    
    // Render chat messages if they exist
    if (notebookState.chatMessages.length > 0) {
        renderChatMessages();
    }
    
    // Render recommended sources if they exist
    if (notebookState.recommendedSources.length > 0) {
        renderRecommendedSources();
    }
}

// Make functions available globally for onclick handlers
window.toggleSourceSelection = toggleSourceSelection;
window.toggleSelectAll = toggleSelectAll;
window.removeSource = removeSource;
window.addRecommendedSource = addRecommendedSource;

/**
 * Handle file upload
 */
function handleFileUpload() {
    // Create a file input element
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.pdf,.txt,.doc,.docx,.md';
    input.multiple = true;
    
    input.addEventListener('change', async (e) => {
        const files = Array.from(e.target.files);
        if (files.length > 0) {
            // Show processing notification
            const hasPDF = files.some(f => (f.type || getFileTypeFromName(f.name)).includes('pdf'));
            if (hasPDF) {
                showNotification('Processing PDF files... This may take a moment.', 5000);
            }
            
            // Process each file
            for (const file of files) {
                await processFile(file);
            }
            
            // Update UI
            renderSources();
            updateChatInputState();
            saveNotebookState();
            
            showNotification(`${files.length} file(s) uploaded successfully!`);
            
            // Generate summary of uploaded sources
            await generateSourceSummary();
            
            // Generate recommended sources if this is the first upload
            if (notebookState.sources.length === files.length) {
                await generateRecommendedSources();
            }
        }
    });
    
    input.click();
}

/**
 * Process uploaded file
 */
async function processFile(file) {
    const fileType = file.type || getFileTypeFromName(file.name);
    
    const source = {
        id: `source-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        name: file.name,
        type: fileType,
        size: file.size,
        uploadedAt: new Date().toISOString(),
        content: null,
        contentPreview: null,
        selected: true // Auto-select newly uploaded sources
    };
    
    try {
        if (fileType.includes('pdf')) {
            // Extract text from PDF
            const text = await extractTextFromPDF(file);
            source.content = text;
            source.contentPreview = text.substring(0, 200) + (text.length > 200 ? '...' : '');
        } else if (fileType.includes('text') || fileType.includes('markdown')) {
            // Read text files
            const text = await readTextFile(file);
            source.content = text;
            source.contentPreview = text.substring(0, 200) + (text.length > 200 ? '...' : '');
        } else {
            // For other file types, just store basic info
            source.contentPreview = 'Document uploaded successfully';
        }
    } catch (error) {
        console.error('Error processing file:', file.name, error);
        source.contentPreview = 'Error reading file content';
    }
    
    notebookState.sources.push(source);
    notebookState.selectedSources.add(source.id);
}

/**
 * Read text file
 */
function readTextFile(file) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = (e) => resolve(e.target.result);
        reader.onerror = () => reject(new Error('Failed to read file'));
        reader.readAsText(file);
    });
}

/**
 * Extract text from PDF using PDF.js
 */
async function extractTextFromPDF(file) {
    try {
        // Read file as ArrayBuffer
        const arrayBuffer = await file.arrayBuffer();
        
        // Load PDF document
        const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
        
        let fullText = '';
        
        // Extract text from each page
        for (let i = 1; i <= pdf.numPages; i++) {
            const page = await pdf.getPage(i);
            const textContent = await page.getTextContent();
            const pageText = textContent.items.map(item => item.str).join(' ');
            fullText += pageText + '\n\n';
        }
        
        return fullText.trim();
    } catch (error) {
        console.error('Error extracting PDF text:', error);
        throw new Error('Failed to extract text from PDF');
    }
}

/**
 * Get file type from filename
 */
function getFileTypeFromName(filename) {
    const ext = filename.split('.').pop().toLowerCase();
    const typeMap = {
        'pdf': 'application/pdf',
        'txt': 'text/plain',
        'doc': 'application/msword',
        'docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'md': 'text/markdown'
    };
    return typeMap[ext] || 'application/octet-stream';
}

/**
 * Render sources in the sidebar
 */
function renderSources() {
    const container = document.querySelector('.sources-empty-state');
    
    if (!container) return;
    
    if (notebookState.sources.length === 0) {
        // Show empty state
        container.innerHTML = `
            <span class="material-symbols-rounded empty-icon">description</span>
            <h3 class="empty-title">Saved sources will appear here</h3>
            <p class="empty-description">Click Add source above to add PDFs, websites, text, videos, or audio files. Or import a file directly from Google Drive.</p>
        `;
        container.style.display = 'block';
    } else {
        // Show sources list
        container.style.display = 'none';
        
        // Check if sources list already exists
        let sourcesList = document.querySelector('.sources-list');
        if (!sourcesList) {
            sourcesList = document.createElement('div');
            sourcesList.className = 'sources-list';
            container.parentNode.appendChild(sourcesList);
        }
        
        // Render select all option
        const selectAllHtml = `
            <div class="source-select-all">
                <label class="source-checkbox-label">
                    <input type="checkbox" 
                           class="source-checkbox" 
                           id="select-all-sources"
                           ${notebookState.selectedSources.size === notebookState.sources.length ? 'checked' : ''}>
                    <span class="source-select-text">Select all sources</span>
                </label>
                <button class="source-check-icon ${notebookState.selectedSources.size === notebookState.sources.length ? 'checked' : ''}" 
                        onclick="toggleSelectAll()">
                    <span class="material-symbols-rounded">check</span>
                </button>
            </div>
        `;
        
        // Render individual sources
        const sourcesHtml = notebookState.sources.map(source => {
            const isSelected = notebookState.selectedSources.has(source.id);
            const fileIcon = getFileIcon(source.type);
            
            return `
                <div class="source-item ${isSelected ? 'selected' : ''}" 
                     data-source-id="${source.id}"
                     onclick="toggleSourceSelection('${source.id}')">
                    <div class="source-icon">
                        <span class="material-symbols-rounded">${fileIcon}</span>
                    </div>
                    <div class="source-info">
                        <div class="source-name">${source.name}</div>
                        <div class="source-meta">${formatFileSize(source.size)}</div>
                    </div>
                    <div class="source-actions">
                        <button class="source-remove-btn" 
                                onclick="removeSource('${source.id}', event)"
                                title="Remove source">
                            <span class="material-symbols-rounded">close</span>
                        </button>
                        <button class="source-check-icon ${isSelected ? 'checked' : ''}" 
                                onclick="event.stopPropagation(); toggleSourceSelection('${source.id}')"
                                title="Toggle selection">
                            <span class="material-symbols-rounded">check</span>
                        </button>
                    </div>
                </div>
            `;
        }).join('');
        
        sourcesList.innerHTML = selectAllHtml + sourcesHtml;
    }
}

/**
 * Get icon for file type
 */
function getFileIcon(type) {
    if (type.includes('pdf')) return 'picture_as_pdf';
    if (type.includes('text') || type.includes('markdown')) return 'description';
    if (type.includes('word') || type.includes('document')) return 'description';
    return 'insert_drive_file';
}

/**
 * Format file size
 */
function formatFileSize(bytes) {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
}

/**
 * Toggle source selection
 */
function toggleSourceSelection(sourceId) {
    const wasSelected = notebookState.selectedSources.has(sourceId);
    
    if (wasSelected) {
        notebookState.selectedSources.delete(sourceId);
    } else {
        notebookState.selectedSources.add(sourceId);
    }
    
    renderSources();
    updateChatInputState();
    saveNotebookState();
    
    // Generate summary if source was just selected
    if (!wasSelected && notebookState.selectedSources.size > 0) {
        generateSourceSummary();
    }
}

/**
 * Toggle select all sources
 */
function toggleSelectAll() {
    const wasAllSelected = notebookState.selectedSources.size === notebookState.sources.length;
    
    if (wasAllSelected) {
        // Deselect all
        notebookState.selectedSources.clear();
    } else {
        // Select all
        notebookState.sources.forEach(source => {
            notebookState.selectedSources.add(source.id);
        });
    }
    
    renderSources();
    updateChatInputState();
    saveNotebookState();
    
    // Generate summary if sources were just selected
    if (!wasAllSelected && notebookState.selectedSources.size > 0) {
        generateSourceSummary();
    }
}

/**
 * Remove a source
 */
function removeSource(sourceId, event) {
    if (event) {
        event.stopPropagation();
    }
    
    // Remove from sources array
    notebookState.sources = notebookState.sources.filter(s => s.id !== sourceId);
    
    // Remove from selected sources
    notebookState.selectedSources.delete(sourceId);
    
    // Update UI
    renderSources();
    updateChatInputState();
    saveNotebookState();
    
    showNotification('Source removed');
}

/**
 * Update chat input state based on sources
 */
function updateChatInputState() {
    const chatInput = document.querySelector('.chat-input');
    const chatSubmitBtn = document.querySelector('.chat-submit-btn');
    const sourceCount = document.querySelector('.source-count');
    const chatEmptyState = document.querySelector('.chat-empty-state');
    const studioCards = document.querySelectorAll('.studio-card');
    
    const selectedCount = notebookState.selectedSources.size;
    
    if (selectedCount > 0) {
        // Enable chat
        chatInput.disabled = false;
        chatInput.placeholder = 'Ask anything about your sources...';
        chatSubmitBtn.disabled = false;
        sourceCount.textContent = `${selectedCount} source${selectedCount !== 1 ? 's' : ''}`;
        
        // Enable study cards
        studioCards.forEach(card => {
            card.disabled = false;
        });
        
        // Hide empty state
        if (chatEmptyState && notebookState.chatMessages.length === 0) {
            chatEmptyState.style.display = 'none';
        }
    } else {
        // Disable chat
        chatInput.disabled = true;
        chatInput.placeholder = 'Upload a source to get started';
        chatSubmitBtn.disabled = true;
        sourceCount.textContent = '0 sources';
        
        // Disable study cards
        studioCards.forEach(card => {
            card.disabled = true;
        });
        
        // Show empty state if no sources at all and no chat messages
        if (chatEmptyState && notebookState.sources.length === 0 && notebookState.chatMessages.length === 0) {
            chatEmptyState.style.display = 'flex';
        }
    }
}

/**
 * Show a temporary notification
 */
function showNotification(message, duration = 3000) {
    // Remove existing notification if any
    const existing = document.querySelector('.app-notification');
    if (existing) {
        existing.remove();
    }
    
    // Create notification
    const notification = document.createElement('div');
    notification.className = 'app-notification';
    notification.style.cssText = `
        position: fixed;
        bottom: 24px;
        left: 50%;
        transform: translateX(-50%);
        background: var(--ref-color-gray-900);
        color: white;
        padding: 12px 24px;
        border-radius: 8px;
        font-size: 14px;
        font-weight: 600;
        z-index: 10000;
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
        animation: slideUp 0.2s ease-out;
    `;
    notification.textContent = message;
    document.body.appendChild(notification);
    
    // Auto-remove after duration
    setTimeout(() => {
        notification.style.animation = 'slideDown 0.2s ease-in';
        setTimeout(() => {
            notification.remove();
        }, 200);
    }, duration);
}

// Add notification animations to CSS
const style = document.createElement('style');
style.textContent = `
    @keyframes slideUp {
        from {
            transform: translateX(-50%) translateY(20px);
            opacity: 0;
        }
        to {
            transform: translateX(-50%) translateY(0);
            opacity: 1;
        }
    }
    
    @keyframes slideDown {
        from {
            transform: translateX(-50%) translateY(0);
            opacity: 1;
        }
        to {
            transform: translateX(-50%) translateY(20px);
            opacity: 0;
        }
    }
`;
document.head.appendChild(style);

/**
 * Handle study card click
 */
async function handleStudyCardClick(card) {
    const label = card.querySelector('.studio-label').textContent;
    
    if (notebookState.selectedSources.size === 0) {
        showNotification(`Please select sources to generate ${label}`);
        return;
    }
    
    // Map labels to types
    const typeMap = {
        'Flashcards': 'flashcards',
        'Quiz': 'quiz',
        'Mind Map': 'mind-map',
        'Reports': 'summary'
    };
    
    const type = typeMap[label];
    
    if (type) {
        await generateStudyMaterial(type, label);
    } else {
        showNotification(`${label} coming soon!`);
    }
}

/**
 * Generate study material using OpenAI
 */
async function generateStudyMaterial(type, label) {
    try {
        showNotification(`Generating ${label}...`);
        
        // Get selected sources
        const selectedSources = notebookState.sources.filter(s => 
            notebookState.selectedSources.has(s.id)
        );
        
        const response = await fetch('/api/generate-study-material', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                type,
                sources: selectedSources
            })
        });
        
        if (!response.ok) {
            throw new Error('Failed to generate study material');
        }
        
        const data = await response.json();
        
        // Store the generated material
        notebookState.activeStudyModes.push({
            type,
            label,
            content: data.content,
            generatedAt: new Date().toISOString()
        });
        
        saveNotebookState();
        showNotification(`${label} generated successfully!`);
        
        // TODO: Display the generated material in a modal or new view
        console.log('Generated material:', data.content);
        
    } catch (error) {
        console.error('Study material generation error:', error);
        showNotification(`Failed to generate ${label}`);
    }
}

/**
 * Generate summary of selected sources
 */
async function generateSourceSummary() {
    if (notebookState.selectedSources.size === 0) return;
    
    try {
        // Get selected sources
        const selectedSources = notebookState.sources.filter(s => 
            notebookState.selectedSources.has(s.id)
        );
        
        // Build summary prompt
        const sourceNames = selectedSources.map(s => s.name).join(', ');
        const summaryPrompt = `Please provide a brief summary of the following source(s): ${sourceNames}`;
        
        // Add intro message to chat
        const introMessage = {
            role: 'assistant',
            content: `📚 I've loaded ${selectedSources.length} source${selectedSources.length !== 1 ? 's' : ''}: **${sourceNames}**\n\nHere's a summary of your materials:`,
            timestamp: new Date().toISOString()
        };
        
        notebookState.chatMessages.push(introMessage);
        renderChatMessages();
        scrollChatToBottom();
        
        // Show typing indicator
        showTypingIndicator();
        
        // Call API for summary
        const response = await fetch('/api/chat', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                messages: [
                    {
                        role: 'user',
                        content: summaryPrompt
                    }
                ],
                sources: selectedSources
            })
        });
        
        if (!response.ok) {
            throw new Error('Failed to generate summary');
        }
        
        const data = await response.json();
        
        // Remove typing indicator
        hideTypingIndicator();
        
        // Add summary message
        const summaryMessage = {
            role: 'assistant',
            content: data.message.content,
            timestamp: new Date().toISOString()
        };
        
        notebookState.chatMessages.push(summaryMessage);
        
        // Render and save
        renderChatMessages();
        scrollChatToBottom();
        saveNotebookState();
        
    } catch (error) {
        console.error('Summary generation error:', error);
        hideTypingIndicator();
        showNotification('Failed to generate summary');
    }
}

/**
 * Send chat message
 */
async function sendChatMessage() {
    const message = elements.chatInput.value.trim();
    
    if (!message) return;
    
    if (notebookState.selectedSources.size === 0) {
        showNotification('Please select sources first');
        return;
    }
    
    // Add user message to chat
    const userMessage = {
        role: 'user',
        content: message,
        timestamp: new Date().toISOString()
    };
    
    notebookState.chatMessages.push(userMessage);
    
    // Clear input
    elements.chatInput.value = '';
    
    // Render messages
    renderChatMessages();
    
    // Scroll to bottom
    scrollChatToBottom();
    
    try {
        // Get selected sources
        const selectedSources = notebookState.sources.filter(s => 
            notebookState.selectedSources.has(s.id)
        );
        
        // Show typing indicator
        showTypingIndicator();
        
        // Call API
        const response = await fetch('/api/chat', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                messages: notebookState.chatMessages,
                sources: selectedSources
            })
        });
        
        if (!response.ok) {
            throw new Error('Failed to get response');
        }
        
        const data = await response.json();
        
        // Remove typing indicator
        hideTypingIndicator();
        
        // Add assistant message
        const assistantMessage = {
            role: 'assistant',
            content: data.message.content,
            timestamp: new Date().toISOString()
        };
        
        notebookState.chatMessages.push(assistantMessage);
        
        // Render and save
        renderChatMessages();
        scrollChatToBottom();
        saveNotebookState();
        
    } catch (error) {
        console.error('Chat error:', error);
        hideTypingIndicator();
        showNotification('Failed to send message');
        
        // Remove the user message if failed
        notebookState.chatMessages.pop();
        renderChatMessages();
    }
}

/**
 * Render chat messages
 */
function renderChatMessages() {
    const chatContent = elements.chatContent;
    const emptyState = elements.chatEmptyState;
    
    if (!chatContent) return;
    
    if (notebookState.chatMessages.length === 0) {
        if (emptyState && notebookState.sources.length === 0) {
            emptyState.style.display = 'flex';
        }
        return;
    }
    
    // Hide empty state
    if (emptyState) {
        emptyState.style.display = 'none';
    }
    
    // Check if messages container exists
    let messagesContainer = chatContent.querySelector('.chat-messages');
    if (!messagesContainer) {
        messagesContainer = document.createElement('div');
        messagesContainer.className = 'chat-messages';
        chatContent.insertBefore(messagesContainer, chatContent.firstChild);
    }
    
    // Render all messages
    messagesContainer.innerHTML = notebookState.chatMessages.map(msg => {
        const isUser = msg.role === 'user';
        const formattedContent = formatMessageContent(msg.content);
        return `
            <div class="chat-message ${isUser ? 'user' : 'assistant'}">
                <div class="message-avatar">
                    <span class="material-symbols-rounded">
                        ${isUser ? 'person' : 'smart_toy'}
                    </span>
                </div>
                <div class="message-content">
                    <div class="message-text">${formattedContent}</div>
                    <div class="message-time">${formatTime(msg.timestamp)}</div>
                </div>
            </div>
        `;
    }).join('');
}

/**
 * Show typing indicator
 */
function showTypingIndicator() {
    const chatContent = elements.chatContent;
    let messagesContainer = chatContent.querySelector('.chat-messages');
    
    if (!messagesContainer) {
        messagesContainer = document.createElement('div');
        messagesContainer.className = 'chat-messages';
        chatContent.insertBefore(messagesContainer, chatContent.firstChild);
    }
    
    const indicator = document.createElement('div');
    indicator.className = 'chat-message assistant typing-indicator';
    indicator.id = 'typing-indicator';
    indicator.innerHTML = `
        <div class="message-avatar">
            <span class="material-symbols-rounded">smart_toy</span>
        </div>
        <div class="message-content">
            <div class="typing-dots">
                <span></span>
                <span></span>
                <span></span>
            </div>
        </div>
    `;
    
    messagesContainer.appendChild(indicator);
    scrollChatToBottom();
}

/**
 * Hide typing indicator
 */
function hideTypingIndicator() {
    const indicator = document.getElementById('typing-indicator');
    if (indicator) {
        indicator.remove();
    }
}

/**
 * Scroll chat to bottom
 */
function scrollChatToBottom() {
    const chatContent = elements.chatContent;
    if (chatContent) {
        chatContent.scrollTop = chatContent.scrollHeight;
    }
}

/**
 * Escape HTML to prevent XSS
 */
function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

/**
 * Format message content with basic markdown support
 */
function formatMessageContent(text) {
    // Escape HTML first
    let formatted = escapeHtml(text);
    
    // Convert **bold** to <strong>
    formatted = formatted.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
    
    // Convert *italic* to <em>
    formatted = formatted.replace(/\*(.*?)\*/g, '<em>$1</em>');
    
    // Convert line breaks to <br>
    formatted = formatted.replace(/\n/g, '<br>');
    
    // Convert bullet points (- or *) to proper lists
    formatted = formatted.replace(/^[\-\*]\s(.+)$/gm, '<li>$1</li>');
    if (formatted.includes('<li>')) {
        formatted = '<ul>' + formatted + '</ul>';
    }
    
    return formatted;
}

/**
 * Format timestamp
 */
function formatTime(timestamp) {
    const date = new Date(timestamp);
    return date.toLocaleTimeString('en-US', { 
        hour: 'numeric', 
        minute: '2-digit',
        hour12: true 
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
 * Reset all data and return to empty state
 */
function resetAllData() {
    // Show confirmation dialog
    const confirmReset = confirm(
        'Are you sure you want to reset everything?\n\n' +
        'This will delete:\n' +
        '• All uploaded sources\n' +
        '• All chat messages\n' +
        '• All generated study materials\n\n' +
        'This action cannot be undone.'
    );
    
    if (!confirmReset) {
        return;
    }
    
    // Clear all data
    notebookState.workspaceTitle = 'Untitled notebook';
    notebookState.sources = [];
    notebookState.chatMessages = [];
    notebookState.activeStudyModes = [];
    notebookState.selectedSources.clear();
    notebookState.recommendedSources = [];
    
    // Clear localStorage
    localStorage.removeItem('notebookState');
    
    // Update UI
    renderSources();
    updateChatInputState();
    
    // Clear chat messages container
    const messagesContainer = elements.chatContent?.querySelector('.chat-messages');
    if (messagesContainer) {
        messagesContainer.remove();
    }
    
    // Show empty states
    const chatEmptyState = elements.chatEmptyState;
    if (chatEmptyState) {
        chatEmptyState.style.display = 'flex';
    }
    
    const sourcesEmptyState = document.querySelector('.sources-empty-state');
    if (sourcesEmptyState) {
        sourcesEmptyState.style.display = 'block';
        sourcesEmptyState.innerHTML = `
            <span class="material-symbols-rounded empty-icon">description</span>
            <h3 class="empty-title">Saved sources will appear here</h3>
            <p class="empty-description">Click Add source above to add PDFs, websites, text, videos, or audio files. Or import a file directly from Google Drive.</p>
        `;
    }
    
    // Remove sources list if it exists
    const sourcesList = document.querySelector('.sources-list');
    if (sourcesList) {
        sourcesList.remove();
    }
    
    // Reset workspace title
    if (elements.workspaceTitle) {
        elements.workspaceTitle.textContent = 'Untitled notebook';
    }
    
    // Hide recommended sources
    if (elements.recommendedSection) {
        elements.recommendedSection.style.display = 'none';
    }
    
    // Close debug modal
    closeDebugModal();
    
    // Show success notification
    showNotification('All data has been reset!');
}

// ============================================
// State Persistence
// ============================================

/**
 * Load notebook state from localStorage
 */
function loadNotebookState() {
    const saved = localStorage.getItem('notebookState');
    if (saved) {
        try {
            const data = JSON.parse(saved);
            notebookState.workspaceTitle = data.workspaceTitle || 'Untitled notebook';
            notebookState.sources = data.sources || [];
            notebookState.chatMessages = data.chatMessages || [];
            notebookState.activeStudyModes = data.activeStudyModes || [];
            notebookState.selectedSources = new Set(data.selectedSources || []);
            notebookState.recommendedSources = data.recommendedSources || [];
            
            // Render sources if they exist
            if (notebookState.sources.length > 0) {
                renderSources();
                updateChatInputState();
            }
        } catch (e) {
            console.error('Error loading notebook state:', e);
        }
    }
}

/**
 * Save notebook state to localStorage
 */
function saveNotebookState() {
    const stateToSave = {
        workspaceTitle: notebookState.workspaceTitle,
        sources: notebookState.sources,
        chatMessages: notebookState.chatMessages,
        activeStudyModes: notebookState.activeStudyModes,
        selectedSources: Array.from(notebookState.selectedSources),
        recommendedSources: notebookState.recommendedSources
    };
    localStorage.setItem('notebookState', JSON.stringify(stateToSave));
}

// ============================================
// Event Listeners
// ============================================

function attachNotebookListeners() {
    // Add sources button
    elements.addSourcesBtn?.addEventListener('click', handleFileUpload);
    
    // Upload source button (in chat empty state)
    elements.uploadSourceBtn?.addEventListener('click', handleFileUpload);
    
    // Add note button
    elements.addNoteBtn?.addEventListener('click', () => {
        showNotification('Note taking feature coming soon!');
    });
    
    // Studio cards
    elements.studioCards?.forEach(card => {
        card.addEventListener('click', () => {
            if (!card.disabled) {
                handleStudyCardClick(card);
            }
        });
    });
    
    // Chat input - Enter to send
    elements.chatInput?.addEventListener('keypress', (event) => {
        if (event.key === 'Enter' && !event.shiftKey) {
            event.preventDefault();
            sendChatMessage();
        }
    });
    
    // Chat submit button
    elements.chatSubmitBtn?.addEventListener('click', () => {
        sendChatMessage();
    });
    
    // Recommended sources
    elements.closeRecommended?.addEventListener('click', closeRecommendedSources);
    elements.seeMoreRecommended?.addEventListener('click', () => {
        showNotification('See more functionality coming soon!');
    });
    
    // Debug modal
    elements.menuBtn?.addEventListener('click', openDebugModal);
    elements.debugModalClose?.addEventListener('click', closeDebugModal);
    elements.debugResetBtn?.addEventListener('click', resetAllData);
    elements.debugModalOverlay?.addEventListener('click', (event) => {
        if (event.target === elements.debugModalOverlay) {
            closeDebugModal();
        }
    });
    
    // Close modals with Escape
    document.addEventListener('keydown', (event) => {
        if (event.key === 'Escape') {
            if (elements.debugModalOverlay?.classList.contains('active')) {
                closeDebugModal();
            }
        }
    });
}

// ============================================
// Initialize App
// ============================================

document.addEventListener('DOMContentLoaded', initNotebook);
