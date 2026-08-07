use axum::extract::State;
use axum::Json;
use redis::AsyncCommands;
use serde::{Deserialize, Serialize};
use sha2::{Digest, Sha256};

use crate::error::AppError;
use crate::state::AppState;

#[derive(Deserialize)]
pub struct DedupCheckRequest {
    pub url: String,
    pub ttl_secs: Option<u64>,
}

#[derive(Serialize)]
pub struct DedupCheckResponse {
    pub seen: bool,
    pub ttl_secs: u64,
}

fn hash_url(url: &str) -> String {
    let digest = Sha256::digest(url.as_bytes());
    hex::encode(digest)
}

pub async fn check(
    State(mut state): State<AppState>,
    Json(req): Json<DedupCheckRequest>,
) -> Result<Json<DedupCheckResponse>, AppError> {
    let url = req.url.trim();
    if url.is_empty() {
        return Err(AppError::BadRequest("url must not be empty".into()));
    }
    let ttl_secs = req.ttl_secs.unwrap_or(state.default_dedup_ttl_secs);
    let key = format!("dedup:{}", hash_url(url));

    // SET key 1 NX EX ttl — atomic check-and-mark, no separate check-then-set
    // TOCTOU window. Returns None if the key already existed (seen=true),
    // Some(()) if it just set it (seen=false, now marked).
    let set_result: Option<String> = state
        .redis
        .set_options(
            &key,
            1,
            redis::SetOptions::default()
                .conditional_set(redis::ExistenceCheck::NX)
                .with_expiration(redis::SetExpiry::EX(ttl_secs)),
        )
        .await
        .map_err(AppError::Redis)?;

    let seen = set_result.is_none();

    Ok(Json(DedupCheckResponse { seen, ttl_secs }))
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn hash_url_is_deterministic() {
        assert_eq!(
            hash_url("https://example.com/page?x=1"),
            hash_url("https://example.com/page?x=1")
        );
    }

    #[test]
    fn hash_url_distinguishes_different_urls() {
        assert_ne!(
            hash_url("https://example.com/page?x=1"),
            hash_url("https://example.com/page?x=2")
        );
    }

    #[test]
    fn hash_url_is_hex_sha256_length() {
        // sha256 -> 32 bytes -> 64 hex chars
        assert_eq!(hash_url("https://example.com/").len(), 64);
    }
}
