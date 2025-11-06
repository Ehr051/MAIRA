/**
 * CALCULADOR PCR - LÓGICA PRINCIPAL
 */

// Estado global
let fuerzas = {
    azul: [],
    rojo: []
};

let bandoActual = null;
let modalBootstrap = null;

// ==========================================
// INICIALIZACIÓN
// ==========================================

document.addEventListener('DOMContentLoaded', function() {
    console.log('🎯 Calculador PCR inicializado');

    // Inicializar modal de Bootstrap
    const modalElement = document.getElementById('modalAgregar');
    if (modalElement) {
        modalBootstrap = new bootstrap.Modal(modalElement);

        // Event listener para cuando se cierra el modal
        modalElement.addEventListener('hidden.bs.modal', function () {
            // Resetear todo el formulario
            document.getElementById('categoriaSelect').value = '';
            document.getElementById('equipamientoSelect').innerHTML = '<option value="">Primero seleccione una categoría</option>';
            document.getElementById('equipamientoSelect').disabled = false;
            document.getElementById('cantidadInput').value = 1;
            document.getElementById('munIntCheckbox').disabled = true;
            document.getElementById('munIntCheckbox').checked = false;
            document.getElementById('infoEquipamiento').classList.add('d-none');
            document.getElementById('camposPersonalizados').classList.add('d-none');
            document.getElementById('nombrePersonalizado').value = '';
            document.getElementById('vrcPersonalizado').value = '';
            document.getElementById('obsPersonalizado').value = '';
            document.getElementById('munIntPersonalizado').checked = false;
        });
    }

    // Cargar datos guardados si existen
    cargarDatosGuardados();

    // Calcular totales iniciales
    calcularTotales();
});

// ==========================================
// MODAL AGREGAR ELEMENTO
// ==========================================

function mostrarModalAgregar(bando) {
    bandoActual = bando;
    document.getElementById('modalBandoTitle').textContent = bando === 'azul' ? 'FUERZA AZUL' : 'FUERZA COLORADA';

    // Resetear formulario
    document.getElementById('categoriaSelect').value = '';
    document.getElementById('equipamientoSelect').innerHTML = '<option value="">Primero seleccione una categoría</option>';
    document.getElementById('equipamientoSelect').disabled = false;
    document.getElementById('cantidadInput').value = 1;
    document.getElementById('munIntCheckbox').disabled = true;
    document.getElementById('munIntCheckbox').checked = false;
    document.getElementById('infoEquipamiento').classList.add('d-none');

    // Resetear campos personalizados
    document.getElementById('camposPersonalizados').classList.add('d-none');
    document.getElementById('nombrePersonalizado').value = '';
    document.getElementById('vrcPersonalizado').value = '';
    document.getElementById('obsPersonalizado').value = '';
    document.getElementById('munIntPersonalizado').checked = false;

    modalBootstrap.show();
}

function cargarEquipamiento() {
    const categoria = document.getElementById('categoriaSelect').value;
    const select = document.getElementById('equipamientoSelect');
    const camposPersonalizados = document.getElementById('camposPersonalizados');
    const infoEquipamiento = document.getElementById('infoEquipamiento');

    select.innerHTML = '<option value="">Seleccione...</option>';
    infoEquipamiento.classList.add('d-none');

    if (!categoria) {
        camposPersonalizados.classList.add('d-none');
        return;
    }

    // Si es "otros", mostrar campos personalizados
    if (categoria === 'otros') {
        select.innerHTML = '<option value="personalizado">Elemento Personalizado</option>';
        select.value = 'personalizado';
        select.disabled = true;
        camposPersonalizados.classList.remove('d-none');
        return;
    }

    // Categoría normal
    select.disabled = false;
    camposPersonalizados.classList.add('d-none');

    const equipos = EQUIPAMIENTO[categoria];
    if (!equipos) return;

    equipos.forEach(equipo => {
        const option = document.createElement('option');
        option.value = equipo.id;
        option.textContent = equipo.nombre;
        option.dataset.vrc = equipo.vrc;
        option.dataset.obs = equipo.obs || '';
        option.dataset.munInt = equipo.munInteligente || false;
        select.appendChild(option);
    });
}

