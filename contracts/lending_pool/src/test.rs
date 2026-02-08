#![cfg(test)]
use super::*;
use soroban_sdk::{testutils::{Address as _, Ledger}, Env, token};

#[test]
fn test_escrow_flow() {
    let env = Env::default();
    env.mock_all_auths();

    // 1. Setup Token and Admin
    let admin = Address::generate(&env);
    let token_admin = Address::generate(&env);
    let token = token::Client::new(&env, &env.register_stellar_asset_contract(token_admin.clone()));
    
    // 2. Setup Users
    let user1 = Address::generate(&env);
    let user2 = Address::generate(&env);

    // Mint tokens to users
    token.mint(&user1, &1000);
    token.mint(&user2, &1000);

    // 3. Deploy Contract
    let contract_id = env.register_contract(None, LendingPool);
    let client = LendingPoolClient::new(&env, &contract_id);

    // 4. Initialize
    let target_amount = 2000i128;
    let yield_rate = 1000u32; // 10%
    client.initialize(&admin, &token.address, &target_amount, &yield_rate);

    // Verify Initial State
    let (total, target, rate, state) = client.get_pool_details();
    assert_eq!(total, 0);
    assert_eq!(target, 2000);
    assert_eq!(rate, 1000);
    assert_eq!(state, 0); // Open

    // 5. Deposits
    client.deposit(&user1, &500);
    client.deposit(&user2, &1500);

    assert_eq!(client.get_balance(&user1), 500);
    assert_eq!(client.get_balance(&user2), 1500);
    
    let (total_after_deposit, _, _, _) = client.get_pool_details();
    assert_eq!(total_after_deposit, 2000);

    // Check Contract Token Balance
    assert_eq!(token.balance(&contract_id), 2000);

    // 6. Fund Loan (Release to Admin)
    client.fund_loan();

    // Verify State is Active
    assert_eq!(client.get_state(), 1); // Active
    
    // Verify Funds moved to Admin
    assert_eq!(token.balance(&contract_id), 0);
    assert_eq!(token.balance(&admin), 2000);

    // 7. Repay Loan (with interest)
    // Admin repays 2200 (2000 + 10%)
    token.mint(&admin, &200); // Admin needs extra funds for interest
    client.repay_loan(&2200);

    // Verify State is Repaid
    assert_eq!(client.get_state(), 2); // Repaid
    assert_eq!(token.balance(&contract_id), 2200);

    // 8. Withdraw (Claim Share)
    // User1 should get: (500 / 2000) * 2200 = 0.25 * 2200 = 550
    client.withdraw(&user1);
    
    assert_eq!(token.balance(&user1), 1000 - 500 + 550); // Initial - Deposit + Share = 1050
    assert_eq!(client.get_balance(&user1), 0); // Balance reset

    // User2 should get: (1500 / 2000) * 2200 = 0.75 * 2200 = 1650
    // Remaining in contract: 2200 - 550 = 1650
    client.withdraw(&user2);
    
    assert_eq!(token.balance(&user2), 1000 - 1500 + 1650); // Initial - Deposit + Share = 1150
    assert_eq!(token.balance(&contract_id), 0); // Contract empty
}
