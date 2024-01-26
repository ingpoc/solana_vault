use borsh::{BorshDeserialize, BorshSerialize};
use std::collections::HashMap;

#[derive(BorshSerialize, BorshDeserialize, Debug)]
pub struct SiteCredential {
    pub credentials: HashMap<String, Credential>,
}

#[derive(BorshSerialize, BorshDeserialize, Debug)]
pub struct Credential {
    pub username: String,
    pub password: String,
}
