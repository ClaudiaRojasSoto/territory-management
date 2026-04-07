class AddAuthFieldsToUsers < ActiveRecord::Migration[7.1]
  def change
    add_column :users, :name, :string
    add_reference :users, :congregation, foreign_key: true
  end
end
