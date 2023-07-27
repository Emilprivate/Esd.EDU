import numpy
import numpy as np

def RecursiveTreeInsert(T, z):
    if T == None:
        T = z
    elif z.key < T.key:
        T.left = RecursiveTreeInsert(T.left, z)
    else:
        T.right = RecursiveTreeInsert(T.right, z)
    return T

class Node:
    def __init__(self, key):
        self.key = key
        self.left = None
        self.right = None

root = Node(7)

RecursiveTreeInsert(root, Node(5))

def InorderTreeWalk(T):
    if T != None:
        InorderTreeWalk(T.left)
        print(T.key)
        InorderTreeWalk(T.right)

InorderTreeWalk(root)