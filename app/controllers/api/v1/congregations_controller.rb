class Api::V1::CongregationsController < ApplicationController
  before_action :set_congregation, only: [:show, :update, :destroy]
  skip_before_action :verify_authenticity_token, only: [:create, :update, :destroy]

  def index
    render json: Congregation.all.map(&:to_geojson)
  end

  def show
    render json: @congregation.to_geojson
  end

  def create
    congregation = Congregation.new(congregation_params)
    if congregation.save
      render json: congregation.to_geojson, status: :created
    else
      render json: { errors: congregation.errors.full_messages }, status: :unprocessable_entity
    end
  end

  def update
    if @congregation.update(congregation_params)
      render json: @congregation.to_geojson
    else
      render json: { errors: @congregation.errors.full_messages }, status: :unprocessable_entity
    end
  end

  def destroy
    @congregation.destroy
    head :no_content
  end

  private

  def set_congregation
    @congregation = Congregation.find(params[:id])
  end

  def congregation_params
    raw = params[:congregation].present? ? params[:congregation] : params
    raw = raw.respond_to?(:to_unsafe_h) ? raw.to_unsafe_h : raw

    attributes = {}
    name = raw['name'] || raw[:name]
    description = raw['description'] || raw[:description]
    attributes[:name] = name if name.present?
    attributes[:description] = description if description.present?

    if raw['boundaries'].present? || raw[:boundaries].present?
      geojson = raw['boundaries'] || raw[:boundaries]
      if (geojson['type'] || geojson[:type]) == 'Polygon' && (geojson['coordinates'] || geojson[:coordinates]).present?
        coords_arr = geojson['coordinates'] || geojson[:coordinates]
        ring = coords_arr[0]
        coords = ring.map { |coord| "#{coord[0]} #{coord[1]}" }.join(', ')
        attributes[:boundaries] = "POLYGON((#{coords}))"
      end
    end

    if raw['center'].present? || raw[:center].present?
      center = raw['center'] || raw[:center]
      lng = center['lng'] || center[:lng]
      lat = center['lat'] || center[:lat]
      if lng.present? && lat.present?
        attributes[:center] = "POINT(#{lng} #{lat})"
      end
    end

    ActionController::Parameters.new(attributes).permit(:name, :description, :boundaries, :center)
  end

  def api_congregation_params
    params.permit(:name, :description, boundaries: [:type, coordinates: []], center: [:lng, :lat])
  end
end

