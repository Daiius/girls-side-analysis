use std::fs;
use utoipa::OpenApi;
use server::openapi::ApiDoc;

fn main() {
    let yaml = ApiDoc::openapi().to_yaml().expect("failed to generate OpenAPI spec.");
    fs::write("openapi.yaml", yaml).expect("failed to open openapi.yaml");
}

