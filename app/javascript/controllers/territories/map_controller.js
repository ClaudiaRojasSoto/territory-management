import { Controller } from "@hotwired/stimulus"
import { LeafletHelper } from "../shared/leaflet_helper"

// Connects to data-controller="territories--map"
export default class extends Controller {
  static targets = ["container"]
  
  static values = {
    lat: { type: Number, default: -27.3668 },
    lng: { type: Number, default: -70.3314 },
    zoom: { type: Number, default: 16 }
  }
  
  connect() {
    console.log("Map controller connected!")
    this.initializeMap()
  }
  
  disconnect() {
    console.log("Map controller disconnected!")
    if (this.map) {
      this.map.remove()
      this.map = null
    }
  }
  
  initializeMap() {
    // Verificar que Leaflet esté disponible
    if (typeof L === 'undefined') {
      console.error("Leaflet no está disponible. Asegúrate de que se cargue antes del mapa.")
      return
    }
    
    // Crear el mapa usando el helper
    this.map = LeafletHelper.createMap(this.containerTarget.id, {
      lat: this.latValue,
      lng: this.lngValue,
      zoom: this.zoomValue
    })
    
    // Crear layer group para la zona principal de congregación
    this.mainLayerGroup = L.layerGroup().addTo(this.map)
    
    // Guardar referencia global para que otros controladores puedan acceder
    // TODO: En el futuro, usar eventos de Stimulus en lugar de variables globales
    window.territoryMap = this.map
    window.mainLayerGroup = this.mainLayerGroup
    
    console.log("Mapa inicializado en:", this.latValue, this.lngValue, "zoom:", this.zoomValue)
  }
  
  // Método público para obtener el mapa
  getMap() {
    return this.map
  }
  
  // Método público para obtener el mainLayerGroup
  getMainLayerGroup() {
    return this.mainLayerGroup
  }
  
  // Centrar el mapa en coordenadas específicas
  setView(lat, lng, zoom = null) {
    if (this.map) {
      const z = zoom !== null ? zoom : this.map.getZoom()
      this.map.setView([lat, lng], z)
    }
  }
  
  // Ajustar el mapa a un bounds
  fitBounds(bounds, options = {}) {
    if (this.map) {
      this.map.fitBounds(bounds, options)
    }
  }
  
  // Limpiar capas del mainLayerGroup
  clearMainLayers() {
    if (this.mainLayerGroup) {
      this.mainLayerGroup.clearLayers()
    }
  }
}

