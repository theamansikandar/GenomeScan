# main.py — Full Pipeline Orchestrator
# Chains: FASTA → Preprocessing → DFA → Quantum Grover → Report
#
# Run:  python main.py [classical|quantum] [genome.fasta] [PATTERN]
# Example: python main.py quantum           → uses demo genome + ATCG

import sys
import math
import time
from dfa    import run_dfa, build_transition_table, get_dfa_info
from grover import grover_search, oracle_from_dfa


# ══════════════════════════════════════════════════════════
#  Step 1: Load Genome
# ══════════════════════════════════════════════════════════

def load_fasta(filepath: str) -> str:
    """Parse a FASTA file and return the concatenated DNA sequence."""
    seq = []
    with open(filepath, 'r') as f:
        for line in f:
            line = line.strip()
            if not line or line.startswith('>'):
                continue    # skip FASTA headers (e.g. >chr1)
            seq.append(line.upper())
    result = ''.join(seq)
    # Keep only valid DNA bases
    return ''.join(c for c in result if c in 'ATCG')


def demo_genome(length: int = 500) -> str:
    """Generate a repeating demo genome with embedded markers."""
    import random
    random.seed(42)
    bases = 'ATCG'
    genome = ''.join(random.choice(bases) for _ in range(length))
    # Embed a known marker every ~80 characters
    marker = "ATCG"
    positions = [40, 120, 200, 310, 420]
    genome_list = list(genome)
    for p in positions:
        if p + len(marker) <= len(genome_list):
            for j, b in enumerate(marker):
                genome_list[p + j] = b
    return ''.join(genome_list)


# ══════════════════════════════════════════════════════════
#  Step 2: Preprocess — chunk genome for quantum indexing
# ══════════════════════════════════════════════════════════

def chunk_genome(genome: str, chunk_size: int = 100, overlap: int = 50) -> list[dict]:
    """
    Split the genome into overlapping chunks.
    Each chunk is a candidate 'database entry' for Grover's search.
    """
    chunks = []
    step = chunk_size - overlap
    for i in range(0, len(genome) - chunk_size + 1, step):
        chunks.append({
            "start": i,
            "end":   i + chunk_size,
            "seq":   genome[i: i + chunk_size]
        })
    return chunks


# ══════════════════════════════════════════════════════════
#  Step 3: Classical DFA Search
# ══════════════════════════════════════════════════════════

def classical_search(genome: str, pattern: str) -> dict:
    t0 = time.perf_counter()
    matches = run_dfa(genome, pattern)
    elapsed = time.perf_counter() - t0

    return {
        "method":       "Classical DFA (KMP)",
        "matches":      matches,
        "count":        len(matches),
        "comparisons":  len(genome),   # DFA: each char is one comparison
        "time_s":       elapsed,
    }


# ══════════════════════════════════════════════════════════
#  Step 4+5: Quantum Grover Search
# ══════════════════════════════════════════════════════════

def quantum_search(genome: str, pattern: str) -> dict:
    N = max(1, len(genome) - len(pattern) + 1)   # search space size
    iterations = max(1, round(math.pi / 4 * math.sqrt(N)))
    qubits = math.ceil(math.log2(max(2, N)))

    # Oracle: DFA identifies matching positions (classically here,
    # quantum on real hardware)
    t0 = time.perf_counter()
    target_positions = run_dfa(genome, pattern)
    elapsed = time.perf_counter() - t0

    # Simulate Grover for the first match (demo)
    grover_result = None
    if target_positions:
        grover_result = grover_search(N, target_positions[0], iterations)

    return {
        "method":             "Quantum Grover (simulated)",
        "matches":            target_positions,
        "count":              len(target_positions),
        "N":                  N,
        "grover_iterations":  iterations,
        "classical_steps":    N,
        "speedup_factor":     round(N / max(1, iterations), 2),
        "qubits":             qubits,
        "grover_result":      grover_result,
        "time_s":             elapsed,
    }


# ══════════════════════════════════════════════════════════
#  Step 6: Report
# ══════════════════════════════════════════════════════════

def report(result: dict, genome: str, pattern: str):
    sep = "═" * 56
    print(f"\n{sep}")
    print(f"  GenomeScan — DNA Pattern Matching Report")
    print(sep)
    print(f"  Gene Marker  : {pattern}")
    print(f"  Genome len   : {len(genome):,} bp")
    print(f"  Method       : {result['method']}")
    print(sep)
    print(f"  Matches      : {result['count']}")
    if result['matches']:
        positions_str = ", ".join(str(p) for p in result['matches'][:10])
        if len(result['matches']) > 10:
            positions_str += f" ... (+{len(result['matches'])-10} more)"
        print(f"  Positions    : {positions_str}")

    if result.get('grover_iterations'):
        print(f"\n  Quantum Stats:")
        print(f"    Search space  : N = {result['N']:,}")
        print(f"    Qubits needed : {result['qubits']}")
        print(f"    Grover iters  : {result['grover_iterations']}  (≈ π√N/4)")
        print(f"    Classical ops : {result['classical_steps']:,}")
        print(f"    Speedup       : {result['speedup_factor']}×")

    print(f"\n  Time (wall)  : {result['time_s']*1000:.3f} ms")
    print(sep)

    # Snippet display
    if result['matches']:
        print("\n  Match snippets:")
        for pos in result['matches'][:5]:
            start = max(0, pos - 3)
            end   = min(len(genome), pos + len(pattern) + 3)
            snip  = genome[start:pos] + "[" + genome[pos:pos+len(pattern)] + "]" + genome[pos+len(pattern):end]
            print(f"    pos {pos:>5}: ...{snip}...")
    print()


# ══════════════════════════════════════════════════════════
#  Entry point
# ══════════════════════════════════════════════════════════

if __name__ == "__main__":
    # Parse arguments
    mode    = sys.argv[1] if len(sys.argv) > 1 else "classical"
    fasta   = sys.argv[2] if len(sys.argv) > 2 else None
    pattern = sys.argv[3] if len(sys.argv) > 3 else "ATCG"

    # Load genome
    if fasta:
        print(f"Loading genome from: {fasta}")
        genome = load_fasta(fasta)
    else:
        print("Using demo genome (no FASTA file provided)")
        genome = demo_genome(500)

    print(f"Genome loaded: {len(genome):,} base pairs")

    # Run selected mode
    if mode.lower() == "quantum":
        result = quantum_search(genome, pattern)
    else:
        result = classical_search(genome, pattern)

    report(result, genome, pattern)
