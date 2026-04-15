output "gcp_sa_key" {
  value     = google_service_account_key.github_actions_key.private_key
  sensitive = true
}

output "gke_cluster_endpoint" {
  value = google_container_cluster.primary.endpoint
}

output "sql_connection_name" {
  value = google_sql_database_instance.postgres.connection_name
}

output "redis_host" {
  value = google_redis_instance.cache.host
}

output "artifact_repository_url" {
  value = "${var.region}-docker.pkg.dev/${var.project_id}/${google_artifact_registry_repository.repo.repository_id}"
}
