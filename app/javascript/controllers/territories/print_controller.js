import { Controller } from "@hotwired/stimulus"

// Connects to data-controller="territories--print"
export default class extends Controller {
  connect() {
    // Expose methods globally for backwards compatibility
    window.printTerritory = this.printTerritory.bind(this)
    window.printMainTerritory = () => this.printMainTerritory()
    window.printGeneralTerritory = () => this.printGeneralTerritory()
  }
  
  async printTerritory(territoryId, territoryName) {
    try {
      // Load territory data from API
      const response = await fetch(`/api/v1/territories/${territoryId}`)
      if (!response.ok) {
        throw new Error('Failed to load territory data')
      }
      
      const territory = await response.json()
      const coordinates = territory.geometry.coordinates[0].map(c => [c[1], c[0]])
      
      if (!coordinates || coordinates.length === 0) {
        alert('No hay coordenadas para este territorio')
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
          <title>${territoryName} - ${congregationName}</title>
          <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" />
          <script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"><\/script>
          <style>
            @page {
              margin: 0.3cm;
            }
            body {
              margin: 0;
              padding: 20px;
              font-family: Arial, sans-serif;
            }
            .header {
              text-align: center;
              margin-bottom: 20px;
              padding: 10px;
              background-color: #f8f9fa;
              border-radius: 5px;
            }
            .header h1 {
              margin: 0 0 10px 0;
              color: #333;
            }
            .map-container {
              width: 100%;
              height: 600px;
              margin: 20px 0;
              border: 2px solid #000;
            }
            .no-print {
              text-align: center;
              margin-top: 20px;
            }
            .no-print button {
              padding: 10px 20px;
              margin: 5px;
              font-size: 16px;
              cursor: pointer;
              border-radius: 5px;
              border: 1px solid #ccc;
            }
            .no-print button:hover {
              background-color: #e9ecef;
            }
            
            @media print {
              body {
                margin: 0;
                padding: 0;
              }
              .no-print { 
                display: none !important; 
              }
              .header {
                display: none !important;
              }
              .map-container {
                height: 100vh !important;
                width: 100vw !important;
                margin: 0 !important;
                padding: 0 !important;
                border: none !important;
                page-break-inside: avoid;
                position: absolute;
                top: 0;
                left: 0;
              }
            }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>📍 ${territoryName}</h1>
            <p>${congregationName}</p>
          </div>
          
          <div id="print-map" class="map-container"></div>
          
          <div class="no-print">
            <button onclick="window.print()">🖨️ Imprimir</button>
            <button onclick="window.close()">❌ Cerrar</button>
          </div>
          
          <script>
            window.onload = function() {
              const coords = ${JSON.stringify(coordinates)};
              const printMap = L.map('print-map').setView([${coordinates[0][0]}, ${coordinates[0][1]}], 14);
              
              L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
                attribution: '© OpenStreetMap contributors'
              }).addTo(printMap);
              
              const polygon = L.polygon(coords, {
                color: '#000',
                fillColor: 'transparent',
                fillOpacity: 0,
                weight: 3
              }).addTo(printMap);
              
              const bounds = printMap.getBounds();
              const worldBounds = [
                [bounds.getSouth() - 1, bounds.getWest() - 1],
                [bounds.getSouth() - 1, bounds.getEast() + 1],
                [bounds.getNorth() + 1, bounds.getEast() + 1],
                [bounds.getNorth() + 1, bounds.getWest() - 1],
                [bounds.getSouth() - 1, bounds.getWest() - 1]
              ];
              
              const maskPolygon = L.polygon([worldBounds, coords], {
                color: 'transparent',
                fillColor: 'white',
                fillOpacity: 1,
                weight: 0
              }).addTo(printMap);
              
              printMap.fitBounds(polygon.getBounds(), { padding: [5, 5], maxZoom: 19 });
            };
          <\/script>
        </body>
        </html>
      `)
      
      printWindow.document.close()
    } catch (error) {
      console.error('Error printing territory:', error)
      alert('Error al cargar los datos del territorio para imprimir')
    }
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
            
            printMap.fitBounds(polygon.getBounds(), { padding: [30, 30], maxZoom: 19 });
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
            
            printMap.fitBounds(polygon.getBounds(), { padding: [30, 30], maxZoom: 19 });
          };
        <\/script>
      </body>
      </html>
    `)
    
    printWindow.document.close()
  }
}

