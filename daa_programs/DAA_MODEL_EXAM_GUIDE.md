Here are all **7 DAA programs with the shortest practical Python code, sample input and expected output together**. All programs accept dynamic input.

# 1. Huffman Coding – Greedy Algorithm

**Python Code**
```python
import heapq
h = []
n = int(input())
for i in range(n):
    c, f = input().split()
    heapq.heappush(h, (int(f), i, c))
i = n
while len(h) > 1:
    a, _, x = heapq.heappop(h)
    b, _, y = heapq.heappop(h)
    heapq.heappush(h, (a+b, i, (x, y)))
    i += 1

def show(t, s=""):
    if isinstance(t, str): print(t, s or "0")
    else: show(t[0], s+"0"); show(t[1], s+"1")

show(h[0][2])
```

**Sample Input**
```text
6
A 5
B 9
C 12
D 13
E 16
F 45
```

**Expected Output**
```text
F 0
C 100
D 101
A 1100
B 1101
E 111
```

---

# 2. Matrix Chain Multiplication – Dynamic Programming

**Python Code**
```python
n = int(input())
p = list(map(int, input().split()))
d = [[0]*n for _ in range(n)]

for l in range(2, n+1):
    for i in range(n-l+1):
        j = i+l-1
        d[i][j] = min(d[i][k]+d[k+1][j]+p[i]*p[k+1]*p[j+1]
                      for k in range(i,j))

print("Minimum Cost:", d[0][n-1])
```

**Sample Input**
```text
4
10 20 30 40 30
```

**Expected Output**
```text
Minimum Cost: 30000
```

---

# 3. Longest Common Subsequence (LCS) – Dynamic Programming

**Python Code**
```python
a, b = input(), input()
d = [[0]*(len(b)+1) for _ in range(len(a)+1)]

for i in range(1,len(a)+1):
    for j in range(1,len(b)+1):
        d[i][j] = 1+d[i-1][j-1] if a[i-1]==b[j-1] else max(d[i-1][j],d[i][j-1])

print("LCS Length:", d[-1][-1])
```

**Sample Input**
```text
AGGTAB
GXTXAYB
```

**Expected Output**
```text
LCS Length: 4
```

---

# 4. 0/1 Knapsack – Memoization

**Python Code**
```python
def k(n,w):
    if n==0 or w==0: return 0
    if d[n][w]!=-1: return d[n][w]
    d[n][w] = max(v[n-1]+k(n-1,w-wt[n-1]),k(n-1,w)) if wt[n-1]<=w else k(n-1,w)
    return d[n][w]

n = int(input())
wt = list(map(int,input().split()))
v = list(map(int,input().split()))
w = int(input())
d = [[-1]*(w+1) for _ in range(n+1)]
print("Maximum Profit:",k(n,w))
```

**Sample Input**
```text
3
10 20 30
60 100 120
50
```

**Expected Output**
```text
Maximum Profit: 220
```

---

# 5. N-Queens – Backtracking

**Python Code**
```python
def q(r):
    if r==n: return True
    for c in range(n):
        if (all(b[i][c]==0 for i in range(r)) and
            all(b[r-k][c-k]==0 for k in range(1,min(r,c)+1)) and
            all(b[r-k][c+k]==0 for k in range(1,min(r,n-1-c)+1))):
            b[r][c]=1
            if q(r+1): return True
            b[r][c]=0
    return False

n = int(input())
b = [[0]*n for _ in range(n)]
print("Solution:" if q(0) else "No solution")
for row in b: print(*row)
```

**Sample Input**
```text
4
```

**Expected Output**
```text
Solution:
0 1 0 0
0 0 0 1
1 0 0 0
0 0 1 0
```

---

# 6. Graph Coloring – Backtracking

**Python Code**
```python
def color(v,m):
    if v==n: return True
    for c in range(1,m+1):
        if all(not g[v][i] or a[i]!=c for i in range(n)):
            a[v]=c
            if color(v+1,m): return True
            a[v]=0
    return False

n = int(input())
g = [list(map(int,input().split())) for _ in range(n)]

for m in range(1,n+1):
    a = [0]*n
    if color(0,m):
        print("Minimum Colors:",m)
        print("Colors:",a)
        break
```

**Sample Input**
```text
4
0 1 0 1
1 0 1 0
0 1 0 1
1 0 1 0
```

**Expected Output**
```text
Minimum Colors: 2
Colors: [1, 2, 1, 2]
```

---

# 7. Travelling Salesman Problem – Branch and Bound

**Python Code**
```python
def tsp(p,u,c):
    global best,ans
    if len(p)==n:
        x=c+g[p[-1]][p[0]]
        if x<best: best,ans=x,p[:]
        return
    r=[i for i in range(n) if i not in u]
    bound=c+min(g[p[-1]][j] for j in r)+sum(min(g[i][j] for j in range(n) if i!=j) for i in r)
    if bound>=best: return
    for v in r:
        tsp(p+[v],u|{v},c+g[p[-1]][v])

n = int(input())
g = [list(map(int,input().split())) for _ in range(n)]
best,ans = float('inf'),[]
tsp([0],{0},0)
print("Tour:",ans+[0])
print("Minimum Cost:",best)
```

**Sample Input**
```text
4
0 10 15 20
10 0 35 25
15 35 0 30
20 25 30 0
```

**Expected Output**
```text
Tour: [0, 1, 3, 2, 0]
Minimum Cost: 80
```

---

## Final DAA revision table

| No. | Topic | Algorithm | Main concept |
|---:|---|---|---|
| 1 | Huffman Coding | Greedy | Min Heap |
| 2 | Matrix Chain | DP | Minimum Cost |
| 3 | LCS | DP | Common Subsequence |
| 4 | Knapsack | DP | Memoization |
| 5 | N-Queens | Backtracking | Safe Position |
| 6 | Graph Coloring | Backtracking | Minimum Colors |
| 7 | TSP | Branch & Bound | Lower Bound |

**Important:** For TSP, the provided compact implementation assumes a complete cost matrix with non-negative edge costs. For Huffman, enter each character only once. For Knapsack, enter exactly `n` weights and `n` profits.

These are the versions I recommend practising for tomorrow.

---

If you want, I can:

- Provide ultra-short code for additional topics
- Explain key techniques used in each program
- Provide step-by-step example for one program