#![no_std]
use soroban_sdk::{contract, contractimpl, contracttype, Address, Env, token};

#[cfg(test)]
mod test;

#[contract]
pub struct LendingPool;

#[contracttype]
#[derive(Clone, Copy, PartialEq, Eq)]
pub enum PoolState {
    Open = 0,   // Accepting deposits
    Active = 1, // Funds released to borrower
    Repaid = 2, // Loan repaid, lenders can claim
}

#[contracttype]
pub enum DataKey {
    Admin,          // Address of borrower
    Token,          // Address of the asset (USDC)
    TargetAmount,   // i128
    TotalDeposited, // i128 (Total principal deposited)
    PoolState,      // PoolState
    Balance(Address), // i128 (User's principal)
    YieldRate,      // u32
}

#[contractimpl]
impl LendingPool {
    pub fn initialize(env: Env, admin: Address, token: Address, target: i128, yield_rate: u32) {
        if env.storage().persistent().has(&DataKey::Admin) {
            panic!("Already initialized");
        }
        env.storage().persistent().set(&DataKey::Admin, &admin);
        env.storage().persistent().set(&DataKey::Token, &token);
        env.storage().persistent().set(&DataKey::TargetAmount, &target);
        env.storage().persistent().set(&DataKey::YieldRate, &yield_rate);
        env.storage().persistent().set(&DataKey::PoolState, &PoolState::Open);
        env.storage().persistent().set(&DataKey::TotalDeposited, &0i128);
    }

    pub fn deposit(env: Env, from: Address, amount: i128) {
        from.require_auth();
        
        let state: PoolState = env.storage().persistent().get(&DataKey::PoolState).unwrap();
        if state != PoolState::Open {
            panic!("Pool is not open for deposits");
        }

        let token_addr: Address = env.storage().persistent().get(&DataKey::Token).unwrap();
        let client = token::Client::new(&env, &token_addr);
        
        // Transfer from user to contract
        client.transfer(&from, &env.current_contract_address(), &amount);

        // Update balance
        let balance: i128 = env.storage().persistent().get(&DataKey::Balance(from.clone())).unwrap_or(0);
        env.storage().persistent().set(&DataKey::Balance(from.clone()), &(balance + amount));

        // Update total
        let total: i128 = env.storage().persistent().get(&DataKey::TotalDeposited).unwrap_or(0);
        env.storage().persistent().set(&DataKey::TotalDeposited, &(total + amount));
    }

    pub fn withdraw(env: Env, to: Address) {
        to.require_auth();
        
        let state: PoolState = env.storage().persistent().get(&DataKey::PoolState).unwrap();
        let balance: i128 = env.storage().persistent().get(&DataKey::Balance(to.clone())).unwrap_or(0);
        
        if balance <= 0 {
            panic!("No balance to withdraw");
        }

        let token_addr: Address = env.storage().persistent().get(&DataKey::Token).unwrap();
        let client = token::Client::new(&env, &token_addr);

        if state == PoolState::Open {
            // Refund full amount
            client.transfer(&env.current_contract_address(), &to, &balance);
            env.storage().persistent().set(&DataKey::Balance(to.clone()), &0i128);
            
            let total: i128 = env.storage().persistent().get(&DataKey::TotalDeposited).unwrap_or(0);
            env.storage().persistent().set(&DataKey::TotalDeposited, &(total - balance));
        } else if state == PoolState::Repaid {
            // Claim principal + yield
            // Share = (UserBalance / TotalDeposited) * ContractBalance
            
            let total_deposited: i128 = env.storage().persistent().get(&DataKey::TotalDeposited).unwrap();
            let contract_balance = client.balance(&env.current_contract_address());
            
            // Calculate share with integer arithmetic (careful with overflow)
            // (balance * contract_balance) / total_deposited
            let share = (balance * contract_balance) / total_deposited;
            
            client.transfer(&env.current_contract_address(), &to, &share);
            env.storage().persistent().set(&DataKey::Balance(to), &0i128);
        } else {
            panic!("Cannot withdraw while Active");
        }
    }

    pub fn fund_loan(env: Env) {
        let admin: Address = env.storage().persistent().get(&DataKey::Admin).unwrap();
        admin.require_auth();

        let state: PoolState = env.storage().persistent().get(&DataKey::PoolState).unwrap();
        if state != PoolState::Open {
            panic!("Pool not in Open state");
        }

        let total: i128 = env.storage().persistent().get(&DataKey::TotalDeposited).unwrap_or(0);
        
        if total == 0 {
             panic!("No funds to release");
        }

        let token_addr: Address = env.storage().persistent().get(&DataKey::Token).unwrap();
        let client = token::Client::new(&env, &token_addr);

        // Transfer all collected funds to Admin (Borrower)
        client.transfer(&env.current_contract_address(), &admin, &total);

        env.storage().persistent().set(&DataKey::PoolState, &PoolState::Active);
    }

    pub fn repay_loan(env: Env, amount: i128) {
        let admin: Address = env.storage().persistent().get(&DataKey::Admin).unwrap();
        admin.require_auth();
        
        let state: PoolState = env.storage().persistent().get(&DataKey::PoolState).unwrap();
        if state != PoolState::Active {
             panic!("Loan not Active");
        }

        let token_addr: Address = env.storage().persistent().get(&DataKey::Token).unwrap();
        let client = token::Client::new(&env, &token_addr);

        // Transfer from Admin to Contract
        client.transfer(&admin, &env.current_contract_address(), &amount);

        // Check if fully repaid (Principal check at least)
        let total_deposited: i128 = env.storage().persistent().get(&DataKey::TotalDeposited).unwrap();
        let contract_balance = client.balance(&env.current_contract_address());
        
        if contract_balance >= total_deposited {
             env.storage().persistent().set(&DataKey::PoolState, &PoolState::Repaid);
        }
    }
    
    // View Functions
    
    pub fn get_state(env: Env) -> u32 {
        let state: PoolState = env.storage().persistent().get(&DataKey::PoolState).unwrap_or(PoolState::Open);
        state as u32
    }
    
    pub fn get_balance(env: Env, user: Address) -> i128 {
         env.storage().persistent().get(&DataKey::Balance(user)).unwrap_or(0)
    }

    pub fn get_pool_details(env: Env) -> (i128, i128, u32, u32) {
        let total = env.storage().persistent().get(&DataKey::TotalDeposited).unwrap_or(0i128);
        let target = env.storage().persistent().get(&DataKey::TargetAmount).unwrap_or(0i128);
        let rate = env.storage().persistent().get(&DataKey::YieldRate).unwrap_or(0u32);
        let state = Self::get_state(env);
        (total, target, rate, state)
    }
}
