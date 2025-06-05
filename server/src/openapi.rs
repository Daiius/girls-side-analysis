
use utoipa::OpenApi;
use crate::dto::{
    CharacterDto,
    UserStateDto,
    UserStatesMasterDto,
};

use crate::handlers;

#[derive(OpenApi)]
#[openapi(
    paths(
        handlers::get_characters,
        handlers::get_user_state,
        handlers::get_user_statuses,
    ),
    components(
        schemas(
            CharacterDto,
            UserStateDto,
            UserStatesMasterDto,
        ),
    ),
    tags(
        (name = "Characters", description = "キャラクター関連"),
        (name = "Users", description = "ユーザ関連"),
    ),
    info(
        title = "Gril's side analysis APIs", 
        version = "0.0.1",
        description="ときめきメモリアルGirl's side分析ファンサイト用APIエンドポイント"
    ),
)]
pub struct ApiDoc;

