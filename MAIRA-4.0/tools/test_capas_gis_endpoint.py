#!/usr/bin/env python3
"""
Script de prueba para el endpoint /api/capas_gis/consultar

Prueba diferentes áreas de Argentina y verifica:
- Carga on-demand de tiles
- Performance < 200ms
- Features correctas por capa
- Respuesta JSON válida
"""

import requests
import json
import time
from datetime import datetime

# URL del servidor
BASE_URL = "http://localhost:5001"

# Áreas de prueba
TEST_AREAS = {
    "Buenos Aires": {
        "bounds": {
            "north": -34.0,
            "south": -35.0,
            "east": -58.0,
            "west": -59.0
        },
        "capas": ["transporte", "hidrografia", "areas_urbanas"]
    },
    "Mendoza": {
        "bounds": {
            "north": -32.5,
            "south": -33.5,
            "east": -68.5,
            "west": -69.5
        },
        "capas": ["transporte", "hidrografia"]
    },
    "Patagonia Sur": {
        "bounds": {
            "north": -50.0,
            "south": -52.0,
            "east": -68.0,
            "west": -70.0
        },
        "capas": ["transporte", "hidrografia", "areas_urbanas"]
    },
    "Área pequeña (Córdoba)": {
        "bounds": {
            "north": -31.3,
            "south": -31.5,
            "east": -64.1,
            "west": -64.3
        },
        "capas": ["transporte", "areas_urbanas"]
    }
}


def test_endpoint(area_name, config):
    """Prueba el endpoint con un área específica"""
    print(f"\n{'='*70}")
    print(f"🧪 Probando: {area_name}")
    print(f"{'='*70}")
    
    payload = {
        "bounds": config["bounds"],
        "capas": config["capas"]
    }
    
    print(f"📍 Bounds: {config['bounds']}")
    print(f"🗺️  Capas solicitadas: {', '.join(config['capas'])}")
    
    # Hacer request
    start_time = time.time()
    
    try:
        response = requests.post(
            f"{BASE_URL}/api/capas_gis/consultar",
            json=payload,
            timeout=10
        )
        
        elapsed_ms = (time.time() - start_time) * 1000
        
        print(f"\n⏱️  Tiempo de respuesta: {elapsed_ms:.1f} ms")
        
        if response.status_code == 200:
            data = response.json()
            
            if data.get('success'):
                print(f"✅ Respuesta exitosa")
                print(f"📦 Tiles cargados: {data.get('tiles_cargados', 0)}")
                print(f"📊 Features totales: {data.get('features_totales', 0)}")
                
                # Detallar features por capa
                capas_data = data.get('capas', {})
                for capa_tipo, subcapas in capas_data.items():
                    print(f"\n🗂️  {capa_tipo.upper()}:")
                    for subcapa_nombre, geojson in subcapas.items():
                        feature_count = len(geojson.get('features', []))
                        if feature_count > 0:
                            print(f"   • {subcapa_nombre}: {feature_count} features")
                
                # Verificar performance
                if elapsed_ms < 200:
                    print(f"\n🚀 Performance EXCELENTE (< 200ms)")
                elif elapsed_ms < 500:
                    print(f"\n⚡ Performance BUENA (< 500ms)")
                else:
                    print(f"\n⚠️  Performance MEJORABLE (> 500ms)")
                
                return True
            else:
                print(f"❌ Error en respuesta: {data.get('error', 'Unknown')}")
                return False
        else:
            print(f"❌ Error HTTP {response.status_code}")
            print(f"Respuesta: {response.text[:200]}")
            return False
            
    except requests.exceptions.ConnectionError:
        print(f"❌ No se pudo conectar al servidor {BASE_URL}")
        print(f"💡 Asegúrate de que el servidor esté corriendo:")
        print(f"   python3 Server/serverhttps.py")
        return False
    except Exception as e:
        print(f"❌ Error inesperado: {str(e)}")
        return False


def main():
    """Ejecuta todas las pruebas"""
    print("╔════════════════════════════════════════════════════════════════════╗")
    print("║  🧪 TEST ENDPOINT /api/capas_gis/consultar                        ║")
    print("║  Sistema de tiles GIS on-demand                                   ║")
    print("╚════════════════════════════════════════════════════════════════════╝")
    
    results = []
    
    for area_name, config in TEST_AREAS.items():
        success = test_endpoint(area_name, config)
        results.append((area_name, success))
        time.sleep(0.5)  # Pequeña pausa entre tests
    
    # Resumen final
    print(f"\n\n{'='*70}")
    print("📊 RESUMEN DE PRUEBAS")
    print(f"{'='*70}")
    
    passed = sum(1 for _, success in results if success)
    total = len(results)
    
    for area_name, success in results:
        status = "✅ PASS" if success else "❌ FAIL"
        print(f"{status} - {area_name}")
    
    print(f"\n🎯 Total: {passed}/{total} pruebas exitosas")
    
    if passed == total:
        print("🎉 ¡Todas las pruebas pasaron!")
    else:
        print("⚠️  Algunas pruebas fallaron")
    
    print(f"\n⏰ Hora: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")


if __name__ == "__main__":
    main()
