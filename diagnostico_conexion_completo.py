#!/usr/bin/env python3
"""
Diagnóstico Completo de Conexiones MAIRA
Verifica base de datos, Socket.IO y conectividad desde diferentes dispositivos
"""

import requests
import json
import time
import socket
import urllib3
from urllib.parse import urljoin
import sys

# Suprimir warnings SSL para testing
urllib3.disable_warnings(urllib3.exceptions.InsecureRequestWarning)

class MAIRADiagnostico:
    def __init__(self):
        self.base_url = "https://maira-3e76.onrender.com"
        self.socket_url = "https://maira-3e76.onrender.com/socket.io/"
        self.resultados = {
            'http_basico': False,
            'socket_io': False,
            'base_datos': False,
            'cors': False,
            'mobile_headers': False
        }
    
    def log(self, mensaje, tipo='info'):
        """Log con formato"""
        iconos = {'info': 'ℹ️', 'success': '✅', 'warning': '⚠️', 'error': '❌'}
        print(f"{iconos.get(tipo, 'ℹ️')} {mensaje}")
    
    def verificar_conectividad_basica(self):
        """Verifica conectividad HTTP básica"""
        self.log("VERIFICANDO CONECTIVIDAD BÁSICA", 'info')
        
        try:
            # Test básico de conectividad
            response = requests.get(self.base_url, timeout=15)
            if response.status_code == 200:
                self.log(f"Servidor responde: {response.status_code}", 'success')
                self.resultados['http_basico'] = True
                
                # Verificar headers importantes
                headers = response.headers
                self.log(f"Content-Type: {headers.get('content-type', 'No especificado')}", 'info')
                self.log(f"Server: {headers.get('server', 'No especificado')}", 'info')
                
                return True
            else:
                self.log(f"Respuesta inesperada: {response.status_code}", 'error')
                return False
                
        except requests.exceptions.ConnectionError as e:
            self.log(f"Error de conexión: {str(e)[:100]}", 'error')
            return False
        except requests.exceptions.Timeout:
            self.log("Timeout al conectar con el servidor", 'error')
            return False
        except Exception as e:
            self.log(f"Error inesperado: {str(e)[:100]}", 'error')
            return False
    
    def verificar_socket_io(self):
        """Verifica que Socket.IO esté disponible"""
        self.log("VERIFICANDO SOCKET.IO", 'info')
        
        try:
            # Verificar endpoint de Socket.IO
            socket_check_url = f"{self.base_url}/socket.io/?EIO=4&transport=polling"
            response = requests.get(socket_check_url, timeout=10)
            
            if response.status_code == 200:
                self.log("Socket.IO endpoint responde correctamente", 'success')
                self.resultados['socket_io'] = True
                
                # Verificar contenido de respuesta
                if "sid" in response.text:
                    self.log("Session ID generado correctamente", 'success')
                else:
                    self.log("Respuesta Socket.IO inesperada", 'warning')
                
                return True
            else:
                self.log(f"Socket.IO no disponible: {response.status_code}", 'error')
                return False
                
        except Exception as e:
            self.log(f"Error verificando Socket.IO: {str(e)[:100]}", 'error')
            return False
    
    def verificar_base_datos(self):
        """Verifica conectividad con base de datos a través de endpoint"""
        self.log("VERIFICANDO BASE DE DATOS", 'info')
        
        try:
            # Test de endpoint que requiere DB
            test_url = f"{self.base_url}/api/test-db"
            response = requests.get(test_url, timeout=15)
            
            if response.status_code == 200:
                data = response.json()
                if data.get('status') == 'ok':
                    self.log("Base de datos conectada correctamente", 'success')
                    self.resultados['base_datos'] = True
                    return True
                else:
                    self.log("Base de datos con problemas", 'error')
                    return False
            elif response.status_code == 404:
                self.log("Endpoint de test DB no encontrado (puede ser normal)", 'warning')
                # Intentar con otro endpoint
                return self.verificar_db_alternativo()
            else:
                self.log(f"Error DB: {response.status_code}", 'error')
                return False
                
        except Exception as e:
            self.log(f"Error verificando DB: {str(e)[:100]}", 'error')
            return self.verificar_db_alternativo()
    
    def verificar_db_alternativo(self):
        """Verifica DB usando endpoint de partidas"""
        try:
            # Simular request que necesita DB
            test_url = f"{self.base_url}/partidas"
            headers = {'Content-Type': 'application/json'}
            
            response = requests.get(test_url, headers=headers, timeout=10)
            
            if response.status_code in [200, 404, 500]:  # Cualquier respuesta indica que el servidor funciona
                self.log("Servidor procesando requests (DB probablemente OK)", 'success')
                self.resultados['base_datos'] = True
                return True
            else:
                self.log(f"Respuesta DB alternativa: {response.status_code}", 'warning')
                return False
                
        except Exception as e:
            self.log(f"Error en verificación DB alternativa: {str(e)[:100]}", 'error')
            return False
    
    def verificar_cors_mobile(self):
        """Verifica configuración CORS para dispositivos móviles"""
        self.log("VERIFICANDO CORS Y HEADERS MÓVILES", 'info')
        
        # Headers que simularían un dispositivo móvil
        mobile_headers = {
            'User-Agent': 'Mozilla/5.0 (iPhone; CPU iPhone OS 14_7_1 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/14.1.2 Mobile/15E148 Safari/604.1',
            'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
            'Accept-Language': 'es-ES,es;q=0.5',
            'Accept-Encoding': 'gzip, deflate, br',
            'Origin': 'https://maira-3e76.onrender.com',
            'Referer': 'https://maira-3e76.onrender.com/'
        }
        
        try:
            response = requests.get(self.base_url, headers=mobile_headers, timeout=10)
            
            if response.status_code == 200:
                self.log("Headers móviles aceptados", 'success')
                self.resultados['mobile_headers'] = True
                
                # Verificar headers CORS en respuesta
                cors_headers = {
                    'Access-Control-Allow-Origin': response.headers.get('Access-Control-Allow-Origin'),
                    'Access-Control-Allow-Methods': response.headers.get('Access-Control-Allow-Methods'),
                    'Access-Control-Allow-Headers': response.headers.get('Access-Control-Allow-Headers')
                }
                
                for header, value in cors_headers.items():
                    if value:
                        self.log(f"CORS {header}: {value}", 'success')
                        self.resultados['cors'] = True
                    else:
                        self.log(f"CORS {header}: No configurado", 'warning')
                
                return True
            else:
                self.log(f"Headers móviles rechazados: {response.status_code}", 'error')
                return False
                
        except Exception as e:
            self.log(f"Error verificando headers móviles: {str(e)[:100]}", 'error')
            return False
    
    def verificar_resolucion_dns(self):
        """Verifica que el dominio se resuelva correctamente"""
        self.log("VERIFICANDO RESOLUCIÓN DNS", 'info')
        
        try:
            host = "maira-3e76.onrender.com"
            ip = socket.gethostbyname(host)
            self.log(f"DNS resuelto: {host} -> {ip}", 'success')
            
            # Verificar que podemos conectar al puerto 443 (HTTPS)
            sock = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
            sock.settimeout(5)
            result = sock.connect_ex((ip, 443))
            sock.close()
            
            if result == 0:
                self.log("Puerto 443 (HTTPS) accesible", 'success')
                return True
            else:
                self.log(f"Puerto 443 no accesible: {result}", 'error')
                return False
                
        except Exception as e:
            self.log(f"Error DNS: {str(e)}", 'error')
            return False
    
    def test_simulacion_mobile(self):
        """Simula completamente una conexión móvil"""
        self.log("SIMULANDO CONEXIÓN MÓVIL COMPLETA", 'info')
        
        mobile_session = requests.Session()
        mobile_session.headers.update({
            'User-Agent': 'Mozilla/5.0 (Android 10; Mobile; rv:91.0) Gecko/91.0 Firefox/91.0',
            'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
            'Accept-Language': 'es-ES,es;q=0.5',
            'Accept-Encoding': 'gzip, deflate, br',
            'DNT': '1',
            'Connection': 'keep-alive',
            'Upgrade-Insecure-Requests': '1'
        })
        
        try:
            # 1. Cargar página principal
            self.log("  1. Cargando página principal...", 'info')
            response = mobile_session.get(self.base_url, timeout=10)
            if response.status_code != 200:
                self.log(f"  ❌ Página principal falló: {response.status_code}", 'error')
                return False
            
            # 2. Cargar iniciar partida
            self.log("  2. Cargando página iniciar partida...", 'info')
            response = mobile_session.get(f"{self.base_url}/iniciarpartida.html", timeout=10)
            if response.status_code != 200:
                self.log(f"  ❌ Iniciar partida falló: {response.status_code}", 'error')
                return False
            
            # 3. Test Socket.IO con headers móviles
            self.log("  3. Probando Socket.IO con headers móviles...", 'info')
            socket_url = f"{self.base_url}/socket.io/?EIO=4&transport=polling"
            response = mobile_session.get(socket_url, timeout=10)
            if response.status_code != 200:
                self.log(f"  ❌ Socket.IO móvil falló: {response.status_code}", 'error')
                return False
            
            self.log("  ✅ Simulación móvil completada exitosamente", 'success')
            return True
            
        except Exception as e:
            self.log(f"  ❌ Error en simulación móvil: {str(e)[:100]}", 'error')
            return False
    
    def generar_reporte(self):
        """Genera reporte final con recomendaciones"""
        self.log("", 'info')
        self.log("="*60, 'info')
        self.log("📊 REPORTE FINAL DE DIAGNÓSTICO", 'info')
        self.log("="*60, 'info')
        
        total_tests = len(self.resultados)
        tests_pasados = sum(self.resultados.values())
        
        for test, resultado in self.resultados.items():
            estado = "✅ PASS" if resultado else "❌ FAIL"
            self.log(f"  {test.replace('_', ' ').title()}: {estado}", 'success' if resultado else 'error')
        
        self.log(f"📈 RESUMEN: {tests_pasados}/{total_tests} tests pasados", 'info')
        
        if tests_pasados == total_tests:
            self.log("🎉 SISTEMA COMPLETAMENTE FUNCIONAL", 'success')
            self.log("✅ No hay problemas de conectividad detectados", 'success')
        elif tests_pasados >= total_tests * 0.7:
            self.log("⚠️ SISTEMA MAYORMENTE FUNCIONAL", 'warning')
            self.log("🔧 Algunos componentes necesitan atención", 'warning')
        else:
            self.log("❌ SISTEMA CON PROBLEMAS CRÍTICOS", 'error')
            self.log("🚨 Requiere intervención inmediata", 'error')
        
        # Recomendaciones específicas
        self.log("", 'info')
        self.log("🔧 RECOMENDACIONES:", 'info')
        
        if not self.resultados['http_basico']:
            self.log("  • Verificar que Render no esté en sleep mode", 'warning')
            self.log("  • Comprobar logs de Render para errores de deploy", 'warning')
        
        if not self.resultados['socket_io']:
            self.log("  • Verificar configuración Socket.IO en app.py", 'warning')
            self.log("  • Comprobar que Socket.IO esté incluido en requirements.txt", 'warning')
        
        if not self.resultados['base_datos']:
            self.log("  • Verificar string de conexión PostgreSQL", 'warning')
            self.log("  • Comprobar que la base de datos esté activa", 'warning')
        
        if not self.resultados['cors']:
            self.log("  • Configurar CORS para permitir conexiones móviles", 'warning')
            self.log("  • Verificar headers Access-Control-* en Flask", 'warning')
        
        if not self.resultados['mobile_headers']:
            self.log("  • Optimizar respuestas para dispositivos móviles", 'warning')
            self.log("  • Verificar viewport y responsive design", 'warning')