function mostrarInfoEquipamiento() {
    const select = document.getElementById('equipamientoSelect');
    const selectedOption = select.options[select.selectedIndex];

    if (!selectedOption || !selectedOption.value) {
        document.getElementById('infoEquipamiento').classList.add('d-none');
        return;
    }

    const vrc = selectedOption.dataset.vrc;
    const obs = selectedOption.dataset.obs;
    const munInt = selectedOption.dataset.munInt === 'true';

    document.getElementById('infoVRC').textContent = vrc;
    document.getElementById('infoObs').textContent = obs || 'Sin observaciones';
    document.getElementById('infoEquipamiento').classList.remove('d-none');

    // Habilitar checkbox de munición inteligente si aplica
    const checkbox = document.getElementById('munIntCheckbox');
    if (munInt) {
        checkbox.disabled = false;
    } else {
        checkbox.disabled = true;
        checkbox.checked = false;
    }
}

function agregarElemento() {
    const categoriaSelect = document.getElementById('categoriaSelect');
    const equipoSelect = document.getElementById('equipamientoSelect');
    const cantidad = parseInt(document.getElementById('cantidadInput').value);

    if (!categoriaSelect.value || !cantidad || cantidad < 1) {
        alert('Por favor complete todos los campos');
        return;
    }

    let equipoId, equipoNombre, vrc, vrcBase, obs, munInt;

    // Elemento personalizado
    if (categoriaSelect.value === 'otros') {
        equipoNombre = document.getElementById('nombrePersonalizado').value.trim();
        vrcBase = parseFloat(document.getElementById('vrcPersonalizado').value);
        obs = document.getElementById('obsPersonalizado').value.trim();
        munInt = document.getElementById('munIntPersonalizado').checked;

        if (!equipoNombre || !vrcBase || vrcBase <= 0) {
            alert('Por favor complete el nombre y VRC del elemento personalizado');
            return;
        }

        equipoId = `custom_${Date.now()}`;
        vrc = munInt ? vrcBase * 1.5 : vrcBase;

    } else {
        // Elemento del catálogo
        if (!equipoSelect.value) {
            alert('Por favor seleccione un equipamiento');
            return;
        }

        const selectedOption = equipoSelect.options[equipoSelect.selectedIndex];
        equipoId = equipoSelect.value;
        equipoNombre = selectedOption.textContent;
        vrcBase = parseFloat(selectedOption.dataset.vrc);
        obs = selectedOption.dataset.obs || '';
        munInt = document.getElementById('munIntCheckbox').checked;
        vrc = munInt ? vrcBase * 1.5 : vrcBase;
    }

    // Crear elemento
    const elemento = {
        id: Date.now(), // ID único
        equipoId: equipoId,
        nombre: equipoNombre,
        obs: obs,
        cantidad: cantidad,
        vrcBase: vrcBase,
        vrc: vrc,
        munInt: munInt,
        personalizado: categoriaSelect.value === 'otros'
    };

    // Agregar a la fuerza correspondiente
    fuerzas[bandoActual].push(elemento);

    // Actualizar tabla
    renderizarTabla(bandoActual);

    // Calcular totales
    calcularTotales();

    // Guardar en localStorage
    guardarDatos();

    // Cerrar modal
    modalBootstrap.hide();

    console.log(`✅ Elemento agregado a ${bandoActual}:`, elemento);
}

// ==========================================
// RENDERIZAR TABLAS
// ==========================================

