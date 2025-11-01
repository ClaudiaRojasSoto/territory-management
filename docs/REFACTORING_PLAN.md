# Plan de Refactorización - Territory App

## Estado Actual
- **Archivo**: `app/views/territories/index.html.erb`
- **Líneas**: 1,292 líneas
- **Funciones JS**: 18 funciones globales
- **Problema**: Todo el JavaScript está inline en la vista, sin separación de responsabilidades

## Objetivos
1. Separar el JavaScript en controladores Stimulus organizados por funcionalidad
2. Mantener la vista limpia con solo HTML y data attributes
3. Mejorar mantenibilidad y testabilidad
4. Seguir las mejores prácticas de Rails 7 + Stimulus

---

## Análisis de Funcionalidades

### 1. **Mapa Principal (Leaflet)**
- Inicialización del mapa
- Capas de tiles de OpenStreetMap
- Control de zoom y centrado

### 2. **Gestión de Congregaciones**
- `loadCongregations()` - Cargar lista de congregaciones
- `loadMainCongregationPolygon()` - Mostrar polígono de congregación en mapa
- Filtro por congregación (select)

### 3. **Gestión de Territorios Pequeños**
- `loadTerritories()` - Cargar territorios del API
- `displayTerritories(territories)` - Renderizar territorios en mapa
- `updateTerritoriesList(territories)` - Actualizar sidebar con lista
- `printTerritory(territoryId, territoryName)` - Imprimir territorio individual

### 4. **Demarcación de Zona Principal**
- `demarcateMainTerritory()` - Iniciar modo demarcación
- `startDemarcation()` - Comenzar a dibujar polígono
- `manualClosePolygon()` - Cerrar polígono manualmente
- `cancelDemarcation()` - Cancelar demarcación
- `clearDemarcation()` - Limpiar demarcación
- `closeInstructions()` - Cerrar panel de instrucciones

### 5. **CRUD Zona Principal**
- `saveMainTerritory()` - Guardar/Actualizar zona principal
- `editMainTerritory()` - Editar zona existente
- `deleteMainTerritory()` - Eliminar zona principal
- `printMainTerritory()` - Imprimir zona principal

### 6. **Dibujo de Territorio General**
- `drawGeneralTerritory()` - Dibujar territorio completo
- `printGeneralTerritory()` - Imprimir territorio general

### 7. **Modal de Nuevo Territorio**
- Mapa de dibujo (Leaflet Draw)
- Formulario de creación
- Guardado de territorio

---

## Plan de Refactorización

### Fase 1: Estructura Base (Controladores Stimulus)

#### 1.1 `map_controller.js` - Controlador Principal del Mapa
**Responsabilidades:**
- Inicializar mapa principal de Leaflet
- Gestionar capas base
- Coordinar con otros controladores

**Targets:**
- `container` - Div del mapa

**Values:**
- `lat` (Number) - Latitud inicial
- `lng` (Number) - Longitud inicial
- `zoom` (Number) - Zoom inicial

**Actions:**
- `connect()` - Inicializar mapa

---

#### 1.2 `congregation_controller.js` - Gestión de Congregaciones
**Responsabilidades:**
- Cargar congregaciones del API
- Gestionar filtro de congregación
- Mostrar/ocultar polígono de congregación en mapa
- Actualizar labels dinámicamente

**Targets:**
- `filter` - Select de filtro
- `nameLabel` - Label con nombre de congregación

**Values:**
- `currentId` (Number) - ID congregación actual
- `apiUrl` (String) - URL del API

**Actions:**
- `connect()` - Cargar congregaciones
- `change()` - Cambio de congregación
- `loadPolygon()` - Cargar polígono en mapa

---

#### 1.3 `territory_list_controller.js` - Lista de Territorios
**Responsabilidades:**
- Cargar territorios del API
- Renderizar lista en sidebar
- Gestionar filtro por status
- Click en territorio (resaltar en mapa)

**Targets:**
- `list` - Contenedor de lista
- `statusFilter` - Select de status

**Values:**
- `congregationId` (Number) - ID congregación
- `apiUrl` (String) - URL del API

**Actions:**
- `connect()` - Cargar territorios
- `filterByStatus()` - Filtrar por status
- `selectTerritory(event)` - Click en territorio

