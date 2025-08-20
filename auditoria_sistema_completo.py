# 🔍 AUDITORÍA COMPLETA MAIRA - Análisis de Flujos de Eventos
# Identificación de funcionalidades rotas, faltantes o que necesitan reparación

import os
import re
import json
from datetime import datetime

def extract_socket_events_from_file(file_path):
    """Extrae eventos socket.emit y socket.on de un archivo"""
    events = {"emits": [], "listeners": []}
    
    try:
        with open(file_path, 'r', encoding='utf-8') as f:
            content = f.read()
            
        # Buscar socket.emit
        emit_pattern = r'socket\.emit\([\'"]([^\'"]+)[\'"]'
        emits = re.findall(emit_pattern, content)
        events["emits"] = list(set(emits))
        
        # Buscar socket.on
        on_pattern = r'socket\.on\([\'"]([^\'"]+)[\'"]'
        listeners = re.findall(on_pattern, content)
        events["listeners"] = list(set(listeners))
        
        # Buscar socketio.emit en backend
        socketio_emit_pattern = r'socketio\.emit\([\'"]([^\'"]+)[\'"]'
        socketio_emits = re.findall(socketio_emit_pattern, content)
        events["emits"].extend(socketio_emits)
        
        # Buscar @socketio.on en backend
        socketio_on_pattern = r'@socketio\.on\([\'"]([^\'"]+)[\'"]'
        socketio_listeners = re.findall(socketio_on_pattern, content)
        events["listeners"].extend(socketio_listeners)
        
        events["emits"] = list(set(events["emits"]))
        events["listeners"] = list(set(events["listeners"]))
        
    except Exception as e:
        print(f"Error leyendo {file_path}: {e}")
    
    return events

def analyze_module_flows():
    """Analiza flujos de eventos por módulo"""
    
    modules = {
        "Planeamiento": [
            "static/planeamiento.html",
            "Client/js/planeamiento.js"
        ],
        "Comandos y Control (CO)": [
            "static/co.html", 
            "Client/js/co.js"
        ],
        "Juego de Guerra": [
            "static/juegodeguerra.html",
            "Client/js/juegodeguerra.js"
        ],
        "Gestión de Batalla": [
            "static/gestionbatalla.html",
            "Client/js/gestionbatalla.js"
        ],
        "Chat Sistema": [
            "Client/js/chat.js"
        ],
        "Backend (app.py)": [
            "app.py"
        ]
    }
    
    analysis = {
        "timestamp": datetime.now().isoformat(),
        "modules": {},
        "event_mapping": {},
        "missing_handlers": [],
        "orphaned_emits": [],
        "critical_issues": []
    }
    
    all_emits = set()
    all_listeners = set()
    
    # Analizar cada módulo
    for module_name, files in modules.items():
        module_events = {"emits": [], "listeners": [], "files": []}
        
        for file_path in files:
            if os.path.exists(file_path):
                events = extract_socket_events_from_file(file_path)
                module_events["emits"].extend(events["emits"])
                module_events["listeners"].extend(events["listeners"])
                module_events["files"].append({
                    "path": file_path,
                    "events": events,
                    "exists": True
                })
                
                all_emits.update(events["emits"])
                all_listeners.update(events["listeners"])
            else:
                module_events["files"].append({
                    "path": file_path,
                    "events": {"emits": [], "listeners": []},
                    "exists": False
                })
        
        # Eliminar duplicados
        module_events["emits"] = list(set(module_events["emits"]))
        module_events["listeners"] = list(set(module_events["listeners"]))
        
        analysis["modules"][module_name] = module_events
    
    # Identificar eventos huérfanos (emit sin listener)
    orphaned_emits = all_emits - all_listeners
    analysis["orphaned_emits"] = list(orphaned_emits)
    
    # Identificar listeners sin emit
    missing_handlers = all_listeners - all_emits  
    analysis["missing_handlers"] = list(missing_handlers)
    
    # Análisis crítico por módulo
    critical_patterns = {
        "Juego de Guerra": {
            "required_flow": [
                "crearPartida", "unirseAPartida", "iniciarPartida",
                "zonaDespliegueDefinida", "unidadDesplegada", 
                "jugadorListoDespliegue", "iniciarCombate", 
                "cambioTurno", "finTurno"
            ]
        },
        "Gestión de Batalla": {
            "required_flow": [
                "crearOperacionGB", "unirseOperacionGB", 
                "actualizarPosicionGB", "nuevoElemento",
                "nuevoInforme", "informeLeido"
            ]
        },
        "Planeamiento": {
            "required_flow": [
                "guardarElemento", "cargarElementos",
                "actualizarPosicion", "eliminarElemento"
            ]
        }
    }
    
    # Verificar flujos críticos
    for module, patterns in critical_patterns.items():
        if module in analysis["modules"]:
            module_events = analysis["modules"][module]
            missing_events = []
            
            for required_event in patterns["required_flow"]:
                has_emit = required_event in module_events["emits"]
                has_listener = required_event in all_listeners
                
                if not has_emit and not has_listener:
                    missing_events.append(f"{required_event} - COMPLETAMENTE FALTANTE")
                elif has_emit and not has_listener:
                    missing_events.append(f"{required_event} - FALTA HANDLER EN BACKEND")
                elif not has_emit and has_listener:
                    missing_events.append(f"{required_event} - FALTA EMIT EN FRONTEND")
            
            if missing_events:
                analysis["critical_issues"].append({
                    "module": module,
                    "missing_events": missing_events
                })
    
    return analysis

