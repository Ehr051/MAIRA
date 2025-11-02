/**
 * 🎨 TerrainUI3D.js
 * =====================
 * Gestión de interfaz de usuario para sistema de terreno 3D.
 * 
 * Funciones:
 * - Modal de carga con progreso
 * - Sistema de logging
 * - Controles UI (fullscreen, etc.)
 */

/**
 * 📊 Modal de carga
 */
function showLoadingModal(step = 'Iniciando...', progress = 0) {
    const modal = document.getElementById('loading-modal');
    const stepEl = document.getElementById('loading-step');
    const progressBar = document.getElementById('loading-progress-bar');
    const percentage = document.getElementById('loading-percentage');
    
    if (!modal) {
        console.warn('⚠️ Modal de carga no encontrado en el DOM');
        return;
    }
    
    modal.style.display = 'flex';
    if (stepEl) stepEl.textContent = step;
    if (progressBar) progressBar.style.width = `${progress}%`;
    if (percentage) percentage.textContent = `${Math.round(progress)}%`;
}

function hideLoadingModal() {
    const modal = document.getElementById('loading-modal');
    if (modal) {
        modal.style.display = 'none';
    }
}

/**
 * 📊 Barra de progreso (alias para consistencia)
 */
function updateProgressBar(message, progress) {
    showLoadingModal(message, progress);
    console.log(`📊 Progress: ${message} (${Math.round(progress)}%)`);
}

function hideProgressBar() {
    hideLoadingModal();
}

/**
 * 📝 Sistema de logging
 */
function log(message, type = 'info') {
    const logPanel = document.getElementById('status-log');
    
    if (!logPanel) {
        console.log(`[${type}] ${message}`);
        return;
    }
    
    const entry = document.createElement('div');
    entry.className = `log-entry log-${type}`;
    const time = new Date().toLocaleTimeString();
    entry.textContent = `[${time}] ${message}`;
    
    logPanel.appendChild(entry);
    logPanel.scrollTop = logPanel.scrollHeight;
    
    // También logear a consola
    console.log(`[${type}] ${message}`);
}

/**
 * 🖼️ Crear modal de preview de imagen
 */
function createImagePreviewModal(imageSrc) {
    const modal = document.createElement('div');
    modal.id = 'preview-modal';
    modal.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: rgba(0,0,0,0.9);
        display: flex;
        align-items: center;
        justify-content: center;
        z-index: 10000;
    `;
    
    const content = document.createElement('div');
    content.style.cssText = `
        background: white;
        padding: 20px;
        border-radius: 8px;
        max-width: 90%;
        max-height: 90%;
        overflow: auto;
    `;
    
    const img = document.createElement('img');
    img.src = imageSrc;
    img.style.cssText = 'max-width: 100%; height: auto;';
    
    const closeBtn = document.createElement('button');
    closeBtn.textContent = '✖ Cerrar (ESC)';
    closeBtn.className = 'secondary';
    closeBtn.style.cssText = 'margin-top: 10px; width: 100%;';
    closeBtn.onclick = () => modal.remove();
    
    content.appendChild(img);
    content.appendChild(closeBtn);
    modal.appendChild(content);
    document.body.appendChild(modal);
    
    // ESC para cerrar
    const handleEsc = (e) => {
        if (e.key === 'Escape') {
            modal.remove();
            document.removeEventListener('keydown', handleEsc);
        }
    };
    document.addEventListener('keydown', handleEsc);
    
    return modal;
}

/**
 * 💬 Toast notifications
 */
function showToast(message, type = 'info', duration = 3000) {
    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    toast.textContent = message;
    toast.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        background: ${type === 'error' ? '#ff4444' : type === 'success' ? '#44ff44' : '#4444ff'};
        color: white;
        padding: 15px 20px;
        border-radius: 8px;
        box-shadow: 0 4px 6px rgba(0,0,0,0.3);
        z-index: 10001;
        animation: slideIn 0.3s ease;
        max-width: 300px;
    `;
    
    document.body.appendChild(toast);
    
    setTimeout(() => {
        toast.style.animation = 'slideOut 0.3s ease';
        setTimeout(() => toast.remove(), 300);
    }, duration);
}

/**
 * 🔔 Confirmación de diálogo
 */
function showConfirmDialog(title, message, onConfirm, onCancel) {
    const overlay = document.createElement('div');
    overlay.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: rgba(0,0,0,0.7);
        display: flex;
        align-items: center;
        justify-content: center;
        z-index: 10002;
    `;
    
    const dialog = document.createElement('div');
    dialog.style.cssText = `
        background: white;
        padding: 30px;
        border-radius: 12px;
        max-width: 400px;
        box-shadow: 0 10px 25px rgba(0,0,0,0.5);
    `;
    
    const titleEl = document.createElement('h3');
    titleEl.textContent = title;
    titleEl.style.marginTop = '0';
    
    const messageEl = document.createElement('p');
    messageEl.textContent = message;
    
    const buttonContainer = document.createElement('div');
    buttonContainer.style.cssText = 'display: flex; gap: 10px; margin-top: 20px;';
    
    const confirmBtn = document.createElement('button');
    confirmBtn.textContent = 'Confirmar';
    confirmBtn.className = 'primary';
    confirmBtn.style.flex = '1';
    confirmBtn.onclick = () => {
        overlay.remove();
        if (onConfirm) onConfirm();
    };
    
    const cancelBtn = document.createElement('button');
    cancelBtn.textContent = 'Cancelar';
    cancelBtn.className = 'secondary';
    cancelBtn.style.flex = '1';
    cancelBtn.onclick = () => {
        overlay.remove();
        if (onCancel) onCancel();
    };
    
    buttonContainer.appendChild(confirmBtn);
    buttonContainer.appendChild(cancelBtn);
    
    dialog.appendChild(titleEl);
    dialog.appendChild(messageEl);
    dialog.appendChild(buttonContainer);
    overlay.appendChild(dialog);
    document.body.appendChild(overlay);
}

// 🌐 Exponer funciones globalmente
window.showLoadingModal = showLoadingModal;
window.hideLoadingModal = hideLoadingModal;
window.updateProgressBar = updateProgressBar;
window.hideProgressBar = hideProgressBar;
window.log = log;
window.createImagePreviewModal = createImagePreviewModal;
window.showToast = showToast;
window.showConfirmDialog = showConfirmDialog;
