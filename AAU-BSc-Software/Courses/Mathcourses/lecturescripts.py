import numpy
import numpy as np
import matplotlib.pyplot as plt
from scipy.sparse.linalg import cg
from imageio import imread
import numpy as np
from scipy.io import loadmat
import matplotlib.pyplot as plt


def gs_cofficient(v1, v2):
    return numpy.dot(v2, v1) / numpy.dot(v1, v1)

def multiply(cofficient, v):
    return map((lambda x : x * cofficient), v)

def proj(v1, v2):
    return multiply(gs_cofficient(v1, v2) , v1)

# Gram-schmidt algorithm
def gs(X, row_vecs=True, norm = True):
    if not row_vecs:
        X = X.T
    Y = X[0:1,:].copy()
    for i in range(1, X.shape[0]):
        proj = numpy.diag((X[i,:].dot(Y.T)/numpy.linalg.norm(Y,axis=1)**2).flat).dot(Y)
        Y = numpy.vstack((Y, X[i,:] - proj.sum(0)))
    if norm:
        Y = numpy.diag(1/numpy.linalg.norm(Y,axis=1)).dot(Y)
    if row_vecs:
        return Y
    else:
        return Y.T
    
def w1o16():
    A = np.array([[1, 0, 0, 0, 0],
                    [1, np.pi/6, (np.pi/6)**2, (np.pi/6)**3, (np.pi/6)**4],
                    [1, np.pi/4, (np.pi/4)**2, (np.pi/4)**3, (np.pi/4)**4],
                    [1, np.pi/3, (np.pi/3)**2, (np.pi/3)**3, (np.pi/3)**4],
                    [1, np.pi/2, (np.pi/2)**2, (np.pi/2)**3, (np.pi/2)**4]])

    b = np.array([1, np.sqrt(3)/2, np.sqrt(2)/2, 1/2, 0])

    x = np.linalg.solve(A, b)

    print(x)

    x_vals = np.linspace(-1, 2, 1000)
    y_vals_p = 1 + 0.16405728 * x_vals - 0.97340685 * x_vals**2 - 0.29122656 * x_vals**3 + 1.11665148 * x_vals**4
    y_vals_cos = np.cos(x_vals)

    plt.plot(x_vals, y_vals_p, label="Interpolating Polynomial")
    plt.plot(x_vals, y_vals_cos, label="cos(x)")
    plt.legend()
    plt.show()

# Define the Lagrange polynomials
def lagrange_poly(i, x, t):
    n = len(t)
    num = 1
    den = 1
    for j in range(n):
        if j != i:
            num *= (x - t[j])
            den *= (t[i] - t[j])
    return num / den

def w1o17():
    # Define the dataset
    t = np.array([1, 2, 3])
    y = np.array([4, 0, 12])

    # Create a grid of x values to plot the polynomials
    x = np.linspace(t.min(), t.max(), 100)

    # Compute the Lagrange polynomials and plot them
    fig, ax = plt.subplots()
    for i in range(len(t)):
        ax.plot(x, lagrange_poly(i, x, t), label=f"$L_{i+1}(t)$")
    
    ax.scatter(t, y, color='red', label='Data points')
    ax.legend()
    plt.show()


def compute_QR(A):
    """
    Computes the QR factorization of a matrix A and returns Q and R.
    
    Args:
    A: numpy array of shape (m,n), where m is the number of rows and n is the number of columns
    
    Returns:
    Q: numpy array of shape (m,m), orthogonal matrix
    R: numpy array of shape (m,n), upper triangular matrix
    """
    Q, R = np.linalg.qr(A)
    print("Q=\n", Q)
    print("R=\n", R)
    # Note that Q^T Q ~ I, up to some small round-offs
    # i.e. Q is an orthogonal matrix
    print("Q^T Q = \n", Q.T @ Q)
    print("Q R = \n", Q @ R)
    return Q, R

# A = np.array([[1,2],[3,4],[5,6]],dtype=np.double)
# Q, R = compute_QR(A)

# Workshop 2 part 1 opgave 4
# A = np.array([[1, 1, 0, 0],
#               [0, 0, 1, 1],
#               [1, 0, 1, 0],
#               [0, 1, 0, 1],
#               [0, 1, 0, 0],
#               [1, 0, 0, 1],
#               [0, 0, 1, 0],
#               [1, 0, 0, 0],
#               [0, 1, 1, 0],
#               [0, 0, 0, 1]])
# Q, R = compute_QR(A)

# ------------------------------

# Workshop 2 part 1 opgave 5
# A = np.array([[1, 1, 0, 0],
#               [0, 0, 1, 1],
#               [1, 0, 1, 0],
#               [0, 1, 0, 1],
#               [0, 1, 0, 0],
#               [1, 0, 0, 1],
#               [0, 0, 1, 0],
#               [1, 0, 0, 0],
#               [0, 1, 1, 0],
#               [0, 0, 0, 1]])

