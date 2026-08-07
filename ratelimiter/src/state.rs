use redis::aio::ConnectionManager;

#[derive(Clone)]
pub struct AppState {
    pub redis: ConnectionManager,
    pub api_key: String,
    pub default_max_rps: u32,
    pub default_dedup_ttl_secs: u64,
}
