/**
 * 📹 CameraController3D.js
 * ============================
 * Gestión avanzada de controles de cámara para navegación 3D.
 * 
 * Características:
 * - Controles de teclado (WASD, QE, +-)
 * - Movimiento suave y natural
 * - Rotación orbital
 * - Zoom progresivo
 * 
 * Inspirado en Google Earth Pro controls.
 */

class CameraController3D {
    constructor(controller) {
        this.controller = controller;
        
        // Estado de teclado
        this.keyState = {};
        
        // Velocidades de control
        this.keyboardSpeed = 10;     // Velocidad de movimiento
        this.rotationSpeed = 0.02;   // Velocidad de rotación
        this.zoomSpeed = 5;          // Velocidad de zoom
        
        // Referencias
        this.camera = null;
        this.controls = null;
    }
    
    /**
     * 🚀 Inicializar controlador de cámara
     */
    init() {
        this.camera = this.controller.camera;
        this.controls = this.controller.controls;
        
        if (!this.camera || !this.controls) {
            console.error('❌ CameraController3D: camera o controls no disponibles');
            return;
        }
        
        // Configurar event listeners
        this.setupKeyboardControls();
        
        log('✅ CameraController3D inicializado', 'success');
    }
    
    /**
     * ⌨️ Configurar controles de teclado
     */
    setupKeyboardControls() {
        document.addEventListener('keydown', (e) => {
            this.keyState[e.key.toLowerCase()] = true;
            
            // Prevenir scroll con flechas/espacio
            if (['arrowup', 'arrowdown', 'arrowleft', 'arrowright', ' ', '+', '-'].includes(e.key.toLowerCase())) {
                e.preventDefault();
            }
        });
        
        document.addEventListener('keyup', (e) => {
            this.keyState[e.key.toLowerCase()] = false;
        });
    }
    
    /**
     * 🔄 Actualizar controles de teclado (llamado cada frame)
     */
    update() {
        if (!this.controls || !this.camera) return;
        
        const direction = new THREE.Vector3();
        const right = new THREE.Vector3();
        
        // Obtener direcciones relativas a la cámara
        this.camera.getWorldDirection(direction);
        direction.y = 0; // Mantener movimiento horizontal
        direction.normalize();
        right.crossVectors(this.camera.up, direction).normalize();
        
        // W/S - Adelante/Atrás
        if (this.keyState['w']) {
            const moveVector = direction.clone().multiplyScalar(this.keyboardSpeed);
            this.controls.target.add(moveVector);
            this.camera.position.add(moveVector);
        }
        if (this.keyState['s']) {
            const moveVector = direction.clone().multiplyScalar(this.keyboardSpeed);
            this.controls.target.sub(moveVector);
            this.camera.position.sub(moveVector);
        }
        
        // A/D - Izquierda/Derecha (pan lateral)
        if (this.keyState['a']) {
            const moveVector = right.clone().multiplyScalar(this.keyboardSpeed);
            this.controls.target.add(moveVector);
            this.camera.position.add(moveVector);
        }
        if (this.keyState['d']) {
            const moveVector = right.clone().multiplyScalar(this.keyboardSpeed);
            this.controls.target.sub(moveVector);
            this.camera.position.sub(moveVector);
        }
        
        // Q/E - Rotar izquierda/derecha
        if (this.keyState['q']) {
            const spherical = new THREE.Spherical();
            spherical.setFromVector3(this.camera.position.clone().sub(this.controls.target));
            spherical.theta -= this.rotationSpeed;
            this.camera.position.setFromSpherical(spherical).add(this.controls.target);
            this.camera.lookAt(this.controls.target);
        }
        if (this.keyState['e']) {
            const spherical = new THREE.Spherical();
            spherical.setFromVector3(this.camera.position.clone().sub(this.controls.target));
            spherical.theta += this.rotationSpeed;
            this.camera.position.setFromSpherical(spherical).add(this.controls.target);
            this.camera.lookAt(this.controls.target);
        }
        
        // R/F - Subir/Bajar altura de cámara
        if (this.keyState['r']) {
            this.camera.position.y += this.zoomSpeed;
        }
        if (this.keyState['f']) {
            this.camera.position.y -= this.zoomSpeed;
        }
        
        // +/- - Zoom in/out
        if (this.keyState['+'] || this.keyState['=']) {
            const zoomDirection = this.controls.target.clone().sub(this.camera.position).normalize();
            this.camera.position.add(zoomDirection.multiplyScalar(this.zoomSpeed));
        }
        if (this.keyState['-'] || this.keyState['_']) {
            const zoomDirection = this.controls.target.clone().sub(this.camera.position).normalize();
            this.camera.position.sub(zoomDirection.multiplyScalar(this.zoomSpeed));
        }
        
        this.controls.update();
    }
    
    /**
     * 🎯 Enfocar cámara en una posición específica
     */
    focusOn(position, distance = 100, animated = true) {
        if (!this.camera || !this.controls) return;
        
        if (animated) {
            // TODO: Implementar animación suave (gsap/tween.js)
            console.log('🎬 Animación de cámara no implementada aún');
        }
        
        // Posición inmediata
        this.controls.target.copy(position);
        this.camera.position.set(
            position.x,
            position.y + distance * 0.8,
            position.z + distance * 0.6
        );
        this.camera.lookAt(position);
        this.controls.update();
    }
    
    /**
     * 🔧 Ajustar velocidades de control
     */
    setSpeed(keyboard, rotation, zoom) {
        this.keyboardSpeed = keyboard || this.keyboardSpeed;
        this.rotationSpeed = rotation || this.rotationSpeed;
        this.zoomSpeed = zoom || this.zoomSpeed;
    }
}

// 🌐 Exponer globalmente
window.CameraController3D = CameraController3D;