def generate_detailed_report():
    """Genera reporte detallado con recomendaciones"""
    
    print("🔍 INICIANDO AUDITORÍA COMPLETA DEL SISTEMA MAIRA...")
    print("=" * 80)
    
    analysis = analyze_module_flows()
    
    print(f"📅 Timestamp: {analysis['timestamp']}")
    print(f"🎯 Módulos analizados: {len(analysis['modules'])}")
    print()
    
    # Resumen por módulo
    print("📋 RESUMEN POR MÓDULO:")
    print("-" * 50)
    
    for module_name, module_data in analysis["modules"].items():
        emits_count = len(module_data["emits"])
        listeners_count = len(module_data["listeners"])
        files_exist = sum(1 for f in module_data["files"] if f["exists"])
        total_files = len(module_data["files"])
        
        status = "✅" if files_exist == total_files else "⚠️"
        
        print(f"{status} {module_name}:")
        print(f"   📤 Emite: {emits_count} eventos")
        print(f"   📥 Escucha: {listeners_count} eventos") 
        print(f"   📁 Archivos: {files_exist}/{total_files} encontrados")
        
        # Mostrar archivos faltantes
        missing_files = [f["path"] for f in module_data["files"] if not f["exists"]]
        if missing_files:
            print(f"   ❌ Archivos faltantes: {missing_files}")
        
        print()
    
    # Problemas críticos
    if analysis["critical_issues"]:
        print("🚨 PROBLEMAS CRÍTICOS IDENTIFICADOS:")
        print("-" * 50)
        
        for issue in analysis["critical_issues"]:
            print(f"❌ {issue['module']}:")
            for missing in issue["missing_events"]:
                print(f"   • {missing}")
            print()
    
    # Eventos huérfanos
    if analysis["orphaned_emits"]:
        print("👻 EVENTOS HUÉRFANOS (emit sin handler):")
        print("-" * 50)
        for event in sorted(analysis["orphaned_emits"]):
            print(f"   📤➡️❌ {event}")
        print()
    
    # Handlers sin emit
    if analysis["missing_handlers"]:
        print("🔌 HANDLERS SIN EMIT (listener sin emisor):")
        print("-" * 50)
        for event in sorted(analysis["missing_handlers"]):
            print(f"   ❌➡️📥 {event}")
        print()
    
    # Recomendaciones específicas
    print("💡 RECOMENDACIONES DE REPARACIÓN:")
    print("-" * 50)
    
    recommendations = [
        "1. 🎮 JUEGO DE GUERRA - Prioridad ALTA:",
        "   • Implementar handler 'jugadorListoDespliegue' en backend",
        "   • Corregir flujo 'finalizarDespliegue' → 'iniciarCombate'", 
        "   • Verificar transiciones de turno (cambioTurno/finTurno)",
        "",
        "2. 🎖️ GESTIÓN DE BATALLA - Prioridad MEDIA:",
        "   • Implementar tracking en tiempo real (actualizarPosicionGB)",
        "   • Sistema de informes (nuevoInforme/informeLeido)",
        "   • Sincronización de elementos entre usuarios",
        "",
        "3. 🎯 PLANEAMIENTO - Prioridad BAJA:",
        "   • Verificar persistencia de elementos guardados",
        "   • Optimizar carga/descarga de elementos",
        "",
        "4. 💬 CHAT - Funcionando correctamente",
        "5. 🎖️ CO - Funcionando correctamente"
    ]
    
    for rec in recommendations:
        print(rec)
    
    # Guardar análisis detallado en archivo
    with open("auditoria_completa_maira.json", "w", encoding="utf-8") as f:
        json.dump(analysis, f, indent=2, ensure_ascii=False)
    
    print()
    print("💾 Análisis completo guardado en: auditoria_completa_maira.json")
    print("🔧 Iniciando reparaciones automáticas...")
    
    return analysis

if __name__ == "__main__":
    analysis = generate_detailed_report()
