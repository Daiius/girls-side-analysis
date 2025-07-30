use axum::{
    http::StatusCode,
    response::{ IntoResponse, Response },
    Json,
};
use sea_orm::DbErr;
use std::fmt;
use serde_json::json;

#[derive(Debug)]
pub enum AppError {
    Db(DbErr),
    Auth(AuthError),
    Other(String),
}

impl fmt::Display for AppError {
    fn fmt(&self, f: &mut fmt::Formatter<'_>) -> fmt::Result {
        match self {
            AppError::Db(err) => write!(f, "Database error: {}", err),
            AppError::Auth(err) => write!(f, "Auth error: {}", err),
            AppError::Other(msg) => write!(f, "Unexpected error: {}", msg),
        }
    }
}

impl IntoResponse for AppError {
    fn into_response(self) -> Response {
        let status = StatusCode::INTERNAL_SERVER_ERROR;
        eprintln!("[server error]: {}", self);
        // TODO 詳細なエラーメッセージを乗せるか検討するべき
        (status, self.to_string()).into_response()
    }
}

impl From<DbErr> for AppError {
    fn from(value: DbErr) -> Self {
        AppError::Db(value)
    }
}

#[derive(Debug)]
pub enum AuthError {
    WrongCredentials,
    MissingCredentials,
    TokenCreation,
    InvalidToken,
}

impl std::fmt::Display for AuthError {
    fn fmt(&self, f: &mut fmt::Formatter<'_>) -> fmt::Result {
       match self {
         AuthError::WrongCredentials => write!(f, "wrong credentials"),
         AuthError::MissingCredentials => write!(f, "missing credentials"),
         AuthError::TokenCreation => write!(f, "token creation error"),
         AuthError::InvalidToken => write!(f, "invalid token"),
       }
    }
}

impl IntoResponse for AuthError {
    fn into_response(self) -> Response {
        let (status, error_message) = match self {
            AuthError::WrongCredentials => 
                (StatusCode::UNAUTHORIZED, "Wrong credentials"),
            AuthError::MissingCredentials =>
                (StatusCode::BAD_REQUEST, "Missing credentials"),
            AuthError::TokenCreation =>
                (StatusCode::INTERNAL_SERVER_ERROR, "Token creation error"),
            AuthError::InvalidToken =>
                (StatusCode::BAD_REQUEST, "Invalid token"),
        };
        let body = Json(json!({ "error": error_message }));

        (status, body).into_response()
    }
}

