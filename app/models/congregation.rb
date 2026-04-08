class Congregation < ApplicationRecord
  def self.ransackable_attributes(auth_object = nil)
    super - %w[boundaries center]
  end

  has_many :congregation_memberships, dependent: :destroy
  has_many :members, through: :congregation_memberships, source: :user
  has_many :territories, dependent: :destroy
  has_many :invitations, dependent: :destroy

  validates :name, presence: true

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
