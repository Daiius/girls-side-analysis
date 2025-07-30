use crate::entity::{
    user_states::Model as UserStates
};
use crate::dto::{
    PostUserStatusPayload,
};

/// DB中の最新のプレイ状況とリクエスト中のプレイ状況を比較します
///
/// プレイ状況変化の履歴がDB中に残ります（過去の状態も記録しています）
/// 前と一緒のデータを保持していてもしょうがない感があるのでこれで判定します
pub fn is_same_state(
    data: &Vec<UserStates>, 
    payload: &Vec<PostUserStatusPayload>
) -> bool {

    // そもそも長さが違えば異なると見做します
    // TODO ??意図的に、以前と同じ内容だが部分的な入力がされるとどうなる？
    if data.len() != payload.len() { return false };

    // シリーズ毎に状態を比較します
    // 長さが同じなら、ソートして頭から順に比較したらOkかな...
    let mut sorted_data = data.to_vec();
    let mut sorted_payload = payload.to_vec();
    sorted_data.sort_by_key(|d| d.series);
    sorted_payload.sort_by_key(|p| p.series);
    let result = sorted_data
        .iter()
        .zip(sorted_payload.iter())
        .all(|(d, p)| d.series == p.series && d.status == p.status);

    return result;
}

