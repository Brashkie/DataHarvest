mod auth;
mod config;
mod error;
mod routes;
mod state;

use axum::routing::{get, post};
use axum::Router;

use state::AppState;

#[tokio::main]
async fn main() -> anyhow::Result<()> {
    dotenvy::dotenv().ok();
    // Default to info-level logging when RUST_LOG is unset, so the sidecar
    // isn't silent in the dev stack; RUST_LOG still overrides when present.
    let filter = tracing_subscriber::EnvFilter::try_from_default_env()
        .unwrap_or_else(|_| tracing_subscriber::EnvFilter::new("info"));
    tracing_subscriber::fmt().with_env_filter(filter).init();

    let cfg = config::Config::from_env()?;

    let client = redis::Client::open(cfg.redis_url.clone())?;
    let redis = client.get_connection_manager().await?;

    let state = AppState {
        redis,
        api_key: cfg.api_key.clone(),
        default_max_rps: cfg.default_max_rps,
        default_dedup_ttl_secs: cfg.default_dedup_ttl_secs,
    };

    let protected = Router::new()
        .route("/rate/check", post(routes::rate::check))
        .route("/dedup/check", post(routes::dedup::check))
        .route_layer(axum::middleware::from_fn_with_state(
            state.clone(),
            auth::require_api_key,
        ));

    let app = Router::new()
        .route("/health", get(routes::health::health))
        .merge(protected)
        .layer(tower_http::trace::TraceLayer::new_for_http())
        .with_state(state);

    // Bind via a (host, port) tuple rather than parsing a formatted string as
    // a SocketAddr — RATELIMITER_HOST may be a hostname like "localhost",
    // which needs resolving, not just an IP literal.
    tracing::info!(host = %cfg.host, port = cfg.port, "ratelimiter listening");

    let listener = tokio::net::TcpListener::bind((cfg.host.as_str(), cfg.port)).await?;
    axum::serve(listener, app).await?;

    Ok(())
}
