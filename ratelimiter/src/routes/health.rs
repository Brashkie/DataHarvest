use axum::extract::State;
use axum::Json;
use serde_json::{json, Value};

use crate::state::AppState;

/// Always 200 if the HTTP server itself answers — a Redis blip is reported in
/// the body, not surfaced as a failing status, so a transient Redis hiccup
/// doesn't restart-loop this sidecar under a Docker healthcheck.
pub async fn health(State(mut state): State<AppState>) -> Json<Value> {
    let redis_status = match redis::cmd("PING")
        .query_async::<String>(&mut state.redis)
        .await
    {
        Ok(_) => "ok",
        Err(_) => "unreachable",
    };

    Json(json!({ "status": "ok", "redis": redis_status }))
}
