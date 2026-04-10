# dfa.py — Deterministic Finite Automaton Engine
# DNA Pattern Matching via KMP-style transition table
#
# Usage:
#   from dfa import run_dfa
#   matches = run_dfa("ATGCATCGATCG", "ATCG")
#   print(matches)  # [5, 9]

DNA_ALPHABET = ['A', 'T', 'C', 'G']


def build_transition_table(pattern: str) -> list[dict]:
    """
    Construct the DFA transition function δ(q, c) for the given pattern.

    State q means: the longest prefix of `pattern` that is also a suffix
    of the text processed so far has length q.

    Time:  O(m² × |Σ|)  where m = len(pattern), |Σ| = 4 (DNA alphabet)
    Space: O(m × |Σ|)

    Returns:
        delta: list of dicts. delta[q][c] = next state
    """
    m = len(pattern)
    delta = []

    for q in range(m + 1):
        row = {}
        for c in DNA_ALPHABET:
            # Check decreasing suffix lengths to find the longest
            # prefix of `pattern` that is a suffix of pattern[0:q]+c
            k = min(m, q + 1)
            while k > 0:
                if (pattern[:q] + c)[-k:] == pattern[:k]:
                    break
                k -= 1
            row[c] = k
        delta.append(row)

    return delta


def run_dfa(genome: str, pattern: str) -> list[int]:
    """
    Scan `genome` using the DFA built from `pattern`.

    Non-DNA characters are silently skipped.

    Time:  O(|genome|) — single pass, no backtracking
    Space: O(m)       — only current state stored

    Returns:
        List of 0-indexed start positions where pattern was found.
    """
    if not pattern:
        return []

    pattern = pattern.upper()
    genome  = genome.upper()
    delta   = build_transition_table(pattern)
    m       = len(pattern)
    q       = 0           # current DFA state
    matches = []

    for i, c in enumerate(genome):
        if c not in DNA_ALPHABET:
            continue
        q = delta[q][c]
        if q == m:        # accept state reached
            matches.append(i - m + 1)

    return matches


def get_dfa_info(pattern: str) -> dict:
    """Return a summary of the DFA for display / debugging."""
    pattern = pattern.upper()
    m = len(pattern)
    delta = build_transition_table(pattern)

    return {
        "pattern":    pattern,
        "num_states": m + 1,
        "accept_state": m,
        "alphabet":   DNA_ALPHABET,
        "delta":      delta,
    }


if __name__ == "__main__":
    import sys

    genome  = sys.argv[1] if len(sys.argv) > 1 else "ATGCATCGATCGAAATCGATCG"
    pattern = sys.argv[2] if len(sys.argv) > 2 else "ATCG"

    print(f"\nGenome  : {genome}")
    print(f"Pattern : {pattern}")
    print(f"States  : q0 → q{len(pattern)} (accept)")
    print()

    # Print transition table
    delta = build_transition_table(pattern)
    header = f"{'State':>8}" + "".join(f"{c:>6}" for c in DNA_ALPHABET)
    print(header)
    print("-" * (8 + 6 * len(DNA_ALPHABET)))
    for q, row in enumerate(delta):
        acc = " (accept)" if q == len(pattern) else ("  (start)" if q == 0 else "")
        vals = "".join(f"{row[c]:>6}" for c in DNA_ALPHABET)
        print(f"  q{q:<5}" + vals + acc)

    matches = run_dfa(genome, pattern)
    print(f"\nMatches found: {len(matches)}")
    for pos in matches:
        print(f"  Position {pos:>4}:  ...{genome[max(0,pos-2):pos]}"
              f"[{genome[pos:pos+len(pattern)]}]{genome[pos+len(pattern):pos+len(pattern)+2]}...")