function renderizarTabla(bando) {
    const tbody = document.getElementById(bando === 'azul' ? 'tablaAzul' : 'tablaRojo');
    const elementos = fuerzas[bando];

    if (elementos.length === 0) {
        tbody.innerHTML = `
            <tr class="tabla-vacia">
                <td colspan="5" class="text-center text-muted">
                    <i class="fas fa-inbox"></i> No hay elementos agregados
                </td>
            </tr>
        `;
        return;
    }

    tbody.innerHTML = '';

    elementos.forEach((elem, index) => {
        const total = calcularTotalElemento(elem, bando);

        const tr = document.createElement('tr');
        tr.className = 'elemento-row';
        tr.innerHTML = `
            <td>
                <div class="elemento-nombre">${elem.nombre}</div>
                ${elem.obs ? `<div class="elemento-obs">${elem.obs}</div>` : ''}
                ${elem.munInt ? '<span class="badge bg-warning text-dark" style="font-size: 0.7rem;">Mun. Inteligente x1.5</span>' : ''}
            </td>
            <td>
                <input type="number" class="form-control form-control-sm cantidad-input"
                       value="${elem.cantidad}" min="1"
                       onchange="actualizarCantidad('${bando}', ${index}, this.value)">
            </td>
            <td>
                <span class="vrc-badge">${elem.vrc.toFixed(2)}</span>
            </td>
            <td>
                <span class="total-badge">${total.toFixed(2)}</span>
            </td>
            <td>
                <button class="btn btn-danger btn-sm btn-eliminar" onclick="eliminarElemento('${bando}', ${index})">
                    <i class="fas fa-trash"></i>
                </button>
            </td>
        `;

        tbody.appendChild(tr);
    });
}

// ==========================================
// CÁLCULOS
// ==========================================

function obtenerFactoresGlobales(bando) {
    const moral = parseFloat(document.getElementById(`moral${bando.charAt(0).toUpperCase() + bando.slice(1)}`).value);
    const experiencia = parseFloat(document.getElementById(`experiencia${bando.charAt(0).toUpperCase() + bando.slice(1)}`).value);
    const personal = parseFloat(document.getElementById(`personal${bando.charAt(0).toUpperCase() + bando.slice(1)}`).value);
    const oportunidad = parseFloat(document.getElementById(`oportunidad${bando.charAt(0).toUpperCase() + bando.slice(1)}`).value);
    const adaptacion = parseFloat(document.getElementById(`adaptacion${bando.charAt(0).toUpperCase() + bando.slice(1)}`).value);

    return {
        moral,
        experiencia,
        personal,
        oportunidad,
        adaptacion
    };
}

function calcularTotalElemento(elemento, bando) {
    const factores = obtenerFactoresGlobales(bando);

    // Fórmula: Total = Cantidad × VRC × Moral × Exp × Pers × Opor × Adp
    const total = elemento.cantidad *
                  elemento.vrc *
                  factores.moral *
                  factores.experiencia *
                  factores.personal *
                  factores.oportunidad *
                  factores.adaptacion;

    return total;
}

