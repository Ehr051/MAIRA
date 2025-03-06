// Carrusel de selección de modos para M.A.I.R.A.
document.addEventListener('DOMContentLoaded', function() {
    // Configuración de modos disponibles (fácilmente extensible)
    const modos = [
        {
            id: 'planeamiento',
            nombre: 'Modo Planeamiento',
            icono: 'planning-icon.png', // Asegúrate de tener estos iconos en tu carpeta de imágenes
            descripcion: 'Planifica operaciones, crea calcos y elementos en el mapa con libertad total.',
            url: 'planeamiento.html'
        },
        {
            id: 'juego-guerra',
            nombre: 'Juego de Guerra',
            icono: 'wargame-icon.png',
            descripcion: 'Simula combates por turnos con unidades que responden a la topografía y condiciones.',
            url: 'juegodeguerra.html'
        },
        // Puedes agregar más modos aquí fácilmente en el futuro
    ];

    // Crear el contenedor del carrusel si no existe
    if (!document.querySelector('.mode-carousel-container')) {
        createCarousel();
    }

    // Función para crear el carrusel completo
    function createCarousel() {
        const container = document.createElement('div');
        container.className = 'mode-carousel-container';
        
        // Botón flecha izquierda
        const leftArrow = document.createElement('button');
        leftArrow.className = 'carousel-arrow left-arrow';
        leftArrow.innerHTML = '&lt;';
        container.appendChild(leftArrow);
        
        // Contenedor de tarjetas
        const cardsContainer = document.createElement('div');
        cardsContainer.className = 'mode-cards';
        
        // Crear tarjetas para cada modo
        modos.forEach((modo, index) => {
            const card = document.createElement('div');
            card.className = 'mode-card';
            card.dataset.id = modo.id;
            
            // Si es el primer modo, marcarlo como activo
            if (index === 0) {
                card.classList.add('active');
            }
            
            // Contenido de la tarjeta
            card.innerHTML = `
                <img src="/Client/image/${modo.icono}" alt="${modo.nombre}">
                <h3>${modo.nombre}</h3>
                <p>${modo.descripcion}</p>
            `;
            
            // Agregar evento de clic para seleccionar el modo
            card.addEventListener('click', function() {
                document.querySelectorAll('.mode-card').forEach(c => c.classList.remove('active'));
                this.classList.add('active');
                currentMode = modo.id;
                
                // Actualizar el botón de acceso
                const iniciarBtn = document.getElementById('btnIniciarModo');
                if (iniciarBtn) {
                    iniciarBtn.setAttribute('data-url', modo.url);
                }
            });
            
            cardsContainer.appendChild(card);
        });
        
        container.appendChild(cardsContainer);
        
        // Botón flecha derecha
        const rightArrow = document.createElement('button');
        rightArrow.className = 'carousel-arrow right-arrow';
        rightArrow.innerHTML = '&gt;';
        container.appendChild(rightArrow);
        
        // Insertar el carrusel antes de los botones de inicio
        const botonesInicio = document.getElementById('botonesInicio');
        if (botonesInicio) {
            botonesInicio.parentNode.insertBefore(container, botonesInicio);
        } else {
            document.querySelector('main') || document.body.appendChild(container);
        }
        
        // Manejar eventos de flechas
        leftArrow.addEventListener('click', () => scrollCarousel(-1));
        rightArrow.addEventListener('click', () => scrollCarousel(1));
        
        // Agregar o modificar botón de inicio
        let iniciarBtn = document.getElementById('btnIniciarModo');
        
        if (!iniciarBtn) {
            iniciarBtn = document.createElement('button');
            iniciarBtn.id = 'btnIniciarModo';
            iniciarBtn.textContent = 'Iniciar Modo';
            iniciarBtn.setAttribute('data-url', modos[0].url);
            
            // Agregar evento de clic
            iniciarBtn.addEventListener('click', function() {
                const url = this.getAttribute('data-url');
                if (url) {
                    window.location.href = url;
                }
            });
            
            // Agregar al contenedor de botones
            if (botonesInicio) {
                botonesInicio.appendChild(iniciarBtn);
            }
        }
    }
    
    // Variables para el estado del carrusel
    let currentIndex = 0;
    let currentMode = modos[0].id;
    
    // Función para desplazar el carrusel
    function scrollCarousel(direction) {
        const cards = document.querySelectorAll('.mode-card');
        const visibleCount = getVisibleCardCount();
        
        // Calcular nuevo índice con límites
        currentIndex = Math.max(0, Math.min(currentIndex + direction, modos.length - visibleCount));
        
        // Animar desplazamiento
        const cardsContainer = document.querySelector('.mode-cards');
        if (cardsContainer) {
            const cardWidth = cards[0].offsetWidth + parseInt(window.getComputedStyle(cards[0]).marginLeft) + 
                             parseInt(window.getComputedStyle(cards[0]).marginRight);
            
            cardsContainer.style.transform = `translateX(${-currentIndex * cardWidth}px)`;
        }
    }
    
    // Función para determinar cuántas tarjetas son visibles según el ancho de ventana
    function getVisibleCardCount() {
        const windowWidth = window.innerWidth;
        
        if (windowWidth < 576) return 1;
        if (windowWidth < 992) return 2;
        return 3;
    }
    
    // Manejar redimensionamiento de ventana
    window.addEventListener('resize', function() {
        // Asegurar que siempre haya tarjetas visibles
        const visibleCount = getVisibleCardCount();
        currentIndex = Math.min(currentIndex, modos.length - visibleCount);
        
        // Actualizar posición
        scrollCarousel(0);
    });
});