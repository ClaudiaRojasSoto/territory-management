class Api::V1::CongregationsController < ApplicationController
  before_action :set_congregation, only: [:show, :update, :destroy]
  skip_before_action :verify_authenticity_token, only: [:create, :update, :destroy]

  def index
    congregations = current_user.super_admin? ? Congregation.all : current_user.congregations
    render json: congregations.map(&:to_geojson)
  end

  def show
    render json: @congregation.to_geojson
  end

  def create
    congregation = Congregation.new(congregation_params)
    if congregation.save
      CongregationMembership.create!(user: current_user, congregation: congregation, role: :admin)
      render json: congregation.to_geojson, status: :created
    else
      render json: { errors: congregation.errors.full_messages }, status: :unprocessable_entity
    end
  end

  def update
    require_congregation_admin!(@congregation)
    if @congregation.update(congregation_params)
      @congregation.reload
      render json: @congregation.to_geojson
    else
      render json: { errors: @congregation.errors.full_messages }, status: :unprocessable_entity
    end
  end

  def destroy
    require_congregation_admin!(@congregation)
    @congregation.destroy
    head :no_content
  end

  private

  def set_congregation
    @congregation = accessible_congregations.find(params[:id])
  end

  def accessible_congregations
    current_user.super_admin? ? Congregation.all : current_user.congregations
  end

  def congregation_params
    raw = params[:congregation].present? ? params[:congregation] : params
    raw = raw.respond_to?(:to_unsafe_h) ? raw.to_unsafe_h : raw

    attributes = {}
    name = raw['name'] || raw[:name]
    description = raw['description'] || raw[:description]
    attributes[:name] = name if name.present?
    attributes[:description] = description if description.present?

    if raw.key?('boundaries') || raw.key?(:boundaries)
      if raw['boundaries'].nil? || raw[:boundaries].nil?
        attributes[:boundaries] = nil
      else
        geojson = raw['boundaries'] || raw[:boundaries]
        if (geojson['type'] || geojson[:type]) == 'Polygon' && (geojson['coordinates'] || geojson[:coordinates]).present?
          coords_arr = geojson['coordinates'] || geojson[:coordinates]
          ring = coords_arr[0]
          coords = ring.map { |coord| "#{coord[0]} #{coord[1]}" }.join(', ')
          attributes[:boundaries] = "SRID=4326;POLYGON((#{coords}))"
        end
      end
    end

    if raw.key?('center') || raw.key?(:center)
      if raw['center'].nil? || raw[:center].nil?
        attributes[:center] = nil
      else
        center = raw['center'] || raw[:center]
        lng = center['lng'] || center[:lng]
        lat = center['lat'] || center[:lat]
        if lng.present? && lat.present?
          attributes[:center] = "SRID=4326;POINT(#{lng} #{lat})"
        end
      end
    end

    ActionController::Parameters.new(attributes).permit(:name, :description, :boundaries, :center)
  end
end