function calcularTotales() {
    // Calcular total azul
    let totalAzul = 0;
    fuerzas.azul.forEach(elem => {
        totalAzul += calcularTotalElemento(elem, 'azul');
    });

    // Calcular total rojo
    let totalRojo = 0;
    fuerzas.rojo.forEach(elem => {
        totalRojo += calcularTotalElemento(elem, 'rojo');
    });

    // Mostrar totales
    document.getElementById('totalAzul').textContent = totalAzul.toFixed(2);
    document.getElementById('totalRojo').textContent = totalRojo.toFixed(2);

    // Calcular PCR
    let pcr = 0;
    let pcrTexto = '-- : --';
    let ratioTexto = '';

    if (totalAzul > 0 && totalRojo > 0) {
        pcr = totalAzul / totalRojo;
        pcrTexto = `${totalAzul.toFixed(2)} : ${totalRojo.toFixed(2)}`;

        // Determinar ratio simplificado
        if (pcr >= 1) {
            const ratio = pcr.toFixed(1);
            ratioTexto = `Ratio ${ratio}:1 (Ventaja Azul)`;
        } else {
            const ratio = (1 / pcr).toFixed(1);
            ratioTexto = `Ratio 1:${ratio} (Ventaja Colorada)`;
        }

        // Agregar interpretación
        if (pcr >= 3) {
            ratioTexto += ' - SUPERIORIDAD AZUL';
        } else if (pcr >= 1.5) {
            ratioTexto += ' - Ventaja Significativa Azul';
        } else if (pcr >= 1.2) {
            ratioTexto += ' - Ventaja Moderada Azul';
        } else if (pcr <= 0.33) {
            ratioTexto += ' - SUPERIORIDAD COLORADA';
        } else if (pcr <= 0.67) {
            ratioTexto += ' - Ventaja Significativa Colorada';
        } else if (pcr <= 0.83) {
            ratioTexto += ' - Ventaja Moderada Colorada';
        } else {
            ratioTexto += ' - FUERZAS EQUILIBRADAS';
        }
    }

    document.getElementById('pcrValor').textContent = pcrTexto;
    document.getElementById('pcrRatio').textContent = ratioTexto;

    console.log(`📊 PCR actualizado: ${pcr.toFixed(2)} (Azul: ${totalAzul.toFixed(2)}, Rojo: ${totalRojo.toFixed(2)})`);
}

// ==========================================
// ACTUALIZAR Y ELIMINAR
// ==========================================

function actualizarCantidad(bando, index, nuevaCantidad) {
    const cantidad = parseInt(nuevaCantidad);
    if (cantidad < 1) {
        alert('La cantidad debe ser al menos 1');
        renderizarTabla(bando);
        return;
    }

    fuerzas[bando][index].cantidad = cantidad;
    calcularTotales();
    guardarDatos();

    console.log(`🔄 Cantidad actualizada en ${bando}[${index}]: ${cantidad}`);
}

function eliminarElemento(bando, index) {
    if (!confirm('¿Está seguro de eliminar este elemento?')) {
        return;
    }

    const eliminado = fuerzas[bando].splice(index, 1);
    renderizarTabla(bando);
    calcularTotales();
    guardarDatos();

    console.log(`🗑️ Elemento eliminado de ${bando}:`, eliminado[0]);
}

// ==========================================
// PERSISTENCIA (localStorage)
// ==========================================

function guardarDatos() {
    try {
        const datos = {
            fuerzas: fuerzas,
            factores: {
                azul: obtenerFactoresGlobales('azul'),
                rojo: obtenerFactoresGlobales('rojo')
            },
            timestamp: new Date().toISOString()
        };

        localStorage.setItem('calculadorPCR_datos', JSON.stringify(datos));
        console.log('💾 Datos guardados en localStorage');
    } catch (error) {
        console.error('❌ Error guardando datos:', error);
    }
}

function cargarDatosGuardados() {
    try {
        const datosJSON = localStorage.getItem('calculadorPCR_datos');
        if (!datosJSON) return;

        const datos = JSON.parse(datosJSON);

        // Cargar fuerzas
        fuerzas = datos.fuerzas || { azul: [], rojo: [] };

        // Cargar factores (si existen)
        if (datos.factores) {
            // Azul
            if (datos.factores.azul) {
                document.getElementById('moralAzul').value = datos.factores.azul.moral;
                document.getElementById('experienciaAzul').value = datos.factores.azul.experiencia;
                document.getElementById('personalAzul').value = datos.factores.azul.personal;
                document.getElementById('oportunidadAzul').value = datos.factores.azul.oportunidad;
                document.getElementById('adaptacionAzul').value = datos.factores.azul.adaptacion;
            }

            // Rojo
            if (datos.factores.rojo) {
                document.getElementById('moralRojo').value = datos.factores.rojo.moral;
                document.getElementById('experienciaRojo').value = datos.factores.rojo.experiencia;
                document.getElementById('personalRojo').value = datos.factores.rojo.personal;
                document.getElementById('oportunidadRojo').value = datos.factores.rojo.oportunidad;
                document.getElementById('adaptacionRojo').value = datos.factores.rojo.adaptacion;
            }
        }

        // Renderizar tablas
        renderizarTabla('azul');
        renderizarTabla('rojo');

        console.log('✅ Datos cargados desde localStorage');
    } catch (error) {
        console.error('❌ Error cargando datos:', error);
    }
}

