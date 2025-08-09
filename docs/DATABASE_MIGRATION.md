# 🗄️ Guía de Migración de Base de Datos MAIRA

## 📋 Opciones para tu Base de Datos Actual

### Opción 1: 🏠 **Mantener XAMPP Local para Desarrollo**
Esta es la opción **MÁS RECOMENDADA** para preservar tu trabajo actual:

```bash
# Tu entorno de desarrollo (XAMPP)
MYSQL_HOST=localhost
MYSQL_USER=root
MYSQL_PASSWORD=
MYSQL_DATABASE=maira
MYSQL_PORT=3306
```

```bash
# Tu entorno de producción (Render.com)
MYSQL_HOST=your-cloud-mysql-host.com
MYSQL_USER=cloud_user
MYSQL_PASSWORD=cloud_password
MYSQL_DATABASE=maira_prod
MYSQL_PORT=3306
```

**✅ Ventajas:**
- Mantienes tu base de datos actual intacta
- Desarrollo local rápido y familiar
- Base de datos de producción separada y segura
- No pierdes ningún dato existente

---

### Opción 2: 📤 **Migrar Base de Datos Completa**

#### A. Exportar desde XAMPP (phpMyAdmin)

1. **Abrir phpMyAdmin:**
   ```bash
   # Ir a: http://localhost/phpmyadmin
   ```

2. **Exportar base de datos:**
   - Seleccionar base de datos `maira`
   - Clic en "Exportar"
   - Método: "Rápido"
   - Formato: "SQL"
   - ✅ Descargar archivo `maira.sql`

3. **Exportar vía terminal (alternativo):**
   ```bash
   # Desde terminal
   cd /Applications/XAMPP/bin
   ./mysqldump -u root -p maira > ~/Desktop/maira_backup.sql
   ```

#### B. Importar a Base de Datos en la Nube

**Para PlanetScale (Recomendado):**
```bash
# 1. Crear cuenta en https://planetscale.com
# 2. Crear base de datos 'maira'
# 3. Obtener cadena de conexión
# 4. Importar datos usando su interfaz web
```

**Para Railway:**
```bash
# 1. Crear cuenta en https://railway.app
# 2. Crear servicio MySQL
# 3. Usar sus herramientas de importación
```

---

### Opción 3: 🔄 **Script de Migración Automática**

```python
# migrate_database.py
import pymysql
import os
from dotenv import load_dotenv

def migrate_xampp_to_cloud():
    # Conexión XAMPP (origen)
    xampp_config = {
        'host': 'localhost',
        'user': 'root',
        'password': '',  # Tu password de XAMPP
        'database': 'maira',
        'port': 3306
    }
    
    # Conexión nube (destino)
    cloud_config = {
        'host': 'tu-host-en-la-nube.com',
        'user': 'tu_usuario_cloud',
        'password': 'tu_password_cloud',
        'database': 'maira_prod',
        'port': 3306
    }
    
    print("🔄 Iniciando migración...")
    # Script completo disponible si lo necesitas
```

---

## 🚀 Pasos Recomendados (Opción 1 - Dual Environment)

### 1. **Mantener tu XAMPP actual funcionando**
```bash
# No toques nada de tu XAMPP actual
# Tu base de datos local sigue funcionando igual
```

### 2. **Configurar base de datos en la nube para producción**
```bash
# Crear cuenta en PlanetScale o Railway
# Obtener credenciales de conexión
# Crear tablas básicas en la nube
```

### 3. **Configurar variables de entorno**
```bash
# Desarrollo (.env para local)
FLASK_ENV=development
MYSQL_HOST=localhost
MYSQL_USER=root
MYSQL_PASSWORD=
MYSQL_DATABASE=maira

# Producción (Render.com)
FLASK_ENV=production
MYSQL_HOST=tu-host-cloud.com
MYSQL_USER=cloud_user
MYSQL_PASSWORD=cloud_password
MYSQL_DATABASE=maira_prod
```

### 4. **Probar localmente**
```bash
cd /Users/mac/Documents/GitHub/MAIRA_git
python app.py
# Debería conectar a tu XAMPP local
```

### 5. **Deploy a Render.com**
```bash
# Render detectará automáticamente el ambiente
# Usará las variables de entorno de producción
```

---

## 🔧 Comandos Útiles

### Verificar Estado XAMPP
```bash
# Ver si MySQL está corriendo
brew services list | grep mysql
# o
sudo /Applications/XAMPP/xamppfiles/bin/mysql.server status
```

### Backup de Seguridad
```bash
# Crear backup completo de tu base actual
/Applications/XAMPP/bin/mysqldump -u root -p --all-databases > ~/Desktop/xampp_full_backup.sql
```

### Probar Conexión
```bash
# Probar conexión local
python -c "
import pymysql
try:
    conn = pymysql.connect(host='localhost', user='root', password='', database='maira')
    print('✅ Conexión XAMPP exitosa')
    conn.close()
except Exception as e:
    print(f'❌ Error: {e}')
"
```

---

## 🎯 Recomendación Final

**MANTÉN TU XAMPP** y agrega la base de datos en la nube para producción. Esto te da:

- ✅ Cero riesgo de perder datos
- ✅ Desarrollo local rápido
- ✅ Producción profesional en la nube
- ✅ Fácil sincronización cuando necesites

¿Con cuál opción quieres continuar?
