class Api::V1::TerritoriesController < ApplicationController
  before_action :set_territory, only: [:show, :update, :destroy, :assign, :return, :complete]
  skip_before_action :verify_authenticity_token, only: [:create, :update, :destroy, :assign, :return, :complete]

  def index
    @territories = Territory.all
    if params[:congregation_id].present?
      @territories = @territories.where(congregation_id: params[:congregation_id])
    end
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
    raw = params[:territory].present? ? params[:territory] : params
    raw = raw.respond_to?(:to_unsafe_h) ? raw.to_unsafe_h : raw
    attributes = {}
    attributes[:name] = raw['name'] || raw[:name]
    attributes[:description] = raw['description'] || raw[:description]
    attributes[:status] = raw['status'] || raw[:status]
    attributes[:assigned_to_id] = raw['assigned_to_id'] || raw[:assigned_to_id]
    attributes[:congregation_id] = raw['congregation_id'] || raw[:congregation_id]
    attributes[:number] = raw['number'] || raw[:number]
    
    if raw['boundaries'].present? || raw[:boundaries].present?
      geojson = raw['boundaries'] || raw[:boundaries]
      if geojson[:type] == 'Polygon' && geojson[:coordinates].present?
        coords = geojson[:coordinates][0].map { |coord| "#{coord[0]} #{coord[1]}" }.join(', ')
        attributes[:boundaries] = "POLYGON((#{coords}))"
      end
    end
    
    if raw['center'].present? || raw[:center].present?
      center = raw['center'] || raw[:center]
      if center[:lng].present? && center[:lat].present?
        attributes[:center] = "POINT(#{center[:lng]} #{center[:lat]})"
      end
    end
    ActionController::Parameters.new(attributes).permit(:name, :description, :status, :assigned_to_id, :boundaries, :center, :congregation_id, :number)
  end

  def api_territory_params
    params.permit(:name, :description, :status, :assigned_to_id, :congregation_id, :number, boundaries: [:type, coordinates: []], center: [:lng, :lat])
  end
end
