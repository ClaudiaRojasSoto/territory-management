class TerritoriesController < ApplicationController
  before_action :set_territory, only: [:show, :edit, :update, :destroy]

  def index
    @territories = Territory.all
  end

  def show
  end

  def new
    @territory = Territory.new
  end

  def create
    @territory = Territory.new(territory_params)
    
    if @territory.save
      redirect_to @territory, notice: 'Territorio creado exitosamente.'
    else
      render :new, status: :unprocessable_entity
    end
  end

  def edit
  end

  def update
    if @territory.update(territory_params)
      redirect_to @territory, notice: 'Territorio actualizado exitosamente.'
    else
      render :edit, status: :unprocessable_entity
    end
  end

  def destroy
    @territory.destroy
    redirect_to territories_url, notice: 'Territorio eliminado exitosamente.'
  end

  private

  def set_territory
    @territory = Territory.find(params[:id])
  end

  def territory_params
    params.require(:territory).permit(:name, :description, :status, :assigned_to_id, :boundaries, :center)
  end
end
