
use serde::Serialize;
use utoipa::ToSchema;
use crate::entity::{
    characters,
    user_states,
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