---

#### 1.4 `territory_map_controller.js` - Territorios en Mapa
**Responsabilidades:**
- Renderizar territorios en el mapa
- Gestionar estilos por status
- Popups de territorios
- Interacción (click, hover)

**Targets:**
- Ninguno (usa el mapa del map_controller)

**Values:**
- `territories` (Array) - Lista de territorios

**Actions:**
- `render()` - Renderizar territorios
- `clear()` - Limpiar territorios del mapa
- `highlightTerritory(id)` - Resaltar territorio

---

#### 1.5 `territory_form_controller.js` - Modal Nuevo Territorio
**Responsabilidades:**
- Gestionar modal de creación
- Inicializar mapa de dibujo (Leaflet Draw)
- Capturar geometría dibujada
- Enviar al API

**Targets:**
- `modal` - Modal container
- `form` - Formulario
- `drawingMap` - Div del mapa de dibujo
- `nameInput` - Input nombre
- `descriptionInput` - Textarea descripción

**Values:**
- `apiUrl` (String) - URL del API

**Actions:**
- `connect()` - Inicializar
- `open()` - Abrir modal
- `close()` - Cerrar modal
- `save()` - Guardar territorio

---

#### 1.6 `main_territory_controller.js` - Gestión Zona Principal
**Responsabilidades:**
- Demarcación de zona principal
- CRUD de zona principal (save, edit, delete)
- Mostrar/ocultar controles
- Gestionar instrucciones de demarcación

**Targets:**
- `controls` - Panel de controles
- `demarcateBtn` - Botón demarcate
- `instructions` - Panel de instrucciones
- `nameLabel` - Label con nombre

**Values:**
- `congregationId` (Number) - ID congregación
- `isEditing` (Boolean) - Modo edición activo
- `apiUrl` (String) - URL del API

**Actions:**
- `startDemarcation()` - Iniciar demarcación
- `save()` - Guardar zona
- `edit()` - Editar zona
- `delete()` - Eliminar zona
- `cancel()` - Cancelar demarcación
- `closePolygon()` - Cerrar polígono manualmente

---

#### 1.7 `print_controller.js` - Funcionalidad de Impresión
**Responsabilidades:**
- Imprimir territorio individual
- Imprimir zona principal
- Imprimir territorio general
- Generar vistas para impresión

**Targets:**
- Ninguno

**Values:**
- `apiUrl` (String) - URL del API

**Actions:**
- `printTerritory(event)` - Imprimir territorio
- `printMainTerritory()` - Imprimir zona principal
- `printGeneralTerritory()` - Imprimir general

---

### Fase 2: Estructura de Archivos

```
app/javascript/controllers/
├── application.js                    (ya existe)
├── index.js                          (ya existe)
├── hello_controller.js               (ya existe - para borrar después)
├── test_controller.js                (ya existe - para borrar después)
├── territories/
│   ├── map_controller.js
│   ├── congregation_controller.js
│   ├── territory_list_controller.js
│   ├── territory_map_controller.js
│   ├── territory_form_controller.js
│   ├── main_territory_controller.js
│   └── print_controller.js
└── shared/
    ├── leaflet_helper.js             (utilidades Leaflet)
    └── api_client.js                 (cliente HTTP reutilizable)
```

---

### Fase 3: Refactorización de la Vista

**De:**
```erb
<div class="container-fluid" data-controller="hello">
  <!-- 1292 líneas de HTML + JS inline -->
  <script>
    function loadCongregations() { ... }
    // 18 funciones más...
  </script>
</div>
```

**A:**
```erb
<div class="container-fluid" 
     data-controller="territories--map territories--congregation territories--territory-list">
  <div class="row">
    <div class="col-md-3 sidebar">
      <!-- Sidebar con data attributes -->
      <div data-territories--congregation-target="filter"
           data-territories--territory-list-target="list">
        <!-- Contenido -->
      </div>
    </div>
    
    <div class="col-md-9">
      <div data-territories--map-target="container"
           data-territories--map-lat-value="-27.3668"
           data-territories--map-lng-value="-70.3314"
           data-territories--map-zoom-value="16"
           style="height: 100vh;"></div>
    </div>
  </div>
</div>

<!-- Modales como partials -->
<%= render 'territories/new_territory_modal' %>
```

