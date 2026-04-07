class MigrateOwnershipToMemberships < ActiveRecord::Migration[7.1]
  def up
    # Migrate existing congregation owners to admin memberships
    execute <<-SQL
      INSERT INTO congregation_memberships (user_id, congregation_id, role, created_at, updated_at)
      SELECT user_id, id, 0, NOW(), NOW()
      FROM congregations
      WHERE user_id IS NOT NULL
      ON CONFLICT (user_id, congregation_id) DO NOTHING
    SQL

    remove_reference :users, :congregation, foreign_key: true
    remove_reference :congregations, :user, foreign_key: true
  end

  def down
    add_reference :congregations, :user, foreign_key: true
    add_reference :users, :congregation, foreign_key: true
  end
end
