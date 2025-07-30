use sea_orm::{
    DatabaseConnection,
    EntityTrait,
    ColumnTrait,
    QueryFilter,
    QueryOrder,
    Set,
};
use sea_orm::sea_query::Query;

use crate::dto::PostUserStatusPayload;
use crate::entity::{
    characters,
    user_states,
    user_states_master,
};

use crate::errors::AppError;

pub async fn get_characters(
    db: &DatabaseConnection,
) -> Result<Vec<characters::Model>, AppError> {
    let result = characters::Entity::find()
        .order_by_asc(characters::Column::Series)
        .order_by_asc(characters::Column::Sort)
        .all(db)
        .await?;
    Ok(result)
}

pub async fn get_user_states(
    db: &DatabaseConnection,
) -> Result<Vec<user_states_master::Model>, AppError> {
    let result = user_states_master::Entity::find()
        .all(db)
        .await?;
    Ok(result)
}

pub async fn get_latest_user_state(
    id: &str,
    db: &DatabaseConnection,
) -> Result<Vec<user_states::Model>, AppError> {
    let subquery = Query::select()
        .expr(user_states::Column::RecordedTime.max())
        .from(user_states::Entity)
        .and_where(user_states::Column::TwitterId.eq(id))
        .to_owned();
    let mainquery = user_states::Entity::find()
        .filter(
            user_states::Column::TwitterId.eq(id)
            .and(
                // TODO サブクエリ結果は1件のはずなのでinでなく=を使いたい
                // できないっぽい...??
                user_states::Column::RecordedTime.in_subquery(subquery)
            )
        );
    //println!("mainquery: {:?}", &mainquery.build(DbBackend::MySql).to_string());

    let result = mainquery.all(db).await?;
    Ok(result)
}

pub async fn insert_user_state(
    id: &str,
    payload: Vec<PostUserStatusPayload>,
    db: &DatabaseConnection,
) -> Result<(), AppError> {
    let now = chrono::Utc::now();
    let insert_data: Vec<user_states::ActiveModel> = payload
        .iter()
        .map(|p| user_states::ActiveModel {
            twitter_id: Set(id.to_string()),
            recorded_time: Set(now),
            series: Set(p.series),
            status: Set(p.status.clone()),
            ..Default::default()
        })
        .collect();
    user_states::Entity::insert_many(insert_data)
        .exec(db)
        .await?;
    Ok(())
}

