# 6. Graph Coloring – Backtracking
# Sample Input:
# 4
# 0 1 0 1
# 1 0 1 0
# 0 1 0 1
# 1 0 1 0
#
# Expected Output:
# Minimum Colors: 2
# Colors: [1, 2, 1, 2]

def color(v, m):
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
        break
