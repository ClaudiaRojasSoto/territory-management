class Territory < ApplicationRecord
  belongs_to :congregation
  belongs_to :assigned_to, class_name: 'User', optional: true
  
  validates :name, presence: true
  validates :status, inclusion: { in: %w[available assigned completed returned] }
  
  # Geoespacial
  validates :boundaries, presence: true
  validates :center, presence: true
  
  # Scopes
  scope :available, -> { where(status: 'available') }
  scope :assigned, -> { where(status: 'assigned') }
  scope :completed, -> { where(status: 'completed') }
  scope :returned, -> { where(status: 'returned') }
  
  # Métodos geoespaciales
  def area_in_sq_meters
    return nil unless boundaries
    RGeo::Geos.factory(srid: 4326).parse_wkt(boundaries).area
  end
  
  def area_in_acres
    return nil unless area_in_sq_meters
    (area_in_sq_meters * 0.000247105).round(2)
  end
  
  def assign_to(user)
    update(
      assigned_to: user,
      assigned_at: Time.current,
      status: 'assigned'
    )
  end
  
  def return_territory
    update(
      returned_at: Time.current,
      status: 'returned'
    )
  end
  
  def complete_territory
    update(status: 'completed')
  end
  
  def to_geojson
    {
      type: 'Feature',
      geometry: RGeo::GeoJSON.encode(boundaries),
      properties: {
        id: id,
        name: name,
        status: status,
        area: area_in_acres,
        number: number,
        congregation_id: congregation_id,
        center: center && { lng: center.longitude, lat: center.latitude },
        assigned_to: assigned_to&.name
      }
    }
  end
end
