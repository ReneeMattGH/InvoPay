#![no_std]
use soroban_sdk::{contract, contractimpl, contracttype, Address, Env, String, Symbol, Vec};

#[contract]
pub struct InvoiceNFT;

#[contracttype]
#[derive(Clone)]
pub struct InvoiceMetadata {
    pub amount: i128,
    pub due_date: u64,
    pub buyer_hash: String,
    pub invoice_hash: String,
    pub paid: bool,
}

#[contractimpl]
impl InvoiceNFT {
    pub fn mint(env: Env, to: Address, id: u64, metadata: InvoiceMetadata) {
        to.require_auth();
        // Storage logic for NFT metadata linked to id
        env.storage().persistent().set(&id, &metadata);
        // Event emission
        env.events().publish((Symbol::new(&env, "mint"), to), id);
    }

    pub fn get_invoice(env: Env, id: u64) -> Option<InvoiceMetadata> {
        env.storage().persistent().get(&id)
    }

    pub fn mark_paid(env: Env, id: u64) {
        // Only admin or authorized entity should call this
        let mut meta: InvoiceMetadata = env.storage().persistent().get(&id).unwrap();
        meta.paid = true;
        env.storage().persistent().set(&id, &meta);
    }
}
