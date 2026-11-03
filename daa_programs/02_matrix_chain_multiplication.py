# 2. Matrix Chain Multiplication – Dynamic Programming
# Sample Input:
# 4
# 10 20 30 40 30
#
# Expected Output:
# Minimum Cost: 30000

n = int(input())
p = list(map(int, input().split()))
d = [[0] * n for _ in range(n)]

for l in range(2, n + 1):
    for i in range(n - l + 1):
        j = i + l - 1
        d[i][j] = min(d[i][k] + d[k + 1][j] + p[i] * p[k + 1] * p[j + 1]
                      for k in range(i, j))

print("Minimum Cost:", d[0][n - 1])
