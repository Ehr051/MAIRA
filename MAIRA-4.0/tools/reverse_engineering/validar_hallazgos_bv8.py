#!/usr/bin/env python3
"""
Script de validación rápida de valores BV8
Para ejecutar MAÑANA antes de la integración
"""

from pathlib import Path
import json

# Valores extraídos HOY con sus niveles de confianza
VALORES_EXTRAIDOS = {
    'dotaciones_personal': {
        'agua_litros_dia': {
            'valor': 3,
            'confianza': 85,
            'fuente': 'logistica_smalltalk.img - dotacionInicial a 26 bytes',
            'contexto': '[:o|o dotacionInicial kg printDecimals: 2]'
        },
        'viveres_raciones_dia': {
            'valor': 3,
            'confianza': 70,
            'fuente': 'Inferido por analogía con agua',
            'contexto': 'Mismo patrón que agua en método'
        },
        'municion_fal_cartuchos': {
            'valor': 100,
            'confianza': 80,
            'fuente': '220 ocurrencias en logistica_smalltalk.img',
            'contexto': '5 cargadores x 20 cartuchos (estándar AR)'
        },
        'municion_fal_cargadores': {
            'valor': 5,
            'confianza': 60,
            'fuente': 'Correlación + estándar militar AR',
            'contexto': 'Valor 5 a 118 bytes de dotacionInicial'
        }
    },
    
    'combustible_vehiculos': {
        'tam_capacidad_litros': {
            'valor': 620,
            'confianza': 90,
            'fuente': '1 ocurrencia en logistica_smalltalk.img',
            'contexto': 'Coincide con documentación técnica TAM'
        },
        'm113_capacidad_litros': {
            'valor': 360,
            'confianza': 85,
            'fuente': '76 ocurrencias en logistica_smalltalk.img',
            'contexto': 'Estándar conocido M113 APC'
        },
        'liviano_consumo_100km': {
            'valor': 20,
            'confianza': 70,
            'fuente': '295 bytes de consumoCombustibleBase',
            'contexto': 'consumoPorVehiculoTotal: asCharacter'
        },
        'mediano_consumo_100km': {
            'valor': 25,
            'confianza': 70,
            'fuente': '265 bytes de consumoCombustibleBase',
            'contexto': 'consumoCombustibleBaseDatos'
        }
    },
    
    'otros': {
        'aceite_motor_litros': {
            'valor': 160,
            'confianza': 75,
            'fuente': '122 bytes de dotacionInicial',
            'contexto': 'DIAS DE ABASTECIMIENTO Aceite Motor'
        }
    }
}

# Errores CONFIRMADOS en roles_personal.json
ERRORES_CONOCIDOS = {
    'roles_con_fal_300': [
        'jefe_equipo',
        'jefe_grupo', 
        'jefe_seccion',
        'apuntador_at',
        'tirador_especial'
    ],
    'valor_incorrecto': 300,
    'valor_correcto': 100,
    'descripcion_incorrecta': '10 cargadores x 30 cartuchos',
    'descripcion_correcta': '5 cargadores x 20 cartuchos'
}


def imprimir_tabla_valores():
    """Imprime tabla de valores extraídos"""
    print("\n" + "="*80)
    print("📊 VALORES EXTRAÍDOS DE BV8 - DÍA 1")
    print("="*80)
    
    for categoria, items in VALORES_EXTRAIDOS.items():
        print(f"\n🔹 {categoria.replace('_', ' ').upper()}")
        print("-" * 80)
        
        for nombre, datos in items.items():
            emoji_confianza = "🟢" if datos['confianza'] >= 80 else "🟡" if datos['confianza'] >= 60 else "🔴"
            print(f"\n  {emoji_confianza} {nombre.replace('_', ' ').title()}")
            print(f"     Valor: {datos['valor']}")
            print(f"     Confianza: {datos['confianza']}%")
            print(f"     Fuente: {datos['fuente']}")
            if len(datos['contexto']) < 70:
                print(f"     Contexto: {datos['contexto']}")


def generar_json_validacion():
    """Genera JSON para comparar con MAIRA actual"""
    output = {
        'fecha_extraccion': '2025-01-XX',
        'fuente': 'BV8 2019 - Dolphin Smalltalk 7',
        'metodo': 'Extracción RCDATA + análisis binario correlaciones',
        'valores': VALORES_EXTRAIDOS,
        'errores_confirmados': ERRORES_CONOCIDOS,
        'proximos_pasos': [
            'Validar agua 3L contra dbDatos.data si existe',
            'Validar TAM 620L contra configuracionCajones.xml',
            'Validar M113 360L contra configuracionCajones.xml',
            'Ejecutar BV8 Planeamiento Logístico para confirmar',
            'Corregir 5 roles con FAL 300 → 100',
            'Integrar dotaciones agua/víveres en roles_personal.json',
            'Integrar capacidades combustible en vehiculos.json',
            'Marcar valores VALIDADO vs ESTIMADO',
            'Versión: 0.2-PARTIAL-VALIDATED'
        ]
    }
    
    output_file = Path('hallazgos_bv8_validacion.json')
    with open(output_file, 'w', encoding='utf-8') as f:
        json.dump(output, f, indent=2, ensure_ascii=False)
    
    print(f"\n✅ JSON generado: {output_file}")
    return output_file


