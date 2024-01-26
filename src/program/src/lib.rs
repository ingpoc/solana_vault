use solana_program::{
    account_info::{next_account_info, AccountInfo},
    entrypoint,
    entrypoint::ProgramResult,
    msg,
    program_error::ProgramError,
    pubkey::Pubkey,
};

entrypoint!(process_instruction);

pub fn process_instruction(
    program_id: &Pubkey,
    accounts: &[AccountInfo],
    _instruction_data: &[u8],
) -> ProgramResult {
    let accounts_iter = &mut accounts.iter();
    let account = next_account_info(accounts_iter)?;

    if account.owner != program_id {
        msg!("Account does not have the correct program id");
        return Err(ProgramError::IncorrectProgramId);
    }

    let mut data = account.try_borrow_mut_data()?;

    let mut counter = u32::from_le_bytes([data[0], data[1], data[2], data[3]]);
    msg!("Counter before increment: {}", counter);
    
    counter += 1;
    data[0..4].copy_from_slice(&counter.to_le_bytes());

    msg!("Counter after increment: {}", counter);


    Ok(())
}