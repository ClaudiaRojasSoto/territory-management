class CreateInvitations < ActiveRecord::Migration[7.1]
  def change
    create_table :invitations do |t|
      t.string :token, null: false
      t.references :congregation, null: false, foreign_key: true
      t.integer :role, null: false, default: 1
      t.datetime :used_at
      t.datetime :expires_at, null: false

      t.timestamps
    end

    add_index :invitations, :token, unique: true
  end
end