---

### Fase 4: Orden de Implementación (Paso a Paso)

#### **Sprint 1: Base del Mapa** (Día 1)
1. Crear `map_controller.js`
2. Crear `leaflet_helper.js`
3. Refactorizar inicialización del mapa
4. **Test**: Mapa carga correctamente

#### **Sprint 2: Congregaciones** (Día 2)
1. Crear `api_client.js`
2. Crear `congregation_controller.js`
3. Migrar `loadCongregations()` y `loadMainCongregationPolygon()`
4. **Test**: Filtro de congregación funciona

#### **Sprint 3: Lista de Territorios** (Día 3)
1. Crear `territory_list_controller.js`
2. Migrar `loadTerritories()` y `updateTerritoriesList()`
3. **Test**: Lista se actualiza al cambiar congregación

#### **Sprint 4: Territorios en Mapa** (Día 4)
1. Crear `territory_map_controller.js`
2. Migrar `displayTerritories()`
3. Integrar con `territory_list_controller`
4. **Test**: Territorios se ven en mapa con colores correctos

#### **Sprint 5: Zona Principal** (Día 5-6)
1. Crear `main_territory_controller.js`
2. Migrar demarcación: `demarcateMainTerritory()`, `startDemarcation()`, etc.
3. Migrar CRUD: `saveMainTerritory()`, `editMainTerritory()`, `deleteMainTerritory()`
4. **Test**: Crear, editar y eliminar zona principal

#### **Sprint 6: Nuevo Territorio** (Día 7)
1. Crear `territory_form_controller.js`
2. Migrar modal y mapa de dibujo
3. **Test**: Crear territorio nuevo funciona

#### **Sprint 7: Impresión** (Día 8)
1. Crear `print_controller.js`
2. Migrar todas las funciones de impresión
3. **Test**: Impresión funciona

#### **Sprint 8: Limpieza** (Día 9)
1. Eliminar `<script>` tags del index.html.erb
2. Eliminar `hello_controller.js` y `test_controller.js`
3. Extraer modales a partials
4. **Test**: Todo funciona end-to-end

---

### Fase 5: Mejoras Adicionales (Opcional)

1. **Testing**
   - Agregar tests con Stimulus Testing Library
   - Tests de integración con Capybara

2. **Performance**
   - Lazy loading de controladores
   - Debounce en filtros
   - Virtual scrolling para lista larga de territorios

3. **UX**
   - Loading states
   - Error handling visual
   - Confirmaciones antes de delete

4. **Código**
   - TypeScript (opcional)
   - Linting con ESLint
   - Prettier para formato

---

## Beneficios Esperados

### ✅ Antes vs Después

| Aspecto | Antes | Después |
|---------|-------|---------|
| **Líneas en vista** | 1,292 | ~150 |
| **Funciones globales** | 18 | 0 |
| **Archivos JS** | 1 (inline) | 9 (organizados) |
| **Testeable** | ❌ No | ✅ Sí |
| **Reutilizable** | ❌ No | ✅ Sí |
| **Mantenible** | ❌ Difícil | ✅ Fácil |
| **Separación** | ❌ No | ✅ Sí |

---

## Comandos Útiles

```bash
# Generar nuevo controlador Stimulus
rails generate stimulus territories/map

# Ver estructura de controladores
tree app/javascript/controllers/

# Restart server después de cambios JS
bin/rails restart

# Ver logs del servidor
tail -f log/development.log
```

---

## Notas Importantes

1. **No tocar el backend** - Esta refactorización es solo frontend
2. **Mantener funcionalidad** - Todo debe seguir funcionando igual
3. **Commits pequeños** - Un commit por cada controlador implementado
4. **Probar constantemente** - No avanzar sin confirmar que funciona
5. **Documentar** - Agregar comentarios en código complejo

---

## Estado Actual
- ✅ Stimulus instalado y funcionando
- ✅ Bootstrap funcionando
- ⏳ Plan de refactorización creado
- ⏳ Pendiente: Implementación

**Fecha de creación**: 2025-11-01
**Última actualización**: 2025-11-01

