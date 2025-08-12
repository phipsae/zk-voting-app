use binary_merkle_root::binary_merkle_root;
use std::hash::poseidon::bn254::hash_1;
use std::hash::poseidon::bn254::hash_2;

fn main(
    // public inputs
    root: pub Field,
    nullifier_hash: pub Field,
    vote: pub bool,
    depth: pub u32,
    // private inputs
    nullifier: Field,
    secret: Field,
    index: Field,
    // max of 2^16 leaves --> 65536 leaves
    siblings: [Field; 16],
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

    let index_bits: [u1; 16] = index.to_le_bits();
    assert(depth <= siblings.len());

    let computed_root = binary_merkle_root(hash_2, commitment, siblings_num, index_bits, siblings);

    assert(computed_root == root);

    // just vote binding, prevent front running
    let vote_field = vote as Field;
    assert((vote_field * vote_field) == vote_field);
}
