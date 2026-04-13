provider "google" {
  project = var.project_id
  region  = var.region
}

resource "google_container_cluster" "primary" {
  name     = "crowdflow-cluster"
  location = var.region

  # We're using a managed node pool
  remove_default_node_pool = true
  initial_node_count       = 1
}

resource "google_container_node_pool" "primary_nodes" {
  name       = "crowdflow-node-pool"
  location   = var.region
  cluster    = google_container_cluster.primary.name
  node_count = 3

  node_config {
    preemptible  = true
    machine_type = "e2-medium"

    oauth_scopes = [
      "https://www.googleapis.com/auth/cloud-platform"
    ]
  }
}

resource "google_sql_database_instance" "postgres" {
  name             = "crowdflow-postgres-db"
  database_version = "POSTGRES_16"
  region           = var.region

  settings {
    tier = "db-f1-micro"
  }
}

resource "google_redis_instance" "cache" {
  name           = "crowdflow-cache"
  memory_size_gb = 1
  region         = var.region
}

resource "google_artifact_registry_repository" "repo" {
  location      = var.region
  repository_id = "crowdflow-repo"
  format        = "DOCKER"
}
