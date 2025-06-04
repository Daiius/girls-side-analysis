
use utoipa::OpenApi;
use crate::dto::CharacterDto;

use crate::handlers;

#[derive(OpenApi)]
#[openapi(
    paths(
        handlers::get_characters,
    ),
    components(
        schemas(CharacterDto),
    ),
    tags(
        (name = "Gril's side analysis APIs", description="ときめきメモリアルGirl's side分析ファンサイト用APIエンドポイント"),
    ),
)]
pub struct ApiDoc;

