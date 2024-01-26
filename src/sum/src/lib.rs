use borsh::{BorshDeserialize, BorshSerialize};
use solana_program::{
    account_info::{next_account_info, AccountInfo},
    entrypoint,
    entrypoint::ProgramResult,
    msg,
    program_error::ProgramError,
    pubkey::Pubkey,
};

#[derive(BorshDeserialize, BorshSerialize)]
pub struct UserData {
    username: [u8; 16],
    password: [u8; 16],
}

const USER_DATA_LEN: usize = 32; // 16 bytes for username and 16 bytes for password

entrypoint!(process_instruction);

pub fn process_instruction(
    program_id: &Pubkey,
    accounts: &[AccountInfo],
    input: &[u8],
) -> ProgramResult {
    let accounts_iter = &mut accounts.iter();
    let account = next_account_info(accounts_iter)?;

    if account.owner != program_id {
        return Err(ProgramError::IncorrectProgramId);
    }

    if input.len() < USER_DATA_LEN {
        return Err(ProgramError::InvalidInstructionData);
    }

    let user_data: UserData = UserData::try_from_slice(input)?;
    
    let mut account_data = account.try_borrow_mut_data()?;
    msg!("Username: {:?}", user_data.username);
    msg!("Password: {:?}", user_data.password);
    let user_data_vec = borsh::BorshSerialize::try_to_vec(&user_data)
        .map_err(|_| ProgramError::InvalidInstructionData)?;
    
    
    if user_data_vec.len() > account_data.len() {
        return Err(ProgramError::InsufficientFunds);
    }

    account_data[..].copy_from_slice(&user_data_vec);

    Ok(())
}
