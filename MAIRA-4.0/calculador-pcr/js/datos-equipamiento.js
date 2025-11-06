/**
 * BASE DE DATOS DE EQUIPAMIENTO MILITAR
 * Extraído de Tabla Poder Combate Relativo.xlsx
 *
 * VRC = Valor Relativo de Combate (valor base)
 */

const EQUIPAMIENTO = {
    // ==========================================
    // ELEMENTOS DE MANIOBRA
    // ==========================================
    maniobra: [
        { id: 'ca_i_m_pie', nombre: 'Ca I M (a pie)', vrc: 0.25, obs: 'A 4 secciones' },
        { id: 'ca_i_m_montada', nombre: 'Ca I M (montada)', vrc: 0.33, obs: 'Ídem anterior' },
        { id: 'ca_i_mte', nombre: 'Ca I Mte', vrc: 0.33, obs: 'Ídem anterior' },
        { id: 'ca_asal_ae', nombre: 'Ca Asal Ae', vrc: 0.45, obs: 'Ídem anterior' },
        { id: 'ca_i_para', nombre: 'Ca I Para', vrc: 0.45, obs: 'Ídem anterior' },
        { id: 'ca_i_mot_veh', nombre: 'Ca I Mot (Veh Rda s/blindaje)', vrc: 0.4, obs: 'Ídem anterior' },
        { id: 'ca_i_mec_rda', nombre: 'Ca I Mec Rda 6x6', vrc: 0.5, obs: 'A 13 vehículos, 4 secciones x 3 VC c/u' },
        { id: 'ca_i_mec_m113_12', nombre: 'Ca I Mec (M113 Amet 12.7mm)', vrc: 0.6, obs: 'Ídem anterior' },
        { id: 'ca_i_mec_m113_20', nombre: 'Ca I Mec (M113 c/Cñ 20mm/AIFV)', vrc: 0.7, obs: 'Ídem anterior' },
        { id: 'ca_i_mec_vctp', nombre: 'Ca I Mec (VCTP)', vrc: 1, obs: 'Ídem anterior' },
        { id: 'ca_i_mec_marder', nombre: 'Ca I Mec (Marder 1 A3)', vrc: 1.2, obs: 'Ídem anterior' },
        { id: 'ca_i_mec_guarani_7', nombre: 'Ca I Mec (Guaraní 6x6 – Amet 7.62mm)', vrc: 0.7, obs: 'Ídem anterior' },
        { id: 'ca_i_mec_guarani_12', nombre: 'CA I Mec (Guaraní 6x6 – Amet 12.7mm)', vrc: 0.75, obs: 'Ídem anterior' },
        { id: 'ca_i_mec_pirana_12', nombre: 'Ca I Mec (Mowag Piraña 6x6 – Amet 12.7)', vrc: 0.85, obs: 'Ídem anterior' },
        { id: 'ca_i_mec_pirana_25', nombre: 'Ca I Mec (Mowag Piraña 6x6 – Cñ 25mm)', vrc: 0.9, obs: 'Ídem anterior' },
        { id: 'esc_c_montado', nombre: 'Esc C (montado)', vrc: 0.4, obs: 'A 4 secciones' },
        { id: 'esc_tan_sk105', nombre: 'Esc Tan (SK 105)', vrc: 1.8, obs: 'A 13 vehículos, 4 secciones x 3 VC c/u' },
        { id: 'esc_tan_tam', nombre: 'Esc Tan (TAM)', vrc: 2, obs: 'Ídem anterior' },
        { id: 'esc_tan_tam2c', nombre: 'Esc Tan (TAM 2 C)', vrc: 2.5, obs: 'Ídem anterior' },
        { id: 'esc_tan_tam2ip', nombre: 'Esc Tan (TAM 2IP)', vrc: 3, obs: 'Ídem anterior' },
        { id: 'esc_tan_leopard1', nombre: 'Esc Tan (LEOPARD 1)', vrc: 2, obs: 'Ídem anterior' },
        { id: 'esc_tan_leopard2', nombre: 'Esc Tan (LEOPARD 2)', vrc: 2.5, obs: 'Ídem anterior' },
        { id: 'esc_tan_leopard2a4', nombre: 'Esc Tan (LEOPARD 2 A4)', vrc: 3, obs: 'Ídem anterior' },
        { id: 'esc_tan_panhard', nombre: 'Esc Tan (PANHARD)', vrc: 1.2, obs: 'Ídem anterior' },
        { id: 'esc_tan_amx30', nombre: 'Esc Tan (AMX 30)', vrc: 1.5, obs: 'Ídem anterior' },
        { id: 'esc_tan_cascavel', nombre: 'Esc Tan (Cascavel)', vrc: 1.2, obs: 'Ídem anterior' },
        { id: 'esc_expl_hummer_12', nombre: 'Esc Expl (Hummer c/Amet 12.7mm)', vrc: 0.5, obs: '2 Secciones Pesadas + 1 Sec Liv' },
        { id: 'esc_expl_hummer_7', nombre: 'Esc Expl (Hummer c/Amet 7.62mm)', vrc: 0.45, obs: '' },
        { id: 'esc_expl_guarani_cascavel', nombre: 'Esc Expl (Guaraní + 1 Sec Pes Cascavel)', vrc: 1.1, obs: '' },
        { id: 'esc_expl_guarani_12', nombre: 'Esc Expl (Guaraní – Amet 12.7mm)', vrc: 0.9, obs: '' },
        { id: 'sec_expl_cascavel', nombre: 'Sec Expl (Cascavel EE9 Cñ 90mm)', vrc: 1.25, obs: '' },
        { id: 'sec_expl_moto', nombre: 'Sec Expl Moto TT', vrc: 0.1, obs: '' },
        { id: 'sec_av_ej_expl', nombre: 'Sec Av Ej (Expl)', vrc: 1, obs: '' }
    ],

    // ==========================================
    // ELEMENTOS DE APOYO DE FUEGO
    // ==========================================
    apoyoFuego: [
        { id: 'ga_bl_155_palmaria', nombre: 'GA Bl Cal 155mm (Palmaria)', vrc: 4, obs: '4 baterías', munInteligente: true },
        { id: 'ga_mec_105', nombre: 'GA Mec Cal 105mm (M101 A1)', vrc: 3.5, obs: '4 baterías', munInteligente: true },
        { id: 'ga_155_citer', nombre: 'GA Cal 155mm (CITER)', vrc: 3, obs: '4 baterías', munInteligente: true },
        { id: 'ga_bl_155', nombre: 'GA Bl Cal 155mm', vrc: 3.5, obs: '4 baterías', munInteligente: true },
        { id: 'ga_remol_155', nombre: 'GA Remol Cal 155mm', vrc: 3, obs: '4 baterías', munInteligente: true },
        { id: 'ga_105_otto', nombre: 'GA Cal 105mm (Otto Melara)', vrc: 2.5, obs: '4 baterías', munInteligente: true },
        { id: 'ba_pp_155_palmaria', nombre: 'Ba PP Cal 155 (Palmaria)', vrc: 1, obs: '', munInteligente: true },
        { id: 'ba_pp_155', nombre: 'Ba PP Cal 155mm', vrc: 0.9, obs: '', munInteligente: true },
        { id: 'ba_155_citer', nombre: 'Ba Cal 155mm (CITER-SOFMA)', vrc: 0.75, obs: '', munInteligente: true },
        { id: 'sec_mor_120_vctm', nombre: 'Sec Mor Pes Cal 120mm (VCTM/M107/Piraña)', vrc: 0.5, obs: '4 piezas' },
        { id: 'sec_mor_120_remol', nombre: 'Sec Mor Pes Cal 120mm remolcado', vrc: 0.4, obs: '4 piezas' },
        { id: 'ba_liv_105_m101', nombre: 'Ba Liv Cal 105mm (M 101)', vrc: 0.8, obs: '', munInteligente: true },
        { id: 'ba_105_otto', nombre: 'Ba Cal 105mm (Otto Melara)', vrc: 0.625, obs: '', munInteligente: true },
        { id: 'ba_m101_105', nombre: 'Ba M101 Cal 105mm', vrc: 0.75, obs: '', munInteligente: true },
        { id: 'ba_pp_m7_105', nombre: 'Ba PP M-7 Cal 105mm', vrc: 0.75, obs: '', munInteligente: true },
        { id: 'ba_pp_m108_105', nombre: 'Ba PP M-108 Cal 105mm', vrc: 0.8, obs: '', munInteligente: true },
        { id: 'ba_slam_105_pampero', nombre: 'Ba SLAM Cal 105mm (PAMPERO)', vrc: 1, obs: '4 lanzadores' },
        { id: 'ba_slam_155', nombre: 'Ba SLAM Cal 155mm', vrc: 1.2, obs: '4 lanzadores' },
        { id: 'ba_slam_70_yarara', nombre: 'Ba SLAM YARARÁ Cal 70mm', vrc: 0.7, obs: '4 lanzadores' },
        { id: 'ba_slam_m108r', nombre: 'Ba SLAM M-108 R', vrc: 1.2, obs: '4 lanzadores' },
        { id: 'ba_slam_127_sapba', nombre: 'Ba SLAM SAPBA Cal 127mm', vrc: 2, obs: '4 lanzadores' },
        { id: 'ba_slam_240_bm24', nombre: 'Ba SLAM BM 24 Cal 240mm', vrc: 2.75, obs: '4 lanzadores' },
        { id: 'ba_slam_160', nombre: 'Ba SLAM Cal 160mm', vrc: 2.5, obs: '4 lanzadores' },
        { id: 'ba_slam_306', nombre: 'Ba SLAM Cal 306mm', vrc: 3, obs: '4 lanzadores' },
        { id: 'babac', nombre: 'BABAC', vrc: 2, obs: '' },
        { id: 'radar_3km', nombre: 'Grupo Radar terrestre 3 km', vrc: 0.1, obs: '3 radares' },
        { id: 'radar_12km', nombre: 'Grupo Radar terrestre 12 km', vrc: 0.3, obs: '3 radares' },
        { id: 'radar_30km', nombre: 'Grupo Radar terrestre 30 km', vrc: 0.4, obs: '3 radares' },
        { id: 'radar_80km', nombre: 'Grupo Radar terrestre 80 km', vrc: 0.6, obs: '3 radares' },
        { id: 'helic_atq_misil', nombre: 'Esc Helic Atq (con misil)', vrc: 3, obs: '' },
        { id: 'ca_atan_hilog', nombre: 'Ca Atan Misil Hiloguiado', vrc: 2.75, obs: '3 sec x 3 grupos lanzadores' },
        { id: 'ca_atan_intel', nombre: 'Ca Atan Misil inteligente', vrc: 3, obs: '3 sec x 3 grupos lanzadores' },
        { id: 'sec_ada_stinger', nombre: 'Sec ADA Mis Stinger', vrc: 1.2, obs: '3 lanzadores' },
        { id: 'sec_ada_mistral', nombre: 'Sec ADA Mis Mistral', vrc: 1.2, obs: '3 lanzadores' },
        { id: 'bada_35mm', nombre: 'BADA Cal 35mm', vrc: 0.8, obs: '4 sec x 3 piezas' },
        { id: 'bada_40mm', nombre: 'BADA Cal 40mm', vrc: 0.9, obs: '4 sec x 3 piezas' },
        { id: 'bada_mis', nombre: 'BADA Mis', vrc: 4.8, obs: '4 sec x 3 lanzadores' },
        { id: 'bada_20mm', nombre: 'BADA Cal 20mm', vrc: 0.7, obs: '4 sec x 3 piezas' },
        { id: 'esc_ae_2sec', nombre: 'Esc AE 2 Sec x 2 Helo c/u', vrc: 5, obs: '1 Sec Atq + 1 Sec Expl' },
        { id: 'sec_av_ej_atq', nombre: 'Sec Av Ej (Atq)', vrc: 2.5, obs: '4 Helo' },
        { id: 'ca_atan_spike_lr1', nombre: 'Ca ATan - Misil Spike LR1', vrc: 2.75, obs: '3 Sec x 2 lanzadores' },
        { id: 'ca_atan_spike_lr2', nombre: 'Ca ATan - Misil Spike LR2', vrc: 3.5, obs: '3 Sec x 2 lanzadores' },
        { id: 'ca_atan_tow2a', nombre: 'Ca Atan - Misil TOW 2A', vrc: 3, obs: '3 Sec x 2 lanzadores' },
        { id: 'sec_atan_cohetes', nombre: 'Sec ATan (Lanzacohetes)', vrc: 0.8, obs: '3 Lanzadores' },
        { id: 'sec_ant_hermes450', nombre: 'Sec ANT Hermes 450', vrc: 2.5, obs: '4 ANT - Atq, Expl y Vig' },
        { id: 'sec_ant_hermes900', nombre: 'Sec ANT Hermes 900', vrc: 3, obs: '4 ANT - Misil + bombas' },
        { id: 'sec_ant_clase1', nombre: 'Sec ANT (Clase I) Drones', vrc: 0.5, obs: '4 ANT sin armamento' }
    ],

    // ==========================================
    // ELEMENTOS DE INGENIEROS
    // ==========================================
    ingenieros: [
        { id: 'b_ing_liv', nombre: 'B Ing Liv', vrc: 3, obs: '4 Ca Ing Comb + 1 Ca Ing Franq' },
        { id: 'b_ing_bl_mec', nombre: 'B Ing Bl/Mec', vrc: 4, obs: '4 Ca Ing Comb Mec + 1 Ca Ing Franq' },
        { id: 'ca_ing_pes', nombre: 'Ca Ing Pes', vrc: 2, obs: 'A 4 Secciones' },
        { id: 'ca_ing_buzos', nombre: 'Ca Ing Buzos', vrc: 2, obs: 'A 4 Secciones' },
        { id: 'ca_ing_comb', nombre: 'Ca Ing Comb', vrc: 1, obs: 'A 4 Secciones' },
        { id: 'ca_ing_franq', nombre: 'Ca Ing Franq', vrc: 1.5, obs: 'A 4 Secciones' },
        { id: 'ca_ing_pte_flot_m4', nombre: 'Ca Ing Pte Flot (M4 T6)', vrc: 1, obs: '' },
        { id: 'ca_ing_pte_flot_tijera', nombre: 'Ca Ing Pte Flot (Lanz Tijera)', vrc: 0.5, obs: '' },
        { id: 'ca_ing_pte_pnl_bailey', nombre: 'Ca Ing Pte Pnl (Bailey)', vrc: 1, obs: '' }
    ],

    // ==========================================
    // ELEMENTOS DE COMUNICACIONES Y GE
    // ==========================================
    comunicaciones: [
        { id: 'ca_com_s', nombre: 'Ca Com (s)', vrc: 1.5, obs: '1 Sec CCIP + CCIS + Enl + Telecom + Seg' },
        { id: 'sec_ge_hf', nombre: 'Sec GE (HF)', vrc: 3, obs: 'Nivel GUB y GUC' },
        { id: 'sec_ge_vhf', nombre: 'Sec GE (VHF)', vrc: 2.5, obs: 'Nivel Unidad y Subunidad' }
    ],

    // ==========================================
    // ELEMENTOS DE TOE
    // ==========================================
    toe: [
        { id: 'ca_cdo_s', nombre: 'Ca Cdo (s)', vrc: 2, obs: '' },
        { id: 'ca_caz_s_mte', nombre: 'Ca Caz (s) Mte', vrc: 1, obs: 'Fuera de AG vale 0.60' },
        { id: 'ca_caz_s_m', nombre: 'Ca Caz (s) M', vrc: 1, obs: 'Fuera de AG vale 0.60' }
    ]
};

