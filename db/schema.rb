# This file is auto-generated from the current state of the database. Instead
# of editing this file, please use the migrations feature of Active Record to
# incrementally modify your database, and then regenerate this schema definition.
#
# This file is the source Rails uses to define your schema when running `bin/rails
# db:schema:load`. When creating a new database, `bin/rails db:schema:load` tends to
# be faster and is potentially less error prone than running all of your
# migrations from scratch. Old migrations may fail to apply correctly if those
# migrations use external dependencies or application code.
#
# It's strongly recommended that you check this file into your version control system.

ActiveRecord::Schema[7.1].define(version: 2026_04_07_235416) do
  # These are extensions that must be enabled in order to support this database
  enable_extension "plpgsql"
  enable_extension "postgis"

  create_table "active_admin_comments", force: :cascade do |t|
    t.string "namespace"
    t.text "body"
    t.string "resource_type"
    t.bigint "resource_id"
    t.string "author_type"
    t.bigint "author_id"
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.index ["author_type", "author_id"], name: "index_active_admin_comments_on_author"
    t.index ["namespace"], name: "index_active_admin_comments_on_namespace"
    t.index ["resource_type", "resource_id"], name: "index_active_admin_comments_on_resource"
  end

  create_table "congregation_memberships", force: :cascade do |t|
    t.bigint "user_id", null: false
    t.bigint "congregation_id", null: false
    t.integer "role", default: 1, null: false
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.index ["congregation_id"], name: "index_congregation_memberships_on_congregation_id"
    t.index ["user_id", "congregation_id"], name: "index_congregation_memberships_on_user_id_and_congregation_id", unique: true
    t.index ["user_id"], name: "index_congregation_memberships_on_user_id"
  end

  create_table "congregations", force: :cascade do |t|
    t.string "name", null: false
    t.text "description"
    t.geometry "boundaries", limit: {:srid=>4326, :type=>"geometry"}
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.geography "center", limit: {:srid=>4326, :type=>"st_point", :geographic=>true}
    t.index ["boundaries"], name: "index_congregations_on_boundaries", using: :gist
    t.index ["name"], name: "index_congregations_on_name"
  end

  create_table "invitations", force: :cascade do |t|
    t.string "token", null: false
    t.bigint "congregation_id", null: false
    t.integer "role", default: 1, null: false
    t.datetime "used_at"
    t.datetime "expires_at", null: false
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.index ["congregation_id"], name: "index_invitations_on_congregation_id"
    t.index ["token"], name: "index_invitations_on_token", unique: true
  end

  create_table "territories", force: :cascade do |t|
    t.string "name", null: false
    t.text "description"
    t.string "status", default: "available"
    t.bigint "assigned_to_id"
    t.datetime "assigned_at"
    t.datetime "returned_at"
    t.text "notes"
    t.decimal "area", precision: 10, scale: 2
    t.geometry "boundaries", limit: {:srid=>4326, :type=>"geometry"}
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.bigint "congregation_id", null: false
    t.integer "number"
    t.geography "center", limit: {:srid=>4326, :type=>"st_point", :geographic=>true}
    t.index ["assigned_to_id"], name: "index_territories_on_assigned_to_id"
    t.index ["boundaries"], name: "index_territories_on_boundaries", using: :gist
    t.index ["congregation_id", "number"], name: "index_territories_on_congregation_id_and_number", unique: true, where: "(number IS NOT NULL)"
    t.index ["congregation_id"], name: "index_territories_on_congregation_id"
    t.index ["status"], name: "index_territories_on_status"
  end

  create_table "users", force: :cascade do |t|
    t.string "email", default: "", null: false
    t.string "encrypted_password", default: "", null: false
    t.string "reset_password_token"
    t.datetime "reset_password_sent_at"
    t.datetime "remember_created_at"
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.string "name"
    t.boolean "super_admin", default: false, null: false
    t.index ["email"], name: "index_users_on_email", unique: true
    t.index ["reset_password_token"], name: "index_users_on_reset_password_token", unique: true
  end

  add_foreign_key "congregation_memberships", "congregations"
  add_foreign_key "congregation_memberships", "users"
  add_foreign_key "invitations", "congregations"
  add_foreign_key "territories", "congregations"
  add_foreign_key "territories", "users", column: "assigned_to_id"
end
