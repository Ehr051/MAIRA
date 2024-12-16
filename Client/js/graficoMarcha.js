// GraficoMarchaController.js
function GraficoMarchaController() {
    this.config = {
        margin: { 
            top: 40, 
            right: 150,
            bottom: 70, // Aumentado para las etiquetas rotadas
            left: 70    
        },
        colors: [
            '#2196F3', // Azul
            '#4CAF50', // Verde
            '#F44336', // Rojo
            '#FFC107', // Ámbar
            '#9C27B0'  // Púrpura
        ],
        altura: 600,
        opacidadSerie: 0.3,
        opacidadColumna: 0.7,
        anchoLinea: 2,
        gridColor: '#ddd',
        gridOpacity: 0.3,
        fineGridColor: '#eee',
        fineGridOpacity: 0.2,
        altoColor: '#ff4444',
        leyendaAncho: 120
    };

    this.state = {
        svg: null,
        width: 0,
        height: 0,
        scales: {},
        data: null,
        horaH: null,
        layers: {}
    };
}

GraficoMarchaController.prototype.inicializar = function(containerId) {
    const container = document.getElementById(containerId);
    if (!container) {
        console.error('Contenedor no encontrado:', containerId);
        return;
    }
    
    // Obtener el display-content en lugar de usar el container directamente
    const displayContent = container.querySelector('.display-content');
    if (!displayContent) {
        console.error('Display content no encontrado');
        return;
    }
    
    displayContent.innerHTML = '';

    this.state.width = displayContent.clientWidth - this.config.margin.left - this.config.margin.right;
    this.state.height = displayContent.clientHeight - this.config.margin.top - this.config.margin.bottom;

    this.state.svg = d3.select(displayContent)
        .append('svg')
        .attr('width', this.state.width + this.config.margin.left + this.config.margin.right)
        .attr('height', this.state.height + this.config.margin.top + this.config.margin.bottom)
        .append('g')
        .attr('transform', `translate(${this.config.margin.left},${this.config.margin.top})`);

        ['grid', 'series', 'columnas', 'altos', 'puntosControl', 'ejes', 'leyenda', 'tooltip', 'overlay']
        .forEach(layer => {
            this.state.layers[layer] = this.state.svg.append('g')
                .attr('class', `${layer}-layer`);
        });

    this.agregarTooltipMouse();

    const resizeObserver = new ResizeObserver(() => {
        if (this.state.data) {
            this.handleResize();
        }
    });
    
    resizeObserver.observe(displayContent);
};


GraficoMarchaController.prototype.dibujarGrafico = function() {
    if (!this.state.data) {
        console.error('No hay datos para dibujar');
        return;
    }

    this.limpiarGrafico();
    this.dibujarGrid();
    this.dibujarSeries();
    this.dibujarColumnas();
    this.dibujarPuntosControl();
    this.dibujarEjes();
    this.dibujarLeyenda();
};

GraficoMarchaController.prototype.limpiarGrafico = function() {
    Object.values(this.state.layers).forEach(layer => layer.selectAll('*').remove());
};

GraficoMarchaController.prototype.dibujarGrid = function() {
    const gridLayer = this.state.layers.grid;

    // Grid vertical (tiempo) - cada 15 minutos
    const minutosTotal = this.state.data.tiempoTotal;
    const intervaloTicks = minutosTotal > 120 ? 30 : 15;

    const xGrid = d3.axisBottom(this.state.scales.x)
        .ticks(d3.timeMinute.every(intervaloTicks))
        .tickSize(-this.state.height)
        .tickFormat('');

    gridLayer.append('g')
        .attr('class', 'grid x-grid')
        .attr('transform', `translate(0,${this.state.height})`)
        .call(xGrid)
        .style('stroke', this.config.gridColor)
        .style('stroke-opacity', this.config.gridOpacity);

    // Grid horizontal (distancia) - cada kilómetro
    const yGrid = d3.axisLeft(this.state.scales.y)
        .ticks(Math.floor(this.state.data.distanciaTotal / 1000))
        .tickSize(-this.state.width)
        .tickFormat('');

    gridLayer.append('g')
        .attr('class', 'grid y-grid')
        .call(yGrid)
        .style('stroke', this.config.gridColor)
        .style('stroke-opacity', this.config.gridOpacity);

    // Grid fino (milimetrado) opcional
    if (this.state.width <= 1000) { // Solo para gráficos no muy anchos
        const fineGrid = gridLayer.append('g')
            .attr('class', 'fine-grid');

        // Líneas cada 5 minutos
        const minutosTotales = Math.ceil(this.state.data.tiempoTotal);
        for (let minuto = 0; minuto <= minutosTotales; minuto += 5) {
            const tiempo = new Date(this.state.horaH.getTime() + minuto * 60000);
            fineGrid.append('line')
                .attr('x1', this.state.scales.x(tiempo))
                .attr('x2', this.state.scales.x(tiempo))
                .attr('y1', 0)
                .attr('y2', this.state.height)
                .style('stroke', this.config.fineGridColor)
                .style('stroke-opacity', this.config.fineGridOpacity);
        }

        // Líneas cada 0.5 km
        const distanciaMaxKm = this.state.data.distanciaTotal / 1000;
        for (let km = 0; km <= distanciaMaxKm; km += 0.5) {
            fineGrid.append('line')
                .attr('x1', 0)
                .attr('x2', this.state.width)
                .attr('y1', this.state.scales.y(km))
                .attr('y2', this.state.scales.y(km))
                .style('stroke', this.config.fineGridColor)
                .style('stroke-opacity', this.config.fineGridOpacity);
        }
    }
};


