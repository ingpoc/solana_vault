mod site_credential;
use site_credential::{SiteCredential, Credential};
use solana_program::{
    account_info::{next_account_info, AccountInfo},
    entrypoint,
    entrypoint::ProgramResult,
    msg,
    pubkey::Pubkey,
};

entrypoint!(process_instruction);

fn process_instruction(
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

    let mut site_credential_data = SiteCredential::try_from_slice(&account.data.borrow())?;
    let instruction_data: SiteCredential = try_from_slice(input)?;

    for (site_name, credential) in instruction_data.credentials {
        site_credential_data.credentials.insert(site_name, credential);
    }

    SiteCredential::try_to_vec(&site_credential_data)?.swap_with_slice(&mut account.data.borrow_mut());

    msg!("Stored site credentials");
    Ok(())
}
