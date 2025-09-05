class AddCongregationToTerritories < ActiveRecord::Migration[7.1]
  def change
    add_reference :territories, :congregation, null: false, foreign_key: true
    add_column :territories, :number, :integer
    add_index :territories, [:congregation_id, :number], unique: true, where: "number IS NOT NULL"
  end
end
