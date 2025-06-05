use axum::{
    http::StatusCode,
    response::{ IntoResponse, Response },
};
use sea_orm::DbErr;
use std::fmt;

#[derive(Debug)]
pub enum AppError {
    Db(DbErr),
    Other(String),
}

impl fmt::Display for AppError {
    fn fmt(&self, f: &mut fmt::Formatter<'_>) -> fmt::Result {
        match self {
            AppError::Db(err) => write!(f, "Database error: {}", err),
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

