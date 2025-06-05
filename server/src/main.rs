use axum::{
    routing::get,
    Router,
};
use utoipa_swagger_ui::SwaggerUi;
mod db;
mod entity;
mod dto;
mod handlers;
use handlers::{
    get_characters,
    get_user_state,
};
use utoipa::OpenApi;
mod openapi;
use openapi::ApiDoc;


#[tokio::main]
async fn main() {
    println!("Hello, world!");

    dotenvy::dotenv().ok();

    let db = db::init().await.expect("cannot connect to db...");

    let app = Router::new()
        .route("/", get(|| async { "Hello, axum!" }))
        .route("/characters", get(get_characters))
        .route("/users/{id}", get(get_user_state))
        .merge(SwaggerUi::new("/docs").url("/api/doc/openapi.json", ApiDoc::openapi()))
        .with_state(db);
    let listener = tokio::net::TcpListener::bind("0.0.0.0:3000").await.unwrap();

    axum::serve(listener, app).await.unwrap()
}

