# Promotes the user with SUPER_ADMIN_EMAIL to super_admin on boot (idempotent).
# Use this on hosts without a paid shell (e.g. Render free): set SUPER_ADMIN_EMAIL
# in the dashboard to the exact email of an existing account, then redeploy or restart.
Rails.application.config.after_initialize do
  email = ENV.fetch("SUPER_ADMIN_EMAIL", "").strip.downcase
  next if email.blank?

  user = User.find_by("LOWER(email) = ?", email)
  next unless user
  next if user.super_admin?

  user.update_column(:super_admin, true)
end
