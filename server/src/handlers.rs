use serde::Deserialize;
use utoipa::IntoParams;
use crate::dto::{
    CharacterDto,
    UserStateDto,
    UserStatesMasterDto,
    PostUserStatusPayload,
};
use sea_orm::DatabaseConnection;
use axum:: {
    response::Json,
    extract::{ State, Path },
};
use crate::errors::AppError;
use crate::repositories;
use crate::services;

/// DBに記録されたキャラクター一覧を取得
#[axum::debug_handler]
#[utoipa::path(
    operation_id = "getCharacters",
    tags = ["Characters"],
    get,
    path = "/characters",
    responses(
        (status = 200, description = "成功", body = [CharacterDto])
    ),
)]
pub async fn get_characters(
    State(db): State<DatabaseConnection>,
) -> Result<Json<Vec<CharacterDto>>, AppError> {

    let json = repositories::get_characters(&db)
        .await?
        .into_iter()
        .map(CharacterDto::from)
        .collect();

    Ok(Json(json))
}

#[derive(Deserialize, IntoParams)]
pub struct UserPath {
    pub id: String
}

/// ユーザの最新のプレイ状況を取得します
///
/// NOTE DBにはユーザの過去のプレイ状況変化が蓄積されています
#[axum::debug_handler]
#[utoipa::path(
    operation_id = "getUser",
    tags = ["Users"],
    get, path = "/users/{id}",
    params(UserPath),
    responses(
        (status = 200, description = "ユーザ情報取得成功", body = [UserStateDto])
    ),
)]
pub async fn get_user_state(
    Path(UserPath { id }): Path<UserPath>,
    State(db): State<DatabaseConnection>,
) -> Result<Json<Vec<UserStateDto>>, AppError> {

    let json = repositories::get_latest_user_state(&id, &db)
        .await?
        .into_iter()
        .map(UserStateDto::from)
        .collect();

    Ok(Json(json))
}


/// ユーザのプレイ状況のパターン一覧を取得します
#[axum::debug_handler]
#[utoipa::path(
    operation_id = "getUserStatuses",
    tags = ["Users"],
    get, path = "/user-statuses",
    responses(
        (
            status = 200, 
            description = "ユーザ状態パターン一覧取得成功", 
            body = [UserStatesMasterDto]
        )
    ),
)]
pub async fn get_user_statuses(
    State(db): State<DatabaseConnection>,
) -> Result<Json<Vec<UserStatesMasterDto>>, AppError> {
    let json = repositories::get_user_states(&db)
        .await?
        .into_iter()
        .map(UserStatesMasterDto::from)
        .collect();

    Ok(Json(json))
}

/// ユーザの最新のプレイ状況を登録します
///
/// プレイ状況が変化していない場合、DB変更は行われません
#[axum::debug_handler]
#[utoipa::path(
    operation_id = "postUserStatus",
    tags = ["Users"],
    post, path = "/users/{id}",
    params(UserPath),
    request_body = PostUserStatusPayload,
    responses(
        (status = 200, description = "ユーザ状態記録成功")
    ),
)]
pub async fn post_user_state(
    Path(UserPath { id }): Path<UserPath>,
    State(db): State<DatabaseConnection>,
    Json(payload): Json<Vec<PostUserStatusPayload>>,
) -> Result<(), AppError> {
    // TODO 最新データとpayloadの差を比較するロジックは分けたいところ
    let latest = repositories::get_latest_user_state(&id, &db)
        .await?;
    if !services::is_same_state(&latest, &payload) { 
        repositories::insert_user_state(&id, payload, &db).await?;
    }
    
    Ok(())
}

