# 4. 0/1 Knapsack – Memoization (Dynamic Programming)
# Sample Input:
# 3
# 10 20 30
# 60 100 120
# 50
#
# Expected Output:
# Maximum Profit: 220

def k(n, w):
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

print("Maximum Profit:", k(n, w))
