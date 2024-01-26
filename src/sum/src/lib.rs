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
    username: [u8; 32],
    password: [u8; 32],
}

entrypoint!(process_instruction);

pub fn process_instruction(
    program_id: &Pubkey,
    accounts: &[AccountInfo],
    input: &[u8],
) -> ProgramResult {
    let accounts_iter = &mut accounts.iter();
    let account = next_account_info(accounts_iter)?;

    if account.owner != program_id {
        msg!("Account does not have the correct program id");
        return Err(ProgramError::IncorrectProgramId);
    }

    msg!("Execution start of the Credential Manager program");

    if input.len() < UserData::try_to_vec(&UserData { username: [0u8; 32], password: [0u8; 32] }).unwrap().len() {
        msg!("The input data is too short");
        return Err(ProgramError::InvalidInstructionData);
    }

    let user_data: UserData = UserData::try_from_slice(input)?;

    msg!("Username: {:?}", user_data.username);
    msg!("Password: {:?}", user_data.password);

    let mut account_data = account.try_borrow_mut_data()?;

// Log the current state of account_data
msg!("Account data before copy: {:?}", &account_data[..]);

// Check length of source and destination slices
if user_data.try_to_vec()?.len() > account_data.len() {
    msg!("User data length : {:?}", user_data.try_to_vec()?.len());
    msg!("Account data length : {:?}", account_data.len());
    msg!("The input data is too large for the account data");
    return Err(ProgramError::AccountDataTooSmall);
}else{
    account_data[..].copy_from_slice(&user_data.try_to_vec()?);
    // Log the state of account_data after the copy
    msg!("Account data after copy: {:?}", &account_data[..]);
}


    Ok(())
}