# Pin npm packages by running ./bin/importmap

pin "@hotwired/turbo-rails", to: "turbo.min.js", preload: true
pin "@hotwired/stimulus", to: "stimulus.min.js", preload: true
pin "@hotwired/stimulus-loading", to: "stimulus-loading.js", preload: true
pin "controllers", preload: true
pin "bootstrap", to: "https://ga.jspm.io/npm:bootstrap@5.3.0/dist/js/bootstrap.bundle.min.js"
