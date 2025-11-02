class AddDetailsToUsers < ActiveRecord::Migration[7.1]
  def change
    add_column :users, :name, :string, null: false
    add_column :users, :city, :string
    add_column :users, :role, :string, default: 'user', null: false
    add_reference :users, :congregation, foreign_key: true
    add_column :users, :active, :boolean, default: true, null: false
    
    add_index :users, :role
  end
end
