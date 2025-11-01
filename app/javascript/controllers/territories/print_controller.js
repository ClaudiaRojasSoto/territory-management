import { Controller } from "@hotwired/stimulus"

// Connects to data-controller="territories--print"
export default class extends Controller {
  connect() {
    console.log("Print controller connected!")
    
    // Expose methods globally for backwards compatibility
    window.printTerritory = this.printTerritory.bind(this)
    window.printMainTerritory = this.printMainTerritory.bind(this)
    window.printGeneralTerritory = this.printGeneralTerritory.bind(this)
  }
  
  printTerritory(territoryId, territoryName) {
    const printWindow = window.open('', '_blank')
    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
      <head>
        <title>${territoryName} - Copiapó</title>
        <style>
          body { font-family: Arial, sans-serif; margin: 20px; }
          .header { text-align: center; margin-bottom: 30px; }
          .map-container { width: 100%; height: 500px; margin: 20px 0; }
          .info { margin: 20px 0; }
          .boundaries { margin: 20px 0; }
          @media print { .no-print { display: none; } }
        </style>
      </head>
      <body>
        <div class="header">
          <h1>${territoryName}</h1>
          <h2>Copiapó, Región de Atacama, Chile</h2>
          <p>Fecha: ${new Date().toLocaleDateString('es-CL')}</p>
        </div>
        
        <div class="info">
          <h3>Información del Territorio:</h3>
          <p><strong>ID:</strong> ${territoryId}</p>
          <p><strong>Estado:</strong> [Se cargará desde la base de datos]</p>
          <p><strong>Área:</strong> [Se calculará automáticamente]</p>
        </div>
        
        <div class="map-container" id="print-map-${territoryId}"></div>
        
        <div class="no-print">
          <button onclick="window.print()">Imprimir</button>
          <button onclick="window.close()">Cerrar</button>
        </div>
      </body>
      </html>
    `)
    
    printWindow.document.close()
  }
  
  printMainTerritory() {
    // Gather coordinates from various sources
    let coordinates = []
    
    if (window.mainTerritoryPoints && window.mainTerritoryPoints.length > 0) {
      coordinates = window.mainTerritoryPoints.map(point => [point.lat, point.lng])
    } else if (window.mainCongregationFeature && 
               window.mainCongregationFeature.geometry && 
               window.mainCongregationFeature.geometry.coordinates) {
      try {
        const ring = window.mainCongregationFeature.geometry.coordinates[0] || []
        coordinates = ring.map(c => [c[1], c[0]])
      } catch (e) {
        console.error('Error parsing main congregation feature:', e)
      }
    } else if (window.mainTerritoryLayer) {
      try {
        const latLngs = window.mainTerritoryLayer.getLatLngs()
        const ring = Array.isArray(latLngs) ? (Array.isArray(latLngs[0]) ? latLngs[0] : latLngs) : []
        coordinates = ring.map(ll => [ll.lat, ll.lng])
      } catch (e) {
        console.error('Error getting coordinates from layer:', e)
      }
    }
    
    if (!coordinates || coordinates.length === 0) {
      alert('No hay zona principal demarcada')
      return
    }
    
    const congregationName = (window.congregationsById && 
                             window.currentCongregationId && 
                             window.congregationsById[String(window.currentCongregationId)]) || 
                             'Zona Principal de la Congregación'
    
    const printWindow = window.open('', '_blank')
    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
      <head>
        <title>${congregationName} - Copiapó</title>
        <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" />
        <script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"><\/script>
        <style>
          body { 
            font-family: Arial, sans-serif; 
            margin: 20px; 
          }
          .header { 
            text-align: center; 
            margin-bottom: 30px; 
          }
          .map-container { 
            width: 100%; 
            height: 600px; 
            margin: 20px 0; 
            border: 2px solid #ffc107;
          }
          .info { 
            margin: 20px 0; 
          }
          .coordinates { 
            font-size: 12px; 
            margin: 10px 0; 
          }
          @media print { 
            .no-print { display: none; } 
          }
        </style>
      </head>
      <body>
        <div class="header">
          <h1>🏛️ ${congregationName}</h1>
          <h2>Copiapó, Región de Atacama, Chile</h2>
          <p>Fecha: ${new Date().toLocaleDateString('es-CL')}</p>
        </div>
        
        <div class="info">
          <h3>Información de la Zona Principal:</h3>
          <p><strong>Puntos de límite:</strong> ${coordinates.length - 1}</p>
          <p><strong>Tipo:</strong> Zona Principal de Congregación</p>
        </div>
        
        <div id="print-map" class="map-container"></div>
        
        <div class="coordinates">
          <h4>Coordenadas:</h4>
          <p>${coordinates.slice(0, -1).map((c, i) => \`Punto \${i+1}: \${c[0].toFixed(6)}, \${c[1].toFixed(6)}\`).join('<br>')}</p>
        </div>
        
        <div class="no-print" style="text-align: center; margin-top: 20px;">
          <button onclick="window.print()" style="padding: 10px 20px; margin: 5px;">Imprimir</button>
          <button onclick="window.close()" style="padding: 10px 20px; margin: 5px;">Cerrar</button>
        </div>
        
        <script>
          // Initialize map when window loads
          window.onload = function() {
            const printMap = L.map('print-map').setView([${coordinates[0][0]}, ${coordinates[0][1]}], 15);
            
            L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
              attribution: '© OpenStreetMap contributors'
            }).addTo(printMap);
            
            const coords = ${JSON.stringify(coordinates)};
            const polygon = L.polygon(coords, {
              color: '#ffc107',
              fillColor: '#ffc107',
              fillOpacity: 0.3,
              weight: 3
            }).addTo(printMap);
            
            printMap.fitBounds(polygon.getBounds(), { padding: [50, 50] });
          };
        <\/script>
      </body>
      </html>
    `)
    
