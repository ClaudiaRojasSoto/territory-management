class ChangeCenterColumnsToGeometry < ActiveRecord::Migration[7.1]
  def change
    # territories.center: point -> geometry(Point,4326)
    change_table :territories do |t|
      t.remove :center
    end
    add_column :territories, :center, :st_point, geographic: true

    # congregations.center: point -> geometry(Point,4326)
    change_table :congregations do |t|
      t.remove :center
    end
    add_column :congregations, :center, :st_point, geographic: true
  end
end
