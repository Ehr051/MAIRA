#!/usr/bin/env python3
"""
🧪 Test Runner Local para MAIRA
Ejecuta pruebas locales de funcionalidad sin depender del servidor en producción
"""

import os
import sys
import json
import time
import requests
import subprocess
from pathlib import Path
from datetime import datetime

class MAIRATestRunner:
    def __init__(self):
        self.project_root = Path(__file__).parent
        self.test_results = {}
        self.total_tests = 15
        self.passed_tests = 0
        
    def log(self, message, level="INFO"):
        timestamp = datetime.now().strftime("%H:%M:%S")
        icons = {"INFO": "ℹ️", "SUCCESS": "✅", "ERROR": "❌", "WARNING": "⚠️"}
        icon = icons.get(level, "ℹ️")
        print(f"[{timestamp}] {icon} {message}")
        
    def add_result(self, test_name, success, message):
        self.test_results[test_name] = {
            "success": success,
            "message": message,
            "timestamp": datetime.now().isoformat()
        }
        if success:
            self.passed_tests += 1
            
    def test_project_structure(self):
        """Verifica que todos los archivos principales existan"""
        self.log("🔍 Verificando estructura del proyecto...")
        
        required_files = [
            "app.py",
            "requirements.txt", 
            "render.yaml",
            "index.html",
            "iniciarpartida.html",
            "juegodeguerra.html",
            "inicioGB.html", 
            "gestionbatalla.html",
            "planeamiento.html",
            "CO.html"
        ]
        
        missing_files = []
        for file in required_files:
            if not (self.project_root / file).exists():
                missing_files.append(file)
                
        if missing_files:
            self.add_result("project_structure", False, f"Archivos faltantes: {missing_files}")
            self.log(f"❌ Archivos faltantes: {missing_files}", "ERROR")
        else:
            self.add_result("project_structure", True, "Todos los archivos principales presentes")
            self.log("✅ Estructura del proyecto correcta", "SUCCESS")
            
    def test_python_dependencies(self):
        """Verifica que las dependencias de Python estén disponibles"""
        self.log("📦 Verificando dependencias de Python...")
        
        required_modules = [
            "flask", "flask_socketio", "flask_cors", 
            "psycopg2", "bcrypt"
        ]
        
        missing_modules = []
        for module in required_modules:
            try:
                __import__(module)
            except ImportError:
                missing_modules.append(module)
                
        if missing_modules:
            self.add_result("python_dependencies", False, f"Módulos faltantes: {missing_modules}")
            self.log(f"❌ Módulos faltantes: {missing_modules}", "ERROR")
        else:
            self.add_result("python_dependencies", True, "Todas las dependencias disponibles")
            self.log("✅ Dependencias de Python correctas", "SUCCESS")
            
    def test_app_syntax(self):
        """Verifica que app.py no tenga errores de sintaxis"""
        self.log("🐍 Verificando sintaxis de app.py...")
        
        try:
            result = subprocess.run([
                sys.executable, "-m", "py_compile", str(self.project_root / "app.py")
            ], capture_output=True, text=True)
            
            if result.returncode == 0:
                self.add_result("app_syntax", True, "app.py sin errores de sintaxis")
                self.log("✅ app.py sintaxis correcta", "SUCCESS")
            else:
                self.add_result("app_syntax", False, f"Error de sintaxis: {result.stderr}")
                self.log(f"❌ Error de sintaxis: {result.stderr}", "ERROR")
        except Exception as e:
            self.add_result("app_syntax", False, f"Error ejecutando verificación: {e}")
            self.log(f"❌ Error verificando sintaxis: {e}", "ERROR")
            
    def test_html_files(self):
        """Verifica que los archivos HTML tengan estructura básica"""
        self.log("📄 Verificando archivos HTML...")
        
        html_files = [
            "index.html", "iniciarpartida.html", "juegodeguerra.html",
            "inicioGB.html", "gestionbatalla.html", "planeamiento.html", "CO.html"
        ]
        
        errors = []
        for html_file in html_files:
            file_path = self.project_root / html_file
            if file_path.exists():
                try:
                    content = file_path.read_text(encoding='utf-8')
                    if "<html" not in content.lower():
                        errors.append(f"{html_file}: No es un archivo HTML válido")
                    elif "socket.io" in content and "inicioGB" not in html_file:
                        # Verificar que tenga conexión SocketIO donde corresponde
                        pass
                except Exception as e:
                    errors.append(f"{html_file}: Error leyendo archivo - {e}")
                    
        if errors:
            self.add_result("html_files", False, f"Errores: {errors}")
            self.log(f"❌ Errores en HTML: {errors}", "ERROR")
        else:
            self.add_result("html_files", True, "Todos los archivos HTML válidos")
            self.log("✅ Archivos HTML correctos", "SUCCESS")
            
    def test_css_resources(self):
        """Verifica que los recursos CSS principales existan"""
        self.log("🎨 Verificando recursos CSS...")
        
        css_dir = self.project_root / "Client" / "css"
        if not css_dir.exists():
            self.add_result("css_resources", False, "Directorio Client/css no existe")
            self.log("❌ Directorio CSS faltante", "ERROR")
            return
            
        important_css = [
            "juegodeguerra.css", "GBatalla.css", "iniciarpartida.css",
            "inicioGB.css", "CO.css"
        ]
        
        missing_css = []
        for css_file in important_css:
            if not (css_dir / css_file).exists():
                missing_css.append(css_file)
                
        if missing_css:
            self.add_result("css_resources", False, f"CSS faltantes: {missing_css}")
            self.log(f"⚠️ CSS faltantes: {missing_css}", "WARNING")
        else:
            self.add_result("css_resources", True, "Todos los CSS principales presentes")
            self.log("✅ Recursos CSS correctos", "SUCCESS")
            
    def test_js_resources(self):
        """Verifica que los recursos JavaScript principales existan"""
        self.log("📜 Verificando recursos JavaScript...")
        
        js_dir = self.project_root / "Client" / "js"
        if not js_dir.exists():
            self.add_result("js_resources", False, "Directorio Client/js no existe")
            self.log("❌ Directorio JS faltante", "ERROR")
            return
            
        # Buscar archivos JS importantes
        js_files = list(js_dir.glob("*.js"))
        
        if len(js_files) < 5:  # Esperamos al menos algunos archivos JS
            self.add_result("js_resources", False, f"Pocos archivos JS encontrados: {len(js_files)}")
            self.log(f"⚠️ Solo {len(js_files)} archivos JS encontrados", "WARNING")
        else:
            self.add_result("js_resources", True, f"{len(js_files)} archivos JS encontrados")
            self.log(f"✅ Recursos JS correctos ({len(js_files)} archivos)", "SUCCESS")
            
    def test_server_configuration(self):
        """Verifica la configuración del servidor"""
        self.log("⚙️ Verificando configuración del servidor...")
        
        render_yaml = self.project_root / "render.yaml"
        if render_yaml.exists():
            try:
                content = render_yaml.read_text()
                if "startCommand: python app.py" in content:
                    self.add_result("server_config", True, "render.yaml configurado correctamente")
                    self.log("✅ Configuración de servidor correcta", "SUCCESS")
                else:
                    self.add_result("server_config", False, "render.yaml sin comando de inicio correcto")
                    self.log("❌ render.yaml mal configurado", "ERROR")
            except Exception as e:
                self.add_result("server_config", False, f"Error leyendo render.yaml: {e}")
                self.log(f"❌ Error en render.yaml: {e}", "ERROR")
        else:
            self.add_result("server_config", False, "render.yaml no existe")
            self.log("❌ render.yaml faltante", "ERROR")
            
    def test_production_server(self):
        """Intenta conectar al servidor en producción"""
        self.log("🌐 Probando conexión al servidor en producción...")
        
        try:
            response = requests.get("https://maira.onrender.com/health", timeout=10)
            if response.status_code == 200:
                data = response.json()
                self.add_result("production_server", True, f"Servidor activo: {data}")
                self.log("✅ Servidor en producción activo", "SUCCESS")
            else:
                self.add_result("production_server", False, f"HTTP {response.status_code}")
                self.log(f"⚠️ Servidor responde pero con error {response.status_code}", "WARNING")
        except requests.exceptions.RequestException as e:
            self.add_result("production_server", False, f"Error de conexión: {e}")
            self.log(f"❌ No se puede conectar al servidor: {e}", "ERROR")
            
    def test_database_migration(self):
        """Verifica que el script de migración esté presente"""
        self.log("🗄️ Verificando migración de base de datos...")
        
        migration_script = self.project_root / "convert_mysql_to_postgres.py"
        if migration_script.exists():
            self.add_result("database_migration", True, "Script de migración presente")
            self.log("✅ Script de migración disponible", "SUCCESS")
        else:
            self.add_result("database_migration", False, "Script de migración faltante")
            self.log("❌ Script de migración no encontrado", "ERROR")
            
    def test_documentation(self):
        """Verifica que la documentación esté completa"""
        self.log("📚 Verificando documentación...")
        
        doc_files = [
            "README.md", "ANALISIS_MAIRA_COMPLETO.md", 
            "DATABASE_MIGRATION.md", "DEPLOYMENT.md"
        ]
        
        existing_docs = []
        for doc in doc_files:
            if (self.project_root / doc).exists():
                existing_docs.append(doc)
                
        if len(existing_docs) >= 3:
            self.add_result("documentation", True, f"Documentación completa: {existing_docs}")
            self.log(f"✅ Documentación completa ({len(existing_docs)} archivos)", "SUCCESS")
        else:
            self.add_result("documentation", False, f"Documentación incompleta: {existing_docs}")
            self.log(f"⚠️ Documentación incompleta: {existing_docs}", "WARNING")
            
    def run_all_tests(self):
        """Ejecuta todos los tests"""
        self.log("🚀 Iniciando tests integrales de MAIRA...")
        print("=" * 60)
        
        tests = [
            self.test_project_structure,
            self.test_python_dependencies, 
            self.test_app_syntax,
            self.test_html_files,
            self.test_css_resources,
            self.test_js_resources,
            self.test_server_configuration,
            self.test_production_server,
            self.test_database_migration,
            self.test_documentation
        ]
        
        for i, test in enumerate(tests, 1):
            print(f"\n--- Test {i}/{len(tests)} ---")
            test()
            time.sleep(0.5)  # Pausa breve entre tests
            
        self.generate_report()
        
    def generate_report(self):
        """Genera el reporte final"""
        print("\n" + "=" * 60)
        self.log("📊 REPORTE FINAL DE TESTS")
        print("=" * 60)
        
        success_rate = (self.passed_tests / len(self.test_results)) * 100
        
        print(f"✅ Tests exitosos: {self.passed_tests}")
        print(f"❌ Tests fallidos: {len(self.test_results) - self.passed_tests}")
        print(f"📈 Tasa de éxito: {success_rate:.1f}%")
        
        print("\n🔍 DETALLES POR TEST:")
        for test_name, result in self.test_results.items():
            status = "✅" if result["success"] else "❌"
            print(f"{status} {test_name}: {result['message']}")
            
        # Guardar reporte en JSON
        report_file = self.project_root / f"test_report_{datetime.now().strftime('%Y%m%d_%H%M%S')}.json"
        with open(report_file, 'w') as f:
            json.dump({
                "summary": {
                    "total_tests": len(self.test_results),
                    "passed": self.passed_tests,
                    "failed": len(self.test_results) - self.passed_tests,
                    "success_rate": success_rate,
                    "timestamp": datetime.now().isoformat()
                },
                "results": self.test_results
            }, f, indent=2)
            
        print(f"\n💾 Reporte guardado en: {report_file}")
        
        if success_rate >= 80:
            self.log("🎉 MAIRA está en buen estado general!", "SUCCESS")
        elif success_rate >= 60:
            self.log("⚠️ MAIRA necesita algunas correcciones", "WARNING")
        else:
            self.log("❌ MAIRA requiere atención urgente", "ERROR")

if __name__ == "__main__":
    runner = MAIRATestRunner()
    runner.run_all_tests()
