module TerritoriesHelper
  # Helper para mostrar el mapa de un territorio
  def territory_map(territory, options = {})
    options[:height] ||= '400px'
    options[:width] ||= '100%'
    
    content_tag :div, '', {
      id: "territory-map-#{territory.id}",
      style: "height: #{options[:height]}; width: #{options[:width]};",
      class: 'territory-map',
      data: {
        territory_id: territory.id,
        boundaries: territory.boundaries&.to_json,
        center: territory.center&.to_json
      }
    }
  end
  
  # Helper para mostrar las acciones de un territorio
  def territory_actions(territory)
    content_tag :div, class: 'territory-actions' do
      safe_join([
        link_to(t('territories.show.actions.edit'), edit_territory_path(territory), class: 'btn btn-sm btn-outline-primary me-2'),
        link_to(t('territories.show.actions.delete'), territory_path(territory), 
                method: :delete, 
                data: { confirm: '¿Estás seguro?' }, 
                class: 'btn btn-sm btn-outline-danger me-2'),
        territory_status_action(territory)
      ])
    end
  end
  
  # Helper para mostrar la acción de estado apropiada
  def territory_status_action(territory)
    case territory.status
    when 'available'
      content_tag :span, t('territories.show.actions.assign'), class: 'btn btn-sm btn-success disabled'
    when 'assigned'
      safe_join([
        link_to(t('territories.show.actions.complete'), 
                complete_api_v1_territory_path(territory), 
                method: :patch, 
                class: 'btn btn-sm btn-info me-2'),
        link_to(t('territories.show.actions.return'), 
                return_api_v1_territory_path(territory), 
                method: :patch, 
                class: 'btn btn-sm btn-warning')
      ])
    when 'completed'
      content_tag :span, t('territories.show.actions.completed'), class: 'btn btn-sm btn-info disabled'
    when 'returned'
      content_tag :span, t('territories.show.actions.returned'), class: 'btn btn-sm btn-warning disabled'
    else
      content_tag :span, territory.status, class: 'btn btn-sm btn-secondary disabled'
    end
  end
end
