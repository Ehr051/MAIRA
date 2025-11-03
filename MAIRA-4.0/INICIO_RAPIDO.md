# 🚀 INICIO RÁPIDO - MAIRA 4.0

## ✅ SOLUCIÓN A TU PROBLEMA

El servidor está corriendo en **HTTP** porque falta el flag `--https`.

---

## 🔧 OPCIÓN 1: Usa el Script Correcto (Recomendado)

```bash
# Detén el servidor actual (Ctrl+C en la terminal)
# Luego ejecuta:

cd /Users/mac/Documents/GitHub/MAIRA-WORKSPACE/MAIRA-4.0
chmod +x start_https.sh
./start_https.sh
```

Este script automáticamente:
- ✅ Usa `--https` flag
- ✅ Verifica certificados SSL
- ✅ Inicia en puerto 5001 con HTTPS

---

## 🔧 OPCIÓN 2: Comando Manual

```bash
cd /Users/mac/Documents/GitHub/MAIRA-WORKSPACE/MAIRA-4.0/Server
python3 serverhttps.py --https
```

**Nota:** El flag `--https` es CRÍTICO.

---

## 📊 VERIFICAR MYSQL

Antes de iniciar, verifica que MySQL esté corriendo:

```bash
# Ver servicios
brew services list

# Si MySQL no está activo:
brew services start mysql

# O manualmente:
mysql.server start
```

---

## 🌐 URLS CORRECTAS

Una vez iniciado con `--https`:

```
✅ https://localhost:5001/Client/planeamiento_integrado.html
✅ https://localhost:5001/Client/planeamiento.html
✅ https://localhost:5001/Client/juegodeguerra.html
✅ https://localhost:5001/health
```

---

## 📋 QUÉ DEBERÍAS VER EN LA TERMINAL

### **Inicio correcto:**
```
🚀 Iniciando servidor MAIRA...
📍 Host: 127.0.0.1:5001
🔒 Modo HTTPS: Activado  ← ESTO DEBE DECIR "Activado"
🔐 Iniciando servidor HTTPS...
Conexión exitosa a la base de datos  ← Debería aparecer
 * Running on https://127.0.0.1:5001
```

### **Si ves esto (tu problema actual):**
```
🔒 Modo HTTPS: Desactivado  ← PROBLEMA
🌐 Iniciando servidor HTTP...
```
**Solución:** Detén (Ctrl+C) y reinicia con `--https`

---

## 🐛 TROUBLESHOOTING

### **Problema 1: "Address already in use"**
```bash
# Matar proceso en puerto 5001
lsof -ti:5001 | xargs kill -9
```

### **Problema 2: "Connection refused" (MySQL)**
```bash
# Iniciar MySQL
brew services start mysql

# Verificar que está corriendo
mysql -u root -e "SELECT 1"
```

### **Problema 3: "No module named 'flask'"**
```bash
pip3 install flask flask-socketio flask-cors pymysql python-dotenv bcrypt requests gevent
```

### **Problema 4: Certificados no encontrados**
```bash
# Generar certificados
cd /Users/mac/Documents/GitHub/MAIRA-WORKSPACE/MAIRA-4.0
mkdir -p ssl

openssl req -x509 -newkey rsa:4096 -nodes \
    -keyout ssl/key.pem \
    -out ssl/cert.pem \
    -days 365 \
    -subj "/C=AR/ST=BuenosAires/L=BuenosAires/O=MAIRA/CN=localhost"
```

---

## ✅ CHECKLIST COMPLETO

- [ ] MySQL está corriendo (`brew services list`)
- [ ] Puerto 5001 está libre (`lsof -i:5001`)
- [ ] Certificados SSL existen (`ls ssl/cert.pem`)
- [ ] Archivo .env configurado (`cat Server/.env`)
- [ ] Dependencias Python instaladas (`pip3 list | grep flask`)
- [ ] Usar flag `--https` al iniciar

---

## 🎯 COMANDO FINAL

**Ejecuta esto AHORA:**

```bash
# 1. Detén el servidor actual
# (Presiona Ctrl+C en la terminal donde está corriendo)

# 2. Verifica MySQL
brew services start mysql

# 3. Inicia con HTTPS
cd /Users/mac/Documents/GitHub/MAIRA-WORKSPACE/MAIRA-4.0
./start_https.sh
```

---

## 📝 RESUMEN DE TU PROBLEMA

| Estado Actual | Estado Deseado |
|---------------|----------------|
| ❌ HTTP en puerto 5001 | ✅ HTTPS en puerto 5001 |
| ❌ Sin flag `--https` | ✅ Con flag `--https` |
| ❌ No se ve conexión DB | ✅ Se ve "Conexión exitosa a la base de datos" |
| ❌ Certificado no usado | ✅ Certificado SSL activo |

**Solución:** Añadir `--https` al comando de inicio.

---

🎉 **¡Con esto funcionará perfecto!**
