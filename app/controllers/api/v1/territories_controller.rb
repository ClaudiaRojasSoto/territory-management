class Api::V1::TerritoriesController < ApplicationController
  before_action :set_territory, only: [:show, :update, :destroy, :assign, :return, :complete]
  skip_before_action :verify_authenticity_token, only: [:create, :update, :destroy, :assign, :return, :complete]

  def index
    @territories = Territory.all
    render json: @territories.map(&:to_geojson)
  end

  def show
    render json: @territory.to_geojson
  end

  def create
    @territory = Territory.new(territory_params)
    
    if @territory.save
      render json: @territory.to_geojson, status: :created
    else
      render json: { errors: @territory.errors.full_messages }, status: :unprocessable_entity
    end
  end

  def update
    if @territory.update(territory_params)
      render json: @territory.to_geojson
    else
      render json: { errors: @territory.errors.full_messages }, status: :unprocessable_entity
    end
  end

  def destroy
    @territory.destroy
    head :no_content
  end

  def assign
    user = User.find(params[:user_id])
    @territory.assign_to(user)
    render json: @territory.to_geojson
  end

  def return
    @territory.return_territory
    render json: @territory.to_geojson
  end

  def complete
    @territory.complete_territory
    render json: @territory.to_geojson
  end

  private

  def set_territory
    @territory = Territory.find(params[:id])
  end

  def territory_params
    # Convertir los parámetros de GeoJSON a formato PostGIS
    params = api_territory_params
    
    if params[:boundaries].present?
      # Convertir GeoJSON a WKT para PostGIS
      geojson = params[:boundaries]
      if geojson[:type] == 'Polygon' && geojson[:coordinates].present?
        # Crear WKT string
        coords = geojson[:coordinates][0].map { |coord| "#{coord[0]} #{coord[1]}" }.join(', ')
        wkt = "POLYGON((#{coords}))"
        params[:boundaries] = wkt
      end
    end
    
    if params[:center].present?
      center = params[:center]
      if center[:lng].present? && center[:lat].present?
        params[:center] = "POINT(#{center[:lng]} #{center[:lat]})"
      end
    end
    
    params.permit(:name, :description, :status, :assigned_to_id, :boundaries, :center)
  end

  def api_territory_params
    params.permit(:name, :description, :status, :assigned_to_id, boundaries: [:type, coordinates: []], center: [:lng, :lat])
  end
end
