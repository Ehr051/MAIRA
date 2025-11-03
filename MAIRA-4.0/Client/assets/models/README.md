# Directorio de Modelos 3D - MAIRA 4.0

## Estructura de Directorios

```
assets/models/
├── vegetation/     # Modelos de vegetación (árboles, arbustos, pasto)
├── vehicles/       # Vehículos militares (tanques, camiones, etc)
├── structures/     # Estructuras (carpas, edificios, etc)
└── README.md       # Este archivo
```

## Formatos Soportados

- **GLB**: Formato binario GLTF (preferido)
- **GLTF**: Formato JSON GLTF con assets externos

## Sistema de Fallback

Si un modelo no está disponible, el sistema generará automáticamente geometrías procedurales usando THREE.js:

- **Vegetación**: Cilindros + esferas para árboles, boxes para arbustos
- **Vehículos**: Geometrías básicas que representan la forma del vehículo
- **Estructuras**: Prismas y cajas con texturas básicas

## Añadir Nuevos Modelos

1. Coloca el archivo GLB en el subdirectorio apropiado
2. Actualiza el mapeo en:
   - `js/services/GLTFModelLoader.js`
   - `js/services/maira3DMaster.js`
   - `js/modules/gaming/modelos3DManager.js`

## Optimización

- Mantén los modelos GLB bajo 5MB cada uno
- Usa texturas comprimidas cuando sea posible
- Considera usar instancing para objetos repetidos