# b_tilde = np.array([1, 5.25, 2, 3.5, 1.5, 3, 1.75, 0, 2.5, 3]).reshape(-1, 1)

# # Then, the QR decomposition of A is computed using the numpy function np.linalg.qr(A). 
# # This decomposition factorizes A into an orthogonal matrix Q and an upper-triangular matrix R.
# Q, R = np.linalg.qr(A)

# # Next, the vector c is computed by multiplying the transpose of Q with b_tilde, i.e., 
# # c = np.dot(Q.T, b_tilde). This step is equivalent to solving the system A*x = b_tilde by 
# # computing Q^T*b_tilde, which yields a vector c such that R*x = c, 
# # where R is the upper-triangular matrix obtained in the QR decomposition.
# c = np.dot(Q.T, b_tilde)
# x = np.linalg.solve(R, c)

# print("Solution to the least-squares problem: ")
# print(x)

def insertionSort(array):

    for step in range(1, len(array)):
        key = array[step]
        j = step - 1
        
        # Compare key with each element on the left of it until an element smaller than it is found
        # For descending order, change key<array[j] to key>array[j].        
        while j >= 0 and key < array[j]:
            array[j + 1] = array[j]
            j = j - 1
        
        # print each step
        print(f"Step {step}: {array}")
        array[j + 1] = key

def merge(arr, l, m, r):
    n1 = m - l + 1
    n2 = r - m

    # create temp arrays
    L = [0] * (n1)
    R = [0] * (n2)

    # Copy data to temp arrays L[] and R[]
    for i in range(0, n1):
        L[i] = arr[l + i]

    for j in range(0, n2):
        R[j] = arr[m + 1 + j]

    # Merge the temp arrays back into arr[l..r]
    i = 0     # Initial index of first subarray
    j = 0     # Initial index of second subarray
    k = l     # Initial index of merged subarray

    while i < n1 and j < n2:
        if L[i] <= R[j]:
            arr[k] = L[i]
            i += 1
        else:
            arr[k] = R[j]
            j += 1
        k += 1

    # Copy the remaining elements of L[], if there
    # are any
    while i < n1:
        arr[k] = L[i]
        i += 1
        k += 1

    # Copy the remaining elements of R[], if there
    # are any
    while j < n2:
        arr[k] = R[j]
        j += 1
        k += 1

    # Print the merging process
    print("Merging:", arr[l:r+1])

# l is for left index and r is right index of the
# sub-array of arr to be sorted

def mergeSort(arr, l, r):
    if l < r:
        # Same as (l+r)//2, but avoids overflow for
        # large l and h
        m = l+(r-l)//2

        # Sort first and second halves
        mergeSort(arr, l, m)
        mergeSort(arr, m+1, r)
        merge(arr, l, m, r)
        # Print the sorted subarray after merging
        print("Sorted subarray:", arr[l:r+1])

# array = np.array([7, 3, 5, 9, 8, 2])
# n = len(array)
# print("Given array is", array)
# mergeSort(array, 0, n-1)
# print("Sorted array is", array)


# read the gray-scale image from file
original_image = imread("Mathcourses/resources/skull64.png",as_gray=True)
# figure out its shape
sz = original_image.shape
# number of pixels = dimension of the vector space
n = sz[0]*sz[1]
# reshape the image as a one-dimensional vector
x = np.reshape(original_image,[n])

# read the Radon transform matrix from file
mat_content = loadmat("Mathcourses/resources/radon_matrix.mat")
A = mat_content["A"]
# size of the CT picture
N_angles = int(mat_content["N_angles"])
NX       = int(mat_content["NX"])

# apply the Radon transform to the image
# this produces the measurements, or the right-hand side of
# the least-squares system we want to solve
b = A @ x

# add some random noise
m = b.shape[0]
# larger values of sigma => more noise
sigma = 0.02
b_tilde = b + sigma*np.random.randn(m)


# plot the original image side by side with 
# the CT measurements/sinogram
fig, (ax1, ax2, ax3) = plt.subplots(1, 3)
ax1.set_title("Original image")
ax1.imshow(original_image, cmap=plt.cm.Greys_r)

ax2.set_title("CT measurements")
sinogram = b_tilde.reshape([NX,N_angles])
ax2.imshow(sinogram, cmap=plt.cm.Greys_r, aspect='auto')

### TODO: actually reconstruct image from the noisy measurements
# Tikhonov regularization parameter
alpha = 10

# Create the Tikhonov-regularized least-squares problem
ATA = A.T @ A + alpha * np.eye(n)

# Solve the Tikhonov-regularized least-squares problem using conjugate gradient method
x_hat, _ = cg(ATA, A.T @ b_tilde)
### END TODO

reconstructed_image = x_hat.reshape(sz)

ax3.set_title("Reconstructed image")
ax3.imshow(reconstructed_image, cmap=plt.cm.Greys_r)

fig.tight_layout()
plt.show()


