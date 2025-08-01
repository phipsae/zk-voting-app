use binary_merkle_root::binary_merkle_root;
use std::hash::poseidon::bn254::hash_1;
use std::hash::poseidon::bn254::hash_2;
use std::println;

fn main(
    // public inputs
    root: pub Field,
    nullifier_hash: pub Field,
    statement: pub Field,
    depth: pub u32,
    // // private inputs
    nullifier: Field,
    secret: Field,
    // index of the leaf to prove
    index: Field,
    siblings: [Field; 4],
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

    let index_bits: [u1; 4] = index.to_le_bits();
    assert(depth <= siblings.len());

    let computed_root = binary_merkle_root(hash_2, commitment, siblings_num, index_bits, siblings);

    println("root calculated");
    println(hash_2([siblings[0], commitment]));
    println("left -siblings[0]");
    println(siblings[0]);
    println("right - commitment");
    println(commitment);
    println("computed_root from function");
    println(computed_root);
    println("root");
    println(root);

    println("commitment");
    println(commitment);

    // println("siblings.len()");
    // println(siblings.len());
    // println(siblings);
    // println("siblings_num");
    // println(siblings_num);
    // println("index_bits");
    // println(index_bits);

    assert(computed_root == root);

    let statement_binding = statement * statement;
    assert(statement_binding == statement * statement);
}
