class CreateTerritories < ActiveRecord::Migration[7.1]
  def change
    create_table :territories do |t|
      t.string :name, null: false
      t.text :description
      t.string :status, default: 'available'
      t.references :assigned_to, null: true, foreign_key: { to_table: :users }
      t.datetime :assigned_at
      t.datetime :returned_at
      t.text :notes
      t.decimal :area, precision: 10, scale: 2
      t.geometry :boundaries, srid: 4326
      t.point :center, srid: 4326

      t.timestamps
    end
    
    add_index :territories, :status
    add_index :territories, :boundaries, using: :gist
    add_index :territories, :center, using: :gist
  end
end
