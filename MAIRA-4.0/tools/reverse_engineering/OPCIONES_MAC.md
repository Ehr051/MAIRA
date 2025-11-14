# 💻 OPCIONES PARA EJECUTAR BV8 EN MAC

## Problema
BV8 es software Windows (.exe) y necesitamos acceder a su base de datos MySQL para extraer:
- Factores de combate
- Alcances de armas
- Consumos logísticos
- Tiempos de ingenieros
- MTBF de vehículos

## Opciones Disponibles

### ⭐ OPCIÓN 1: Wine (RECOMENDADO - Gratis y Rápido)

**Wine** permite ejecutar aplicaciones Windows en Mac sin virtualización.

**Ventajas:**
- ✅ Gratuito
- ✅ Rápido de instalar (15-20 min)
- ✅ No requiere licencia Windows
- ✅ Acceso directo al filesystem Mac
- ✅ MySQL puede correr nativamente

**Desventajas:**
- ⚠️ Compatibilidad no garantizada al 100%
- ⚠️ Aplicaciones gráficas pueden tener problemas

**Instalación:**
```bash
# Instalar Homebrew si no lo tienes
/bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"

# Instalar Wine
brew install --cask wine-stable

# Verificar
wine --version
```

**Uso:**
```bash
# Ejecutar instalador BV8
wine "/Users/mac/Downloads/Batalla Virtual 8 2019/1 Componentes Base/Servidor de Datos 2019 rev 4.02.02.exe"

# Acceder a archivos Windows desde Mac
cd ~/.wine/drive_c/
```

---

### 🔷 OPCIÓN 2: UTM (Virtualización ARM - Gratis)

**UTM** es una VM gratuita optimizada para Mac Apple Silicon.

**Ventajas:**
- ✅ Gratuito y open source
- ✅ Optimizado para M1/M2/M3
- ✅ Windows completo y estable
- ✅ Snapshots y backups

**Desventajas:**
- ⏱️ Requiere descargar ISO de Windows (4-6 GB)
- ⏱️ Setup inicial largo (1-2 horas)
- 💾 Ocupa espacio (20-30 GB mínimo)

**Instalación:**
```bash
# Instalar UTM
brew install --cask utm

# Descargar Windows 11 ARM ISO
# https://www.microsoft.com/software-download/windowsinsiderpreviewARM64

# Crear VM en UTM con:
# - 4GB RAM mínimo
# - 30GB disco
# - Windows 11 ARM
```

---

### 💰 OPCIÓN 3: Parallels Desktop (Pago - Más Estable)

**Parallels** es la solución comercial más pulida para Mac.

**Ventajas:**
- ✅ Máxima compatibilidad
- ✅ Performance excelente
- ✅ Integración perfecta Mac-Windows
- ✅ Soporte técnico

**Desventajas:**
- 💵 Costo: $99/año (o $129 perpetua)
- 💾 Ocupa espacio similar a UTM

**Instalación:**
```bash
# Descargar desde:
# https://www.parallels.com/

# Trial gratuito de 14 días disponible
```

---

### 🌐 OPCIÓN 4: Acceso Remoto a PC Windows

Si tienes acceso a una PC Windows (trabajo, familiar, amigo):

**Ventajas:**
- ✅ No modificas tu Mac
- ✅ Windows nativo (sin emulación)
- ✅ Rápido si ya tienes acceso

**Desventajas:**
- 🔌 Requiere PC Windows disponible
- 🌐 Requiere conexión de red

**Herramientas:**
- Microsoft Remote Desktop (gratis)
- TeamViewer (gratis uso personal)
- AnyDesk (gratis)

---

## 🎯 RECOMENDACIÓN FINAL

### Para este proyecto, recomiendo **OPCIÓN 1: WINE**

**Razones:**
1. **Rapidez:** Instalación en 15 minutos vs 2 horas VM
2. **Costo:** $0 vs $99 Parallels
3. **Objetivo específico:** Solo necesitamos:
   - Instalar BV8 Servidor de Datos
   - Acceder a MySQL
   - Exportar dump SQL
   - No necesitamos interfaz gráfica completa

**Plan de instalación con Wine:**

```bash
# 1. Instalar Wine (5 min)
brew install --cask wine-stable

# 2. Instalar Servidor de Datos BV8 (10 min)
wine "/Users/mac/Downloads/Batalla Virtual 8 2019/1 Componentes Base/Servidor de Datos 2019 rev 4.02.02.exe"
# Clave: (de Claves de Instalación.txt)

# 3. Localizar instalación MySQL
cd ~/.wine/drive_c/Program\ Files/
find . -name "mysql*" -o -name "*.frm"

# 4. Iniciar MySQL en Wine
wine "C:\Program Files\MySQL\bin\mysqld.exe"

# O MEJOR: Copiar archivos de tablas a MySQL nativo Mac
cp -r ~/.wine/drive_c/Program\ Files/BV8/MySQL/data/ /tmp/bv8_mysql/

# 5. Importar en MySQL Mac nativo
brew install mysql
mysql.server start
mysql -u root -p < /tmp/bv8_mysql/dump.sql
```

---

## 🔄 Plan B: Si Wine falla

Si Wine no funciona con los instaladores de BV8:

### Estrategia híbrida:
1. **Usar Wine para extraer archivos del instalador** (sin ejecutar)
2. **Copiar archivos de tablas MySQL** (.frm, .MYD, .MYI)
3. **Importar en MySQL 5.7 Mac** (compatible con BV8)
4. **Exportar dump SQL limpio**

```bash
# Extraer instalador sin ejecutar
7z x "Servidor de Datos 2019 rev 4.02.02.exe" -o"bv8_extracted"

# Buscar archivos MySQL
find bv8_extracted -name "*.frm" -o -name "*.MYD" -o -name "*.MYI"

# Instalar MySQL 5.7 (compatible con BV8)
brew install mysql@5.7

# Copiar tablas
cp bv8_extracted/mysql/data/* /usr/local/var/mysql/

# Iniciar MySQL
brew services start mysql@5.7

# Exportar
mysqldump -u root --all-databases > bv8_complete.sql
```

---

## ⏱️ Tiempo Estimado por Opción

| Opción | Setup | Extracción | Total |
|--------|-------|------------|-------|
| **Wine** | 15 min | 30 min | **45 min** ⭐ |
| UTM | 2 horas | 30 min | 2.5 horas |
| Parallels | 1 hora | 30 min | 1.5 horas |
| Remoto | 0 min | 1 hora | 1 hora |

---

## 🚀 Próximos Pasos

**¿Qué prefieres?**

1. **Probar Wine** (recomendado, rápido, gratis)
2. **Instalar UTM** (más estable, gratis, más largo)
3. **Usar acceso remoto** (si tienes PC Windows disponible)
4. **Continuar con datos de literatura militar** (plan original)

**Si eliges Wine, ejecuto ahora:**
```bash
brew install --cask wine-stable
```

**Si no funciona Wine, tenemos Plan B listo** 👆