// ==========================================
// FACTORES MULTIPLICADORES
// ==========================================

const FACTORES = {
    // MORAL (1)
    moral: [
        { id: 'muy_alta', nombre: 'Muy Alta', valor: 2 },
        { id: 'alta', nombre: 'Alta', valor: 1.5 },
        { id: 'normal', nombre: 'Normal', valor: 1 },
        { id: 'baja', nombre: 'Baja', valor: 0.5 },
        { id: 'muy_baja', nombre: 'Muy Baja', valor: 0.2 }
    ],

    // EXPERIENCIA (2)
    experiencia: [
        { id: 'comb_mov', nombre: 'Exp de Combate Ofensivo', valor: 1 },
        { id: 'comb_def', nombre: 'Exp de Combate Defensivo', valor: 0.5 },
        { id: 'sin_exp', nombre: 'Sin Experiencia en Combate', valor: 0.1 }
    ],

    // PERSONAL (3)
    personal: [
        { id: 'prof_100', nombre: 'Tropa Profesional 100%', valor: 1 },
        { id: 'perm_75', nombre: '75% permanente, 25% movilizado', valor: 0.75 },
        { id: 'perm_50', nombre: '50% permanente, 50% movilizado', valor: 0.5 },
        { id: 'conscripta', nombre: 'Tropa Conscripta', valor: 0.5 },
        { id: 'conscripta_2', nombre: 'Conscripta 2 años servicio', valor: 0.375 },
        { id: 'movil_100', nombre: 'Unidad 100% movilizada', valor: 0.1 }
    ],

    // OPORTUNIDAD (4) - Visibilidad
    oportunidad: [
        { id: 'diurno', nombre: 'Diurno', valor: 1 },
        { id: 'diurno_baja', nombre: 'Diurno con baja visibilidad', valor: 0.5 },
        { id: 'noct_sin_cap', nombre: 'Nocturno sin capacidad', valor: 0.25 },
        { id: 'noct_instr', nombre: 'Nocturno con instrucción', valor: 0.5 },
        { id: 'noct_ampli', nombre: 'Nocturno + amplificador luz', valor: 0.75 },
        { id: 'noct_termica', nombre: 'Nocturno + visión térmica', valor: 1 }
    ],

    // ADAPTACIÓN (5) - Terreno
    terreno: [
        { id: 'llanura', nombre: 'Llanura', valores: { si: 1, no: 0.9 } },
        { id: 'monte', nombre: 'Monte', valores: { si: 1, no: 0.5 } },
        { id: 'alta_montana', nombre: 'Alta Montaña', valores: { si: 1, no: 0.1 } },
        { id: 'media_montana', nombre: 'Media Montaña', valores: { si: 1, no: 0.25 } },
        { id: 'baja_montana', nombre: 'Baja Montaña', valores: { si: 1, no: 0.5 } },
        { id: 'desierto', nombre: 'Desierto', valores: { si: 1, no: 0.8 } },
        { id: 'urbano', nombre: 'Urbano', valores: { si: 1, no: 0.3 } }
    ],

    // ADAPTACIÓN (5) - Clima
    clima: [
        { id: 'altas_lat', nombre: 'Altas latitudes', matriz: [1, 0.9, 0.9, 0.75, 0.5, 0.25, 0.1] },
        { id: 'frio_humedo', nombre: 'Frío húmedo', matriz: [0.9, 1, 0.9, 0.75, 0.5, 0.3, 0.2] },
        { id: 'frio', nombre: 'Frío', matriz: [0.8, 0.9, 1, 0.8, 0.6, 0.4, 0.3] },
        { id: 'templado', nombre: 'Templado', matriz: [0.75, 0.8, 0.9, 1, 0.75, 0.5, 0.7] },
        { id: 'subtropical_seco', nombre: 'Subtropical seco', matriz: [0.5, 0.6, 0.7, 0.9, 1, 0.9, 0.8] },
        { id: 'subtropical_humedo', nombre: 'Subtropical húmedo', matriz: [0.3, 0.4, 0.5, 0.75, 0.9, 1, 0.9] },
        { id: 'tropical', nombre: 'Tropical', matriz: [0.1, 0.2, 0.3, 0.5, 0.8, 0.9, 1] }
    ]
};

// Exportar para uso en calculador.js
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { EQUIPAMIENTO, FACTORES };
}
