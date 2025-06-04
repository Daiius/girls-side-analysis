
use serde::Serialize;
use utoipa::ToSchema;
use crate::entity::characters;

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
