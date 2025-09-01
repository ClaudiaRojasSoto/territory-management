module ApplicationHelper
  # Helper para mostrar el estado del territorio con colores
  def territory_status_badge(status)
    case status
    when 'available'
      content_tag :span, t("common.status.available"), class: 'badge bg-success'
    when 'assigned'
      content_tag :span, t("common.status.assigned"), class: 'badge bg-warning'
    when 'completed'
      content_tag :span, t("common.status.completed"), class: 'badge bg-info'
    when 'returned'
      content_tag :span, t("common.status.returned"), class: 'badge bg-danger'
    else
      content_tag :span, status, class: 'badge bg-secondary'
    end
  end
  
  # Helper para formatear el área
  def format_area(area)
    if area
      "#{area} #{t('common.units.acres')}"
    else
      "N/A"
    end
  end
  
  # Helper para mostrar la fecha en formato legible
  def format_date(date)
    date&.strftime("%d/%m/%Y %H:%M")
  end
end