// ==========================================
// UTILIDADES
// ==========================================

function limpiarTodo() {
    if (!confirm('¿Está seguro de limpiar TODOS los datos? Esta acción no se puede deshacer.')) {
        return;
    }

    fuerzas = { azul: [], rojo: [] };

    // Resetear factores a valores por defecto
    ['Azul', 'Rojo'].forEach(bando => {
        document.getElementById(`moral${bando}`).value = 1;
        document.getElementById(`experiencia${bando}`).value = 1;
        document.getElementById(`personal${bando}`).value = 1;
        document.getElementById(`oportunidad${bando}`).value = 1;
        document.getElementById(`adaptacion${bando}`).value = 1;
    });

    renderizarTabla('azul');
    renderizarTabla('rojo');
    calcularTotales();

    localStorage.removeItem('calculadorPCR_datos');

    console.log('🗑️ Todos los datos limpiados');
    alert('Todos los datos han sido eliminados');
}

function exportarJSON() {
    const datos = {
        fuerzas: fuerzas,
        factores: {
            azul: obtenerFactoresGlobales('azul'),
            rojo: obtenerFactoresGlobales('rojo')
        },
        totales: {
            azul: parseFloat(document.getElementById('totalAzul').textContent),
            rojo: parseFloat(document.getElementById('totalRojo').textContent)
        },
        pcr: document.getElementById('pcrValor').textContent,
        ratio: document.getElementById('pcrRatio').textContent,
        timestamp: new Date().toISOString()
    };

    const json = JSON.stringify(datos, null, 2);
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);

    const a = document.createElement('a');
    a.href = url;
    a.download = `PCR_${new Date().toISOString().slice(0, 19).replace(/:/g, '-')}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    console.log('📥 Datos exportados a JSON');
    alert('Datos exportados correctamente');
}

function exportarExcel() {
    try {
        // Crear nuevo workbook
        const wb = XLSX.utils.book_new();

        // ========================================
        // HOJA 1: RESUMEN PCR
        // ========================================
        const totalAzul = parseFloat(document.getElementById('totalAzul').textContent);
        const totalRojo = parseFloat(document.getElementById('totalRojo').textContent);
        const pcrValor = document.getElementById('pcrValor').textContent;
        const pcrRatio = document.getElementById('pcrRatio').textContent;

        const resumenData = [
            ['CALCULADOR PCR - PODER DE COMBATE RELATIVO'],
            [],
            ['Fecha:', new Date().toLocaleString('es-ES')],
            [],
            ['RESULTADOS'],
            ['Total Fuerza Azul:', totalAzul],
            ['Total Fuerza Colorada:', totalRojo],
            ['PCR:', pcrValor],
            ['Interpretación:', pcrRatio],
        ];

        const wsResumen = XLSX.utils.aoa_to_sheet(resumenData);
        XLSX.utils.book_append_sheet(wb, wsResumen, 'Resumen PCR');

        // ========================================
        // HOJA 2: FUERZA AZUL
        // ========================================
        const factoresAzul = obtenerFactoresGlobales('azul');
        const azulData = [
            ['FUERZA AZUL'],
            [],
            ['FACTORES MULTIPLICADORES'],
            ['Moral:', factoresAzul.moral],
            ['Experiencia:', factoresAzul.experiencia],
            ['Personal:', factoresAzul.personal],
            ['Oportunidad:', factoresAzul.oportunidad],
            ['Adaptación:', factoresAzul.adaptacion],
            [],
            ['ELEMENTOS'],
            ['Nombre', 'Cantidad', 'VRC', 'VRC Final', 'Munición Inteligente', 'Total'],
        ];

        fuerzas.azul.forEach(elem => {
            const total = calcularTotalElemento(elem, 'azul');
            azulData.push([
                elem.nombre,
                elem.cantidad,
                elem.vrcBase,
                elem.vrc,
                elem.munInt ? 'Sí' : 'No',
                total.toFixed(2)
            ]);
        });

        azulData.push([]);
        azulData.push(['TOTAL FUERZA AZUL:', '', '', '', '', totalAzul]);

        const wsAzul = XLSX.utils.aoa_to_sheet(azulData);
        XLSX.utils.book_append_sheet(wb, wsAzul, 'Fuerza Azul');

        // ========================================
        // HOJA 3: FUERZA COLORADA
        // ========================================
        const factoresRojo = obtenerFactoresGlobales('rojo');
        const rojoData = [
            ['FUERZA COLORADA'],
            [],
            ['FACTORES MULTIPLICADORES'],
            ['Moral:', factoresRojo.moral],
            ['Experiencia:', factoresRojo.experiencia],
            ['Personal:', factoresRojo.personal],
            ['Oportunidad:', factoresRojo.oportunidad],
            ['Adaptación:', factoresRojo.adaptacion],
            [],
            ['ELEMENTOS'],
            ['Nombre', 'Cantidad', 'VRC', 'VRC Final', 'Munición Inteligente', 'Total'],
        ];

        fuerzas.rojo.forEach(elem => {
            const total = calcularTotalElemento(elem, 'rojo');
            rojoData.push([
                elem.nombre,
                elem.cantidad,
                elem.vrcBase,
                elem.vrc,
                elem.munInt ? 'Sí' : 'No',
                total.toFixed(2)
            ]);
        });

        rojoData.push([]);
        rojoData.push(['TOTAL FUERZA COLORADA:', '', '', '', '', totalRojo]);

        const wsRojo = XLSX.utils.aoa_to_sheet(rojoData);
        XLSX.utils.book_append_sheet(wb, wsRojo, 'Fuerza Colorada');

        // ========================================
        // HOJA 4: FÓRMULA Y EXPLICACIÓN
        // ========================================
        const formulaData = [
            ['CÁLCULO DEL PODER DE COMBATE RELATIVO (PCR)'],
            [],
            ['FÓRMULA:'],
            ['Total Elemento = Cantidad × VRC × Moral × Experiencia × Personal × Oportunidad × Adaptación'],
            [],
            ['Total Fuerza = Suma de todos los elementos'],
            [],
            ['PCR = Total Fuerza Azul / Total Fuerza Colorada'],
            [],
            ['INTERPRETACIÓN:'],
            ['PCR ≥ 3.0', 'SUPERIORIDAD AZUL'],
            ['PCR ≥ 1.5', 'Ventaja Significativa Azul'],
            ['PCR ≥ 1.2', 'Ventaja Moderada Azul'],
            ['0.83 < PCR < 1.2', 'FUERZAS EQUILIBRADAS'],
            ['PCR ≤ 0.83', 'Ventaja Moderada Colorada'],
            ['PCR ≤ 0.67', 'Ventaja Significativa Colorada'],
            ['PCR ≤ 0.33', 'SUPERIORIDAD COLORADA'],
        ];

        const wsFormula = XLSX.utils.aoa_to_sheet(formulaData);
        XLSX.utils.book_append_sheet(wb, wsFormula, 'Fórmula');

        // Generar archivo
        const timestamp = new Date().toISOString().slice(0, 19).replace(/:/g, '-');
        XLSX.writeFile(wb, `PCR_${timestamp}.xlsx`);

        console.log('📊 Datos exportados a Excel');
        alert('Archivo Excel exportado correctamente');

    } catch (error) {
        console.error('❌ Error exportando a Excel:', error);
        alert('Error al exportar a Excel: ' + error.message);
    }
}

function exportarPDF() {
    try {
        const { jsPDF } = window.jspdf;
        const doc = new jsPDF();

        const totalAzul = parseFloat(document.getElementById('totalAzul').textContent);
        const totalRojo = parseFloat(document.getElementById('totalRojo').textContent);
        const pcrValor = document.getElementById('pcrValor').textContent;
        const pcrRatio = document.getElementById('pcrRatio').textContent;

        let y = 20;

        // Título
        doc.setFontSize(18);
        doc.setFont(undefined, 'bold');
        doc.text('CALCULADOR PCR', 105, y, { align: 'center' });
        y += 8;
        doc.setFontSize(14);
        doc.text('Poder de Combate Relativo', 105, y, { align: 'center' });
        y += 15;

        // Fecha
        doc.setFontSize(10);
        doc.setFont(undefined, 'normal');
        doc.text(`Fecha: ${new Date().toLocaleString('es-ES')}`, 20, y);
        y += 15;

        // ========================================
        // RESULTADOS PCR
        // ========================================
        doc.setFontSize(14);
        doc.setFont(undefined, 'bold');
        doc.text('RESULTADOS', 20, y);
        y += 8;

        doc.setFontSize(11);
        doc.setFont(undefined, 'normal');
        doc.text(`PCR: ${pcrValor}`, 20, y);
        y += 6;
        doc.text(`Total Fuerza Azul: ${totalAzul}`, 20, y);
        y += 6;
        doc.text(`Total Fuerza Colorada: ${totalRojo}`, 20, y);
        y += 6;
        doc.setFont(undefined, 'bold');
        doc.text(`Interpretación: ${pcrRatio}`, 20, y);
        y += 12;

        // ========================================
        // FUERZA AZUL
        // ========================================
        doc.setFontSize(14);
        doc.text('FUERZA AZUL', 20, y);
        y += 8;

        const factoresAzul = obtenerFactoresGlobales('azul');
        doc.setFontSize(10);
        doc.setFont(undefined, 'normal');
        doc.text('Factores:', 20, y);
        y += 5;
        doc.text(`  Moral: ${factoresAzul.moral} | Experiencia: ${factoresAzul.experiencia} | Personal: ${factoresAzul.personal}`, 20, y);
        y += 5;
        doc.text(`  Oportunidad: ${factoresAzul.oportunidad} | Adaptación: ${factoresAzul.adaptacion}`, 20, y);
        y += 8;

        doc.setFont(undefined, 'bold');
        doc.text('Elementos:', 20, y);
        y += 5;

        doc.setFont(undefined, 'normal');
        fuerzas.azul.forEach((elem, index) => {
            if (y > 270) {
                doc.addPage();
                y = 20;
            }
            const total = calcularTotalElemento(elem, 'azul');
            const munInt = elem.munInt ? ' (Mun. Int. x1.5)' : '';
            doc.text(`  ${index + 1}. ${elem.nombre}${munInt}`, 20, y);
            y += 5;
            doc.text(`     Cantidad: ${elem.cantidad} | VRC: ${elem.vrc} | Total: ${total.toFixed(2)}`, 20, y);
            y += 6;
        });

        y += 5;
        doc.setFont(undefined, 'bold');
        doc.text(`TOTAL FUERZA AZUL: ${totalAzul}`, 20, y);
        y += 15;

        // ========================================
        // FUERZA COLORADA
        // ========================================
        if (y > 220) {
            doc.addPage();
            y = 20;
        }

        doc.setFontSize(14);
        doc.text('FUERZA COLORADA', 20, y);
        y += 8;

        const factoresRojo = obtenerFactoresGlobales('rojo');
        doc.setFontSize(10);
        doc.setFont(undefined, 'normal');
        doc.text('Factores:', 20, y);
        y += 5;
        doc.text(`  Moral: ${factoresRojo.moral} | Experiencia: ${factoresRojo.experiencia} | Personal: ${factoresRojo.personal}`, 20, y);
        y += 5;
        doc.text(`  Oportunidad: ${factoresRojo.oportunidad} | Adaptación: ${factoresRojo.adaptacion}`, 20, y);
        y += 8;

        doc.setFont(undefined, 'bold');
        doc.text('Elementos:', 20, y);
        y += 5;

        doc.setFont(undefined, 'normal');
        fuerzas.rojo.forEach((elem, index) => {
            if (y > 270) {
                doc.addPage();
                y = 20;
            }
            const total = calcularTotalElemento(elem, 'rojo');
            const munInt = elem.munInt ? ' (Mun. Int. x1.5)' : '';
            doc.text(`  ${index + 1}. ${elem.nombre}${munInt}`, 20, y);
            y += 5;
            doc.text(`     Cantidad: ${elem.cantidad} | VRC: ${elem.vrc} | Total: ${total.toFixed(2)}`, 20, y);
            y += 6;
        });

        y += 5;
        doc.setFont(undefined, 'bold');
        doc.text(`TOTAL FUERZA COLORADA: ${totalRojo}`, 20, y);

        // ========================================
        // FÓRMULA (Nueva página)
        // ========================================
        doc.addPage();
        y = 20;

        doc.setFontSize(14);
        doc.text('FÓRMULA DE CÁLCULO', 20, y);
        y += 10;

        doc.setFontSize(10);
        doc.setFont(undefined, 'normal');
        doc.text('Total Elemento = Cantidad × VRC × Moral × Experiencia ×', 20, y);
        y += 5;
        doc.text('                 Personal × Oportunidad × Adaptación', 20, y);
        y += 8;
        doc.text('Total Fuerza = Suma de todos los elementos', 20, y);
        y += 8;
        doc.setFont(undefined, 'bold');
        doc.text('PCR = Total Fuerza Azul / Total Fuerza Colorada', 20, y);
        y += 15;

        doc.setFontSize(12);
        doc.text('INTERPRETACIÓN:', 20, y);
        y += 8;

        doc.setFontSize(10);
        doc.setFont(undefined, 'normal');
        const interpretaciones = [
            'PCR ≥ 3.0       → SUPERIORIDAD AZUL',
            'PCR ≥ 1.5       → Ventaja Significativa Azul',
            'PCR ≥ 1.2       → Ventaja Moderada Azul',
            '0.83 < PCR < 1.2 → FUERZAS EQUILIBRADAS',
            'PCR ≤ 0.83      → Ventaja Moderada Colorada',
            'PCR ≤ 0.67      → Ventaja Significativa Colorada',
            'PCR ≤ 0.33      → SUPERIORIDAD COLORADA',
        ];

        interpretaciones.forEach(interp => {
            doc.text(interp, 20, y);
            y += 6;
        });

        // Guardar PDF
        const timestamp = new Date().toISOString().slice(0, 19).replace(/:/g, '-');
        doc.save(`PCR_${timestamp}.pdf`);

        console.log('📄 Datos exportados a PDF');
        alert('Archivo PDF exportado correctamente');

    } catch (error) {
        console.error('❌ Error exportando a PDF:', error);
        alert('Error al exportar a PDF: ' + error.message);
    }
}

// Exponer funciones globalmente
window.mostrarModalAgregar = mostrarModalAgregar;
window.cargarEquipamiento = cargarEquipamiento;
window.mostrarInfoEquipamiento = mostrarInfoEquipamiento;
window.agregarElemento = agregarElemento;
window.actualizarCantidad = actualizarCantidad;
window.eliminarElemento = eliminarElemento;
window.calcularTotales = calcularTotales;
window.limpiarTodo = limpiarTodo;
window.exportarJSON = exportarJSON;
window.exportarExcel = exportarExcel;
window.exportarPDF = exportarPDF;

console.log('📦 Calculador PCR cargado correctamente');
