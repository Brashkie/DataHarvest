use anyhow::{bail, Context, Result};

#[derive(Clone)]
pub struct Config {
    pub host: String,
    pub port: u16,
    pub redis_url: String,
    pub api_key: String,
    pub default_max_rps: u32,
    pub default_dedup_ttl_secs: u64,
}

fn env_or(key: &str, default: &str) -> String {
    std::env::var(key).unwrap_or_else(|_| default.to_string())
}

impl Config {
    pub fn from_env() -> Result<Self> {
        let api_key = std::env::var("RATELIMITER_API_KEY").unwrap_or_default();
        if api_key.trim().is_empty() {
            bail!(
                "RATELIMITER_API_KEY is unset or empty — refusing to start an unauthenticated service"
            );
        }

        let port: u16 = env_or("RATELIMITER_PORT", "8090")
            .parse()
            .context("RATELIMITER_PORT must be a valid u16")?;
        let default_max_rps: u32 = env_or("RATELIMITER_DEFAULT_MAX_RPS", "2")
            .parse()
            .context("RATELIMITER_DEFAULT_MAX_RPS must be a valid u32")?;
        let default_dedup_ttl_secs: u64 = env_or("RATELIMITER_DEDUP_TTL_SECS", "3600")
            .parse()
            .context("RATELIMITER_DEDUP_TTL_SECS must be a valid u64")?;

        Ok(Config {
            host: env_or("RATELIMITER_HOST", "0.0.0.0"),
            port,
            redis_url: env_or("RATELIMITER_REDIS_URL", "redis://localhost:6379/3"),
            api_key,
            default_max_rps,
            default_dedup_ttl_secs,
        })
    }
}
