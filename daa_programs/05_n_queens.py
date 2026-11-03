# 5. N-Queens – Backtracking
# Sample Input:
# 4
#
# Expected Output:
# Solution:
# 0 1 0 0
# 0 0 0 1
# 1 0 0 0
# 0 0 1 0

def q(r):
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
    print(*row)
