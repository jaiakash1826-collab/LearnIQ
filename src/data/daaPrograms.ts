export interface DaaProgram {
  id: number;
  title: string;
  topic: string;
  algorithm: string;
  technique: 'Greedy' | 'Dynamic Programming' | 'Backtracking' | 'Branch & Bound';
  mainConcept: string;
  timeComplexity: string;
  spaceComplexity: string;
  code: string;
  sampleInput: string;
  expectedOutput: string;
  inputDescription: string;
  explanation: string;
}

export const DAA_PROGRAMS: DaaProgram[] = [
  {
    id: 1,
    title: 'Huffman Coding',
    topic: 'Construct Huffman coding tree for data compression',
    algorithm: 'Greedy Algorithm',
    technique: 'Greedy',
    mainConcept: 'Min Heap Priority Queue',
    timeComplexity: 'O(n log n)',
    spaceComplexity: 'O(n)',
    code: `import heapq

h = []
n = int(input())
for i in range(n):
    c, f = input().split()
    heapq.heappush(h, (int(f), i, c))

i = n
while len(h) > 1:
    a, _, x = heapq.heappop(h)
    b, _, y = heapq.heappop(h)
    heapq.heappush(h, (a + b, i, (x, y)))
    i += 1

def show(t, s=""):
    if isinstance(t, str):
        print(t, s or "0")
    else:
        show(t[0], s + "0")
        show(t[1], s + "1")

show(h[0][2])`,
    sampleInput: `6
A 5
B 9
C 12
D 13
E 16
F 45`,
    expectedOutput: `F 0
C 100
D 101
A 1100
B 1101
E 111`,
    inputDescription: 'Line 1: Number of characters n. Next n lines: Character and its frequency separated by space.',
    explanation: 'Uses a min-heap to greedily combine the two lowest-frequency nodes repeatedly until a single root remains. Codes are derived by traversing left (0) and right (1).',
  },
  {
    id: 2,
    title: 'Matrix Chain Multiplication',
    topic: 'Implement Matrix Chain Multiplication',
    algorithm: 'Dynamic Programming (Tabulation)',
    technique: 'Dynamic Programming',
    mainConcept: 'Optimal Parenthesization / Minimum Scalar Multiplications',
    timeComplexity: 'O(n^3)',
    spaceComplexity: 'O(n^2)',
    code: `n = int(input())
p = list(map(int, input().split()))
d = [[0] * n for _ in range(n)]

for l in range(2, n + 1):
    for i in range(n - l + 1):
        j = i + l - 1
        d[i][j] = min(d[i][k] + d[k + 1][j] + p[i] * p[k + 1] * p[j + 1]
                      for k in range(i, j))

print("Minimum Cost:", d[0][n - 1])`,
    sampleInput: `4
10 20 30 40 30`,
    expectedOutput: `Minimum Cost: 30000`,
    inputDescription: 'Line 1: Number of matrices n. Line 2: n + 1 dimension array values p[0...n].',
    explanation: 'Calculates the minimum cost of multiplying a chain of n matrices. Evaluates sub-chains of increasing length l from 2 to n, splitting at each possible index k to memoize the minimal product cost.',
  },
  {
    id: 3,
    title: 'Longest Common Subsequence (LCS)',
    topic: 'Solve Longest Common Subsequence Problem',
    algorithm: 'Dynamic Programming (2D Grid)',
    technique: 'Dynamic Programming',
    mainConcept: 'Character matching with diagonal transition or prefix max',
    timeComplexity: 'O(m * n)',
    spaceComplexity: 'O(m * n)',
    code: `a, b = input(), input()
d = [[0] * (len(b) + 1) for _ in range(len(a) + 1)]

for i in range(1, len(a) + 1):
    for j in range(1, len(b) + 1):
        d[i][j] = 1 + d[i - 1][j - 1] if a[i - 1] == b[j - 1] else max(d[i - 1][j], d[i][j - 1])

print("LCS Length:", d[-1][-1])`,
    sampleInput: `AGGTAB
GXTXAYB`,
    expectedOutput: `LCS Length: 4`,
    inputDescription: 'Line 1: First string. Line 2: Second string.',
    explanation: 'Constructs an (m+1)x(n+1) dynamic programming table. If characters match, d[i][j] = 1 + d[i-1][j-1]. Otherwise, it takes the maximum of omitting one character from either string.',
  },
  {
    id: 4,
    title: '0/1 Knapsack Problem',
    topic: 'Implement 0/1 knapsack problem using memory functions',
    algorithm: 'Dynamic Programming with Memoization',
    technique: 'Dynamic Programming',
    mainConcept: 'Memory Function / Top-Down Cache',
    timeComplexity: 'O(n * W)',
    spaceComplexity: 'O(n * W)',
    code: `def k(n, w):
    if n == 0 or w == 0:
        return 0
    if d[n][w] != -1:
        return d[n][w]
    d[n][w] = max(v[n - 1] + k(n - 1, w - wt[n - 1]), k(n - 1, w)) if wt[n - 1] <= w else k(n - 1, w)
    return d[n][w]

n = int(input())
wt = list(map(int, input().split()))
v = list(map(int, input().split()))
w = int(input())
d = [[-1] * (w + 1) for _ in range(n + 1)]

print("Maximum Profit:", k(n, w))`,
    sampleInput: `3
10 20 30
60 100 120
50`,
    expectedOutput: `Maximum Profit: 220`,
    inputDescription: 'Line 1: Number of items n. Line 2: Weights of items. Line 3: Values/Profits of items. Line 4: Knapsack capacity W.',
    explanation: 'Employs a top-down recursive memory function to compute maximum profit without redundant recalculation of subproblems.',
  },
  {
    id: 5,
    title: 'N-Queens Problem',
    topic: 'Apply backtracking to solve the N-Queens problem',
    algorithm: 'Backtracking',
    technique: 'Backtracking',
    mainConcept: 'Row-by-row placement with column and diagonal safety verification',
    timeComplexity: 'O(N!)',
    spaceComplexity: 'O(N^2)',
    code: `def q(r):
    if r == n:
        return True
    for c in range(n):
        if (all(b[i][c] == 0 for i in range(r)) and
            all(b[r - k][c - k] == 0 for k in range(1, min(r, c) + 1)) and
            all(b[r - k][c + k] == 0 for k in range(1, min(r, n - 1 - c) + 1))):
            b[r][c] = 1
            if q(r + 1):
                return True
            b[r][c] = 0
    return False

n = int(input())
b = [[0] * n for _ in range(n)]
print("Solution:" if q(0) else "No solution")
for row in b:
    print(*row)`,
    sampleInput: `4`,
    expectedOutput: `Solution:
0 1 0 0
0 0 0 1
1 0 0 0
0 0 1 0`,
    inputDescription: 'Line 1: Integer n representing board dimension (n x n) and number of queens.',
    explanation: 'Places queens sequentially row by row. If placing queen at column c conflicts diagonally or vertically, the algorithm backtracks by resetting b[r][c] to 0.',
  },
  {
    id: 6,
    title: 'Graph Coloring / Hamiltonian Circuit',
    topic: 'Apply backtracking to graph vertex coloring and Hamiltonian path',
    algorithm: 'Backtracking (m-Colorability)',
    technique: 'Backtracking',
    mainConcept: 'Valid adjacency conflict check & chromatic number search',
    timeComplexity: 'O(m^V)',
    spaceComplexity: 'O(V)',
    code: `def color(v, m):
    if v == n:
        return True
    for c in range(1, m + 1):
        if all(not g[v][i] or a[i] != c for i in range(n)):
            a[v] = c
            if color(v + 1, m):
                return True
            a[v] = 0
    return False

n = int(input())
g = [list(map(int, input().split())) for _ in range(n)]

for m in range(1, n + 1):
    a = [0] * n
    if color(0, m):
        print("Minimum Colors:", m)
        print("Colors:", a)
        break`,
    sampleInput: `4
0 1 0 1
1 0 1 0
0 1 0 1
1 0 1 0`,
    expectedOutput: `Minimum Colors: 2
Colors: [1, 2, 1, 2]`,
    inputDescription: 'Line 1: Number of vertices n. Next n lines: Adjacency matrix of the graph.',
    explanation: 'Tries assigning colors 1..m to each vertex sequentially. If an adjacent neighbor shares the color, it backtracks. Iterating m finds the exact chromatic number.',
  },
  {
    id: 7,
    title: 'Travelling Salesman Problem (TSP)',
    topic: 'Traveling Salesperson Problem using branch and bound technique',
    algorithm: 'Branch and Bound (LCBB)',
    technique: 'Branch & Bound',
    mainConcept: 'State Space Tree Pruning using lower bound estimation',
    timeComplexity: 'O(2^n * n^2) pruned',
    spaceComplexity: 'O(n)',
    code: `def tsp(p, u, c):
    global best, ans
    if len(p) == n:
        x = c + g[p[-1]][p[0]]
        if x < best:
            best, ans = x, p[:]
        return
    r = [i for i in range(n) if i not in u]
    bound = c + min(g[p[-1]][j] for j in r) + sum(min(g[i][j] for j in range(n) if i != j) for i in r)
    if bound >= best:
        return
    for v in r:
        tsp(p + [v], u | {v}, c + g[p[-1]][v])

n = int(input())
g = [list(map(int, input().split())) for _ in range(n)]
best, ans = float('inf'), []
tsp([0], {0}, 0)
print("Tour:", ans + [0])
print("Minimum Cost:", best)`,
    sampleInput: `4
0 10 15 20
10 0 35 25
15 35 0 30
20 25 30 0`,
    expectedOutput: `Tour: [0, 1, 3, 2, 0]
Minimum Cost: 80`,
    inputDescription: 'Line 1: Number of cities n. Next n lines: Cost adjacency matrix.',
    explanation: 'Explores permutations of city tours. At each step, a lower bound on cost is calculated; if the lower bound exceeds the current known best, the entire branch is pruned.',
  },
];
