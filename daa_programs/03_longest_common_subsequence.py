# 3. Longest Common Subsequence (LCS) – Dynamic Programming
# Sample Input:
# AGGTAB
# GXTXAYB
#
# Expected Output:
# LCS Length: 4

a, b = input(), input()
d = [[0] * (len(b) + 1) for _ in range(len(a) + 1)]

for i in range(1, len(a) + 1):
    for j in range(1, len(b) + 1):
        d[i][j] = 1 + d[i - 1][j - 1] if a[i - 1] == b[j - 1] else max(d[i - 1][j], d[i][j - 1])

print("LCS Length:", d[-1][-1])
