class CreateCongregations < ActiveRecord::Migration[7.1]
  def change
    create_table :congregations do |t|
      t.string :name, null: false
      t.text :description
      t.geometry :boundaries, srid: 4326
      t.point :center, srid: 4326

      t.timestamps
    end
    add_index :congregations, :name
    add_index :congregations, :boundaries, using: :gist
    add_index :congregations, :center, using: :gist
  end
end
