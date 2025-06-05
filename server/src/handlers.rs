use serde::Deserialize;
use utoipa::IntoParams;
use crate::dto::{
    CharacterDto,
    UserStateDto,
    UserStatesMasterDto,
};
use sea_orm::{
    DatabaseConnection,
    EntityTrait,
    ColumnTrait,
    QueryFilter,
    QueryOrder,
};
use sea_orm::sea_query::{ Query };
use axum:: {
    response::Json,
    extract::{ State, Path },
};
use crate::entity::{
    characters,
    user_states,
    user_states_master,
};
use crate::errors::AppError;

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
    let result = characters::Entity::find()
        .order_by_asc(characters::Column::Series)
        .order_by_asc(characters::Column::Sort)
        .all(&db)
        .await?;

    let json = result
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

    //println!("id: {:?}", &id);

    // NOTE ORM的なEntity::findと、sqlx的なQuery::select()と2通りある
    // サブクエリはよりプリミティブになるためか、後者の定義が必要

    //let subquery = user_states::Entity::find()
    //    .select_only()
    //    .filter(user_states::Column::TwitterId.eq(&id))
    //    .column_as(user_states::Column::RecordedTime.max(), "latest_recorded_time")
    //    .into_query();
    let subquery = Query::select()
        .expr(user_states::Column::RecordedTime.max())
        .from(user_states::Entity)
        .and_where(user_states::Column::TwitterId.eq(&id))
        .to_owned();
    let mainquery = user_states::Entity::find()
        .filter(
            user_states::Column::TwitterId.eq(&id)
            .and(
                // TODO サブクエリ結果は1件のはずなのでinでなく=を使いたい
                // できないっぽい...??
                user_states::Column::RecordedTime.in_subquery(subquery)
            )
        );
    //println!("mainquery: {:?}", &mainquery.build(DbBackend::MySql).to_string());

    let result = mainquery
        .all(&db)
        .await?;

    let json = result
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
    let result = user_states_master::Entity::find()
        .all(&db)
        .await?;
    let json = result
        .into_iter()
        .map(UserStatesMasterDto::from)
        .collect();

    Ok(Json(json))
}

