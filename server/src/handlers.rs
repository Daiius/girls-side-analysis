use serde::Deserialize;
use utoipa::IntoParams;
use crate::dto::{
    CharacterDto,
    UserStateDto,
};
use sea_orm::DatabaseConnection;
use axum:: {
    response::Json,
    extract::{ State, Path },
};
use crate::entity::characters;
use sea_orm::{ EntityTrait, QueryOrder };

#[utoipa::path(
    get,
    path = "/characters",
    responses(
        (status = 200, description = "成功", body = [CharacterDto])
    ),
)]
pub async fn get_characters(
    State(db): State<DatabaseConnection>,
) -> Json<Vec<CharacterDto>> {
    let result = characters::Entity::find()
        .order_by_asc(characters::Column::Series)
        .order_by_asc(characters::Column::Sort)
        .all(&db)
        .await
        .unwrap_or_default();

    let json = result
        .into_iter()
        .map(CharacterDto::from)
        .collect();

    Json(json)
}

#[derive(Deserialize, IntoParams)]
pub struct UserPath {
    pub id: String
}

#[utoipa::path(
    get, path = "/users/{id}",
    params(UserPath),
    responses(
        (status = 200, description = "ユーザ情報取得成功", body = [UserStateDto])
    ),
)]
pub async fn get_user_state(
    Path(UserPath { id }): Path<UserPath>,
    State(state): State<DatabaseConnection>,
) -> Json<UserStateDto> {
}
