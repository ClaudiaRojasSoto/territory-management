class AddForeignKeyTerritoriesToUsers < ActiveRecord::Migration[7.1]
  def change
    add_foreign_key :territories, :users, column: :assigned_to_id
  end
end
