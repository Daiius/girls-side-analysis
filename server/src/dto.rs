
use serde::{
    Serialize,
    Deserialize,
};
use utoipa::ToSchema;
use crate::entity::{
    characters,
    user_states,
    user_states_master,
};

#[derive(Serialize, ToSchema)]
pub struct CharacterDto {
    name: String,
    series: u8,
    sort: u8,
}

impl From<characters::Model> for CharacterDto {
    fn from(model: characters::Model) -> Self {
        Self {
            name: model.name,
            series: model.series,
            sort: model.sort,
        }
    }
}

#[derive(Serialize, ToSchema)]
pub struct UserStateDto {
    twitter_id: String,
    recorded_time: String,
    series: u8,
    status: String,
}

impl From<user_states::Model> for UserStateDto {
    fn from(model: user_states::Model) -> Self {
        Self {
            twitter_id: model.twitter_id,
            recorded_time: model.recorded_time.to_string(),
            series: model.series,
            status: model.status,
        }
    }
}
#[derive(Serialize, ToSchema)]
pub struct UserStatesMasterDto {
    state: String,
    sort: u8,
}

impl From<user_states_master::Model> for UserStatesMasterDto {
    fn from(model: user_states_master::Model) -> Self {
        Self {
            state: model.state,
            sort: model.sort,
        }
    }
}

/// ユーザのプレイ状況を記録する際のリクエストボディ
///
/// recorded_timeはサーバ側で現在時刻を取得するので、
/// それ以外のフィールドを取得します
///
/// Clone and pub fields for services::is_same_state
#[derive(Debug, Deserialize, ToSchema, Clone)]
pub struct PostUserStatusPayload {
    pub status: String,
    pub series: u8,
}

