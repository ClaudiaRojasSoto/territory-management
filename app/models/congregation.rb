class Congregation < ApplicationRecord
  has_many :territories, dependent: :destroy

  validates :name, presence: true
  validates :boundaries, presence: true
  validates :center, presence: true

  def to_geojson
    {
      type: 'Feature',
      geometry: RGeo::GeoJSON.encode(boundaries),
      properties: {
        id: id,
        name: name,
        description: description,
        center: center && { lng: center.longitude, lat: center.latitude }
      }
    }
  end
end
