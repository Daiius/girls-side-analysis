use crate::dto::CharacterDto;
use sea_orm::DatabaseConnection;
use axum:: {
    response::Json,
    extract::State,
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

