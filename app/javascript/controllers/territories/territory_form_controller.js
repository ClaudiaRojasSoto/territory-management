import { Controller } from "@hotwired/stimulus"
import apiClient from "../shared/api_client"

// Connects to data-controller="territories--territory-form"
export default class extends Controller {
  static targets = ["modal", "form", "drawingMap", "nameInput", "descriptionInput", "numberInput", "saveBtn", "drawBtn", "drawingControls"]
  
  connect() {
    this.drawnItems = null
    this.drawingMap = null
    this.isDrawingMode = false
    this.currentDrawingLayer = null
    this.initializeDrawingMap()
  }
  
  disconnect() {
    if (this.drawingMap) {
      this.drawingMap.remove()
      this.drawingMap = null
    }
  }
  
  initializeDrawingMap() {
    // Wait for modal to be available
    if (!this.hasDrawingMapTarget) {
      console.warn("Drawing map target not found")
      return
    }
    
    // Initialize drawing map for the modal
    this.drawingMap = L.map(this.drawingMapTarget.id).setView([-27.3668, -70.3314], 16)
    
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '© OpenStreetMap contributors'
    }).addTo(this.drawingMap)
    
    // Drawing tool setup
    this.drawnItems = new L.FeatureGroup()
    this.drawingMap.addLayer(this.drawnItems)
    
    const drawControl = new L.Control.Draw({
      draw: {
        polygon: {
          allowIntersection: false,
          drawError: {
            color: '#e1e100',
            message: '<strong>Error:</strong> El polígono no puede intersectarse consigo mismo'
          },
          shapeOptions: {
            color: '#3388ff',
            fillColor: '#3388ff',
            fillOpacity: 0.3
          }
        },
        polyline: false,
        circle: false,
        rectangle: false,
        circlemarker: false,
        marker: false
      },
      edit: {
        featureGroup: this.drawnItems,
        remove: true
      }
    })
    
    this.drawingMap.addControl(drawControl)
    
    // Drawing events
    this.drawingMap.on('draw:created', (e) => {
      const layer = e.layer
      this.drawnItems.addLayer(layer)
    })
    
    this.drawingMap.on('draw:deleted', (e) => {
      e.layers.eachLayer((layer) => {
        this.drawnItems.removeLayer(layer)
      })
    })
    
    // Expose globally for backwards compatibility
    window.drawingMap = this.drawingMap
    window.drawnItems = this.drawnItems
  }
  
  async save() {
    const name = this.nameInputTarget.value.trim()
    const description = this.descriptionInputTarget.value.trim()
    const numberValue = this.numberInputTarget.value
    
    // Validation
    if (this.drawnItems.getLayers().length === 0) {
      alert('Por favor dibuja un territorio en el mapa')
      return
    }
    
    if (!window.currentCongregationId) {
      alert('Selecciona una congregación primero')
      return
    }
    
    // Get polygon coordinates
    const layer = this.drawnItems.getLayers()[0]
    const coordinates = layer.getLatLngs()[0].map(latLng => [latLng.lng, latLng.lat])
    
    // Close the polygon (first point must equal last point for PostGIS)
    if (coordinates.length > 0) {
      const firstPoint = coordinates[0]
      const lastPoint = coordinates[coordinates.length - 1]
      if (firstPoint[0] !== lastPoint[0] || firstPoint[1] !== lastPoint[1]) {
        coordinates.push([firstPoint[0], firstPoint[1]])
      }
    }
    
    // Calculate center
    let centerLat = 0, centerLng = 0
    const pointsForCenter = coordinates.slice(0, -1) // Exclude last point (duplicate of first)
    pointsForCenter.forEach(coord => {
      centerLng += coord[0]
      centerLat += coord[1]
    })
    centerLat /= pointsForCenter.length
    centerLng /= pointsForCenter.length
    
    const territoryData = {
      name: name || null, // Will be auto-generated on backend if null
      description: description || null,
      number: numberValue ? parseInt(numberValue, 10) : null, // Will be auto-assigned if null
      status: 'available',
      congregation_id: window.currentCongregationId,
      boundaries: {
        type: 'Polygon',
        coordinates: [coordinates]
      },
      center: {
        lng: centerLng,
        lat: centerLat
      }
    }
    
    try {
      const data = await apiClient.post('/territories', territoryData)
      
      const createdId = data && data.properties && data.properties.id
      if (createdId) {
        alert('✅ Territorio creado exitosamente')
        this.closeModal()
        this.clearForm()
        
        // Reload territories
        if (typeof loadTerritories === 'function') {
          loadTerritories()
        }
      }
    } catch (error) {
      console.error('Error creating territory:', error)
      
      // Show detailed error message
      let errorMessage = error.message
      if (error.response && error.response.errors) {
        errorMessage = error.response.errors.join('\n')
      }
      
      alert(`❌ Error al crear el territorio:\n\n${errorMessage}`)
    }
  }
  
  closeModal() {
    if (this.hasModalTarget) {
      const modalInstance = bootstrap.Modal.getInstance(this.modalTarget)
      if (modalInstance) {
        modalInstance.hide()
      }
    }
  }
  
  clearForm() {
    // Clear drawn items
    if (this.drawnItems) {
      this.drawnItems.clearLayers()
    }
    
    // Reset form
    if (this.hasFormTarget) {
      this.formTarget.reset()
    }
  }
  
  // Modal opened event
  modalOpened() {
    // Invalidate map size when modal is shown
    setTimeout(() => {
      if (this.drawingMap) {
        this.drawingMap.invalidateSize()
      }
    }, 200)
    
    // Suggest next available number
    this.suggestNextNumber()
  }
  
  async suggestNextNumber() {
    if (!window.currentCongregationId) {
      return
    }
    
    try {
      const response = await apiClient.get(`/congregations/${window.currentCongregationId}/territories`)
      const territories = response || []
      
      // Find max number
      let maxNumber = 0
      territories.forEach(territory => {
        const num = territory.properties?.number
        if (num && num > maxNumber) {
          maxNumber = num
        }
      })
      
      // Suggest next number
      const nextNumber = maxNumber + 1
      if (this.hasNumberInputTarget) {
        this.numberInputTarget.placeholder = `Sugerido: ${nextNumber}`
        this.numberInputTarget.value = '' // Leave empty for auto-assign
      }
      
      return nextNumber
    } catch (error) {
      console.error('Error fetching territories for number suggestion:', error)
      return 1
    }
  }
  
  // Start drawing mode on main map
  startDrawing() {
    if (!window.currentCongregationId) {
      alert('Selecciona una congregación primero')
      return
    }
    
    const map = window.territoryMap
    if (!map) {
      alert('El mapa no está listo')
      return
    }
    
    this.isDrawingMode = true
    
    // Show controls, hide button
    if (this.hasDrawBtnTarget) {
      this.drawBtnTarget.style.display = 'none'
    }
    if (this.hasDrawingControlsTarget) {
      this.drawingControlsTarget.style.display = 'block'
    }
    
    // Initialize drawing on main map
    this.initMainMapDrawing()
  }
  
  initMainMapDrawing() {
    const map = window.territoryMap
    if (!map) return
    
    // Create feature group for drawing
    this.mainDrawnItems = new L.FeatureGroup()
    map.addLayer(this.mainDrawnItems)
    
    // Add draw control
    this.drawControl = new L.Control.Draw({
      draw: {
        polygon: {
          allowIntersection: false,
          drawError: {
            color: '#e1e100',
            message: '<strong>Error:</strong> El polígono no puede intersectarse consigo mismo'
          },
          shapeOptions: {
            color: '#3388ff',
            fillColor: '#3388ff',
            fillOpacity: 0.3
          }
        },
        polyline: false,
        circle: false,
        rectangle: false,
        circlemarker: false,
        marker: false
      },
      edit: {
        featureGroup: this.mainDrawnItems,
        remove: true
      }
    })
    
    map.addControl(this.drawControl)
    
    // Setup drawing events
    map.on('draw:created', (e) => {
      this.currentDrawingLayer = e.layer
      this.mainDrawnItems.addLayer(e.layer)
    })
    
    map.on('draw:deleted', (e) => {
      this.currentDrawingLayer = null
    })
  }
  
  async saveDrawnTerritory() {
    if (!this.currentDrawingLayer) {
      alert('Por favor dibuja un territorio en el mapa')
      return
    }
    
    if (!window.currentCongregationId) {
      alert('Selecciona una congregación primero')
      return
    }
    
    // Get next suggested number
    const nextNumber = await this.suggestNextNumber()
    
    // Ask for number (optional)
    const numberInput = prompt(`Número del territorio (dejar vacío para auto-asignar #${nextNumber}):`)
    const number = numberInput && numberInput.trim() ? parseInt(numberInput, 10) : null
    
    // Ask for name (optional)
    const nameInput = prompt(`Nombre del territorio (opcional, se generará "Territorio ${number || nextNumber}" si se deja vacío):`)
    const name = nameInput && nameInput.trim() ? nameInput : null
    
    // Get polygon coordinates
    const coordinates = this.currentDrawingLayer.getLatLngs()[0].map(latLng => [latLng.lng, latLng.lat])
    
    // Close the polygon (first point must equal last point for PostGIS)
    if (coordinates.length > 0) {
      const firstPoint = coordinates[0]
      const lastPoint = coordinates[coordinates.length - 1]
      if (firstPoint[0] !== lastPoint[0] || firstPoint[1] !== lastPoint[1]) {
        coordinates.push([firstPoint[0], firstPoint[1]])
      }
    }
    
    // Calculate center
    let centerLat = 0, centerLng = 0
    const pointsForCenter = coordinates.slice(0, -1) // Exclude last point (duplicate of first)
    pointsForCenter.forEach(coord => {
      centerLng += coord[0]
      centerLat += coord[1]
    })
    centerLat /= pointsForCenter.length
    centerLng /= pointsForCenter.length
    
    const territoryData = {
      name: name || null,
      description: null,
      number: number || null,
      status: 'available',
      congregation_id: window.currentCongregationId,
      boundaries: {
        type: 'Polygon',
        coordinates: [coordinates]
      },
      center: {
        lng: centerLng,
        lat: centerLat
      }
    }
    
    try {
      const data = await apiClient.post('/territories', territoryData)
      
      const createdId = data && data.properties && data.properties.id
      if (createdId) {
        alert('✅ Territorio creado exitosamente')
        this.cancelDrawing()
        
        // Reload territories
        if (typeof loadTerritories === 'function') {
          loadTerritories()
        }
      }
    } catch (error) {
      console.error('Error creating territory:', error)
      
      // Show detailed error message
      let errorMessage = error.message
      if (error.response && error.response.errors) {
        errorMessage = error.response.errors.join('\n')
      }
      
      alert(`❌ Error al crear el territorio:\n\n${errorMessage}`)
    }
  }
  
  cancelDrawing() {
    const map = window.territoryMap
    if (!map) return
    
    this.isDrawingMode = false
    this.currentDrawingLayer = null
    
    // Remove draw control
    if (this.drawControl) {
      map.removeControl(this.drawControl)
      this.drawControl = null
    }
    
    // Remove drawn items
    if (this.mainDrawnItems) {
      map.removeLayer(this.mainDrawnItems)
      this.mainDrawnItems = null
    }
    
    // Show button, hide controls
    if (this.hasDrawBtnTarget) {
      this.drawBtnTarget.style.display = 'block'
    }
    if (this.hasDrawingControlsTarget) {
      this.drawingControlsTarget.style.display = 'none'
    }
  }
}

