provider "google" {
  project = var.project_id
  region  = var.region
}

# Enable required APIs
locals {
  services = [
    "artifactregistry.googleapis.com",
    "container.googleapis.com",
    "sqladmin.googleapis.com",
    "redis.googleapis.com",
    "iam.googleapis.com",
    "cloudresourcemanager.googleapis.com",
    "cloudbuild.googleapis.com"
  ]
}

resource "google_project_service" "enabled_services" {
  for_each = toset(local.services)
  project  = var.project_id
  service  = each.key

  disable_on_destroy = false
}

resource "google_container_cluster" "primary" {
  name     = "crowdflow-cluster"
  location = var.region

  # We're using a managed node pool
  remove_default_node_pool    = true
  initial_node_count          = 1
  deletion_protection         = false # Set to true for production!

  # Configuration for the temporary initial node pool (to stay under quota)
  node_config {
    disk_size_gb = 20
    disk_type    = "pd-standard"
  }

  depends_on = [google_project_service.enabled_services]
}

resource "google_container_node_pool" "primary_nodes" {
  name       = "crowdflow-node-pool"
  location   = var.region
  cluster    = google_container_cluster.primary.name
  node_count = 2

  node_config {
    preemptible  = false
    machine_type = "e2-medium"
    disk_size_gb = 50
    disk_type    = "pd-standard"

    oauth_scopes = [
      "https://www.googleapis.com/auth/cloud-platform"
    ]
  }
}

resource "google_sql_database_instance" "postgres" {
  name             = "crowdflow-postgres"
  database_version = "POSTGRES_16"
  region           = var.region
  deletion_protection = false # Set to true for production!

  settings {
    tier      = "db-f1-micro"
    edition   = "ENTERPRISE"
    disk_type = "PD_HDD"
    disk_size = 10
  }

  depends_on = [google_project_service.enabled_services]
}

resource "google_sql_database" "database" {
  name     = "crowdflow"
  instance = google_sql_database_instance.postgres.name
}

resource "google_sql_user" "users" {
  name     = "crowdflow_admin"
  instance = google_sql_database_instance.postgres.name
  password = "changeme123" # In production, use a secret manager or terraform variable
}

resource "google_redis_instance" "cache" {
  name           = "crowdflow-cache"
  memory_size_gb = 1
  region         = var.region

  depends_on = [google_project_service.enabled_services]
}

resource "google_artifact_registry_repository" "repo" {
  location      = var.region
  repository_id = "crowdflow-repo"
  format        = "DOCKER"

  depends_on = [google_project_service.enabled_services]
}

# CI/CD Service Account for GitHub Actions
resource "google_service_account" "github_actions" {
  account_id   = "github-actions-sa"
  display_name = "GitHub Actions Service Account"
  depends_on   = [google_project_service.enabled_services]
}

resource "google_project_iam_member" "github_actions_editor" {
  project = var.project_id
  role    = "roles/editor"
  member  = "serviceAccount:${google_service_account.github_actions.email}"
}

resource "google_service_account_key" "github_actions_key" {
  service_account_id = google_service_account.github_actions.name
}
