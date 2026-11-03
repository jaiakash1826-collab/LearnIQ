# 1. Huffman Coding – Greedy Algorithm
# Sample Input:
# 6
# A 5
# B 9
# C 12
# D 13
# E 16
# F 45
#
# Expected Output:
# F 0
# C 100
# D 101
# A 1100
# B 1101
# E 111

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
    heapq.heappush(h, (a + b, i, (x, y)))
    i += 1

def show(t, s=""):
    if isinstance(t, str):
        print(t, s or "0")
    else:
        show(t[0], s + "0")
        show(t[1], s + "1")

show(h[0][2])