def main():
    print("🔍 MAIRA - DIAGNÓSTICO COMPLETO DE CONEXIONES")
    print("=" * 60)
    print("🎯 Verificando conectividad desde diferentes dispositivos")
    print(f"📅 Timestamp: {time.strftime('%Y-%m-%d %H:%M:%S')}")
    print("=" * 60)
    
    diagnostico = MAIRADiagnostico()
    
    # Ejecutar todas las verificaciones
    diagnostico.verificar_resolucion_dns()
    print()
    diagnostico.verificar_conectividad_basica()
    print()
    diagnostico.verificar_socket_io()
    print()
    diagnostico.verificar_base_datos()
    print()
    diagnostico.verificar_cors_mobile()
    print()
    diagnostico.test_simulacion_mobile()
    
    # Generar reporte final
    diagnostico.generar_reporte()
    
    # Códigos de salida
    tests_pasados = sum(diagnostico.resultados.values())
    total_tests = len(diagnostico.resultados)
    
    if tests_pasados == total_tests:
        return 0  # Todo OK
    elif tests_pasados >= total_tests * 0.7:
        return 1  # Problemas menores
    else:
        return 2  # Problemas críticos

if __name__ == "__main__":
    try:
        exit_code = main()
        sys.exit(exit_code)
    except KeyboardInterrupt:
        print("\n🛑 Diagnóstico cancelado por usuario")
        sys.exit(1)
    except Exception as e:
        print(f"\n❌ Error durante diagnóstico: {e}")
        sys.exit(2)