    printWindow.document.close()
  }
  
  printGeneralTerritory() {
    const printWindow = window.open('', '_blank')
    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
      <head>
        <title>Territorio General - Copiapó</title>
        <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" />
        <script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"><\/script>
        <style>
          body { 
            font-family: Arial, sans-serif; 
            margin: 20px; 
          }
          .header { 
            text-align: center; 
            margin-bottom: 30px; 
          }
          .map-container { 
            width: 100%; 
            height: 600px; 
            margin: 20px 0; 
            border: 2px solid #dc3545;
          }
          .boundaries { 
            margin: 20px 0; 
          }
          .boundaries ul { 
            list-style-type: none; 
            padding-left: 0; 
          }
          .boundaries li { 
            padding: 5px 0; 
          }
          @media print { 
            .no-print { display: none; } 
          }
        </style>
      </head>
      <body>
        <div class="header">
          <h1>📍 Territorio General de Predicación</h1>
          <h2>Copiapó, Región de Atacama, Chile</h2>
          <p>Fecha: ${new Date().toLocaleDateString('es-CL')}</p>
        </div>
        
        <div class="boundaries">
          <h3>Límites del Territorio:</h3>
          <ul>
            <li>🧭 <strong>Norte:</strong> Avenida Van Buren</li>
            <li>🧭 <strong>Sur:</strong> Calle Inca</li>
            <li>🧭 <strong>Este:</strong> Río Copiapó</li>
            <li>🧭 <strong>Oeste:</strong> Avenida Los Loros</li>
          </ul>
        </div>
        
        <div id="print-map" class="map-container"></div>
        
        <div class="no-print" style="text-align: center; margin-top: 20px;">
          <button onclick="window.print()" style="padding: 10px 20px; margin: 5px;">Imprimir</button>
          <button onclick="window.close()" style="padding: 10px 20px; margin: 5px;">Cerrar</button>
        </div>
        
        <script>
          window.onload = function() {
            const printMap = L.map('print-map').setView([-27.3665, -70.3300], 14);
            
            L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
              attribution: '© OpenStreetMap contributors'
            }).addTo(printMap);
            
            const generalTerritoryCoords = [
              [-27.3650, -70.3350], // Van Buren (North)
              [-27.3650, -70.3250], // Los Loros (West)
              [-27.3680, -70.3250], // Inca (South)
              [-27.3680, -70.3350], // Río Copiapó (East)
              [-27.3650, -70.3350]  // Close polygon
            ];
            
            const polygon = L.polygon(generalTerritoryCoords, {
              color: '#dc3545',
              fillColor: '#dc3545',
              fillOpacity: 0.2,
              weight: 4
            }).addTo(printMap);
            
            // Add markers for boundaries
            L.marker([-27.3650, -70.3300]).bindPopup('<strong>Van Buren</strong><br>Límite Norte').addTo(printMap);
            L.marker([-27.3680, -70.3300]).bindPopup('<strong>Inca</strong><br>Límite Sur').addTo(printMap);
            L.marker([-27.3665, -70.3350]).bindPopup('<strong>Río Copiapó</strong><br>Límite Este').addTo(printMap);
            L.marker([-27.3665, -70.3250]).bindPopup('<strong>Avenida Los Loros</strong><br>Límite Oeste').addTo(printMap);
            
            printMap.fitBounds(polygon.getBounds(), { padding: [50, 50] });
          };
        <\/script>
      </body>
      </html>
    `)
    
    printWindow.document.close()
  }
}

