import { Controller } from "@hotwired/stimulus"
import apiClient from "../shared/api_client"

// Connects to data-controller="territories--territory-form"
export default class extends Controller {
  static targets = ["modal", "form", "drawingMap", "nameInput", "descriptionInput", "numberInput", "saveBtn"]
  
  connect() {
    this.drawnItems = null
    this.drawingMap = null
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
    
    // Calculate center
    let centerLat = 0, centerLng = 0
    coordinates.forEach(coord => {
      centerLng += coord[0]
      centerLat += coord[1]
    })
    centerLat /= coordinates.length
    centerLng /= coordinates.length
    
    const territoryData = {
      name: name || null, // Will be auto-generated on backend if null
      description: description || null,
      number: numberValue ? parseInt(numberValue, 10) : null, // Will be auto-assigned if null
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
      alert(`❌ Error al crear el territorio: ${error.message}`)
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
    } catch (error) {
      console.error('Error fetching territories for number suggestion:', error)
    }
  }
}

