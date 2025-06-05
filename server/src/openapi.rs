
use utoipa::OpenApi;
use crate::dto::{
    CharacterDto,
    UserStateDto,
};

use crate::handlers::*;

#[derive(OpenApi)]
#[openapi(
    paths(
        get_characters,
        get_user_state,
    ),
    components(
        schemas(
            CharacterDto,
            UserStateDto,
        ),
    ),
    tags(
        (name = "Gril's side analysis APIs", description="ときめきメモリアルGirl's side分析ファンサイト用APIエンドポイント"),
    ),
)]
pub struct ApiDoc;

