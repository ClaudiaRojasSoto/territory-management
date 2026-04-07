class CreateCongregationMemberships < ActiveRecord::Migration[7.1]
  def change
    create_table :congregation_memberships do |t|
      t.references :user, null: false, foreign_key: true
      t.references :congregation, null: false, foreign_key: true
      t.integer :role, null: false, default: 1

      t.timestamps
    end

    add_index :congregation_memberships, [:user_id, :congregation_id], unique: true
  end
end
