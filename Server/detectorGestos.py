import cv2
import mediapipe as mp
import numpy as np
import time
import pyautogui
import sys
import os

# Configurar pyautogui para que sea seguro y funcione correctamente
pyautogui.FAILSAFE = True
pyautogui.FAILSAFE_POINTS = [(0, 0)]

class ControladorGestos:
    def __init__(self, modo="pantalla", camera_id=0):
        """
        Inicializa el controlador de gestos
        
        Args:
            modo (str): 'pantalla' para controlar el cursor del PC,
                       'mesa' para controlar la mesa de arena con cámara externa
            camera_id (int): ID de la cámara a utilizar (0 para webcam integrada, 
                            1+ para cámaras externas)
        """
        self.modo = modo
        self.camera_id = camera_id
        
        # Inicializar MediaPipe Hands con configuración optimizada
        self.mp_hands = mp.solutions.hands
        self.hands = self.mp_hands.Hands(
            static_image_mode=False,
            max_num_hands=2,
            min_detection_confidence=0.5,
            min_tracking_confidence=0.5,
            model_complexity=0  # Usar modelo más ligero para mejor rendimiento
        )
        self.mp_drawing = mp.solutions.drawing_utils
        self.mp_drawing_styles = mp.solutions.drawing_styles
        
        # Simplificar estilo de dibujo para mejorar rendimiento
        self.drawing_spec = self.mp_drawing.DrawingSpec(thickness=1, circle_radius=1)
        
        # Obtener tamaño de la pantalla
        self.screen_width, self.screen_height = pyautogui.size()
        
        # Variables de estado para gestos
        self.clicking = False
        self.right_clicking = False
        self.dragging = False
        self.zoom_mode = False
        self.punto_inicial_arrastre = None
        
        # Variables para zoom
        self.punos_detectados = []
        self.distancia_punos_inicial = None
        self.haciendo_zoom = False
        
        # Suavizado de movimiento
        self.suavizado = 3  # Reducido para menor latencia
        self.historial_posiciones = []
        
        # Matriz de transformación para mapear coordenadas
        self.matriz_transformacion = np.eye(3)
        
        # Variables para calibración
        self.en_calibracion = False
        self.puntos_calibracion_camara = []
        self.puntos_calibracion_proyeccion = []
        self.calibracion_completada = False
        self.punto_seleccionado = False
        self.punto_actual_calibracion = 0
        self.ultimo_gesto_tiempo = 0
        self.mostrar_confirmacion = False
        self.tiempo_confirmacion = 0
        self.calibracion_cancelada = False
        
        # Mensaje mostrado actualmente
        self.mensaje_actual = ""
        self.tiempo_mensaje = 0
    
    def cambiar_camara(self, nuevo_id):
        """Cambia la cámara utilizada"""
        self.camera_id = nuevo_id
        print(f"Cambiando a cámara ID: {nuevo_id}")
        return True
        
    def procesar_frame(self, frame):
        """
        Procesa un fotograma de la cámara y realiza las acciones correspondientes
        """
        # Si estamos en modo calibración, procesar la calibración
        if self.en_calibracion and self.modo == "mesa":
            frame_procesado, calibracion_finalizada = self.procesar_calibracion(frame)
            if calibracion_finalizada:
                self.en_calibracion = False
                self.calibracion_completada = True
                self.mostrar_mensaje("¡Calibración completada con éxito!", 3)
            
            # Durante la calibración, devolvemos un gesto nulo
            info_gesto = {
                'gesto': 'ninguno',
                'posicion': None,
                'datos_adicionales': {}
            }
            return frame_procesado, info_gesto
        
        # Convertir imagen a RGB (MediaPipe requiere RGB)
        frame_rgb = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
        altura, ancho, _ = frame.shape
        
        # Procesar imagen con MediaPipe (con opción .copy() para evitar modificar el original)
        results = self.hands.process(frame_rgb)
        
        # Crear copia del frame para visualización
        frame_visual = frame.copy()
        
        # Información del gesto detectado para devolver
        info_gesto = {
            'gesto': 'ninguno',
            'posicion': None,
            'datos_adicionales': {}
        }
        
        # Mostrar mensajes temporales si existen
        self.mostrar_mensajes_temporales(frame_visual)
        
        # Si no se detectan manos, devolver el frame original
        if not results.multi_hand_landmarks:
            return frame_visual, info_gesto
        
        # Detectar gestos con dos manos (para zoom)
        if results.multi_hand_landmarks and len(results.multi_hand_landmarks) == 2:
            self.detectar_gestos_dos_manos(results, frame_visual, ancho, altura, info_gesto)
            
            # Si se detectó zoom, aplicar la acción y devolver
            if info_gesto['gesto'] in ['zoom_in', 'zoom_out']:
                return frame_visual, info_gesto
        
        # Detectar gestos con una mano
        if results.multi_hand_landmarks and len(results.multi_hand_landmarks) > 0:
            hand_landmarks = results.multi_hand_landmarks[0]
            
            # Dibujar los puntos de referencia de la mano (uso de estilo simplificado)
            self.mp_drawing.draw_landmarks(
                frame_visual, 
                hand_landmarks, 
                self.mp_hands.HAND_CONNECTIONS,
                self.drawing_spec,
                self.drawing_spec)
            
            # Extraer puntos clave
            puntos = []
            for landmark in hand_landmarks.landmark:
                x, y = int(landmark.x * ancho), int(landmark.y * altura)
                puntos.append((x, y))
            
            # Procesar puntos para detectar gestos específicos
            info_gesto = self.detectar_gestos_una_mano(puntos, frame_visual, ancho, altura)
            
            # Si estamos en modo pantalla, realizar las acciones del mouse
            if self.modo == "pantalla" and info_gesto['posicion'] is not None:
                self.realizar_accion_mouse(info_gesto)
        
        return frame_visual, info_gesto
    
    def mostrar_mensaje(self, mensaje, duracion=2):
        """Muestra un mensaje temporal en la pantalla"""
        self.mensaje_actual = mensaje
        self.tiempo_mensaje = time.time() + duracion
    
    def mostrar_mensajes_temporales(self, frame):
        """Muestra mensajes temporales en el frame"""
        if self.mensaje_actual and time.time() < self.tiempo_mensaje:
            # Mostrar mensaje en centro de pantalla con fondo para mejor legibilidad
            altura, ancho, _ = frame.shape
            texto_size = cv2.getTextSize(self.mensaje_actual, cv2.FONT_HERSHEY_SIMPLEX, 0.9, 2)[0]
            
            # Calcular posición centrada
            texto_x = (ancho - texto_size[0]) // 2
            texto_y = altura // 2
            
            # Dibujar rectángulo de fondo semi-transparente
            overlay = frame.copy()
            cv2.rectangle(overlay, 
                         (texto_x - 20, texto_y - 30), 
                         (texto_x + texto_size[0] + 20, texto_y + 10), 
                         (0, 0, 0), -1)
            
            # Aplicar transparencia
            alpha = 0.6
            cv2.addWeighted(overlay, alpha, frame, 1 - alpha, 0, frame)
            
            # Mostrar texto
            cv2.putText(frame, self.mensaje_actual, 
                      (texto_x, texto_y), cv2.FONT_HERSHEY_SIMPLEX, 0.9, (255, 255, 255), 2)
    
    def detectar_gestos_una_mano(self, puntos, frame, ancho, altura):
        """Detecta gestos realizados con una sola mano con calibración automática de distancia"""
        # Dedos clave
        indice_punta = puntos[8]
        indice_base = puntos[5]
        pulgar_punta = puntos[4]
        pulgar_base = puntos[2]
        medio_punta = puntos[12]
        medio_base = puntos[9]
        palma = puntos[0]
        
        # NUEVO: Detectar distancia y calibrar umbrales automáticamente
        calibracion = self.detectar_distancia_y_calibrar(puntos)
        umbral_pinza = calibracion['umbral_pinza']
        factor_distancia = calibracion['factor_distancia']
        categoria_distancia = calibracion['categoria_distancia']
        
        # Verificar si dedos están extendidos (con adaptación a distancia)
        # A mayor distancia, ser menos estricto con lo que significa "extendido"
        umbral_extension = 5 * factor_distancia  # Adaptativo a la distancia
        indice_extendido = indice_punta[1] < indice_base[1] - umbral_extension
        medio_extendido = medio_punta[1] < medio_base[1] - umbral_extension
        pulgar_extendido = self._calcular_distancia(pulgar_punta, palma) > self._calcular_distancia(pulgar_base, palma) * 1.2
        
        # Distancias entre dedos
        distancia_pulgar_indice = self._calcular_distancia(pulgar_punta, indice_punta)
        distancia_pulgar_medio = self._calcular_distancia(pulgar_punta, medio_punta)
        
        # Mostrar información de depuración
        if True:  # Siempre mostrar para facilitar el diagnóstico
            # Información de depuración útil
            cv2.putText(frame, f"Dist: {categoria_distancia} ({factor_distancia:.2f})", 
                    (10, altura - 90), cv2.FONT_HERSHEY_SIMPLEX, 0.5, (255, 255, 255), 1)
            cv2.putText(frame, f"P-I: {distancia_pulgar_indice:.1f}, Umbral: {umbral_pinza:.1f}", 
                    (10, altura - 70), cv2.FONT_HERSHEY_SIMPLEX, 0.5, (255, 255, 255), 1)
            cv2.putText(frame, f"Índ: {indice_extendido}, Pulg: {pulgar_extendido}", 
                    (10, altura - 50), cv2.FONT_HERSHEY_SIMPLEX, 0.5, (255, 255, 255), 1)
        
        # Posición para el cursor
        if self.modo == "pantalla":
            # Usar índice para el cursor en modo pantalla
            cursor_x, cursor_y = indice_punta
            
            # Mapear coordenadas de cámara a pantalla
            screen_x = int(np.interp(cursor_x, [100, ancho-100], [0, self.screen_width]))
            screen_y = int(np.interp(cursor_y, [100, altura-100], [0, self.screen_height]))
            
            # Aplicar suavizado
            self.historial_posiciones.append((screen_x, screen_y))
            if len(self.historial_posiciones) > self.suavizado:
                self.historial_posiciones.pop(0)
            
            suavizado_x = int(sum(p[0] for p in self.historial_posiciones) / len(self.historial_posiciones))
            suavizado_y = int(sum(p[1] for p in self.historial_posiciones) / len(self.historial_posiciones))
            
            posicion_cursor = (suavizado_x, suavizado_y)
            # Mostrar coordenadas en la pantalla
            cv2.putText(frame, f"Pos: {suavizado_x}, {suavizado_y}", 
                    (ancho - 250, 30), cv2.FONT_HERSHEY_SIMPLEX, 0.7, (0, 0, 255), 2)
        else:
            # En modo mesa, aplicar transformación de coordenadas si ya está calibrado
            if self.calibracion_completada:
                # Usamos índice para mayor precisión
                posicion_cursor = self._transformar_coordenadas(indice_punta)
                cv2.putText(frame, f"Transf: {posicion_cursor[0]}, {posicion_cursor[1]}", 
                        (ancho - 250, 60), cv2.FONT_HERSHEY_SIMPLEX, 0.7, (0, 255, 0), 2)
            else:
                posicion_cursor = indice_punta
        
        # Información del gesto detectado
        info_gesto = {
            'gesto': 'ninguno',
            'posicion': posicion_cursor,
            'datos_adicionales': {'puntos_mano': puntos, 'calibracion': calibracion}
        }
        
        # NUEVO: Sistema anti-temblor para gestos
        # Inicializar variables de estado si no existen
        if not hasattr(self, 'ultimo_gesto'):
            self.ultimo_gesto = 'ninguno'
            self.contador_gesto = 0
            self.tiempo_ultimo_cambio = time.time()
        
        # Mostrar círculo como cursor visual en el dedo índice
        cv2.circle(frame, indice_punta, 8, (0, 255, 0), -1)
        
        # Detección de gestos
        gesto_actual = 'ninguno'
        
        # MEJORADO: Sistema de visualización de proximidad al umbral de pinza
        # Esto ayuda al usuario a ver cuán cerca está de activar un gesto
        if distancia_pulgar_indice < umbral_pinza * 2:  # Mostrar cuando se acerca al umbral
            # Calcular porcentaje de proximidad al umbral (0% = en umbral, 100% = a doble distancia)
            proximidad = max(0, min(100, (distancia_pulgar_indice / umbral_pinza - 1) * 100))
            
            # Color que cambia de rojo (lejos) a verde (cerca del umbral)
            # RGB -> BGR para OpenCV
            if proximidad < 50:
                # De verde a amarillo (de cerca a media distancia)
                g = 255
                r = int((proximidad / 50) * 255)
                color_proximidad = (0, g, r)
            else:
                # De amarillo a rojo (de media distancia a lejos)
                r = 255
                g = int(255 - ((proximidad - 50) / 50) * 255)
                color_proximidad = (0, g, r)
            
            # Dibujar línea entre pulgar e índice con el color de proximidad
            cv2.line(frame, pulgar_punta, indice_punta, color_proximidad, 2)
            
            # Opcional: mostrar círculo en punto medio con tamaño proporcional a la proximidad
            punto_medio = ((pulgar_punta[0] + indice_punta[0]) // 2, 
                        (pulgar_punta[1] + indice_punta[1]) // 2)
            
            # Tamaño del círculo inversamente proporcional a la proximidad
            radio = int(10 + (100 - proximidad) / 10)
            cv2.circle(frame, punto_medio, radio, color_proximidad, 2)
        
        # Click izquierdo: pinza entre índice y pulgar con umbral adaptativo
        if distancia_pulgar_indice < umbral_pinza:
            # MEJORADO: Verificación adicional para evitar falsos positivos
            # Asegurar que es una pinza intencional, no solo dedos juntos por casualidad
            if indice_extendido:  # El índice debe estar extendido
                gesto_actual = 'click'
                # Dibujar indicador visual
                cv2.circle(frame, indice_punta, 12, (255, 0, 0), -1)
                cv2.circle(frame, pulgar_punta, 12, (255, 0, 0), -1)
                cv2.line(frame, indice_punta, pulgar_punta, (255, 0, 0), 2)
                cv2.putText(frame, "Click", (50, 50), cv2.FONT_HERSHEY_SIMPLEX, 0.8, (255, 0, 0), 2)
                
                # NUEVO: Estabilización de gesto
                if self.ultimo_gesto == 'click' or self.ultimo_gesto == 'arrastrar':
                    self.contador_gesto += 1
                else:
                    self.contador_gesto = 1
                    self.tiempo_ultimo_cambio = time.time()
                
                # Número mínimo de frames para confirmar, adaptado a la distancia
                # Más exigente de cerca, más permisivo a distancia
                frames_confirmacion = 5
                if categoria_distancia == "muy_cerca":
                    frames_confirmacion = 8  # Más exigente cuando está muy cerca
                elif categoria_distancia == "distancia_lejana":
                    frames_confirmacion = 3  # Más permisivo a distancia
                
                # Detectar arrastre si se mantiene la pinza y se mueve
                if self.contador_gesto > frames_confirmacion:
                    if self.dragging or self.clicking:
                        gesto_actual = 'arrastrar'
                        if self.punto_inicial_arrastre:
                            info_gesto['datos_adicionales']['punto_inicial'] = self.punto_inicial_arrastre
                            # Dibujar línea de arrastre
                            cv2.line(frame, self.punto_inicial_arrastre, posicion_cursor, (255, 0, 0), 2)
                            cv2.putText(frame, "Arrastrando", (50, 90), cv2.FONT_HERSHEY_SIMPLEX, 0.8, (255, 0, 0), 2)
                    else:
                        self.punto_inicial_arrastre = posicion_cursor
                    
                    info_gesto['gesto'] = gesto_actual
        else:
            # Si la pinza se suelta, resetear estado de arrastre después de un tiempo
            if time.time() - self.tiempo_ultimo_cambio > 0.3:  # 300ms de gracia
                self.punto_inicial_arrastre = None
                gesto_actual = 'ninguno'
            else:
                # Mantener el último gesto brevemente para evitar parpadeos
                gesto_actual = self.ultimo_gesto
        
        # Click derecho: pulgar y dedo medio juntos
        if distancia_pulgar_medio < umbral_pinza and medio_extendido:
            # MEJORADO: Verificación adicional similar al click izquierdo
            if pulgar_extendido:
                gesto_actual = 'menu_contextual'
                # Dibujar indicador visual
                cv2.circle(frame, medio_punta, 12, (0, 0, 255), -1)
                cv2.circle(frame, pulgar_punta, 12, (0, 0, 255), -1)
                cv2.line(frame, medio_punta, pulgar_punta, (0, 0, 255), 2)
                cv2.putText(frame, "Click Derecho", (50, 90), cv2.FONT_HERSHEY_SIMPLEX, 0.8, (0, 0, 255), 2)
                
                # Estabilización similar
                if self.ultimo_gesto == 'menu_contextual':
                    self.contador_gesto += 1
                else:
                    self.contador_gesto = 1
                    self.tiempo_ultimo_cambio = time.time()
                
                # Adaptar frames de confirmación según distancia
                frames_confirmacion = 5
                if categoria_distancia == "muy_cerca":
                    frames_confirmacion = 8
                elif categoria_distancia == "distancia_lejana":
                    frames_confirmacion = 3
                
                if self.contador_gesto > frames_confirmacion:
                    info_gesto['gesto'] = gesto_actual
        
        # Puño cerrado adaptado a la distancia
        if self._es_puño_cerrado(puntos, factor_distancia):
            # Si solo hay una mano y no estamos en modo zoom, considerar como click
            if not self.zoom_mode:
                gesto_actual = 'click'
                cv2.circle(frame, palma, 20, (255, 255, 0), 2)
                cv2.putText(frame, "Puño (Click)", (palma[0]-40, palma[1]-20), 
                        cv2.FONT_HERSHEY_SIMPLEX, 0.7, (255, 255, 0), 2)
                
                # Estabilización
                if self.ultimo_gesto == 'click':
                    self.contador_gesto += 1
                else:
                    self.contador_gesto = 1
                    self.tiempo_ultimo_cambio = time.time()
                
                # Adaptar frames de confirmación según distancia
                frames_confirmacion = 5
                if categoria_distancia == "muy_cerca":
                    frames_confirmacion = 8
                elif categoria_distancia == "distancia_lejana":
                    frames_confirmacion = 3
                
                if self.contador_gesto > frames_confirmacion:
                    info_gesto['gesto'] = gesto_actual
        
        # Actualizar el último gesto detectado
        self.ultimo_gesto = gesto_actual
        
        return info_gesto

    def detectar_gestos_dos_manos(self, results, frame, ancho, altura, info_gesto):
        """Detecta gestos realizados con dos manos, principalmente para zoom"""
        # Implementación simplificada para mejorar rendimiento
        self.punos_detectados = []
        
        for hand_idx, hand_landmarks in enumerate(results.multi_hand_landmarks):
            # Dibujar puntos clave con estilo simplificado para mejor rendimiento
            self.mp_drawing.draw_landmarks(
                frame, 
                hand_landmarks, 
                self.mp_hands.HAND_CONNECTIONS, 
                self.drawing_spec,
                self.drawing_spec)
            
            # Extraer puntos clave
            puntos = []
            for landmark in hand_landmarks.landmark:
                x, y = int(landmark.x * ancho), int(landmark.y * altura)
                puntos.append((x, y))
            
            # Verificar si es un puño
            if self._es_puño_cerrado(puntos):
                centro_palma = puntos[0]  # Base de la palma
                self.punos_detectados.append(centro_palma)
                
                # Dibujar círculo sobre el puño
                cv2.circle(frame, centro_palma, 20, (0, 0, 255), 2)
        
        # Si se detectaron exactamente dos puños, procesar zoom
        if len(self.punos_detectados) == 2:
            self.zoom_mode = True
            distancia_actual = self._calcular_distancia(self.punos_detectados[0], self.punos_detectados[1])
            
            # Inicializar distancia si es el primer frame
            if not self.haciendo_zoom:
                self.distancia_punos_inicial = distancia_actual
                self.haciendo_zoom = True
            
            # Línea entre puños
            cv2.line(frame, self.punos_detectados[0], self.punos_detectados[1], (255, 128, 0), 2)
            
            # Punto medio entre los dos puños
            punto_medio = ((self.punos_detectados[0][0] + self.punos_detectados[1][0]) // 2,
                          (self.punos_detectados[0][1] + self.punos_detectados[1][1]) // 2)
            
            # Detectar cambios significativos en la distancia para zoom
            if self.distancia_punos_inicial is not None:
                factor_zoom = distancia_actual / self.distancia_punos_inicial
                
                if distancia_actual > self.distancia_punos_inicial * 1.5:
                    info_gesto['gesto'] = 'zoom_in'
                    info_gesto['posicion'] = punto_medio
                    info_gesto['datos_adicionales']['factor_zoom'] = factor_zoom
                    
                    cv2.putText(frame, "ZOOM IN", punto_medio, 
                              cv2.FONT_HERSHEY_SIMPLEX, 0.8, (0, 255, 0), 2)
                elif distancia_actual < self.distancia_punos_inicial * 0.7:
                    info_gesto['gesto'] = 'zoom_out'
                    info_gesto['posicion'] = punto_medio
                    info_gesto['datos_adicionales']['factor_zoom'] = factor_zoom
                    
                    cv2.putText(frame, "ZOOM OUT", punto_medio, 
                              cv2.FONT_HERSHEY_SIMPLEX, 0.8, (255, 0, 0), 2)
        else:
            # Resetear detección de zoom si no hay 2 puños
            self.zoom_mode = False
            self.haciendo_zoom = False
            self.distancia_punos_inicial = None
    
    def procesar_calibracion(self, frame):
        """
        Procesa el modo de calibración para mapear la cámara a la mesa/pizarra
        Con ajuste automático según la distancia
        
        Args:
            frame: Imagen capturada de la cámara
            
        Returns:
            frame_procesado: Imagen con información visual sobre calibración
            calibracion_finalizada: Bool indicando si la calibración está completa
        """
        altura, ancho, _ = frame.shape
        
        # Crear copia del frame para visualización
        frame_visual = frame.copy()
        
        # Dibujar instrucciones en el frame
        cv2.putText(frame_visual, "MODO CALIBRACIÓN", 
                (ancho//2 - 150, 30), cv2.FONT_HERSHEY_SIMPLEX, 1, (0, 0, 255), 2)
        cv2.putText(frame_visual, "Define los límites de tu MESA/PIZARRA", 
                (ancho//2 - 250, 70), cv2.FONT_HERSHEY_SIMPLEX, 0.8, (0, 0, 255), 2)
        
        # Variables estáticas para control de la calibración
        if not hasattr(self, 'tiempo_gesto_activo'):
            self.tiempo_gesto_activo = 0
            self.posicion_actual = None
            self.gesto_activo = False
            self.contador_estabilidad = 0
            self.ultima_posicion = None
        
        # Determinar qué punto estamos calibrando ahora
        punto_actual = len(self.puntos_calibracion_camara)
        
        # Definir los nombres de las esquinas
        nombres_puntos = ["Superior Izquierda", "Superior Derecha", "Inferior Derecha", "Inferior Izquierda"]
        
        # Dibujar los puntos ya capturados
        for i, punto in enumerate(self.puntos_calibracion_camara):
            cv2.circle(frame_visual, punto, 10, (0, 255, 255), -1)
            cv2.putText(frame_visual, f"Punto {i+1}: {nombres_puntos[i]}", 
                    (punto[0] - 50, punto[1] - 15), cv2.FONT_HERSHEY_SIMPLEX, 0.6, (0, 255, 255), 2)
        
        # Detectar mano y verificar posición estable
        results = self.hands.process(cv2.cvtColor(frame, cv2.COLOR_BGR2RGB))
        
        if results.multi_hand_landmarks and punto_actual < 4:
            for hand_landmarks in results.multi_hand_landmarks:
                # Dibujar puntos de referencia de la mano
                self.mp_drawing.draw_landmarks(
                    frame_visual, hand_landmarks, self.mp_hands.HAND_CONNECTIONS)
                
                # Extraer puntos clave
                puntos = []
                for landmark in hand_landmarks.landmark:
                    x, y = int(landmark.x * ancho), int(landmark.y * altura)
                    puntos.append((x, y))
                
                # NUEVO: Detectar distancia y calibrar umbrales
                calibracion = self.detectar_distancia_y_calibrar(puntos)
                umbral_pinza = calibracion['umbral_pinza']
                categoria_distancia = calibracion['categoria_distancia']
                
                # Mostrar información de distancia detectada
                cv2.putText(frame_visual, f"Distancia: {categoria_distancia}", 
                        (ancho - 250, 100), cv2.FONT_HERSHEY_SIMPLEX, 0.7, (255, 255, 255), 2)
                
                # Usando la punta del dedo índice como punto de calibración
                indice_punta = puntos[8]
                indice_x, indice_y = indice_punta
                
                # Posición del pulgar (para detectar pinza)
                pulgar_punta = puntos[4]
                pulgar_x, pulgar_y = pulgar_punta
                
                # Calcular distancia entre pulgar e índice
                distancia_pulgar_indice = self._calcular_distancia(pulgar_punta, indice_punta)
                
                # Verificar si la posición se ha mantenido estable
                if self.ultima_posicion:
                    distancia_movimiento = self._calcular_distancia((indice_x, indice_y), self.ultima_posicion)
                    
                    # Umbral de movimiento adaptativo según la distancia
                    umbral_movimiento = 15
                    if categoria_distancia == "distancia_lejana":
                        umbral_movimiento = 25  # Más permisivo a distancia
                    elif categoria_distancia == "muy_cerca":
                        umbral_movimiento = 10  # Más estricto de cerca
                    
                    # Si el movimiento es mínimo, incrementar contador de estabilidad
                    if distancia_movimiento < umbral_movimiento:
                        self.contador_estabilidad += 1
                    else:
                        # Resetear contador si hay movimiento significativo
                        self.contador_estabilidad = 0
                
                # Actualizar última posición
                self.ultima_posicion = (indice_x, indice_y)
                
                # Dibujar la posición del dedo
                cv2.circle(frame_visual, (indice_x, indice_y), 5, (0, 255, 0), -1)
                
                # Mostrar instrucciones para el punto actual
                cv2.putText(frame_visual, f"1. Coloca el dedo índice en la esquina {nombres_puntos[punto_actual]}", 
                        (20, altura - 90), cv2.FONT_HERSHEY_SIMPLEX, 0.7, (255, 255, 255), 2)
                cv2.putText(frame_visual, "2. Mantén la mano quieta", 
                        (20, altura - 60), cv2.FONT_HERSHEY_SIMPLEX, 0.7, (255, 255, 255), 2)
                cv2.putText(frame_visual, "3. Haz una pinza (junta índice y pulgar) para marcar el punto", 
                        (20, altura - 30), cv2.FONT_HERSHEY_SIMPLEX, 0.7, (255, 255, 255), 2)
                
                # MEJORADO: Sistema de visualización de proximidad al umbral de pinza
                if distancia_pulgar_indice < umbral_pinza * 2:  # Mostrar cuando se acerca al umbral
                    # Calcular porcentaje de proximidad al umbral
                    proximidad = max(0, min(100, (distancia_pulgar_indice / umbral_pinza - 1) * 100))
                    
                    # Color que cambia de rojo (lejos) a verde (cerca del umbral)
                    if proximidad < 50:
                        # De verde a amarillo (de cerca a media distancia)
                        g = 255
                        r = int((proximidad / 50) * 255)
                        color_proximidad = (0, g, r)
                    else:
                        # De amarillo a rojo (de media distancia a lejos)
                        r = 255
                        g = int(255 - ((proximidad - 50) / 50) * 255)
                        color_proximidad = (0, g, r)
                    
                    # Dibujar línea entre pulgar e índice con el color de proximidad
                    cv2.line(frame_visual, pulgar_punta, indice_punta, color_proximidad, 2)
                    
                    # Círculo en punto medio con tamaño proporcional a la proximidad
                    punto_medio = ((pulgar_x + indice_x) // 2, (pulgar_y + indice_y) // 2)
                    radio = int(10 + (100 - proximidad) / 10)
                    cv2.circle(frame_visual, punto_medio, radio, color_proximidad, 2)
                
                # Mostrar indicador de estabilidad
                if self.contador_estabilidad > 0:
                    # Adaptar el tiempo de estabilidad requerido según la distancia
                    estabilidad_requerida = 30  # Valor base (aproximadamente 1 segundo a 30 fps)
                    if categoria_distancia == "distancia_lejana":
                        estabilidad_requerida = 20  # Más fácil a distancia
                    elif categoria_distancia == "muy_cerca":
                        estabilidad_requerida = 40  # Más exigente de cerca
                    
                    estabilidad_porcentaje = min(100, int(self.contador_estabilidad / estabilidad_requerida * 100))
                    cv2.putText(frame_visual, f"Estabilidad: {estabilidad_porcentaje}%", 
                            (ancho - 250, 70), cv2.FONT_HERSHEY_SIMPLEX, 0.7, (255, 255, 255), 2)
                    
                    # Dibujar barra de estabilidad
                    barra_longitud = int((ancho - 100) * estabilidad_porcentaje / 100)
                    cv2.rectangle(frame_visual, (50, 120), (barra_longitud, 140), 
                                (0, 255, 0), -1)
                    cv2.rectangle(frame_visual, (50, 120), (ancho - 100, 140), 
                                (255, 255, 255), 1)
                
                # Verificar si la mano está estable y se ha formado una pinza
                if self.contador_estabilidad > estabilidad_requerida and distancia_pulgar_indice < umbral_pinza:
                    # Dibujar círculo para indicar detección de pinza
                    cv2.circle(frame_visual, (indice_x, indice_y), 15, (0, 255, 0), -1)
                    cv2.putText(frame_visual, "¡Punto seleccionado!", (ancho//2 - 150, altura//2), 
                            cv2.FONT_HERSHEY_SIMPLEX, 1, (0, 255, 0), 2)
                    
                    # Guardar el punto
                    self.puntos_calibracion_camara.append((indice_x, indice_y))
                    print(f"Punto {punto_actual+1} capturado: ({indice_x},{indice_y})")
                    
                    # Resetear contadores
                    self.contador_estabilidad = 0
                    self.ultima_posicion = None
                    
                    # Mostrar mensaje de punto capturado
                    cv2.imshow('Control por Gestos - Calibración', frame_visual)
                    cv2.waitKey(1000)  # Pausa de 1 segundo para ver el mensaje
                    
                    # Si hemos capturado todos los puntos, calcular la homografía
                    # Si hemos capturado todos los puntos, calcular la homografía
                if len(self.puntos_calibracion_camara) == 4:
                    # Definir los puntos de destino como las esquinas de la pantalla
                    puntos_proyeccion = [
                        (0, 0),                                  # Esquina superior izquierda
                        (self.screen_width, 0),                  # Esquina superior derecha
                        (self.screen_width, self.screen_height), # Esquina inferior derecha
                        (0, self.screen_height)                  # Esquina inferior izquierda
                    ]
                    
                    self.calibrar_mesa(self.puntos_calibracion_camara, puntos_proyeccion)
                    
                    # Mostrar mensaje de calibración completa
                    temp_frame = frame_visual.copy()
                    cv2.putText(temp_frame, "¡CALIBRACIÓN COMPLETADA!", 
                              (ancho//2 - 250, altura//2), cv2.FONT_HERSHEY_SIMPLEX, 1.2, (0, 255, 0), 3)
                    cv2.putText(temp_frame, "Ya puedes usar tu mesa en modo proyección", 
                              (ancho//2 - 300, altura//2 + 50), cv2.FONT_HERSHEY_SIMPLEX, 1, (0, 255, 0), 2)
                    cv2.imshow('Control por Gestos - Calibración', temp_frame)
                    cv2.waitKey(3000)  # Mostrar mensaje por 3 segundos
                    
                    # Limpieza de variables temporales
                    if hasattr(self, 'tiempo_gesto_activo'):
                        delattr(self, 'tiempo_gesto_activo')
                    if hasattr(self, 'posicion_actual'):
                        delattr(self, 'posicion_actual')
                    if hasattr(self, 'gesto_activo'):
                        delattr(self, 'gesto_activo')
                    if hasattr(self, 'contador_estabilidad'):
                        delattr(self, 'contador_estabilidad')
                    if hasattr(self, 'ultima_posicion'):
                        delattr(self, 'ultima_posicion')
                    
                    return frame_visual, True  # Calibración completada
    
        # Mostrar progreso de la calibración
        if punto_actual > 0:
            cv2.putText(frame_visual, f"Puntos capturados: {punto_actual}/4", 
                    (ancho - 250, altura - 30), cv2.FONT_HERSHEY_SIMPLEX, 0.8, (255, 255, 255), 2)
        
        # Mostrar tecla para cancelar
        cv2.putText(frame_visual, "Presiona 'r' para reiniciar la calibración", 
                (20, 160), cv2.FONT_HERSHEY_SIMPLEX, 0.7, (255, 255, 255), 2)
        
        return frame_visual, False  # Calibración en progreso


    def realizar_accion_mouse(self, info_gesto):
            """Ejecuta las acciones del mouse según el gesto detectado"""
            # Si no hay posición, no hacemos nada
            if info_gesto['posicion'] is None:
                return
            
            # Mover el mouse a la posición del cursor
            x, y = info_gesto['posicion']
            
            # Restringir x,y a los límites de la pantalla
            x = max(0, min(x, self.screen_width))
            y = max(0, min(y, self.screen_height))
            
            # Mover el mouse con suavizado
            pyautogui.moveTo(x, y)
            
            # Realizar acciones según el gesto
            if info_gesto['gesto'] == 'click':
                if not self.clicking:
                    pyautogui.mouseDown()
                    self.clicking = True
            elif info_gesto['gesto'] == 'arrastrar':
                if not self.dragging:
                    self.dragging = True
            elif info_gesto['gesto'] == 'menu_contextual':
                if not self.right_clicking:
                    pyautogui.rightClick()
                    self.right_clicking = True
            elif info_gesto['gesto'] == 'zoom_in':
                pyautogui.scroll(10)  # Scroll hacia arriba
            elif info_gesto['gesto'] == 'zoom_out':
                pyautogui.scroll(-10)  # Scroll hacia abajo
            else:
                # Si no hay gestos activos, liberar el mouse
                if self.clicking or self.dragging:
                    pyautogui.mouseUp()
                    self.clicking = False
                    self.dragging = False
                self.right_clicking = False
        
    def cambiar_modo(self, nuevo_modo):
        """Cambia entre modo 'pantalla' y 'mesa'"""
        if nuevo_modo in ["pantalla", "mesa"]:
            self.modo = nuevo_modo
            print(f"Modo cambiado a: {nuevo_modo}")
            
            # Reiniciar estados
            self.clicking = False
            self.right_clicking = False
            self.dragging = False
            self.punto_inicial_arrastre = None
            self.zoom_mode = False
            self.haciendo_zoom = False
            self.historial_posiciones = []
            
            # Si cambiamos a modo mesa y no está calibrado, activar calibración
            if nuevo_modo == "mesa" and not self.calibracion_completada:
                self.iniciar_calibracion()
    
    def iniciar_calibracion(self):
        """Inicia el proceso de calibración"""
        self.en_calibracion = True
        self.puntos_calibracion_camara = []
        self.puntos_calibracion_proyeccion = []
        self.punto_seleccionado = False
        self.punto_actual_calibracion = 0
        self.ultimo_gesto_tiempo = time.time()
        self.calibracion_cancelada = False
        self.mostrar_mensaje("Iniciando calibración. Usa gesto de 'pinza' para seleccionar puntos", 3)
        print("Iniciando calibración. Define las 4 esquinas con el gesto de 'pinza'.")
    
    def calibrar_mesa(self, puntos_camara, puntos_proyeccion):
        """
        Calibra la matriz de transformación entre la cámara y la proyección
        """
        # Convertir listas a arreglos numpy
        puntos_camara_np = np.array(puntos_camara, dtype=np.float32)
        puntos_proyeccion_np = np.array(puntos_proyeccion, dtype=np.float32)
        
        # Calcular matriz de homografía
        self.matriz_transformacion, _ = cv2.findHomography(
            puntos_camara_np, 
            puntos_proyeccion_np, 
            cv2.RANSAC, 5.0
        )
        
        print("Matriz de calibración calculada")
        
        # Guardar la matriz en un archivo para futuro uso
        np.save(f"calibracion_matriz_camara_{self.camera_id}.npy", self.matriz_transformacion)
        print(f"Matriz de calibración guardada en 'calibracion_matriz_camara_{self.camera_id}.npy'")
    

    
    def _transformar_coordenadas(self, punto):
        """Transforma coordenadas de la cámara al espacio de proyección/pantalla"""
        # Convertir a coordenadas homogéneas
        punto_h = np.array([punto[0], punto[1], 1.0])
        
        # Aplicar transformación
        punto_transformado = np.dot(self.matriz_transformacion, punto_h)
        
        # Normalizar y convertir de vuelta a coordenadas cartesianas
        if punto_transformado[2] != 0:  # Evitar división por cero
            punto_transformado = punto_transformado / punto_transformado[2]
        
        return (int(punto_transformado[0]), int(punto_transformado[1]))
    
    def _calcular_distancia(self, punto1, punto2):
        """Calcula la distancia euclidiana entre dos puntos"""
        return np.sqrt((punto1[0] - punto2[0])**2 + (punto1[1] - punto2[1])**2)
    
    def _es_puño_cerrado(self, puntos, factor_escala=1.0):
        """
        Detecta si la mano forma un puño cerrado
        Versión mejorada para funcionar a distancia variable
        
        Args:
            puntos: Lista de puntos de la mano detectados por MediaPipe
            factor_escala: Factor de escala basado en el tamaño de la mano (para ajuste por distancia)
        
        Returns:
            bool: True si la mano forma un puño cerrado, False en caso contrario
        """
        # Puntos clave para detección
        punta_dedos = [puntos[8], puntos[12], puntos[16], puntos[20]]  # puntas de dedos
        base_dedos = [puntos[5], puntos[9], puntos[13], puntos[17]]    # bases de dedos
        palma = puntos[0]  # base de la palma
        
        # Calcular la distancia promedio de bases de dedos a la palma (para escala)
        distancia_base_palma = sum(self._calcular_distancia(base, palma) for base in base_dedos) / 4
        
        # MEJORADO: Umbral adaptativo basado en el tamaño de la mano y distancia
        umbral_flexion = 10 * factor_escala  # Umbral para considerar un dedo como doblado
        
        # Verificar si los dedos están doblados (usando un enfoque más robusto)
        dedos_doblados = 0
        for i, (punta, base) in enumerate(zip(punta_dedos, base_dedos)):
            # Un dedo está doblado si:
            # 1. La punta está por debajo de la base (coordenada y mayor)
            # 2. O la distancia de la punta a la palma es significativamente menor que la distancia base-palma
            esta_debajo = punta[1] > base[1] + umbral_flexion
            dist_punta_palma = self._calcular_distancia(punta, palma)
            dist_base_palma = self._calcular_distancia(base, palma)
            esta_contraido = dist_punta_palma < dist_base_palma * 0.8
            
            if esta_debajo or esta_contraido:
                dedos_doblados += 1
        
        # NUEVO: Verificaciones adicionales para puño cerrado
        # 1. La distancia entre puntas de dedos debe ser pequeña (dedos juntos)
        distancias_entre_puntas = []
        for i in range(len(punta_dedos)):
            for j in range(i+1, len(punta_dedos)):
                distancias_entre_puntas.append(self._calcular_distancia(punta_dedos[i], punta_dedos[j]))
        
        # Si la distancia promedio entre puntas es pequeña en relación al tamaño de la mano
        puntas_juntas = False
        if distancias_entre_puntas:  # Verificar que la lista no esté vacía
            distancia_media_puntas = sum(distancias_entre_puntas) / len(distancias_entre_puntas)
            umbral_puntas_juntas = distancia_base_palma * 0.6  # 60% de la distancia base-palma
            puntas_juntas = distancia_media_puntas < umbral_puntas_juntas
        
        # 2. Verificar forma compacta del puño (la relación entre ancho y alto de la mano)
        puntos_mano_x = [p[0] for p in puntos[1:]]  # Excluir muñeca
        puntos_mano_y = [p[1] for p in puntos[1:]]
        
        ancho_mano = max(puntos_mano_x) - min(puntos_mano_x)
        alto_mano = max(puntos_mano_y) - min(puntos_mano_y)
        
        # Un puño es más compacto (relación ancho/alto cercana a 1) que una mano abierta
        ratio_aspecto = ancho_mano / max(alto_mano, 1)  # Evitar división por cero
        forma_compacta = 0.6 < ratio_aspecto < 1.3  # Rango ajustado para puño
        
        # Criterios para determinar un puño cerrado:
        # - Al menos 3 dedos doblados 
        # - Forma compacta de la mano
        es_puno = dedos_doblados >= 3 and forma_compacta
        
        # Si estamos a mayor distancia (factor_escala alto), ser menos estrictos
        if factor_escala > 1.2:
            es_puno = dedos_doblados >= 3  # Solo requerir dedos doblados a mayor distancia
        
        return es_puno
def main():
    """Función principal que ejecuta el programa"""
    # Lista de cámaras disponibles
    camaras_disponibles = []
    max_camaras = 5  # Buscar hasta 5 cámaras

    # Encontrar cámaras disponibles
    for i in range(max_camaras):
        cap = cv2.VideoCapture(i)
        if cap.isOpened():
            camaras_disponibles.append(i)
            cap.release()
    
    if not camaras_disponibles:
        print("Error: No se detectaron cámaras disponibles.")
        return
    
    # Mostrar cámaras disponibles
    print("\n=== Cámaras detectadas ===")
    for i, cam_id in enumerate(camaras_disponibles):
        print(f"{i+1}. Cámara ID: {cam_id}")
    
    # Seleccionar cámara
    camera_id = 0  # Por defecto, webcam integrada
    
    if len(camaras_disponibles) > 1:
        while True:
            try:
                seleccion = input(f"\nSelecciona una cámara (1-{len(camaras_disponibles)}) o presiona Enter para usar la predeterminada: ")
                if seleccion == "":
                    camera_id = camaras_disponibles[0]
                    break
                seleccion = int(seleccion)
                if 1 <= seleccion <= len(camaras_disponibles):
                    camera_id = camaras_disponibles[seleccion-1]
                    break
                else:
                    print("Selección inválida. Intenta de nuevo.")
            except ValueError:
                print("Por favor, ingresa un número válido.")
    
    # Inicializar la cámara seleccionada
    cap = cv2.VideoCapture(camera_id)
    
    # Verificar si la cámara se abrió correctamente
    if not cap.isOpened():
        print(f"Error: No se pudo abrir la cámara ID {camera_id}.")
        return
    
    # Optimizar configuración de la cámara
    cap.set(cv2.CAP_PROP_FRAME_WIDTH, 640)  # Resolución reducida para mejor rendimiento
    cap.set(cv2.CAP_PROP_FRAME_HEIGHT, 480)
    cap.set(cv2.CAP_PROP_FPS, 30)  # Intentar configurar a 30 FPS
    
    # Crear controlador de gestos (por defecto en modo 'pantalla')
    controlador = ControladorGestos(modo="pantalla", camera_id=camera_id)
    
    # Variables para cambiar entre modos
    modo_actual = "pantalla"
    
    print("\n=== Sistema Optimizado de Control por Gestos ===")
    print(f"Usando cámara ID: {camera_id}")
    print("Modo actual: Control del cursor de pantalla")
    print("\nGestos disponibles:")
    print("  - Mano abierta: Mover el cursor (el índice controla la posición)")
    print("  - Pulgar + Índice juntos: Click izquierdo / Arrastrar")
    print("  - Pulgar + Dedo medio juntos: Click derecho")
    print("  - Gesto de 'pistola' (índice extendido + pulgar levantado): Seleccionar")
    print("  - Dos puños: Zoom (acercar/alejar según la distancia)")
    print("\nControles:")
    print("  - Presiona 'q' para salir")
    print("  - Presiona 'm' para cambiar entre modo 'pantalla' y 'mesa'")
    print("  - Presiona 'c' para iniciar calibración manual")
    print("  - Presiona '1'-'9' para cambiar entre cámaras disponibles")
    print("  - Presiona 'r' para reiniciar la calibración")
    print("\nEn modo calibración:")
    print("  - Usa el gesto de 'pistola' para seleccionar puntos")
    print("  - Mantén click derecho para cancelar o retroceder puntos")
    
    # Establecer la ventana en una posición que no interfiera
    cv2.namedWindow('Control por Gestos', cv2.WINDOW_NORMAL)
    cv2.moveWindow('Control por Gestos', 50, 50)
    
    # Dimensiones de la ventana
    width = int(cap.get(cv2.CAP_PROP_FRAME_WIDTH))
    height = int(cap.get(cv2.CAP_PROP_FRAME_HEIGHT))
    cv2.resizeWindow('Control por Gestos', width, height)
    
    # Configurar pyautogui para reducir latencia
    pyautogui.PAUSE = 0.01  # Tiempo mínimo entre comandos
    
    # Intentar cargar calibración previa para esta cámara
    try:
        matriz_cargada = np.load(f"calibracion_matriz_camara_{camera_id}.npy")
        controlador.matriz_transformacion = matriz_cargada
        controlador.calibracion_completada = True
        print(f"Calibración cargada desde 'calibracion_matriz_camara_{camera_id}.npy'")
    except:
        print("No se encontró archivo de calibración previo para esta cámara.")
    
    # Variables para medir FPS
    fps_start_time = 0
    fps_counter = 0
    fps = 0
    
    # Bucle principal
    while cap.isOpened():
        # Medir FPS
        if fps_counter == 0:
            fps_start_time = time.time()
        
        # Capturar frame
        ret, frame = cap.read()
        if not ret:
            print("Error al capturar el frame.")
            break
        
        # Voltear horizontalmente para una visualización más natural
        frame = cv2.flip(frame, 1)
        
        # Procesar frame
        frame_procesado, info_gesto = controlador.procesar_frame(frame)
        
        # Contar frames para FPS
        fps_counter += 1
        if fps_counter >= 10:  # Calcular FPS cada 10 frames
            fps = 10 / (time.time() - fps_start_time)
            fps_counter = 0
        
        # Mostrar FPS y modo actual
        modo_texto = "PANTALLA" if modo_actual == "pantalla" else "MESA"
        calibracion_texto = " - CALIBRADO" if controlador.calibracion_completada and modo_actual == "mesa" else ""
        
        cv2.putText(frame_procesado, f"Modo: {modo_texto}{calibracion_texto} | Cámara: {camera_id} | FPS: {fps:.1f}", 
                  (10, 30), cv2.FONT_HERSHEY_SIMPLEX, 0.6, (0, 155, 255), 2)
        
        # Mostrar frame procesado
        cv2.imshow('Control por Gestos', frame_procesado)
        
        # Gestionar teclas
        key = cv2.waitKey(1) & 0xFF
        
        # Salir con 'q'
        if key == ord('q'):
            break
        
        # Cambiar modo con 'm'
        elif key == ord('m'):
            if modo_actual == "pantalla":
                modo_actual = "mesa"
                controlador.cambiar_modo("mesa")
                print("Cambiado a modo: Mesa/Pizarra")
            else:
                modo_actual = "pantalla"
                controlador.cambiar_modo("pantalla")
                print("Cambiado a modo: Control de Pantalla")
        
        # Iniciar calibración manual con 'c'
        elif key == ord('c'):
            if modo_actual == "mesa":
                print("Iniciando calibración manual...")
                controlador.iniciar_calibracion()
        
        # Reiniciar calibración con 'r'
        elif key == ord('r'):
            print("Reiniciando calibración...")
            controlador.en_calibracion = True
            controlador.puntos_calibracion_camara = []
            # Limpiar variables de control de calibración si existen
            if hasattr(controlador, 'contador_estabilidad'):
                controlador.contador_estabilidad = 0
            if hasattr(controlador, 'ultima_posicion'):
                controlador.ultima_posicion = None
            if hasattr(controlador, 'ultimo_gesto'):
                controlador.ultimo_gesto = 'ninguno'
            if hasattr(controlador, 'contador_gesto'):
                controlador.contador_gesto = 0
            if hasattr(controlador, 'tiempo_ultimo_cambio'):
                controlador.tiempo_ultimo_cambio = time.time()
            print("Calibración reiniciada. Define las 4 esquinas de tu mesa/pizarra.")
                
        # Cambiar cámara con teclas numéricas
        elif ord('1') <= key <= ord('9'):
            cam_idx = key - ord('1')
            if cam_idx < len(camaras_disponibles):
                new_camera_id = camaras_disponibles[cam_idx]
                
                # Cerrar cámara actual
                cap.release()
                
                # Abrir nueva cámara
                cap = cv2.VideoCapture(new_camera_id)
                if cap.isOpened():
                    print(f"Cambiando a cámara ID: {new_camera_id}")
                    camera_id = new_camera_id
                    controlador.cambiar_camara(new_camera_id)
                    
                    # Configurar nueva cámara
                    cap.set(cv2.CAP_PROP_FRAME_WIDTH, 640)
                    cap.set(cv2.CAP_PROP_FRAME_HEIGHT, 480)
                    cap.set(cv2.CAP_PROP_FPS, 30)
                    
                    # Intentar cargar calibración para esta cámara
                    try:
                        matriz_cargada = np.load(f"calibracion_matriz_camara_{camera_id}.npy")
                        controlador.matriz_transformacion = matriz_cargada
                        controlador.calibracion_completada = True
                        print(f"Calibración cargada para cámara {camera_id}")
                    except:
                        controlador.calibracion_completada = False
                        print("No hay calibración guardada para esta cámara")
                else:
                    print(f"No se pudo abrir la cámara ID: {new_camera_id}")
                    # Reabrir la cámara anterior
                    cap = cv2.VideoCapture(camera_id)
    
    # Liberar recursos
    cap.release()
    cv2.destroyAllWindows()

    def detectar_distancia_y_calibrar(self, puntos):
        """
        Detecta la distancia aproximada entre la persona y la cámara
        y calibra los umbrales de gestos adecuadamente.
        
        Args:
            puntos: Lista de puntos de la mano detectados por MediaPipe
            
        Returns:
            dict: Diccionario con información de distancia y umbrales calibrados
        """
        # Puntos clave para referencias
        palma = puntos[0]  # Base de la palma/muñeca
        indice_punta = puntos[8]  # Punta del índice
        indice_base = puntos[5]  # Base del índice
        dedo_medio_base = puntos[9]  # Base del dedo medio
        meñique_base = puntos[17]  # Base del meñique
        
        # 1. Calcular tamaño de la mano usando múltiples métricas
        
        # Distancia diagonal de la palma (desde muñeca hasta base del dedo medio)
        diagonal_palma = self._calcular_distancia(palma, dedo_medio_base)
        
        # Anchura de la palma (distancia entre bases del índice y meñique)
        anchura_palma = self._calcular_distancia(indice_base, meñique_base)
        
        # Longitud del dedo índice
        longitud_indice = self._calcular_distancia(indice_punta, indice_base)
        
        # 2. Determinar el factor de distancia
        # Estos valores son aproximados basados en una mano a distancia normal
        diagonal_referencia = 130  # Valor típico a unos 40-50cm de la cámara
        anchura_referencia = 100
        indice_referencia = 80
        
        # Calcular factores por cada métrica (mayor valor = mayor distancia)
        factor_diagonal = diagonal_referencia / max(diagonal_palma, 1)  # Evitar división por cero
        factor_anchura = anchura_referencia / max(anchura_palma, 1)
        factor_indice = indice_referencia / max(longitud_indice, 1)
        
        # Combinar los factores dando más peso a las medidas más estables
        factor_distancia = (factor_diagonal * 0.5 + factor_anchura * 0.3 + factor_indice * 0.2)
        
        # 3. Categorizar la distancia aproximada
        if factor_distancia < 0.8:
            categoria_distancia = "muy_cerca"
        elif factor_distancia < 1.2:
            categoria_distancia = "distancia_normal"
        elif factor_distancia < 2:
            categoria_distancia = "distancia_media"
        else:
            categoria_distancia = "distancia_lejana"
        
        # 4. Calibrar umbrales según la distancia
        
        # Umbral para detectar pinza entre dedos (pulgar-índice, pulgar-medio)
        if categoria_distancia == "muy_cerca":
            umbral_pinza = longitud_indice * 0.25  # Muy estricto cuando está muy cerca
        elif categoria_distancia == "distancia_normal":
            umbral_pinza = longitud_indice * 0.35  # Valor estándar
        elif categoria_distancia == "distancia_media":
            umbral_pinza = longitud_indice * 0.45  # Más permisivo
        else:  # distancia_lejana
            umbral_pinza = longitud_indice * 0.55  # Mucho más permisivo a distancia
        
        # Umbral mínimo y máximo para evitar valores extremos
        umbral_pinza = max(20, min(umbral_pinza, 100))
        
        # 5. Crear diccionario con todos los datos calibrados
        calibracion = {
            'factor_distancia': factor_distancia,
            'categoria_distancia': categoria_distancia,
            'umbral_pinza': umbral_pinza,
            'diagonal_palma': diagonal_palma,
            'anchura_palma': anchura_palma,
            'longitud_indice': longitud_indice
        }
        
        return calibracion

if __name__ == "__main__":
    main()