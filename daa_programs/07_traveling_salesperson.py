# 7. Travelling Salesman Problem – Branch and Bound
# Sample Input:
# 4
# 0 10 15 20
# 10 0 35 25
# 15 35 0 30
# 20 25 30 0
#
# Expected Output:
# Tour: [0, 1, 3, 2, 0]
# Minimum Cost: 80

def tsp(p, u, c):
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
print("Minimum Cost:", best)
