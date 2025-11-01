import { Controller } from "@hotwired/stimulus"

// Connects to data-controller="territories--print"
export default class extends Controller {
  connect() {
    // Expose methods globally for backwards compatibility
    window.printTerritory = this.printTerritory.bind(this)
    window.printMainTerritory = () => this.printMainTerritory()
    window.printGeneralTerritory = () => this.printGeneralTerritory()
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
    
    // Build coordinates HTML
    const coordinatesHtml = coordinates.slice(0, -1)
      .map((c, i) => `Punto ${i+1}: ${c[0].toFixed(6)}, ${c[1].toFixed(6)}`)
      .join('<br>')
    
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
          <p>${coordinatesHtml}</p>
        </div>
        
        <div class="no-print" style="text-align: center; margin-top: 20px;">
          <button onclick="window.print()" style="padding: 10px 20px; margin: 5px;">Imprimir</button>
          <button onclick="window.close()" style="padding: 10px 20px; margin: 5px;">Cerrar</button>
        </div>
        
        <script>
          // Initialize map when window loads
          window.onload = function() {
            const coords = ${JSON.stringify(coordinates)};
            const printMap = L.map('print-map').setView([${coordinates[0][0]}, ${coordinates[0][1]}], 15);
            
            L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
              attribution: '© OpenStreetMap contributors'
            }).addTo(printMap);
            
            // Draw the territory polygon with border
            const polygon = L.polygon(coords, {
              color: '#ffc107',
              fillColor: 'transparent',
              fillOpacity: 0,
              weight: 3
            }).addTo(printMap);
            
            // Create inverse mask to hide everything outside the polygon
            const bounds = printMap.getBounds();
            const worldBounds = [
              [bounds.getSouth() - 1, bounds.getWest() - 1],
              [bounds.getSouth() - 1, bounds.getEast() + 1],
              [bounds.getNorth() + 1, bounds.getEast() + 1],
              [bounds.getNorth() + 1, bounds.getWest() - 1],
              [bounds.getSouth() - 1, bounds.getWest() - 1]
            ];
            
            // Inverse polygon: outer boundary with inner hole
            const maskPolygon = L.polygon([worldBounds, coords], {
              color: 'transparent',
              fillColor: 'white',
              fillOpacity: 1,
              weight: 0
            }).addTo(printMap);
            
            printMap.fitBounds(polygon.getBounds(), { padding: [30, 30] });
          };
        <\/script>
      </body>
      </html>
    `)
    
    printWindow.document.close()
  }
  
  printGeneralTerritory() {
    // Gather coordinates from the saved congregation area
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
      alert('No hay zona principal de congregación guardada para imprimir')
      return
    }
    
    const congregationName = (window.congregationsById && 
                             window.currentCongregationId && 
                             window.congregationsById[String(window.currentCongregationId)]) || 
                             'Congregación'
    
    const printWindow = window.open('', '_blank')
    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
      <head>
        <title>Territorio General - ${congregationName}</title>
        <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" />
        <script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"><\/script>
        <style>
          body { 
            font-family: Arial, sans-serif; 
            margin: 20px; 
          }
          .header { 
            text-align: center; 
            margin-bottom: 20px; 
          }
          .map-container { 
            width: 100%; 
            height: 600px; 
            margin: 20px 0; 
            border: 2px solid #28a745;
          }
          .info { 
            margin: 20px 0; 
          }
          @media print { 
            .no-print { display: none; } 
          }
        </style>
      </head>
      <body>
        <div class="header">
          <h1>📍 Territorio General de Predicación</h1>
          <h2>${congregationName}</h2>
          <h3>Copiapó, Región de Atacama, Chile</h3>
          <p>Fecha: ${new Date().toLocaleDateString('es-CL')}</p>
        </div>
        
        <div class="info">
          <h3>Área de la Congregación:</h3>
          <p><strong>Puntos de límite:</strong> ${coordinates.length - 1}</p>
          <p><strong>Congregación:</strong> ${congregationName}</p>
        </div>
        
        <div id="print-map" class="map-container"></div>
        
        <div class="no-print" style="text-align: center; margin-top: 20px;">
          <button onclick="window.print()" style="padding: 10px 20px; margin: 5px;">🖨️ Imprimir</button>
          <button onclick="window.close()" style="padding: 10px 20px; margin: 5px;">❌ Cerrar</button>
        </div>
        
        <script>
          window.onload = function() {
            const coords = ${JSON.stringify(coordinates)};
            const printMap = L.map('print-map').setView([${coordinates[0][0]}, ${coordinates[0][1]}], 14);
            
            L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
              attribution: '© OpenStreetMap contributors'
            }).addTo(printMap);
            
            // Draw the territory polygon with border
            const polygon = L.polygon(coords, {
              color: '#28a745',
              fillColor: 'transparent',
              fillOpacity: 0,
              weight: 3
            }).addTo(printMap);
            
            // Create inverse mask to hide everything outside the polygon
            const bounds = printMap.getBounds();
            const worldBounds = [
              [bounds.getSouth() - 1, bounds.getWest() - 1],
              [bounds.getSouth() - 1, bounds.getEast() + 1],
              [bounds.getNorth() + 1, bounds.getEast() + 1],
              [bounds.getNorth() + 1, bounds.getWest() - 1],
              [bounds.getSouth() - 1, bounds.getWest() - 1]
            ];
            
            // Inverse polygon: outer boundary with inner hole
            const maskPolygon = L.polygon([worldBounds, coords], {
              color: 'transparent',
              fillColor: 'white',
              fillOpacity: 1,
              weight: 0
            }).addTo(printMap);
            
            printMap.fitBounds(polygon.getBounds(), { padding: [30, 30] });
          };
        <\/script>
      </body>
      </html>
    `)
    
    printWindow.document.close()
  }
}

