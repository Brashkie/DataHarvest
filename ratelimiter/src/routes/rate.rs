use std::time::{SystemTime, UNIX_EPOCH};

use axum::extract::State;
use axum::Json;
use redis::Script;
use serde::{Deserialize, Serialize};

use crate::error::AppError;
use crate::state::AppState;

// Atomic INCR+EXPIRE — must be one op, or a crash between the two calls
// leaves a key with no TTL forever. Redis runs scripts single-threaded, so
// this is race-free across concurrent Celery workers hitting the same
// domain in the same second.
const INCR_AND_EXPIRE: &str = r#"
local current = redis.call('INCR', KEYS[1])
if current == 1 then
    redis.call('EXPIRE', KEYS[1], ARGV[1])
end
return current
"#;

#[derive(Deserialize)]
pub struct RateCheckRequest {
    pub domain: String,
    pub max_rps: u32,
}

#[derive(Serialize)]
pub struct RateCheckResponse {
    pub allowed: bool,
    pub current: u64,
    pub limit: u32,
    pub retry_after_ms: u64,
}

pub async fn check(
    State(mut state): State<AppState>,
    Json(req): Json<RateCheckRequest>,
) -> Result<Json<RateCheckResponse>, AppError> {
    let domain = req.domain.trim().to_lowercase();
    if domain.is_empty() {
        return Err(AppError::BadRequest("domain must not be empty".into()));
    }
    let max_rps = if req.max_rps == 0 {
        state.default_max_rps
    } else {
        req.max_rps
    };

    let epoch_secs = SystemTime::now()
        .duration_since(UNIX_EPOCH)
        .unwrap_or_default()
        .as_secs();
    let key = format!("rl:{}:{}", domain, epoch_secs);

    let current: u64 = Script::new(INCR_AND_EXPIRE)
        .key(&key)
        .arg(2) // TTL: 2s, one second of buffer past the window
        .invoke_async(&mut state.redis)
        .await
        .map_err(AppError::Redis)?;

    let allowed = current <= max_rps as u64;
    // Simple heuristic: if over budget, wait for the current 1s window to
    // roll over rather than computing a precise sub-second offset.
    let retry_after_ms = if allowed { 0 } else { 1000 };

    Ok(Json(RateCheckResponse {
        allowed,
        current,
        limit: max_rps,
        retry_after_ms,
    }))
}
