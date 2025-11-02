import { Controller } from "@hotwired/stimulus"
import apiClient from "../shared/api_client"

// Connects to data-controller="territories--territory-list"
export default class extends Controller {
  static targets = ["list", "statusFilter"]
  
  static values = {
    congregationId: { type: String, default: "" }
  }
  
  connect() {
    this.territories = []
    
    // Setup status filter if target exists
    if (this.hasStatusFilterTarget) {
      this.statusFilterTarget.addEventListener('change', this.filterByStatus.bind(this))
    }
  }
  
  async load(congregationId = null) {
    try {
      const id = congregationId || this.congregationIdValue
      const endpoint = id ? `/territories?congregation_id=${id}` : '/territories'
      const data = await apiClient.get(endpoint)
      
      this.territories = data
      this.render()
      this.renderOnMap(data)
    } catch (error) {
      console.error('Error loading territories:', error)
    }
  }
  
  render() {
    if (!this.hasListTarget) return
    
    this.listTarget.innerHTML = ''
    
    const filteredTerritories = this.getFilteredTerritories()
    
    filteredTerritories.forEach(territory => {
      const item = this.createListItem(territory)
      this.listTarget.appendChild(item)
    })
  }
  
  createListItem(territory) {
    const item = document.createElement('div')
    item.className = 'territory-item p-2 border-bottom cursor-pointer'
    item.dataset.territoryId = territory.properties.id
    
    item.innerHTML = `
      <h6 class="mb-1">
        ${territory.properties.number ? `#${territory.properties.number} - ` : ''}
        ${territory.properties.name}
      </h6>
      <small class="text-muted d-block">${this.translateStatus(territory.properties.status)}</small>
      <small class="d-block">${territory.properties.area} acres</small>
      <div class="mt-2">
        <button class="btn btn-sm btn-outline-primary" 
                onclick="printTerritory(${territory.properties.id}, '${territory.properties.name}')">
          🖨️ Imprimir
        </button>
      </div>
    `
    
    // Add click handler to show territory detail modal
    item.addEventListener('click', (e) => {
      // Don't trigger if clicking the button
      if (e.target.tagName === 'BUTTON') return
      
      this.showTerritoryMapModal(territory)
    })
    
    return item
  }
  
  async showTerritoryMapModal(territory) {
    const properties = territory.properties
    
    console.log('Opening territory detail modal from list for:', properties.name)
    
    // Update modal title
    const title = `${properties.number ? `#${properties.number} - ` : ''}${properties.name}`
    const titleElement = document.getElementById('territoryDetailTitle')
    if (titleElement) {
      titleElement.textContent = title
    }
    
    // Hide the info section, only show map
    const infoParent = document.getElementById('territoryDetailInfo')?.parentElement
    if (infoParent) {
      infoParent.style.display = 'none'
    }
    
    const mapParent = document.querySelector('#territoryDetailMap')?.parentElement
    if (mapParent) {
      mapParent.className = 'col-12'
    }
    
    // Update map to full height
    const mapElement = document.getElementById('territoryDetailMap')
    if (mapElement) {
      mapElement.style.height = '500px'
    }
    
    // Store territory ID for print button
    window.currentDetailTerritoryId = properties.id
    window.currentDetailTerritoryName = properties.name
    
    // Show modal - try multiple methods
    const modalElement = document.getElementById('territoryDetailModal')
    if (!modalElement) {
      console.error('Modal element not found!')
      return
    }
    
    // Try Bootstrap 5 Modal API
    try {
      if (typeof bootstrap !== 'undefined' && bootstrap.Modal) {
        const modal = new bootstrap.Modal(modalElement)
        modal.show()
        
        // Initialize map after modal is shown
        modalElement.addEventListener('shown.bs.modal', async () => {
          await this.initTerritoryMap(properties)
        }, { once: true })
      } else {
        // Fallback: use jQuery Bootstrap
        console.log('Using jQuery Bootstrap fallback')
        $(modalElement).modal('show')
        
        // Initialize map after modal is shown
        $(modalElement).one('shown.bs.modal', async () => {
          await this.initTerritoryMap(properties)
        })
      }
    } catch (error) {
      console.error('Error showing modal:', error)
      // Last resort: just show it manually
      modalElement.classList.add('show')
      modalElement.style.display = 'block'
      document.body.classList.add('modal-open')
      
      // Initialize map immediately
      setTimeout(() => {
        this.initTerritoryMap(properties)
      }, 300)
    }
  }
  
  async initTerritoryMap(properties) {
    // Remove existing map if any
    const mapContainer = document.getElementById('territoryDetailMap')
    mapContainer.innerHTML = ''
    
    // Create new map
    const detailMap = L.map('territoryDetailMap')
    
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '© OpenStreetMap contributors'
    }).addTo(detailMap)
    
    // Fetch territory geometry from API
    try {
      const response = await fetch(`/api/v1/territories/${properties.id}`)
      const territory = await response.json()
      
      const coordinates = territory.geometry.coordinates[0].map(c => [c[1], c[0]])
      
      // Draw polygon with thicker border
      const polygon = L.polygon(coordinates, {
        color: '#000',
        fillColor: '#4CAF50',
        fillOpacity: 0.3,
        weight: 3
      }).addTo(detailMap)
      
      // Fit map to polygon with good zoom
      detailMap.fitBounds(polygon.getBounds(), { padding: [30, 30], maxZoom: 18 })
      
    } catch (error) {
      console.error('Error loading territory details:', error)
      mapContainer.innerHTML = '<p class="text-danger">Error al cargar el mapa</p>'
    }
  }
  
  centerOnTerritory(territory) {
    const center = territory.properties.center
    
    if (center && center.lat && center.lng) {
      const map = window.territoryMap
      if (map) {
        map.setView([center.lat, center.lng], 15)
      }
    }
  }
  
  getFilteredTerritories() {
    if (!this.hasStatusFilterTarget) return this.territories
    
    const selectedStatus = this.statusFilterTarget.value
    
    if (!selectedStatus) return this.territories
    
    return this.territories.filter(territory => 
      territory.properties.status === selectedStatus
    )
  }
  
  filterByStatus(event) {
    this.render()
    
    // Also update map display
    const filteredTerritories = this.getFilteredTerritories()
    this.renderOnMap(filteredTerritories)
  }
  
  renderOnMap(territories) {
    // Find territory-map controller and render
    const mapElement = document.querySelector('[data-controller~="territories--territory-map"]')
    if (mapElement) {
      const mapController = this.application.getControllerForElementAndIdentifier(mapElement, 'territories--territory-map')
      if (mapController && typeof mapController.render === 'function') {
        mapController.render(territories)
      }
    }
  }
  
  translateStatus(status) {
    const translations = {
      'available': 'Disponible',
      'assigned': 'Asignado',
      'completed': 'Completado',
      'returned': 'Devuelto'
    }
    
    return translations[status] || status
  }
  
  // Public method to reload territories
  reload() {
    this.load(this.congregationIdValue)
  }
  
  // Update congregation ID and reload
  setCongregationId(id) {
    this.congregationIdValue = id
    this.load(id)
  }
}