// Agregar al GraficoMarchaController.prototype
GraficoMarchaController.prototype.handleResize = function() {
    const container = document.getElementById('graficoMarchaPanel');
    const content = container.querySelector('.display-content');
    
    // Actualizar dimensiones
    this.state.width = content.clientWidth - this.config.margin.left - this.config.margin.right;
    this.state.height = content.clientHeight - this.config.margin.top - this.config.margin.bottom;

    // Actualizar el SVG principal
    const svg = this.state.svg.node().parentNode;
    d3.select(svg)
        .attr('width', this.state.width + this.config.margin.left + this.config.margin.right)
        .attr('height', this.state.height + this.config.margin.top + this.config.margin.bottom);

    // Actualizar escalas
    this.state.scales.x = d3.scaleTime()
        .domain([this.state.horaH, new Date(this.state.horaH.getTime() + this.state.data.tiempoTotal * 60000)])
        .range([0, this.state.width]);

    this.state.scales.y = d3.scaleLinear()
        .domain([0, this.state.data.distanciaTotal / 1000])
        .range([this.state.height, 0]);

    // Redibujar el gráfico completo
    this.dibujarGrafico();
};





GraficoMarchaController.prototype.dibujarPuntosControl = function() {
    const pcLayer = this.state.layers.puntosControl;
    const puntosControl = window.CalculoMarcha.estado.puntosControl;

    if (!puntosControl || !puntosControl.length) return;

    puntosControl.forEach(pc => {
        if (!pc || isNaN(pc.distanciaAcumulada)) return;

        pcLayer.append('line')
            .attr('class', 'pc-line')
            .attr('x1', 0)
            .attr('x2', this.state.width)
            .attr('y1', this.state.scales.y(pc.distanciaAcumulada / 1000))
            .attr('y2', this.state.scales.y(pc.distanciaAcumulada / 1000))
            .style('stroke', this.config.altoColor)
            .style('stroke-opacity', 0.5)
            .style('stroke-dasharray', '5,5');

        // Etiqueta del PC
        pcLayer.append('text')
            .attr('class', 'pc-label')
            .attr('x', -5)
            .attr('y', this.state.scales.y(pc.distanciaAcumulada / 1000))
            .attr('dy', '0.32em')
            .attr('text-anchor', 'end')
            .text(pc.tipo === 'PC' ? `PC${pc.numero}` : pc.numero);
    });
};

GraficoMarchaController.prototype.dibujarEjes = function() {
    const ejesLayer = this.state.layers.ejes;

    // Eje X (tiempo) - ajustar intervalo según duración total
    const minutosTotal = this.state.data.tiempoTotal;
    const intervaloTicks = minutosTotal > 120 ? 30 : 15;

    const xAxis = d3.axisBottom(this.state.scales.x)
        .ticks(d3.timeMinute.every(intervaloTicks))
        .tickFormat(d3.timeFormat('%H:%M'));

    const xAxisG = ejesLayer.append('g')
        .attr('class', 'x-axis')
        .attr('transform', `translate(0,${this.state.height})`)
        .call(xAxis);

    // Rotar etiquetas del eje X
    xAxisG.selectAll('text')
        .style('text-anchor', 'end')
        .attr('dx', '-.8em')
        .attr('dy', '.15em')
        .attr('transform', 'rotate(-45)');

    // Eje Y (distancia)
    const yAxis = d3.axisLeft(this.state.scales.y)
        .tickFormat(d => `${d} km`);

    ejesLayer.append('g')
        .attr('class', 'y-axis')
        .call(yAxis);

    // Etiquetas de los ejes
    ejesLayer.append('text')
        .attr('class', 'x-label')
        .attr('x', this.state.width / 2)
        .attr('y', this.state.height + 45)
        .style('text-anchor', 'middle')
        .text('Tiempo (HH:MM)');

    ejesLayer.append('text')
        .attr('class', 'y-label')
        .attr('transform', 'rotate(-90)')
        .attr('x', -this.state.height / 2)
        .attr('y', -50)
        .style('text-anchor', 'middle')
        .text('Distancia (km)');
};

