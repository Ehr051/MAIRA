import cv2
import numpy as np
import tkinter as tk
from tkinter import ttk
from PIL import Image, ImageTk
import threading
import time
from detectorGestos import ControladorGestos


class InterfazGestos:
    """Clase para manejar la interfaz de usuario del control por gestos"""
    
    def __init__(self, controlador_gestos):
        self.controlador = controlador_gestos
        self.modo_actual = "pantalla"
        self.ventana_minimizada = False
        self.mostrar_depuracion = True
        self.tema_oscuro = True
        
        # Inicializar ventana principal con Tkinter
        self.root = tk.Tk()
        self.root.title("Control por Gestos")
        self.root.geometry("800x600")
        self.root.protocol("WM_DELETE_WINDOW", self.salir)
        
        # Configurar estilo
        self.estilo = ttk.Style()
        self.aplicar_tema()
        
        # Crear frame principal
        self.frame_principal = ttk.Frame(self.root)
        self.frame_principal.pack(fill=tk.BOTH, expand=True)
        
        # Panel superior con controles
        self.frame_controles = ttk.Frame(self.frame_principal)
        self.frame_controles.pack(fill=tk.X, padx=10, pady=10)
        
        # Título
        ttk.Label(self.frame_controles, text="Control por Gestos", 
                 font=("Helvetica", 16, "bold")).pack(side=tk.LEFT, padx=10)
        
        # Selector de modo
        ttk.Label(self.frame_controles, text="Modo:").pack(side=tk.LEFT, padx=(20, 5))
        self.modo_var = tk.StringVar(value="pantalla")
        modo_combo = ttk.Combobox(self.frame_controles, textvariable=self.modo_var, 
                                 values=["pantalla", "mesa"], width=10, state="readonly")
        modo_combo.pack(side=tk.LEFT, padx=5)
        modo_combo.bind("<<ComboboxSelected>>", self.cambiar_modo)
        
        # Botón de calibración
        self.btn_calibrar = ttk.Button(self.frame_controles, text="Calibrar", 
                                     command=self.iniciar_calibracion)
        self.btn_calibrar.pack(side=tk.LEFT, padx=10)
        
        # Botón de minimizar/restaurar
        self.btn_minimizar = ttk.Button(self.frame_controles, text="Minimizar", 
                                      command=self.toggle_minimizar)
        self.btn_minimizar.pack(side=tk.LEFT, padx=10)
        
        # Switch para depuración
        self.debug_var = tk.BooleanVar(value=True)
        ttk.Checkbutton(self.frame_controles, text="Información", 
                       variable=self.debug_var, command=self.toggle_depuracion).pack(side=tk.LEFT, padx=10)
        
        # Switch para tema
        self.tema_var = tk.BooleanVar(value=True)
        ttk.Checkbutton(self.frame_controles, text="Tema Oscuro", 
                       variable=self.tema_var, command=self.toggle_tema).pack(side=tk.LEFT, padx=10)
        
        # Botón de salir
        self.btn_salir = ttk.Button(self.frame_controles, text="Salir", 
                                   command=self.salir)
        self.btn_salir.pack(side=tk.RIGHT, padx=10)
        
        # Panel de visualización
        self.frame_video = ttk.Frame(self.frame_principal)
        self.frame_video.pack(fill=tk.BOTH, expand=True, padx=10, pady=10)
        
        # Etiqueta para mostrar el video
        self.lbl_video = ttk.Label(self.frame_video)
        self.lbl_video.pack(fill=tk.BOTH, expand=True)
        
        # Panel de estado
        self.frame_estado = ttk.Frame(self.frame_principal)
        self.frame_estado.pack(fill=tk.X, padx=10, pady=5)
        
        # Información de estado
        self.lbl_estado = ttk.Label(self.frame_estado, text="Iniciando...", font=("Helvetica", 10))
        self.lbl_estado.pack(side=tk.LEFT)
        
        # Contador FPS
        self.lbl_fps = ttk.Label(self.frame_estado, text="FPS: 0", font=("Helvetica", 10))
        self.lbl_fps.pack(side=tk.RIGHT)
        
        # Variables para el manejo de video
        self.cap = None
        self.ejecutando = False
        self.ultimo_frame = None
        self.fps = 0
        
        # Interfaz minimalista para cuando esté minimizado
        self.ventana_mini = None
    
    def aplicar_tema(self):
        """Aplica el tema oscuro o claro a la interfaz"""
        if self.tema_oscuro:
            # Tema oscuro
            self.root.configure(bg="#2E2E2E")
            self.estilo.configure("TFrame", background="#2E2E2E")
            self.estilo.configure("TLabel", background="#2E2E2E", foreground="#FFFFFF")
            self.estilo.configure("TButton", background="#3E3E3E", foreground="#FFFFFF")
            self.estilo.configure("TCheckbutton", background="#2E2E2E", foreground="#FFFFFF")
            self.estilo.map('TCheckbutton', background=[('active', '#3E3E3E')])
            self.estilo.configure("TCombobox", fieldbackground="#3E3E3E", foreground="#000000")
        else:
            # Tema claro
            self.root.configure(bg="#F0F0F0")
            self.estilo.configure("TFrame", background="#F0F0F0")
            self.estilo.configure("TLabel", background="#F0F0F0", foreground="#000000")
            self.estilo.configure("TButton", background="#E0E0E0", foreground="#000000")
            self.estilo.configure("TCheckbutton", background="#F0F0F0", foreground="#000000")
            self.estilo.map('TCheckbutton', background=[('active', '#E0E0E0')])
            self.estilo.configure("TCombobox", fieldbackground="#FFFFFF", foreground="#000000")
    
    def toggle_tema(self):
        """Cambia entre tema oscuro y claro"""
        self.tema_oscuro = self.tema_var.get()
        self.aplicar_tema()
    
    def toggle_depuracion(self):
        """Activa/desactiva la información de depuración"""
        self.mostrar_depuracion = self.debug_var.get()
    
    def toggle_minimizar(self):
        """Alterna entre vista completa y minimizada"""
        if self.ventana_minimizada:
            # Restaurar
            if self.ventana_mini:
                self.ventana_mini.destroy()
                self.ventana_mini = None
            
            self.root.deiconify()
            self.btn_minimizar.configure(text="Minimizar")
            self.ventana_minimizada = False
        else:
            # Minimizar
            self.root.withdraw()  # Ocultar ventana principal
            self.ventana_minimizada = True
            self.btn_minimizar.configure(text="Restaurar")
            self.crear_ventana_mini()
    
    def crear_ventana_mini(self):
        """Crea una ventana minimizada flotante"""
        self.ventana_mini = tk.Toplevel()
        self.ventana_mini.title("Control Gestos - Mini")
        self.ventana_mini.geometry("320x240")
        self.ventana_mini.attributes('-topmost', True)  # Siempre visible
        self.ventana_mini.protocol("WM_DELETE_WINDOW", self.toggle_minimizar)
        
        # Panel principal
        mini_frame = ttk.Frame(self.ventana_mini)
        mini_frame.pack(fill=tk.BOTH, expand=True)
        
        # Etiqueta para mostrar video
        self.lbl_mini_video = ttk.Label(mini_frame)
        self.lbl_mini_video.pack(fill=tk.BOTH, expand=True)
        
        # Panel inferior con controles mínimos
        mini_controles = ttk.Frame(self.ventana_mini)
        mini_controles.pack(fill=tk.X, pady=5)
        
        # Botón para restaurar
        ttk.Button(mini_controles, text="Restaurar", 
                  command=self.toggle_minimizar).pack(side=tk.LEFT, padx=5)
        
        # Etiqueta de estado
        self.lbl_mini_estado = ttk.Label(mini_controles, text="Activo")
        self.lbl_mini_estado.pack(side=tk.RIGHT, padx=5)
    
    def cambiar_modo(self, event=None):
        """Cambia el modo de funcionamiento"""
        nuevo_modo = self.modo_var.get()
        self.modo_actual = nuevo_modo
        self.controlador.cambiar_modo(nuevo_modo)
        
        # Actualizar estado
        if nuevo_modo == "mesa" and not self.controlador.calibracion_completada:
            self.actualizar_estado("Modo mesa: Necesita calibración")
        else:
            self.actualizar_estado(f"Modo: {nuevo_modo}")
    
    def iniciar_calibracion(self):
        """Inicia el proceso de calibración"""
        if self.modo_actual == "mesa":
            self.controlador.iniciar_calibracion()
            self.actualizar_estado("Calibración iniciada")
    
    def actualizar_estado(self, mensaje):
        """Actualiza los mensajes de estado"""
        self.lbl_estado.configure(text=mensaje)
        if self.ventana_minimizada and self.ventana_mini:
            self.lbl_mini_estado.configure(text=mensaje)
    
    def actualizar_fps(self, fps):
        """Actualiza el contador de FPS"""
        self.lbl_fps.configure(text=f"FPS: {fps:.1f}")
    
    def iniciar_captura(self, camara_id=0):
        """Inicia la captura de video"""
        if self.cap is not None:
            self.cap.release()
        
        self.cap = cv2.VideoCapture(camara_id)
        if not self.cap.isOpened():
            self.actualizar_estado(f"Error: No se pudo abrir la cámara {camara_id}")
            return False
        
        # Configurar cámara
        self.cap.set(cv2.CAP_PROP_FRAME_WIDTH, 640)
        self.cap.set(cv2.CAP_PROP_FRAME_HEIGHT, 480)
        self.cap.set(cv2.CAP_PROP_FPS, 30)
        
        # Iniciar thread de captura
        self.ejecutando = True
        threading.Thread(target=self.bucle_captura, daemon=True).start()
        
        self.actualizar_estado(f"Cámara {camara_id} iniciada")
        return True
    
    def bucle_captura(self):
        """Bucle principal de captura de video"""
        tiempo_inicio = time.time()
        contador_frames = 0
        
        while self.ejecutando and self.cap is not None:
            ret, frame = self.cap.read()
            if not ret:
                self.actualizar_estado("Error al capturar frame")
                break
            
            # Voltear horizontalmente
            frame = cv2.flip(frame, 1)
            
            # Procesar frame con el controlador
            frame_procesado, info_gesto = self.controlador.procesar_frame(frame)
            
            # Mostrar/ocultar información de depuración
            if not self.mostrar_depuracion:
                # Crear versión limpia sin textos de depuración
                frame_procesado = self.limpiar_frame_depuracion(frame_procesado, frame)
            
            # Calcular FPS
            contador_frames += 1
            tiempo_actual = time.time()
            tiempo_transcurrido = tiempo_actual - tiempo_inicio
            
            if tiempo_transcurrido >= 1.0:  # Actualizar FPS cada segundo
                self.fps = contador_frames / tiempo_transcurrido
                contador_frames = 0
                tiempo_inicio = tiempo_actual
                
                # Actualizar FPS en la interfaz (en el thread principal)
                self.root.after(0, self.actualizar_fps, self.fps)
            
            # Guardar el último frame para mostrarlo
            self.ultimo_frame = frame_procesado
            
            # Actualizar la interfaz (en el thread principal)
            self.root.after(0, self.mostrar_frame)
            
            # Pequeña pausa para no saturar la CPU
            time.sleep(0.01)
    
    def limpiar_frame_depuracion(self, frame_procesado, frame_original):
        """Crea una versión más limpia del frame sin textos de depuración"""
        # Copiar frame original
        frame_limpio = frame_original.copy()
        
        # Mantener solo puntos de mano y círculos de cursor
        # Esto requiere modificar el controlador para separar visualización y procesamiento
        # Por ahora, simplemente reducimos textos de depuración
        
        altura, ancho, _ = frame_procesado.shape
        
        # Crear máscara para elementos visuales importantes (círculos, líneas)
        mask = np.zeros_like(frame_procesado)
        
        # Detectar círculos y líneas usando diferencia de color
        diff = cv2.absdiff(frame_procesado, frame_original)
        diff_gray = cv2.cvtColor(diff, cv2.COLOR_BGR2GRAY)
        _, thresh = cv2.threshold(diff_gray, 30, 255, cv2.THRESH_BINARY)
        
        # Dilatar para conectar áreas
        kernel = np.ones((5,5), np.uint8)
        dilated = cv2.dilate(thresh, kernel, iterations=1)
        
        # Extraer contornos
        contours, _ = cv2.findContours(dilated, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)
        
        # Dibujar contornos en la máscara
        cv2.drawContours(mask, contours, -1, (255, 255, 255), -1)
        
        # Aplicar máscara al frame original
        frame_limpio = cv2.bitwise_and(frame_procesado, mask)
        gray_bg = cv2.cvtColor(frame_original, cv2.COLOR_BGR2GRAY)
        gray_bg = cv2.cvtColor(gray_bg, cv2.COLOR_GRAY2BGR)
        mask_inv = cv2.bitwise_not(mask)
        bg = cv2.bitwise_and(gray_bg, mask_inv)
        
        # Combinar
        frame_limpio = cv2.add(frame_limpio, bg)
        
        # Añadir información mínima
        if self.controlador.en_calibracion:
            cv2.putText(frame_limpio, "CALIBRACIÓN EN PROCESO", 
                      (ancho//2 - 150, 30), cv2.FONT_HERSHEY_SIMPLEX, 0.8, (0, 0, 255), 2)
        else:
            if self.modo_actual == "mesa":
                texto_estado = "MESA" + (" CALIBRADA" if self.controlador.calibracion_completada else " NO CALIBRADA")
            else:
                texto_estado = "CONTROL DE PANTALLA"
            
            cv2.putText(frame_limpio, texto_estado, 
                      (10, 30), cv2.FONT_HERSHEY_SIMPLEX, 0.7, (0, 155, 255), 2)
        
        return frame_limpio
    
    def mostrar_frame(self):
        """Muestra el último frame capturado en la interfaz"""
        if self.ultimo_frame is None:
            return
        
        # Convertir de BGR a RGB para Tkinter
        frame_rgb = cv2.cvtColor(self.ultimo_frame, cv2.COLOR_BGR2RGB)
        
        # Convertir a formato PIL
        img_pil = Image.fromarray(frame_rgb)
        
        # Redimensionar para ventana principal
        height, width, _ = self.ultimo_frame.shape
        # Obtener tamaño del contenedor
        contenedor_width = self.frame_video.winfo_width()
        contenedor_height = self.frame_video.winfo_height()
        
        if contenedor_width > 1 and contenedor_height > 1:
            # Calcular escala manteniendo proporción
            ratio = min(contenedor_width/width, contenedor_height/height)
            new_width = int(width * ratio)
            new_height = int(height * ratio)
            
            img_pil = img_pil.resize((new_width, new_height), Image.LANCZOS)
        
        # Convertir a formato Tkinter
        img_tk = ImageTk.PhotoImage(image=img_pil)
        
        # Mostrar en la etiqueta principal
        self.lbl_video.configure(image=img_tk)
        self.lbl_video.image = img_tk  # Mantener referencia
        
        # Si está minimizado, actualizar también la ventana mini
        if self.ventana_minimizada and self.ventana_mini:
            # Redimensionar para ventana mini
            mini_img = img_pil.resize((320, 240), Image.LANCZOS)
            mini_tk = ImageTk.PhotoImage(image=mini_img)
            
            self.lbl_mini_video.configure(image=mini_tk)
            self.lbl_mini_video.image = mini_tk
    
    def salir(self):
        """Cierra la aplicación"""
        self.ejecutando = False
        if self.cap is not None:
            self.cap.release()
        
        # Destruir ventanas
        if self.ventana_mini:
            self.ventana_mini.destroy()
        self.root.destroy()
    
    def ejecutar(self):
        """Ejecuta la aplicación"""
        # Centrar ventana
        self.root.update_idletasks()
        ancho = self.root.winfo_width()
        alto = self.root.winfo_height()
        x = (self.root.winfo_screenwidth() // 2) - (ancho // 2)
        y = (self.root.winfo_screenheight() // 2) - (alto // 2)
        self.root.geometry(f'+{x}+{y}')
        
        # Iniciar bucle principal
        self.root.mainloop()


# Modificación a la función principal para usar la nueva interfaz
def main():
    """Función principal para iniciar el programa con la nueva interfaz"""
    # Crear controlador de gestos
    controlador = ControladorGestos(modo="pantalla")
    
    # Crear interfaz
    interfaz = InterfazGestos(controlador)
    
    # Iniciar captura de video
    if interfaz.iniciar_captura(0):  # Iniciar con cámara 0
        interfaz.ejecutar()
    
    # Al finalizar
    cv2.destroyAllWindows()


if __name__ == "__main__":
    main()