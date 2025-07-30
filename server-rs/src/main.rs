use axum::{
    routing::get,
    routing::post,
    Router,
};
use utoipa_swagger_ui::SwaggerUi;
use server::handlers;
use utoipa::OpenApi;
use server::openapi::ApiDoc;

mod db;

#[tokio::main]
async fn main() {
    println!("Hello, world!");

    dotenvy::dotenv().ok();

    let db = db::init().await.expect("cannot connect to db...");

    let app = Router::new()
        .route("/characters", get(handlers::get_characters))
        .route("/users/{id}", get(handlers::get_user_state))
        .route("/users/{id}", post(handlers::post_user_state))
        .route("/user-statuses", get(handlers::get_user_statuses))
        .merge(
            SwaggerUi::new("/docs")
                .url("/api/doc/openapi.json", ApiDoc::openapi())
        )
        .with_state(db);
    let listener = tokio::net::TcpListener::bind("0.0.0.0:3000").await.unwrap();

    axum::serve(listener, app).await.unwrap()
}