GraficoMarchaController.prototype.dibujarLeyenda = function() {
    const leyendaLayer = this.state.layers.leyenda
        .attr('transform', `translate(${this.state.width + 10}, 20)`);

    this.state.data.series.forEach((serie, index) => {
        const grupoSerie = leyendaLayer.append('g')
            .attr('transform', `translate(0, ${index * 40})`);

        grupoSerie.append('text')
            .attr('x', 0)
            .attr('y', 0)
            .text(serie.nombre)
            .style('font-weight', 'bold');

        serie.columnas.forEach((columna, colIndex) => {
            const grupoColumna = grupoSerie.append('g')
                .attr('transform', `translate(10, ${(colIndex + 1) * 15})`);

            grupoColumna.append('rect')
                .attr('width', 20)
                .attr('height', 10)
                .attr('x', 0)
                .attr('y', -8)
                .style('fill', this.config.colors[index])
                .style('fill-opacity', this.config.opacidadColumna);

            grupoColumna.append('text')
                .attr('x', 25)
                .attr('y', 0)
                .text(columna.nombre)
                .style('font-size', '12px');
        });
    });
};

GraficoMarchaController.prototype.agregarTooltipMouse = function() {
    const self = this;
    
    this.state.layers.overlay.append('rect')
        .attr('width', this.state.width)
        .attr('height', this.state.height)
        .style('fill', 'none')
        .style('pointer-events', 'all')
        .on('mousemove', function(event) {
            const [x, y] = d3.pointer(event);
            const tiempo = self.state.scales.x.invert(x);
            const distancia = self.state.scales.y.invert(y);
            
            self.mostrarTooltipPosicion(event.pageX, event.pageY,
                `Km ${distancia.toFixed(2)} - ${tiempo.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}`
            );
        })
        .on('mouseout', function() {
            self.ocultarTooltip();
        });
};

GraficoMarchaController.prototype.mostrarTooltipPosicion = function(x, y, texto) {
    const tooltipLayer = this.state.layers.tooltip;
    tooltipLayer.selectAll('*').remove();
    
    const tooltip = tooltipLayer.append('g')
        .attr('class', 'tooltip')
        .attr('transform', `translate(${x - 280},${y - 120})`);

    tooltip.append('rect')
        .attr('width', 120)
        .attr('height', 25)
        .attr('fill', 'white')
        .attr('stroke', '#ccc')
        .attr('rx', 5);

    tooltip.append('text')
        .attr('x', 5)
        .attr('y', 17)
        .text(texto);
};

// 1. Mantenemos el procesamiento de datos pero ajustamos las escalas
GraficoMarchaController.prototype.procesarDatos = function(resultados) {
    if (!resultados || !resultados.series || !resultados.distanciaTotal) {
        console.error('Datos inválidos:', resultados);
        return;
    }

    this.state.data = resultados;
    this.state.horaH = window.CalculoMarcha.estado.horaH || new Date();

    // Calculamos el dominio de tiempo total
    const tiempoFinal = this.state.horaH.getTime() + resultados.tiempoTotal * 60000;

    this.state.scales.x = d3.scaleTime()
        .domain([this.state.horaH, new Date(tiempoFinal)])
        .range([0, this.state.width]);

    this.state.scales.y = d3.scaleLinear()
        .domain([0, resultados.distanciaTotal / 1000])
        .range([this.state.height, 0]);
};

