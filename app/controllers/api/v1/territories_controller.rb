class Api::V1::TerritoriesController < ApplicationController
  before_action :set_territory, only: [:show, :update, :destroy, :assign, :return, :complete]
  skip_before_action :verify_authenticity_token, only: [:create, :update, :destroy, :assign, :return, :complete]

  def index
    @territories = scoped_territories
    @territories = @territories.where(congregation_id: params[:congregation_id]) if params[:congregation_id].present?
    render json: @territories.map(&:to_geojson)
  end

  def show
    render json: @territory.to_geojson
  end

  def create
    attrs = territory_params
    congregation = Congregation.find_by(id: attrs[:congregation_id])
    unless congregation && (current_user.super_admin? || current_user.member_of?(congregation))
      render json: { errors: ['No autorizado para crear territorios en esta congregación'] }, status: :forbidden
      return
    end

    @territory = Territory.new(attrs)

    if @territory.save
      render json: @territory.to_geojson, status: :created
    else
      render json: { errors: @territory.errors.full_messages }, status: :unprocessable_entity
    end
  rescue ActiveRecord::RecordNotUnique => e
    Rails.logger.warn("[Territories#create] RecordNotUnique: #{e.message}")
    render json: { errors: ['Ese número de territorio ya existe en esta congregación.'] }, status: :unprocessable_entity
  rescue ActiveRecord::StatementInvalid => e
    Rails.logger.error("[Territories#create] StatementInvalid: #{e.message}")
    render json: { errors: ['No se pudo guardar la geometría. Comprueba que el polígono sea válido e inténtalo de nuevo.'] }, status: :unprocessable_entity
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
    @territory = scoped_territories.find(params[:id])
  end

  def scoped_territories
    if current_user.super_admin?
      Territory.all
    else
      Territory.where(congregation_id: current_user.congregation_ids)
    end
  end

  def territory_params
    raw = params[:territory].present? ? params[:territory] : params
    raw = raw.respond_to?(:to_unsafe_h) ? raw.to_unsafe_h : raw

    attributes = {}
    attributes[:name] = raw['name'] || raw[:name]
    attributes[:description] = raw['description'] || raw[:description]
    attributes[:status] = raw['status'] || raw[:status]
    attributes[:assigned_to_id] = raw['assigned_to_id'] || raw[:assigned_to_id]
    cid = raw['congregation_id'] || raw[:congregation_id]
    attributes[:congregation_id] = cid.present? ? (Integer(cid) rescue nil) : nil
    attributes[:number] = raw['number'] || raw[:number]

    if raw['boundaries'].present? || raw[:boundaries].present?
      geojson = raw['boundaries'] || raw[:boundaries]
      geojson = geojson.to_unsafe_h if geojson.respond_to?(:to_unsafe_h)

      if (geojson['type'] || geojson[:type]) == 'Polygon' && (geojson['coordinates'] || geojson[:coordinates]).present?
        coords_arr = geojson['coordinates'] || geojson[:coordinates]
        ring = coords_arr[0]
        coords = ring.map { |coord| "#{coord[0]} #{coord[1]}" }.join(', ')
        attributes[:boundaries] = "SRID=4326;POLYGON((#{coords}))"
      end
    end

    if raw['center'].present? || raw[:center].present?
      center = raw['center'] || raw[:center]
      center = center.to_unsafe_h if center.respond_to?(:to_unsafe_h)

      lng = center['lng'] || center[:lng]
      lat = center['lat'] || center[:lat]
      if lng.present? && lat.present?
        attributes[:center] = "SRID=4326;POINT(#{lng} #{lat})"
      end
    end

    ActionController::Parameters.new(attributes).permit(:name, :description, :status, :assigned_to_id, :boundaries, :center, :congregation_id, :number)
  end

  def api_territory_params
    params.permit(:name, :description, :status, :assigned_to_id, :congregation_id, :number, boundaries: [:type, coordinates: []], center: [:lng, :lat])
  end
end
