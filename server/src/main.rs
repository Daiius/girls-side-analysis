use axum::{
    routing::get,
    Router,
};

#[tokio::main]
async fn main() {
    println!("Hello, world!");

    let app = Router::new()
        .route("/", get(|| async { "Hello, axum!" }))
        .route("/characters", get(get_characters));
    let listener = tokio::net::TcpListener::bind("0.0.0.0:3000").await.unwrap();

    axum::serve(listener, app).await.unwrap()
}

async fn get_characters() {
}