// 2. La función principal de dibujo de columnas
GraficoMarchaController.prototype.dibujarColumnas = function() {
    const columnasLayer = this.state.layers.columnas;
    
    this.state.data.series.forEach((serie, serieIndex) => {
        serie.columnas.forEach((columna, columnaIndex) => {
            // Crear las líneas de borde head y tail
            const lineHead = d3.line()
                .x(d => this.state.scales.x(new Date(this.state.horaH.getTime() + d.tiempoHead * 60000)))
                .y(d => this.state.scales.y(d.distancia / 1000))
                .curve(d3.curveLinear);

            const lineTail = d3.line()
                .x(d => this.state.scales.x(new Date(this.state.horaH.getTime() + d.tiempoTail * 60000)))
                .y(d => this.state.scales.y(d.distancia / 1000))
                .curve(d3.curveLinear);

            // Área entre las líneas head y tail
            const area = d3.area()
                .x0(d => this.state.scales.x(new Date(this.state.horaH.getTime() + d.tiempoHead * 60000)))
                .x1(d => this.state.scales.x(new Date(this.state.horaH.getTime() + d.tiempoTail * 60000)))
                .y(d => this.state.scales.y(d.distancia / 1000))
                .curve(d3.curveLinear);

            // Dibujar el área principal de la columna
            columnasLayer.append('path')
                .datum(columna.puntos)
                .attr('class', `columna-area serie-${serieIndex}-columna-${columnaIndex}`)
                .attr('d', area)
                .style('fill', this.config.colors[serieIndex])
                .style('fill-opacity', this.config.opacidadColumna);

            // Dibujar las líneas de contorno
            columnasLayer.append('path')
                .datum(columna.puntos)
                .attr('class', `columna-borde head`)
                .attr('d', lineHead)
                .style('stroke', this.config.colors[serieIndex])
                .style('stroke-width', 1)
                .style('fill', 'none');

            columnasLayer.append('path')
                .datum(columna.puntos)
                .attr('class', `columna-borde tail`)
                .attr('d', lineTail)
                .style('stroke', this.config.colors[serieIndex])
                .style('stroke-width', 1)
                .style('fill', 'none');

            
        });
    });
};

// 3. La función de dibujo de series
GraficoMarchaController.prototype.dibujarSeries = function() {
    const seriesLayer = this.state.layers.series;

    this.state.data.series.forEach((serie, serieIndex) => {
        // Área de la serie usando tiempoSerieHead y tiempoSerieTail
        const area = d3.area()
            .x0(d => this.state.scales.x(new Date(this.state.horaH.getTime() + d.tiempoSerieHead * 60000)))
            .x1(d => this.state.scales.x(new Date(this.state.horaH.getTime() + d.tiempoSerieTail * 60000)))
            .y(d => this.state.scales.y(d.distancia / 1000))
            .curve(d3.curveLinear);

        seriesLayer.append('path')
            .datum(serie.puntos)
            .attr('class', `serie-area serie-${serieIndex}`)
            .attr('d', area)
            .style('fill', this.config.colors[serieIndex])
            .style('fill-opacity', this.config.opacidadSerie)
            .style('stroke', this.config.colors[serieIndex])
            .style('stroke-opacity', 0.5)
            .style('stroke-width', 1);
    });
};

// 4. Mejorar el tooltip para mostrar más información
GraficoMarchaController.prototype.mostrarTooltipColumna = function(event, columna, serie) {
    const tooltipLayer = this.state.layers.tooltip;
    tooltipLayer.selectAll('*').remove();
    
    const tooltip = tooltipLayer.append('g')
        .attr('class', 'tooltip')
        .attr('transform', `translate(${event.pageX - 280},${event.pageY - 120})`);

    tooltip.append('rect')
        .attr('width', 250)
        .attr('height', 120)
        .attr('fill', 'white')
        .attr('stroke', '#ccc')
        .attr('rx', 5);

    // Agregar más información
    tooltip.append('text')
        .attr('x', 10)
        .attr('y', 20)
        .text(`${serie.nombre} - ${columna.nombre}`)
        .style('font-weight', 'bold');

    tooltip.append('text')
        .attr('x', 10)
        .attr('y', 40)
        .text(`Velocidad: ${columna.velocidadMarcha} km/h`);

    tooltip.append('text')
        .attr('x', 10)
        .attr('y', 60)
        .text(`Vehículos: ${columna.vehiculos}`);

    tooltip.append('text')
        .attr('x', 10)
        .attr('y', 80)
        .text(`Distancia interv.: ${columna.distanciaIntervehicular}m`);

    tooltip.append('text')
        .attr('x', 10)
        .attr('y', 100)
        .text(`Tiempo total: ${this.formatearTiempo(columna.tiempoTotal)}`);
};

GraficoMarchaController.prototype.ocultarTooltip = function() {
    this.state.layers.tooltip.selectAll('*').remove();
};

// Exportar al objeto global
window.GraficoMarchaController = GraficoMarchaController;