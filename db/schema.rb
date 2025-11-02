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

ActiveRecord::Schema[7.1].define(version: 2025_11_02_004446) do
  # These are extensions that must be enabled in order to support this database
  enable_extension "plpgsql"
  enable_extension "postgis"

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
    t.string "name", null: false
    t.string "city"
    t.string "role", default: "user", null: false
    t.bigint "congregation_id"
    t.boolean "active", default: true, null: false
    t.index ["congregation_id"], name: "index_users_on_congregation_id"
    t.index ["email"], name: "index_users_on_email", unique: true
    t.index ["reset_password_token"], name: "index_users_on_reset_password_token", unique: true
    t.index ["role"], name: "index_users_on_role"
  end

  add_foreign_key "territories", "congregations"
  add_foreign_key "territories", "users", column: "assigned_to_id"
  add_foreign_key "users", "congregations"
end
