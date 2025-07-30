use axum::{
    extract::FromRequestParts,
    RequestPartsExt,
    http::{ request::Parts },
};
use axum_extra::{ 
    TypedHeader,
    headers::{ authorization::Bearer, Authorization },
};

use jsonwebtoken::{
    decode,
    DecodingKey,
    Validation,
    Algorithm,
};
use serde::Deserialize;
use crate::errors::AuthError;

#[derive(Debug, Deserialize)]
pub struct Claims {
    pub sub: String,
    //pub exp: usize,
}

pub struct AuthenticatedUser {
    pub twitter_id: String,
}

impl<S> FromRequestParts<S> for AuthenticatedUser
where
    S: Send + Sync,
{
    type Rejection = AuthError;
    async fn from_request_parts(
        parts: &mut Parts,
        _state: &S,
    ) -> Result<Self,Self::Rejection> {
        let TypedHeader(Authorization(bearer)) =
            parts.extract::<TypedHeader<Authorization<Bearer>>>()
            .await
            .map_err(|_| AuthError::InvalidToken)?;

        let token = bearer.token();
        let secret = std::env::var("AUTH_SECRET")
            .map_err(|_| AuthError::WrongCredentials)?;
        let token_data = decode::<Claims>(
            token,
            &DecodingKey::from_secret(secret.as_bytes()),
            &Validation::new(Algorithm::HS256),
        )
            .map_err(|_| AuthError::InvalidToken)?;

        Ok(AuthenticatedUser {
            twitter_id: token_data.claims.sub,
        })
    }
}

