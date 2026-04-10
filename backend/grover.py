# grover.py — Grover's Quantum Search Algorithm Simulation
#
# Simulates Grover's algorithm using numpy state vectors.
# In real quantum computing: deploy on IBM Q / Qiskit / Cirq.
#
# Usage:
#   from grover import grover_search
#   result = grover_search(N=1024, target_idx=47)

import numpy as np
import math


def grover_search(N: int, target_idx: int, iterations: int = None) -> dict:
    """
    Simulate Grover's algorithm on a search space of size N.

    Parameters:
        N          : Number of items in the database (genome positions)
        target_idx : Index of the correct answer (marked state)
        iterations : Grover iterations (default: optimal ≈ π√N/4)

    Returns dict with:
        measured      : index of the measured state
        probability   : probability of correct measurement
        iterations    : number of Grover iterations used
        amplitudes    : final amplitude vector
        history       : list of probability vectors per iteration

    Complexity: O(√N) oracle evaluations
    Classical:  O(N)  comparisons
    """
    if N < 2:
        raise ValueError("N must be ≥ 2")
    if not (0 <= target_idx < N):
        raise ValueError(f"target_idx must be in [0, {N-1}]")

    if iterations is None:
        # Optimal: π/4 * √N iterations
        iterations = max(1, round(math.pi / 4 * math.sqrt(N)))

    # ── Step 1: Equal superposition (Hadamard on all qubits) ─────────────
    amplitudes = np.ones(N, dtype=float) / math.sqrt(N)

    history = [np.abs(amplitudes) ** 2]  # probability at each step

    for _ in range(iterations):

        # ── Step 2: Oracle — phase-flip the target state ─────────────────
        # Unitary: Uω|x⟩ = -|x⟩ if x==target, else |x⟩
        amplitudes[target_idx] *= -1

        # ── Step 3: Diffusion operator — reflect about the mean ──────────
        # D = 2|ψ⟩⟨ψ| − I
        mean = np.mean(amplitudes)
        amplitudes = 2 * mean - amplitudes

        history.append(np.abs(amplitudes) ** 2)

    # ── Step 4: Measurement (take max-probability state) ─────────────────
    probs       = np.abs(amplitudes) ** 2
    measured    = int(np.argmax(probs))
    success_prob = float(probs[target_idx])

    return {
        "measured":           measured,
        "target":             target_idx,
        "success":            measured == target_idx,
        "probability":        round(success_prob, 6),
        "iterations":         iterations,
        "N":                  N,
        "classical_steps":    N,
        "quantum_steps":      iterations,
        "speedup_factor":     round(N / max(1, iterations), 2),
        "qubits":             math.ceil(math.log2(max(2, N))),
        "amplitudes":         amplitudes.tolist(),
        "history":            history,
    }


def oracle_from_dfa(genome: str, pattern: str, pos: int) -> int:
    """
    Classical simulation of the quantum DFA oracle.
    Returns 1 if genome[pos:pos+len(pattern)] == pattern, else 0.

    In quantum: this would be a reversible circuit encoding the
    DFA transition function into multi-qubit gates.
    """
    segment = genome[pos: pos + len(pattern)].upper()
    return 1 if segment == pattern.upper() else 0


def quantum_phase_estimation_stub(n_qubits: int, pattern_len: int) -> str:
    """
    Returns a conceptual Qiskit circuit description for the
    DFA-based oracle circuit.
    (Full Qiskit implementation requires a quantum hardware account)
    """
    return f"""
    Conceptual Qiskit circuit ({n_qubits} qubits):
    ─────────────────────────────────────
    q0..q{n_qubits-1}: |0⟩ ─[H]─[Oracle]─[Diffusion]─ ... × {int(math.pi/4*math.sqrt(2**n_qubits))} ─[M]
    
    Oracle encodes DFA δ-function for pattern of length {pattern_len}.
    Each DNA base (A/T/C/G) is encoded as 2-qubit input: 00/01/10/11.
    Ancilla qubit flips to |1⟩ on DFA accept state → phase kickback.
    ─────────────────────────────────────
    """


if __name__ == "__main__":
    import sys

    N          = int(sys.argv[1])  if len(sys.argv) > 1 else 1024
    target_idx = int(sys.argv[2])  if len(sys.argv) > 2 else 47

    print(f"\nGrover's Algorithm Simulation")
    print(f"Search space:   N = {N}")
    print(f"Target index:   {target_idx}")
    print()

    result = grover_search(N, target_idx)

    print(f"Iterations:     {result['iterations']}  (optimal: π√N/4 ≈ {result['iterations']})")
    print(f"Measured state: {result['measured']}  {'✓ CORRECT' if result['success'] else '✗ INCORRECT'}")
    print(f"Probability:    {result['probability']:.4f}  ({result['probability']*100:.2f}%)")
    print(f"Qubits needed:  {result['qubits']}")
    print()
    print(f"Classical cost: O(N)     = {result['classical_steps']} steps")
    print(f"Quantum cost:   O(√N)    = {result['quantum_steps']} steps")
    print(f"Speedup factor: {result['speedup_factor']}×")
    print()

    # Show final amplitude for target vs average
    amps = np.array(result['amplitudes'])
    avg_other = float(np.mean(np.abs(amps[np.arange(N) != target_idx])))
    print(f"Target amplitude:  {abs(amps[target_idx]):.4f}")
    print(f"Average (others):  {avg_other:.4f}")