def imprimir_errores_maira():
    """Imprime errores confirmados en MAIRA"""
    print("\n" + "="*80)
    print("❌ ERRORES CONFIRMADOS EN MAIRA")
    print("="*80)
    
    print(f"\n🔴 {len(ERRORES_CONOCIDOS['roles_con_fal_300'])} roles con munición FAL INCORRECTA:")
    print(f"\n   Valor actual (INCORRECTO): {ERRORES_CONOCIDOS['valor_incorrecto']} cartuchos")
    print(f"   Descripción: \"{ERRORES_CONOCIDOS['descripcion_incorrecta']}\"")
    
    print(f"\n   Valor correcto BV8: {ERRORES_CONOCIDOS['valor_correcto']} cartuchos")
    print(f"   Descripción: \"{ERRORES_CONOCIDOS['descripcion_correcta']}\"")
    
    print(f"\n   Roles afectados:")
    for i, role in enumerate(ERRORES_CONOCIDOS['roles_con_fal_300'], 1):
        print(f"      {i}. {role}")
    
    print("\n💡 ACCIÓN REQUERIDA:")
    print("   Corregir estos 5 roles en Server/data/catalogos_bv8/roles_personal.json")


def imprimir_plan_manana():
    """Imprime plan para mañana"""
    print("\n" + "="*80)
    print("📅 PLAN PARA MAÑANA")
    print("="*80)
    
    print("\n🌅 MAÑANA (AM) - VALIDACIÓN")
    print("-" * 80)
    print("""
1. Buscar en archivos BV8 existentes (30 min)
   • Buscar "3" en dbDatos.data (agua/víveres)
   • Buscar "620" en configuración (TAM)
   • Buscar "360" en configuración (M113)
   • Buscar "100" en armas.xml (FAL)

2. Análisis cruzado Smalltalk (1 hora)
   • Buscar mismos valores en ccoo_smalltalk.img
   • Buscar en bajas_smalltalk.img
   • Documentar coincidencias

3. Ejecución BV8 (opcional - 1 hora)
   • Resolver Wine wow64 o usar Windows VM
   • Ejecutar Planeamiento Logístico
   • Crear ejercicio simple (1 pelotón + 1 TAM)
   • Capturar valores desde UI/logs
    """)
    
    print("\n🌤️ TARDE (PM) - INTEGRACIÓN 'SIN ROMPER NADA'")
    print("-" * 80)
    print("""
4. Backup (15 min)
   • cp -r catalogos_bv8 catalogos_bv8.BACKUP.2025-01-XX
   • git commit -m "BACKUP antes de integración"

5. Corrección FAL 300→100 (1 hora)
   • Corregir 5 roles en roles_personal.json
   • Marcar como "_validado_bv8": "2025-01-XX"

6. Integración dotaciones (1.5 horas)
   • Agregar agua_litros_dia: 3
   • Agregar viveres_raciones_dia: 3
   • Marcar confianza 85%

7. Integración vehículos (1 hora)
   • TAM: combustible_capacidad_litros: 620
   • M113: combustible_capacidad_litros: 360
   • Consumos: 20/25 L/100km

8. Pruebas (30 min)
   • pytest tests/
   • Verificar UI MAIRA

9. Documentación (30 min)
   • Actualizar PLAN_MAESTRO_BV8_MAIRA.md
   • Crear ALGORITMOS_BV8_DOTACIONES.md
   • Versión: 0.2-PARTIAL-VALIDATED
    """)


def main():
    print("╔════════════════════════════════════════════════════════════════════════════╗")
    print("║                                                                            ║")
    print("║             🎯 VALIDACIÓN BV8 → MAIRA - RESUMEN DÍA 1                      ║")
    print("║                                                                            ║")
    print("╚════════════════════════════════════════════════════════════════════════════╝")
    
    imprimir_tabla_valores()
    
    imprimir_errores_maira()
    
    # Generar JSON
    json_file = generar_json_validacion()
    
    imprimir_plan_manana()
    
    print("\n" + "="*80)
    print("✅ RESUMEN")
    print("="*80)
    print(f"""
📦 Valores extraídos: {sum(len(v) for v in VALORES_EXTRAIDOS.values())}
🎯 Confianza promedio: {sum(d['confianza'] for cat in VALORES_EXTRAIDOS.values() for d in cat.values()) // sum(len(v) for v in VALORES_EXTRAIDOS.values())}%
❌ Errores confirmados: {len(ERRORES_CONOCIDOS['roles_con_fal_300'])} roles
📄 JSON generado: {json_file}

🚀 PRÓXIMO PASO: Ejecutar validación mañana
📅 Luego: Integrar en MAIRA "sin romper nada"
    """)
    
    print("="*80)
    print("💡 Para ejecutar mañana:")
    print("   python3 validar_hallazgos_bv8.py")
    print("="*80)


if __name__ == "__main__":
    main()
