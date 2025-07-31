use binary_merkle_root::binary_merkle_root;
use std::hash::poseidon::bn254::hash_1;
use std::hash::poseidon::bn254::hash_2;
// use std::hash::poseidon2;

fn main(
    // public inputs
    root: pub Field,
    nullifier_hash: pub Field,
    statement: pub Field,
    depth: pub Field,
    // private inputs
    nullifier: Field,
    secret: Field,
    indexes: Field,
    siblings: [Field; 4],
    // merkle_proof: [Field; 20],
    // is_even: [bool; 20],
) {
    let commitment: Field = hash_2([nullifier, secret]);

    let computed_nullifier_hash: Field = hash_1([nullifier]);
    assert(computed_nullifier_hash == nullifier_hash);

    let mut siblings_num = 0;
    for i in 0..siblings.len() {
        if siblings[i] != 0 {
            siblings_num += 1;
        }
    }

    let index_bits: [u1; 4] = indexes.to_le_bits();
    assert(depth as u32 <= siblings.len());

    let computed_root = binary_merkle_root(hash_2, commitment, siblings_num, index_bits, siblings);
    assert(computed_root == root);

    let statement_binding = statement * statement;
    assert(statement_binding == statement * statement);
}
