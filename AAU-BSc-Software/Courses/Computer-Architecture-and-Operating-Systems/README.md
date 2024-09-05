# Computer Architecture and Operating Systems

# Textbook assignments

## Lecture 1 | Overblik & info & bits

### Problem 2.1

![image.png](Computer%20Architecture%20and%20Operating%20Systems%20e232dc6177884d63ab7e6e2fffb66542/image.png)

![image.png](Computer%20Architecture%20and%20Operating%20Systems%20e232dc6177884d63ab7e6e2fffb66542/image%201.png)

A. 0010 0101 1011 1001 1101 0010

B. 0xAE49

C. 1010 1000 1011 0011 1101

D. 0x322D96

### Problem 2.3

![image.png](Computer%20Architecture%20and%20Operating%20Systems%20e232dc6177884d63ab7e6e2fffb66542/image%202.png)

| Decimal | Binary | Hexadecimal |
| --- | --- | --- |
| 0 | 0000 0000 | 0x00 |
| 158 | 1001 1110 | 0x9E |
| 76 | 0100 1100 | 0x4C |
| 145 | 1001 0001 | 0x91 |
| 174 | 1010 1110 | 0xAE |
| 60 | 0011 1100 | 0x3C |
| 241 | 1111 0001 | 0xF1 |
- Calculations & Notes
    
    To add binaries together:
    
    - Align them vertically and start from right side.
    - 0+0 = 0
    - 0+1 = 1
    - 1+0 = 1
    - 1+1 = 10 (but carry the 1 to the next column on the left side)
        - 10100(20) + 10001(17) = 100101(37)
        - 11000(24) + 11000(24) = 110000(48)
        - 10111 + 01000 = 11111
            - 2^4+2^2+2^1+2^0 = 23
            - 2^3 = 8
            - 2^4+2^3+2^2+2^1+2^0 = 31
        - 00010(2) + 00101(5) = 00111 (7) ← used lecture 1 table for this one
        - 01100(12) + 00100(4) = 10000 →2⁴ = 16
    - **When converting decimal to hex** we repeatedly divide x by 16 giving a quotient q and a remainder that we multiply by 16 to get the remainder represented in this formula: q*16+r. We do this until we reach q = 0.The remainders r represent the hexadecimal values from bottom and up.
    - **When converting hexadecimal to decimal,** we can multiply each of the hexadecimal digits by the appropriate power of 16.
    - **When converting from hex to binary** we just use the table from the textbook and take each symbol in the hexadecimal value and replace it with its binary representation starting from right to left.
    - **To convert binary to hex:**
        - 11111 = 1F | we start from right side, 1 = 1, 1111 = F → 1F
        - 10111 = 17 | remember start from right to left!
        - 01000 = 8 | it’s 8 because 1000 is 8 in the table and aslong as there is only zeros in front it doesn’t change the value, but if there were a 1, we would need to consider that.
        - 00010 = 2
        - 00101 = 5
        - 01100 = C
        - 00100 = 4
    - **Convert binary to decimal directly:**
        - 11111 = 2⁴+2³+2²+2¹+2⁰ = 31
        - etc..
    
    158/16 = 9 * 16 + 14 (R * 16)
    
    9/16 = 0 * 16 + 9
    
    9E is 158 in decimal.
    
    9E = 1001 1110
    
    ________________________
    
    145/16 = 9 * 16 + 1
    
    9/16 = 0 * 16 + 9
    
    91 is 145 in decimal.
    
    91 = 1001 0001
    
    76/16 = 4 * 16 + 12 (R*16)
    
    4/16 = 0 * 16 + 4
    
    4C is 76 in decimal.
    
    4C = 0100 1100
    
    ________________________
    
    1010 1110 = 0xAE
    
    0011 1100 = 0x3C
    
    1111 0001 = 0xF1
    
    AE = 10*16¹ + 14*16⁰ = 160+14 = 174
    
    3C = 3*16¹ + 12*16⁰ = 48+12 = 60
    
    F1 = 15*16¹ + 1*16⁰ = 240+1 = 241
    

### Problem 2.7

![image.png](Computer%20Architecture%20and%20Operating%20Systems%20e232dc6177884d63ab7e6e2fffb66542/image%203.png)

![image.png](Computer%20Architecture%20and%20Operating%20Systems%20e232dc6177884d63ab7e6e2fffb66542/image%204.png)

![image.png](Computer%20Architecture%20and%20Operating%20Systems%20e232dc6177884d63ab7e6e2fffb66542/image%205.png)

| address | value |
| --- | --- |
| 11FFFFCB8 | 0x6D |
| 11FFFFCB9 | 0x6E |
| 11FFFFCBA | 0x6F |
| 11FFFFCBB | 0x70 |
| 11FFFFCBC | 0x71 |
| 11FFFFCBD | 0x72 |
- Calculations & Notes
    
    Note: This task is using incorrect ASCII codes, the actual codes for the letters a through z is 0x41 to 0x5A.
    
    The function would output the pointer address to the value followed by the value itself.
    
    We assume the address starts at 11FFFFCB8 like in the lecture video.
    

### Problem 2.10

![image.png](Computer%20Architecture%20and%20Operating%20Systems%20e232dc6177884d63ab7e6e2fffb66542/image%206.png)

| Step | *x | *y |
| --- | --- | --- |
| Initially | a | b |
| Step 1 | a | 0001 |
| Step 2 | 1011 | 0001 |
| Step 3 | 1011 | 1010 |
- Calculations & Notes
    
    ^ = XOR. Binary XOR operator copies the bit if it is set in one operand but not both.
    
    a   = 1010 (a)
    
    b   = 1011 (b)
    
    y   = 0001 (1)
    
    x   = 1011 (b)
    
    y   = 1010 (a)
    

### Problem 2.12

![image.png](Computer%20Architecture%20and%20Operating%20Systems%20e232dc6177884d63ab7e6e2fffb66542/image%207.png)

![image.png](Computer%20Architecture%20and%20Operating%20Systems%20e232dc6177884d63ab7e6e2fffb66542/image%208.png)

![image.png](Computer%20Architecture%20and%20Operating%20Systems%20e232dc6177884d63ab7e6e2fffb66542/image%209.png)

A. x & 0xFF

B. x ^ ~0xFF

C. x | 0xFF

- Calculations & Notes
    
    A. x & 0xFF because & ensures that the resulting bit is 1 if and only if the two compared bits are 1, everything else will result in 0, which can be see in the references above from the lecture video. 
    
    1000 0111 0110 0101 0100 0011 0010 0001 (x=0x87654321)
    
    0000 0000 0000 0000 0000 0000 1111 1111 (0xFF)
    
    & = 
    
    0000 0000 0000 0000 0000 0000 0010 0001 (21)
    
    B. x ^ ~0xFF
    
    1000 0111 0110 0101 0100 0011 0010 0001 (x=0x87654321)
    
    1111 1111 1111 1111 1111 1111 0000 0000 (~0xFF)
    
    ^ =
    
    0111 1000 1001 1010 1011 1100 0010 0001 (21)
    
    C. x | 0xDE
    
    1000 0111 0110 0101 0100 0011 0010 0001 (x=0x87654321)
    
    0000 0000 0000 0000 0000 0000 1101 1110 (0xDE)
    
    |=
    
    1000 0111 0110 0101 0100 0011 1111 1111 (0xFF)
    
    Correction: According to the textbook it’s actually x | 0xFF, but mine should theoretically also work but only for this specific assignment, not as a general solution.
    

### Problem 2.14

![image.png](Computer%20Architecture%20and%20Operating%20Systems%20e232dc6177884d63ab7e6e2fffb66542/image%2010.png)

| Expression | Value | Expression | Value |
| --- | --- | --- | --- |
| a & b | 0x44 | a && b | 0x01 |
| a | b | 0x57 | a || b | 0x01 |
| ~a | ~b | 0xBB | !a || !b | 0x00 |
| a & !b | 0x00 | a && ~b | 0x01 |
- Calculations & Notes
    
    a = 0101 0101
    
    b = 0100 0110
    
    - a & b:
        
        0101 0101 (a)
        
        0100 0110 (b)
        
        & =
        
        0100 0100 (0x44)
        
    - a | b
        
        0101 0101 (a)
        
        0100 0110 (b)
        
        |=
        
        0101 0111 (0x57)
        
    - ~a | ~b
        
        1010 1010 (~a)
        
        1011 1001 (~b)
        
        |=
        
        1011 1011 (0xBB)
        
    - a & !b
        
        0101 0101 (a)
        
        0000 0000 (!b)
        
        & =
        
        0000 0000 (0x00)
        
    
    - a && b
        
        0101 0101 (a)
        
        0100 0110 (b)
        
        &&=
        
        0x01
        
    - a || b
        
        0101 0101 (a)
        
        0100 0110 (b)
        
        ||=
        
        0x01
        
    - !a || !b
        
        0101 0101 (a)
        
        0100 0110 (b)
        
        ||=
        
        0x00 | 0x00 = 0x00
        
    - a && ~b
        
        0101 0101 (a)
        
        0100 0110 (b)
        
        &&=
        
        0x01 && 0x01 = 0x01
        
    

### C-Programming

Write, compile, and run a program that prints "hello world!”

```c
#include <stdio.h>

void main(){
		printf("hello world\n");
}

> gcc helloworld.c -o helloworld
> ./helloworld
hello world
```

- C-pointer Refresher
    1. Write a function printArray with parameter type long array, that prints its elements as a long integer value and a long hexidecimal value respectively (using %ld respectively %lx as placeholders in printf, and use it to print a sample array "a" containing 20 elements each initialized with the value from 10+i (where i is the index). Ie 10,11,...,29
        
        (done on CAOS Virtual Machine on my Linux boot)
        
    2. Make a pointer x to the 4th element (index 3), and print out its address (use %p). Also print out the address of 'a'. Are the addresses what you expect?
    3. Print the value pointed by x by dereferencing x
    4. Write a function swap (taking to long pointers as argument) that swaps the appointed values. Apply it to swap the array elements with indexes 0 and 5. print the Array
    5. Print the hex value of the expression "long y=*(x+9)"
    6. What does it print if you set y=*(x+100);
    7. What happens if you set y=*(x+100000);? Why?

## Lecture 2  | Repræsentation af signed/unsigned integers

### Lecture notes

![image.png](Computer%20Architecture%20and%20Operating%20Systems%20e232dc6177884d63ab7e6e2fffb66542/image%2011.png)

![image.png](Computer%20Architecture%20and%20Operating%20Systems%20e232dc6177884d63ab7e6e2fffb66542/image%2012.png)

$$
⁍
$$

### **Unsigned integers (positive integers)**

$$
B2U(X) = \sum_{i=0}^{w-1} x_i \cdot 2^i

$$

- Example of B2U
    
    $$
    1010 \rightarrow 1 \cdot 2^3 + 0 \cdot 2^2 + 1 \cdot 2^1 + 0 \cdot 2^0 \rightarrow 8 + 0 + 2 + 0 = 10
    
    $$
    

$$
\text{UMin} = 0

$$

$$
\text{UMax} = 2^w - 1

$$

### **Signed integers (negative-positive integers)**

$$
B2T(X) = -x_{w-1} \cdot 2^{w-1} + \sum_{i=0}^{w-2} x_i \cdot 2^i

$$

- Example of B2T
    
    $$
    1010 \rightarrow -1 \cdot 2^3 + 0 \cdot 2^2 + 1 \cdot 2^1 + 0 \cdot 2^0 \rightarrow -8 + 0 + 2 + 0 = -6
    
    $$
    

$$
\text{TMin} = -2^{w-1}

$$

$$
\text{TMax} = 2^{w-1} - 1

$$

### Converting between signed and unsigned

**Two’s complement of a positive number** N is calculated by taking the bitwise NOT of `N` which flips all the bits and then adding 1.

$$
\text{Two's complement of } N = \text{NOT}(N) + 1

$$

**When converting an unsigned integer greater than the max signed integer** we need to convert the integer to binary, see what the MSB (most significant bit) is, if it’s 1 then we interpret it as negative, if it’s 0 we interpret it as positive. After that we invert all bits and add 1 to the result, which gives a number but remember the decision to interpret it in a certain way, we take that interpretation and add it. So if the number after the bitwise operation turned out to be a positive number but the initial interpretation was concluded as a negative number, we will consider it a negative number, so we add the negative symbol.

$$
\text{Signed representation of } U = 
\begin{cases} 
\text{Negative interpretation: } -( \text{NOT}(U) + 1), & \text{if MSB is 1} \\
\text{Positive interpretation: } \text{NOT}(U) + 1, & \text{if MSB is 0}
\end{cases}

$$

**Converting an unsigned integer that is not greater than the max signed integer** is straight forward as it’s the same value.

$$
\text{Signed representation of } U = U, \text{ if } U \leq \text{Max Signed Integer}

$$

- Example
    
    We’re assuming a 32 bit program.
    
    1) Unsigned integer: `3000000000` (greater than TMax)
    
    2) Binary representation of this: 10110010 11010110 10000000 00000000
    
    - Notice the MSB is 1, so it’s interpreted as a negative number in the result.
    
    3) Apply NOT bit operation and invert all bits:
    
    - 01001101 00101001 01111111 11111111
    
    4) Add 1 to the result
    
    - 01001101 00101001 10000000 00000000
    
    5) We get `1294967296`
    
    6) Since the initial MSB was 1, we get: `-1294967296`
    

### Shift operations

There’s only the amount of space as defined by the word size.

![image.png](Computer%20Architecture%20and%20Operating%20Systems%20e232dc6177884d63ab7e6e2fffb66542/image%2013.png)

**Left shift**

x << y → we just move bits to the left `y` times and replace the values on the right side with zeros.

**Right shift**

x >> y → we just move bits to the right `y` times and replace the values on the left side with either the `msb` (most significant bit) if it’s arithmetic or zeros if it’s logical.

**Power-of-2 multiplication via shifting**

$$
u \ll k = u \cdot 2^k

$$

- Examples of P2MS
    
    $$
    \text{Unsigned: } u = 4, k = 1 \quad \rightarrow \quad 4 \cdot 2^1: \quad 0100 \ll 1 = 1000 = 8
    
    $$
    
    $$
    \text{Signed: } u = -4, k = 1 \quad \rightarrow \quad -4 \cdot 2^1: \quad 1100 \ll 1 = 1000 = -8
    
    $$
    

**Power-of-2 division via shifting**

$$
u \gg k=\left\lfloor \frac{u}{2^k} \right\rfloor
$$

- Examples of P2DS
    
    Unsigned logical shifting:
    
    ![image.png](Computer%20Architecture%20and%20Operating%20Systems%20e232dc6177884d63ab7e6e2fffb66542/image%2014.png)
    
    Signed arithmetic shift:
    
    ![image.png](Computer%20Architecture%20and%20Operating%20Systems%20e232dc6177884d63ab7e6e2fffb66542/image%2015.png)
    

### Problem 2.17

![image.png](Computer%20Architecture%20and%20Operating%20Systems%20e232dc6177884d63ab7e6e2fffb66542/image%2016.png)

![image.png](Computer%20Architecture%20and%20Operating%20Systems%20e232dc6177884d63ab7e6e2fffb66542/image%2017.png)

![image.png](Computer%20Architecture%20and%20Operating%20Systems%20e232dc6177884d63ab7e6e2fffb66542/image%2018.png)

| Hexadecimal | Binary | B2U | B2T |
| --- | --- | --- | --- |
| 0xA | 1010 | 2³ + 2¹ = 10 | -2³ + 2¹ = -6 |
| 0x1 | 0001 | 2⁰ = 1 | 2⁰ = 1 |
| 0xB | 1011 | 2³+2¹+2⁰ = 11 | -2³+2¹+2⁰ = -5 |
| 0x2 | 0010 | 2¹ = 2 | 2¹ = 2 |
| 0x7 | 0111 | 2²+2¹+2⁰ = 7 | -2²+2¹+2⁰ = 7 |
| 0xC | 1100 | 2³+2² = 12 | 2³+2²  = -4 |

### Problem 2.21

![image.png](Computer%20Architecture%20and%20Operating%20Systems%20e232dc6177884d63ab7e6e2fffb66542/image%2019.png)

![image.png](Computer%20Architecture%20and%20Operating%20Systems%20e232dc6177884d63ab7e6e2fffb66542/image%2020.png)

| Type | Evaluation |
| --- | --- |
| Unsigned | 1* |
| Signed | 1 |
| Unsigned | 0* |
| Signed | 1 |
| Unsigned | 1* |

### Problem 2.29

![image.png](Computer%20Architecture%20and%20Operating%20Systems%20e232dc6177884d63ab7e6e2fffb66542/image%2021.png)

![image.png](Computer%20Architecture%20and%20Operating%20Systems%20e232dc6177884d63ab7e6e2fffb66542/image%2022.png)

| x | y | x+y | x+(t/5)*y | Case |
| --- | --- | --- | --- | --- |
| 10100 | 10001 | 37 |  |  |
| 11000 | 11000 | 48 |  |  |
| 10111 | 01000 | 31 |  |  |
| 00010 | 00101 | 7 |  |  |
| 01100 | 00100 | 16 |  |  |

![image.png](Computer%20Architecture%20and%20Operating%20Systems%20e232dc6177884d63ab7e6e2fffb66542/image%2023.png)

### Problem 2.30

![image.png](Computer%20Architecture%20and%20Operating%20Systems%20e232dc6177884d63ab7e6e2fffb66542/image%2024.png)

This function is a direct implementation of the rules given to determine whether
or not a two’s-complement addition overflows.

```c
/* Determine whether arguments can be added without overflow */
int tadd_ok(int x, int y) {
	int sum = x+y;
	int neg_over = x < 0 && y < 0 && sum >= 0;
	int pos_over = x >= 0 && y >= 0 && sum < 0;
	return !neg_over && !pos_over;
}
```

### Quizzes

- Notes & Work / Answers
    
    **Two’s complement to bit-representation:**
    
    - We use the table below. If we want to convert let’s say -20 to bit-representation we would first find it’s positive number’s binary representation, 20. We can follow one of the methods noted in lecture 1 notes or we can just check how many values of the numbers in the table that goes into 20 and then try to make it add up to 20. So 16 goes into 20 and 4 goes into the remaining 4, which is 20 now. Now we want to look from right to left, go until we get to the first 1 and then complement everything to the left of the 1 but everything to the right of the first 1 including the 1 itself, stays the same. So 11101100 is -20.
    
    | 128 | 64 | 32 | 16 | 8 | 4 | 2 | 1 |
    | --- | --- | --- | --- | --- | --- | --- | --- |
    | 0 | 0 | 0 | 1 | 0 | 1 | 0 | 0 |
    | 1 | 1 | 1 | 0 | 1 | 1 | 0 | 0 |
    
    _____________________________________________________________________
    
    **Betragt  8-bit ordet w=10101010.**
    
    **Hvilken værdi har w fortolket som unsigned (decimal)?**
    
    - 2^7 + 2^5 + 2^3 + 2^1 = 170
    
    **Hvilken værdi har w fortolket som  signed two's complement (decimal)?**
    
    - -2^7 + 2^5 + 2^3 + 2^1 = -86
    
    **Hvilken two's complement bit-repræsentation skal w have for at gemme decimal** værdien -8? 
    
    | 128 | 64 | 32 | 16 | 8 | 4 | 2 | 1 |
    | --- | --- | --- | --- | --- | --- | --- | --- |
    | 0 | 0 | 0 | 0 | 1 | 0 | 0 | 0 |
    | 1 | 1 | 1 | 1 | 1 | 0 | 0 | 0 |
    
    _____________________________________________________________________
    
    **Consider a (hypothetical) CAOSv1 machine that uses 6-bit words to represent integer numbers. Give answers as decimal numbers.**
    
    **What is the smallest unsigned integer that the machine can represent as a single word?** 
    
    [UMin](https://www.notion.so/Computer-Architecture-and-Operating-Systems-e232dc6177884d63ab7e6e2fffb66542?pvs=21) which is 0
    
    **What is the largest unsigned integer that the machine can represent as a single word?** 
    
    [UMax](https://www.notion.so/Computer-Architecture-and-Operating-Systems-e232dc6177884d63ab7e6e2fffb66542?pvs=21) which is 2^w - 1 →2⁶ - 1 = 63
    
    **What is the smallest signed integer that the machine can represent as a single word?**
    
    [TMin](https://www.notion.so/Computer-Architecture-and-Operating-Systems-e232dc6177884d63ab7e6e2fffb66542?pvs=21) which is -2^(w-1) → -2⁵ = -32
    
    **What is the largest signed integer that the machine can represent as a single word?**
    
    [TMax](https://www.notion.so/Computer-Architecture-and-Operating-Systems-e232dc6177884d63ab7e6e2fffb66542?pvs=21) which is 2^(w-1)-1 → 2^5 - 1 = 31
    
    _____________________________________________________________________
    
    **Betragt  (den hypotetiske) CAOSv1 maskine som anvender 6 bits til repræssentation af heltal (integers). Det er endvidere givet at den anvender two's complement til repræssentation af signed integers og  two's complement addition på signed integers.**
    
    **A C-program has the following declarations:**
    
    ```c
    unsigned int x1 = UINT_MIN ;
    unsigned int x2 = UINT_MAX; //UMax_w
    int y1 = INT_MIN ; //TMin_w
    int y2 = INT_MAX; //TMax_w
    int y3 = 6;
    ```
    
    **Beregn værdien af nedenstående C-udtryk. Giv resultater som decimal værdier (10 talssystem):** 
    
    x1 = UINT_MIN = 0
    
    x2 = UINT_MAX → 2^w - 1 → 2⁶ - 1 = 63
    
    y1 = INT_MIN (TMin) → -2^(w-1) → -2⁵ = -32
    
    y2 = INT_MAX (TMax) → 2^(w-1)-1 → 2^5 - 1 = 31
    
    y3 = 6
    
    | 1 | x2+1 → UINT_MAX + 1 → 63 + 1 → 0 (overflow) | 0 |
    | --- | --- | --- |
    | 2 | x2+y3 → UINT_MAX + 6 → 63 + 6 → 5 (overflow) | 5 |
    | 3 | x1-y3 → UINT_MIN - 6 → 0 - 6 → 58 (underflow) | 58 |
    | 4 | y1-1 → INT_MIN - 1 → -32 - 1 → 31 (underflow) | 31 |
    | 5 | y1-y3 → INT_MIN - 6 → -32 - 6 → 26 (underflow) | 26 |
    | 6 | y2+y3 → INT_MAX + 6 →31 + 6 → -27(overflow) | -27 |
    | 7 | x2+y1 → UINT_MAX+INT_MIN → 63U+(-32)U → 63+32 →0+31 → 31 (overflow) | 31 |
    
    To convert -32 to unsigned we can find it’s positive number’s binary representation then apply the B2T or use the table structure as below. B2T = 2^5 = 32. The table below also shows that 32 and -32 have same bit representation in a 6-bit program. So the unsigned integer of -32 is 32.
    
    |  | 32 | 16 | 8 | 4 | 2 | 1 |
    | --- | --- | --- | --- | --- | --- | --- |
    | 32 | 1 | 0 | 0 | 0 | 0 | 0 |
    | -32 | 1 | 0 | 0 | 0 | 0 | 0 |
    
    _____________________________________________________________________
    
    **How many iterations will the loop in the following program execute?**
    
    ```c
    #include<stdio.h>
    int main () {
      for (double i = 10; i != 0; i = i - 0.1) {
         printf("%.15f\n",i);
       }
    }
    ```
    
    Answer is A LOT! Because numbers don’t have an exact representation in floats/doubles. 
    
    - Program output:
        
        ```c
        Program output:
        
        10.000000000000000
        9.900000000000000
        9.800000000000001
        9.700000000000001
        9.600000000000001
        9.500000000000002
        9.400000000000002
        9.300000000000002
        9.200000000000003
        9.100000000000003
        9.000000000000004
        8.900000000000004
        8.800000000000004
        8.700000000000005
        8.600000000000005
        8.500000000000005
        8.400000000000006
        8.300000000000006
        8.200000000000006
        8.100000000000007
        8.000000000000007
        7.900000000000007
        7.800000000000008
        7.700000000000008
        7.600000000000009
        7.500000000000009
        7.400000000000009
        7.300000000000010
        7.200000000000010
        7.100000000000010
        7.000000000000011
        6.900000000000011
        6.800000000000011
        6.700000000000012
        6.600000000000012
        6.500000000000012
        6.400000000000013
        6.300000000000013
        6.200000000000014
        6.100000000000014
        6.000000000000014
        5.900000000000015
        5.800000000000015
        5.700000000000015
        5.600000000000016
        5.500000000000016
        5.400000000000016
        5.300000000000017
        5.200000000000017
        5.100000000000017
        5.000000000000018
        4.900000000000018
        4.800000000000018
        4.700000000000019
        4.600000000000019
        4.500000000000020
        4.400000000000020
        4.300000000000020
        4.200000000000021
        4.100000000000021
        4.000000000000021
        3.900000000000021
        3.800000000000021
        3.700000000000021
        3.600000000000021
        3.500000000000021
        3.400000000000021
        3.300000000000021
        3.200000000000021
        3.100000000000021
        3.000000000000020
        2.900000000000020
        2.800000000000020
        2.700000000000020
        2.600000000000020
        2.500000000000020
        2.400000000000020
        2.300000000000020
        2.200000000000020
        2.100000000000020
        2.000000000000020
        1.900000000000019
        1.800000000000019
        1.700000000000019
        1.600000000000019
        1.500000000000019
        1.400000000000019
        1.300000000000019
        1.200000000000019
        1.100000000000019
        1.000000000000019
        0.900000000000019
        0.800000000000019
        0.700000000000019
        0.600000000000019
        0.500000000000019
        0.400000000000019
        0.300000000000019
        0.200000000000019
        0.100000000000019
        0.000000000000019
        -0.099999999999981
        -0.199999999999981
        -0.299999999999981
        -0.399999999999981
        -0.499999999999981
        -0.599999999999981
        -0.699999999999981
        -0.799999999999981
        
        ...
        ```
        
    
    _____________________________________________________________________
    
    **Beregn resultatet af følgende udtryk af 8 bit ord med bitvise operationer.**
    
    [Reference](https://www.notion.so/Computer-Architecture-and-Operating-Systems-e232dc6177884d63ab7e6e2fffb66542?pvs=21)
    
    | `x` | `11001000` |
    | --- | --- |
    | `y` | `10101010` |
    
    `x | y` = 11101010
    
    | `x` | `11001000` |
    | --- | --- |
    | `y` | `10101010` |
    
    Let’s start by negating y = 01010101
    
    `x ^ ~y`  = 10011101
    
    [Reference](https://www.notion.so/Computer-Architecture-and-Operating-Systems-e232dc6177884d63ab7e6e2fffb66542?pvs=21)
    
    | `y` | `10101010` |
    | --- | --- |
    
    `y << 4` → 10100000
    
    | `x` | `11001000` |
    | --- | --- |
    
    `x >> 3 (logical)` → 00011001
    
    | `x` | `11001000` |
    | --- | --- |
    
    `x >> 3 (arithmetic)` → 11111001
    
    | `x` | `01001000` |
    | --- | --- |
    
    `x >> 3 (arithmetic)` → 00001001
    

## Lecture 3 | Binær repræsentation af programmer

### Lecture notes

![image.png](Computer%20Architecture%20and%20Operating%20Systems%20e232dc6177884d63ab7e6e2fffb66542/image%2025.png)

![image.png](Computer%20Architecture%20and%20Operating%20Systems%20e232dc6177884d63ab7e6e2fffb66542/image%2026.png)

![image.png](Computer%20Architecture%20and%20Operating%20Systems%20e232dc6177884d63ab7e6e2fffb66542/image%2027.png)

![image.png](Computer%20Architecture%20and%20Operating%20Systems%20e232dc6177884d63ab7e6e2fffb66542/image%2028.png)

![image.png](Computer%20Architecture%20and%20Operating%20Systems%20e232dc6177884d63ab7e6e2fffb66542/image%2029.png)

### Problem 3.1

![image.png](Computer%20Architecture%20and%20Operating%20Systems%20e232dc6177884d63ab7e6e2fffb66542/image%2030.png)

| Operand | Value |
| --- | --- |
| %rax | 0x100 |
| 0x104 | 0xAB |
| $0x108 | 0x108 |
| (%rax) | 0xFF |
| 4(%rax) | 0xAB |
| 9(%rax,%rdx) | 0x11 |
| 260(%rcx,%rdx) | 0x108 |
| 0xFC(,%rcx,4) | 0xFF |
| (%rax,%rdx,4) | 0x11 |
- Notes
    
    When an operand is referred to with parantheses, it tells us that there’s a memory address that it points to. 
    
    - (%rax) → M[0x100] → 0xFF.
    - %rax → 0x100
    - $0x108 → 0x108 | anything with a $ infront becomes a constant and the imm (immediate value).
    - 4(%rax) → 4 + 0x100 | when there’s a number in front of the register like this it tells us to add it to the contents of the register in this case the memory address %rax is pointing to and then it’s the contents of that memory address that we get, so whatever is in 0x104 which is 0xAB
    - 9(%rax,%rdx) → 9 + 0x100 + 0x3 → 0x10C → 0x11
    - 260(%rcx,%rdx) →260 + 0x1 + 0x3 → 264 → 0x108 → 0x13
    - 0xFC(,%rcx,4) → 15*16¹+12*16⁰ →252+(0x1*0x4) = 256 →
        - 256/16 = 16 * 16 + 0R
        16/16 = 1 * 16 + 0R
        1/16 = 0 * 16 + 1R
        → 0x100 →0xFF

### Problem 3.5

### Problem 3.10

### Quizzes

1) RSP = Stack pointer, RIP = Instruction pointer, alt andet general purpose

![image.png](Computer%20Architecture%20and%20Operating%20Systems%20e232dc6177884d63ab7e6e2fffb66542/image%2031.png)

`0xa + 0xf000 + (0x0100*8)` → `0xF80A`

![image.png](Computer%20Architecture%20and%20Operating%20Systems%20e232dc6177884d63ab7e6e2fffb66542/image%2032.png)

![image.png](Computer%20Architecture%20and%20Operating%20Systems%20e232dc6177884d63ab7e6e2fffb66542/image%2033.png)

![image.png](Computer%20Architecture%20and%20Operating%20Systems%20e232dc6177884d63ab7e6e2fffb66542/image%2034.png)

![image.png](Computer%20Architecture%20and%20Operating%20Systems%20e232dc6177884d63ab7e6e2fffb66542/image%2035.png)

________________________________________________________________________

![image.png](Computer%20Architecture%20and%20Operating%20Systems%20e232dc6177884d63ab7e6e2fffb66542/image%2036.png)

leaq(%rdi, %rdi, 8), %rax

Adresse beregnings generel format: D(Rb,Ri,S)

Betydning:  Reg[Rb]+S*Reg[Ri]+ D

________________________________________________________________________

![image.png](Computer%20Architecture%20and%20Operating%20Systems%20e232dc6177884d63ab7e6e2fffb66542/image%2037.png)

2*(x*x+y*y)

![image.png](Computer%20Architecture%20and%20Operating%20Systems%20e232dc6177884d63ab7e6e2fffb66542/image%2038.png)

________________________________________________________________________

## Lecture 4 | Binær repræsentation af programmer

### Quizzes

![image.png](Computer%20Architecture%20and%20Operating%20Systems%20e232dc6177884d63ab7e6e2fffb66542/image%2039.png)

![image.png](Computer%20Architecture%20and%20Operating%20Systems%20e232dc6177884d63ab7e6e2fffb66542/image%2040.png)

- De her flag bliver kun sat ved **ARITMETISKE OPERATIONER** dvs alle beregnings relaterede operationer.

I det følgende er vist et fragment af et X86-64 assembly program, som gcc har oversat fra et lille C-program.

Lav
 et beregningsspor (execution trace) af funktionen ved at udfylde 
nedenstående tabel givet start tilstanden givet i første linie. Ved 
start har %rdi værdien 4.  Du kan antage, at der ikke sker overflow.

Dvs.
 angiv effekten på processorens tilstanden ved at hånd-eksekvere 
instruktionerne én efter én. I linie n skal du angive den tilstand, der 
gælder inden instruktionen udføres; dens resultat (ændring af 
register-værdier) skal dermed stå i linien under: n+1. Hvis en værdi 
ikke kan udledes, bedes du angive dette med et "-". Stands når/hvis 
eksekvering når "ret" og lad efterfølgende være markeret med "-".

```
0000000000401136 <func>:
  401136: mov    %rdi,%rax
  401139: jmp    40113f <func+0x9>
  40113b: sub    $0x2,%rax
  40113f: cmp    $0x1,%rax
  401143: jg     40113b <func+0x5>
  401145: ret
```

![image.png](Computer%20Architecture%20and%20Operating%20Systems%20e232dc6177884d63ab7e6e2fffb66542/image%2041.png)

OBS: I have no clue why the SF flag is 1 after the `jg` instruction.

________________________________________________________________________

![image.png](Computer%20Architecture%20and%20Operating%20Systems%20e232dc6177884d63ab7e6e2fffb66542/image%2042.png)

We can observe that we jump to `40113f` immedietely to a compare instruction `cmp`. We can also see that the next instruction moves to another location if it evaluates to true. So we can based on this info already cut out func1 and func2, as they jump into the body before any comparison. We can also eliminate func3 as the assembly code jumps back if the comparison evaluates to false, which this if else statement does not do.

So the answer is **func0**

________________________________________________________________________

![image.png](Computer%20Architecture%20and%20Operating%20Systems%20e232dc6177884d63ab7e6e2fffb66542/image%2043.png)

The answer is **if-then** because we can see that we’re performing a bunch of irrelevant instructions initially, then we get a js (jump if SF is 1) which takes us another place that leads us to a return instruction, so in no place is there a loop going on.

## Lecture 5 | Binær repræsentation af programmer

### Quizzes

![image.png](Computer%20Architecture%20and%20Operating%20Systems%20e232dc6177884d63ab7e6e2fffb66542/image%2044.png)

![image.png](Computer%20Architecture%20and%20Operating%20Systems%20e232dc6177884d63ab7e6e2fffb66542/image%2045.png)

________________________________________________________________________

![image.png](Computer%20Architecture%20and%20Operating%20Systems%20e232dc6177884d63ab7e6e2fffb66542/image%2046.png)

0x14 → 0x8 + %rsp

0xa+0x14 → %rax = 0x1E

________________________________________________________________________

![image.png](Computer%20Architecture%20and%20Operating%20Systems%20e232dc6177884d63ab7e6e2fffb66542/image%2047.png)

- Caller saved betyder at registrene bliver håndteret/gemt fra hvor funktionen bliver kaldt
- Callee saved er det samme bare hvor funktionen er deklareret, så der hvor funktionen starter.
- Når en funktion bliver kaldt bliver der pushet 8 bytes i stakken for returaddressen, når man returnere fra funktionen bliver de 8 bytes popped, så dvs i forrige opgave, blev der trukket 8 bytes fra %rsp og efter returneringen blev de 8 bytes gendannet og dermed blev %rsp gendannet til oprindelig værdi før kaldet.

![image.png](Computer%20Architecture%20and%20Operating%20Systems%20e232dc6177884d63ab7e6e2fffb66542/image%2048.png)

________________________________________________________________________

## Lecture 6 | Processor arkitektur: Transistorer, gates & en sekventiel processor

### Quizzes

![image.png](Computer%20Architecture%20and%20Operating%20Systems%20e232dc6177884d63ab7e6e2fffb66542/image%2049.png)

![image.png](Computer%20Architecture%20and%20Operating%20Systems%20e232dc6177884d63ab7e6e2fffb66542/image%2050.png)

![image.png](Computer%20Architecture%20and%20Operating%20Systems%20e232dc6177884d63ab7e6e2fffb66542/image%2051.png)

![image.png](Computer%20Architecture%20and%20Operating%20Systems%20e232dc6177884d63ab7e6e2fffb66542/image%2052.png)

![image.png](Computer%20Architecture%20and%20Operating%20Systems%20e232dc6177884d63ab7e6e2fffb66542/image%2053.png)

![image.png](Computer%20Architecture%20and%20Operating%20Systems%20e232dc6177884d63ab7e6e2fffb66542/image%2054.png)

![image.png](Computer%20Architecture%20and%20Operating%20Systems%20e232dc6177884d63ab7e6e2fffb66542/image%2055.png)

![image.png](Computer%20Architecture%20and%20Operating%20Systems%20e232dc6177884d63ab7e6e2fffb66542/image%2056.png)

![image.png](Computer%20Architecture%20and%20Operating%20Systems%20e232dc6177884d63ab7e6e2fffb66542/image%2057.png)

### pushq rA

![image.png](Computer%20Architecture%20and%20Operating%20Systems%20e232dc6177884d63ab7e6e2fffb66542/image%2058.png)

### rmmovq rA, D(rB)

![image.png](Computer%20Architecture%20and%20Operating%20Systems%20e232dc6177884d63ab7e6e2fffb66542/image%2059.png)

### OPq rA, rB

![image.png](Computer%20Architecture%20and%20Operating%20Systems%20e232dc6177884d63ab7e6e2fffb66542/image%2060.png)

### jXX Dest

![image.png](Computer%20Architecture%20and%20Operating%20Systems%20e232dc6177884d63ab7e6e2fffb66542/image%2061.png)

### ret

![image.png](Computer%20Architecture%20and%20Operating%20Systems%20e232dc6177884d63ab7e6e2fffb66542/image%2062.png)

mrmovq D(rB), rA

![image.png](Computer%20Architecture%20and%20Operating%20Systems%20e232dc6177884d63ab7e6e2fffb66542/image%2063.png)

call Dest

![image.png](Computer%20Architecture%20and%20Operating%20Systems%20e232dc6177884d63ab7e6e2fffb66542/image%2064.png)

cmovXX rA, rB

![image.png](Computer%20Architecture%20and%20Operating%20Systems%20e232dc6177884d63ab7e6e2fffb66542/image%2065.png)

pushq rA / popq rA

![image.png](Computer%20Architecture%20and%20Operating%20Systems%20e232dc6177884d63ab7e6e2fffb66542/image%2066.png)

rmmovq rA, D(rB) / mrmovq D(rB), rA

![image.png](Computer%20Architecture%20and%20Operating%20Systems%20e232dc6177884d63ab7e6e2fffb66542/image%2067.png)

irmovq V, rB

![image.png](Computer%20Architecture%20and%20Operating%20Systems%20e232dc6177884d63ab7e6e2fffb66542/image%2068.png)

OPq rA, rB / rrmovq rA, rB / irmovq V, rB

![image.png](Computer%20Architecture%20and%20Operating%20Systems%20e232dc6177884d63ab7e6e2fffb66542/image%2069.png)

_______________________________________________________________________

![image.png](Computer%20Architecture%20and%20Operating%20Systems%20e232dc6177884d63ab7e6e2fffb66542/image%2070.png)

![image.png](Computer%20Architecture%20and%20Operating%20Systems%20e232dc6177884d63ab7e6e2fffb66542/image%2071.png)

[Reference](https://www.notion.so/Computer-Architecture-and-Operating-Systems-e232dc6177884d63ab7e6e2fffb66542?pvs=21)

________________________________________________________________________

![image.png](Computer%20Architecture%20and%20Operating%20Systems%20e232dc6177884d63ab7e6e2fffb66542/image%2072.png)

________________________________________________________________________

![image.png](Computer%20Architecture%20and%20Operating%20Systems%20e232dc6177884d63ab7e6e2fffb66542/image%2073.png)

![image.png](Computer%20Architecture%20and%20Operating%20Systems%20e232dc6177884d63ab7e6e2fffb66542/image%2074.png)

________________________________________________________________________

![image.png](Computer%20Architecture%20and%20Operating%20Systems%20e232dc6177884d63ab7e6e2fffb66542/image%2075.png)

________________________________________________________________________

Hvor mange clock cycles bruger SEQ processoren på at udføre én instruktion?

**1**

________________________________________________________________________

![image.png](Computer%20Architecture%20and%20Operating%20Systems%20e232dc6177884d63ab7e6e2fffb66542/image%2076.png)

![image.png](Computer%20Architecture%20and%20Operating%20Systems%20e232dc6177884d63ab7e6e2fffb66542/image%2077.png)

## Lecture 7 | Instruktionsniveau parallelitet, Program & Compiler optimeringer

## Quizzes

![billede.png](Computer%20Architecture%20and%20Operating%20Systems%20e232dc6177884d63ab7e6e2fffb66542/billede.png)

**Svar: 4**

- Calculations & Notes
    - **addl %eax, %ebx**
        - Starter i cycle 0.
        - Latency er 2 cycles, så resultatet er klar i cycle 2.
    - **addl %ecx, %edx**
        - Da denne instruktion er uafhængig af den første (ingen afhængighed af resultater fra den første), kan den starte umiddelbart efter den første instruktion.
        - Starter i cycle 1 (på grund af CPI på 1).
        - Latency er også 2 cycles, så denne instruktion afsluttes i cycle 3.
    - **addl %eax, %ebx**
        - Denne instruktion afhænger af resultatet fra den første instruktion.
        - Den første instruktion afsluttede i cycle 2, så denne kan starte i cycle 2.
        - Latency er igen 2 cycles, så denne instruktion afsluttes i cycle 4.

![billede.png](Computer%20Architecture%20and%20Operating%20Systems%20e232dc6177884d63ab7e6e2fffb66542/billede%201.png)

![billede.png](Computer%20Architecture%20and%20Operating%20Systems%20e232dc6177884d63ab7e6e2fffb66542/billede%202.png)

![billede.png](Computer%20Architecture%20and%20Operating%20Systems%20e232dc6177884d63ab7e6e2fffb66542/billede%203.png)

**Maskine 2**

- Calculations & Notes
    
    Gennemsnitligt færddigør maskinerne 1 / CPI instruktioner per clock cycle.
    
    Derfor færddiggør maskinerne ca.:
    
    1. Maskine: udfører 4G cycles per sekund, og bruger 2 cycles i snit per instruktion: 1/2 * 4 GHz = 2 G instruktioner per sekund
    2. Maskine: udfører 3G cycles per sekund og bruger 1 cycles i snit per instruktion; 1/1 * 3 GHz = 3 G instruktioner per sekund
    
    Latency er kun en konstant forsinkelse på afslutningen af en instruktion, som kun har betydning for opstart af en ny instruktion, som er afhængig af resultatet fra den foregående; dette er normalt inkluderet i den benchmark der har givet CPI tallet.
    

![billede.png](Computer%20Architecture%20and%20Operating%20Systems%20e232dc6177884d63ab7e6e2fffb66542/billede%204.png)

![billede.png](Computer%20Architecture%20and%20Operating%20Systems%20e232dc6177884d63ab7e6e2fffb66542/billede%205.png)

_________________________________________________________________________________________________

![billede.png](Computer%20Architecture%20and%20Operating%20Systems%20e232dc6177884d63ab7e6e2fffb66542/billede%206.png)

_________________________________________________________________________________________________

![billede.png](Computer%20Architecture%20and%20Operating%20Systems%20e232dc6177884d63ab7e6e2fffb66542/billede%207.png)

_________________________________________________________________________________________________

![billede.png](Computer%20Architecture%20and%20Operating%20Systems%20e232dc6177884d63ab7e6e2fffb66542/billede%208.png)

_________________________________________________________________________________________________

![billede.png](Computer%20Architecture%20and%20Operating%20Systems%20e232dc6177884d63ab7e6e2fffb66542/billede%209.png)

![billede.png](Computer%20Architecture%20and%20Operating%20Systems%20e232dc6177884d63ab7e6e2fffb66542/billede%2010.png)

![billede.png](Computer%20Architecture%20and%20Operating%20Systems%20e232dc6177884d63ab7e6e2fffb66542/billede%2011.png)

_________________________________________________________________________________________________

![billede.png](Computer%20Architecture%20and%20Operating%20Systems%20e232dc6177884d63ab7e6e2fffb66542/billede%2012.png)

![billede.png](Computer%20Architecture%20and%20Operating%20Systems%20e232dc6177884d63ab7e6e2fffb66542/billede%2013.png)

## Lecture 8 | Lager-hierarkiet: Lokalitet, caching

### Quizzes

![billede.png](Computer%20Architecture%20and%20Operating%20Systems%20e232dc6177884d63ab7e6e2fffb66542/billede%2014.png)

![billede.png](Computer%20Architecture%20and%20Operating%20Systems%20e232dc6177884d63ab7e6e2fffb66542/billede%2015.png)

![billede.png](Computer%20Architecture%20and%20Operating%20Systems%20e232dc6177884d63ab7e6e2fffb66542/billede%2016.png)

- Calculations & Notes
    - Blokstørrelsen er 8 bytes. For at adressere de enkelte bytes i en blok, skal vi bruge log⁡2(8)=3 bits til block offset.
    - Der er 8 sets i cachen. For at vælge et set skal vi bruge log2(8) = 3 bits til set index.
    - De resterende bits udgør tag, som bruges til at identificere, hvilken hukommelsesblok der er mappet til et set i cachen. Da vi allerede har brugt 3 bits til block offset og 3 bits til set index, har vi 8-3-3=2 bits tilbage til tag.
    - De laveste 3 bits (bit-positioner 0-2) er block offset.
    - De næste 3 bits (bit-positioner 3-5) er set index.
    - De 2 højeste bits (bit-positioner 6-7) er tag.

![billede.png](Computer%20Architecture%20and%20Operating%20Systems%20e232dc6177884d63ab7e6e2fffb66542/billede%2017.png)

![billede.png](Computer%20Architecture%20and%20Operating%20Systems%20e232dc6177884d63ab7e6e2fffb66542/billede%2018.png)

- Calculations & Notes
    - Tilsvarende forrige opgave ved vi at block offset er 3 bits, set index er 3 bits og tag er 2 bits.
    - Tilsvarende forrige opgave ved vi også hvilke der er hvad.
        - De laveste 3 bits (bit-positioner 0-2) er block offset.
        - De næste 3 bits (bit-positioner 3-5) er set index.
        - De 2 højeste bits (bit-positioner 6-7) er tag.
    - Adresse 0x8B
        - Binær repræsentation: 10001011
        - Tag: 10 (binært), altså 0x2
        - Set index: 001 (binært), altså 0x1
        - Block offset: 011 (binært), altså 0x3
        - Udlæst værdi: D0
        
        ![billede.png](Computer%20Architecture%20and%20Operating%20Systems%20e232dc6177884d63ab7e6e2fffb66542/billede%2019.png)
        
    - Når det kommer til “miss”, måden vi finder det på er ved at kigge på adressen (i binær), se om den tilsvarende adresse’s tag/sæt i referencen har en gyldig værdi “v”, som gerne burde være “1” hvis der er en gyldig værdi, og så skal adressen’s “tag” bit også stemme overens med tag bit på referencen. Hvis værdien ikke er gyldig i referencen, så er der et miss allerede der, og vi erstatter dermed V med “1” fordi nu får vi gyldig information ind, som er adressens information og T i referencen erstatter vi med adressen’s T, samme med blok, som vi erstatter i referencen med adressens blok (hele blok).
        
        ![billede.png](Computer%20Architecture%20and%20Operating%20Systems%20e232dc6177884d63ab7e6e2fffb66542/billede%2020.png)
        

## Lecture 9 | Exceptions og Processor

### Quizzes

Atomisk = uninterruptible

fork is from unistd.h

![billede.png](Computer%20Architecture%20and%20Operating%20Systems%20e232dc6177884d63ab7e6e2fffb66542/billede%2021.png)

![billede.png](Computer%20Architecture%20and%20Operating%20Systems%20e232dc6177884d63ab7e6e2fffb66542/billede%2022.png)

![billede.png](Computer%20Architecture%20and%20Operating%20Systems%20e232dc6177884d63ab7e6e2fffb66542/billede%2023.png)

Svaret er **E, B, C**

_________________________________________________________________________________________________

![billede.png](Computer%20Architecture%20and%20Operating%20Systems%20e232dc6177884d63ab7e6e2fffb66542/billede%2024.png)

![billede.png](Computer%20Architecture%20and%20Operating%20Systems%20e232dc6177884d63ab7e6e2fffb66542/billede%2025.png)

![billede.png](Computer%20Architecture%20and%20Operating%20Systems%20e232dc6177884d63ab7e6e2fffb66542/billede%2026.png)

[https://www.moodle.aau.dk/mod/quiz/view.php?id=1731003](https://www.moodle.aau.dk/mod/quiz/view.php?id=1731003)

## Lecture 10 | Virtual memory

### Quizzes

- virtuelle adresser er 14 bits lange → 2^14 adresser i det virtuelle adresse rum (virtual address space)
- vi har brug for at vide mængden af bits vi har brug for som “offset” inde i page: log2(pagesize) = log2(32) = 5
- så dvs de første 5 bits (0-4) og resten er VPN (5-13) (så hvis der bliver spurgt om vpn, så er svaret de bits der bare konverteret til hex)
- dvs at VPO forbliver det samme for virtuel/fysisk og vi erstatter kun VPN i den fysiske med det korrekte som vi finder på den her måde:
    - bits (5-13) = 010101000 → A8 → vi kigger på tabellen, ser at A8 = 06
        
        ![image.png](Computer%20Architecture%20and%20Operating%20Systems%20e232dc6177884d63ab7e6e2fffb66542/image%2078.png)
        

![image.png](Computer%20Architecture%20and%20Operating%20Systems%20e232dc6177884d63ab7e6e2fffb66542/image%2079.png)

![image.png](Computer%20Architecture%20and%20Operating%20Systems%20e232dc6177884d63ab7e6e2fffb66542/image%2080.png)

![image.png](Computer%20Architecture%20and%20Operating%20Systems%20e232dc6177884d63ab7e6e2fffb66542/image%2081.png)

## Lecture 11 | Concurrency & Multithreaded Programming

![image.png](Computer%20Architecture%20and%20Operating%20Systems%20e232dc6177884d63ab7e6e2fffb66542/image%2082.png)

**Mutex**: I added `pthread_mutex_t lock;` and used `pthread_mutex_lock` and `pthread_mutex_unlock` around the code that modifies the shared variable `max`. This ensures that only one thread can update the `max` at a time.

![image.png](Computer%20Architecture%20and%20Operating%20Systems%20e232dc6177884d63ab7e6e2fffb66542/image%2083.png)

In multithreaded programming, a **critical section** is the part of the code where shared resources (such as variables or data structures) are accessed or modified by multiple threads. Access to these shared resources needs to be protected (usually by some form of synchronization, like mutex locks) to avoid race conditions.

In this example, the shared resource is the variable `max`, which all threads access and potentially modify.

![image.png](Computer%20Architecture%20and%20Operating%20Systems%20e232dc6177884d63ab7e6e2fffb66542/image%2084.png)

![image.png](Computer%20Architecture%20and%20Operating%20Systems%20e232dc6177884d63ab7e6e2fffb66542/image%2085.png)

![image.png](Computer%20Architecture%20and%20Operating%20Systems%20e232dc6177884d63ab7e6e2fffb66542/image%2086.png)

## Lecture 12 | Concurrency & Multithreaded Programming

![image.png](Computer%20Architecture%20and%20Operating%20Systems%20e232dc6177884d63ab7e6e2fffb66542/image%2087.png)

producer_v1 bruger semaforer korrekt:

- **`sem_wait(&tom);`**: Producenten venter på, at der er en tom plads til rådighed i bufferet.
- **`sem_wait(&mutex);`**: Mutual exclusion sikres ved hjælp af en binær semaphore (mutex) for at beskytte kritiske sektioner (i dette tilfælde adgang til bufferet).
- **`put(i);`**: Producenten tilføjer et element til bufferet.
- **`sem_post(&mutex);`**: Mutex frigives, så andre tråde kan få adgang til den kritiske sektion.
- **`sem_post(&fuld);`**: Producenten signalerer, at der nu er en fuld plads i bufferet.

![image.png](Computer%20Architecture%20and%20Operating%20Systems%20e232dc6177884d63ab7e6e2fffb66542/image%2088.png)

Nedenstående program simulerer et
 system bestående af 6 tråde: 3 pushere og 3 rygere. For at ryge en 
cigaret kræver det 3 ressourcer:  en portion tobak, et stykke cigaret 
papir, og en (engangs-)lighter. Hver ryger har tilstrækkeligt af éen af 
ressourcerne, men skal købe de to andre hos pusherne. Resourcerne er 
modelleret som semaforer.

```
#include<stdio.h>
#include<stdlib.h>
#include<pthread.h>
#include"common_threads.h"

sem_t tobak;
sem_t papir;
sem_t lighter;
sem_t tobak_penge;
sem_t papir_penge;
sem_t lighter_penge;

void * tobak_pusher(void *arg){
  for(int i=0;i<2000;i++){
    sem_post(&tobak);
    sem_wait(&tobak_penge);
  }
}
void * papir_pusher(void *arg){
  for(int i=0;i<2000;i++){
    sem_post(&papir);
    sem_wait(&papir_penge);
  }
}
void * lighter_pusher(void *arg){
  for(int i=0;i<2000;i++){
    sem_post(&lighter);
    sem_wait(&lighter_penge);
  }
}

void * ryger_med_tobak(void *arg){
  for(int i=0;i<1000;i++){
    sem_wait(&papir);
    sem_wait(&lighter);
    printf("%ld ryger cigaret %d \n", (long)arg, i);
    sem_post(&papir_penge);
     sem_post(&lighter_penge);
  }
  printf("%ld ryger død\n", (long)arg);
}
void * ryger_med_papir(void *arg){
  for(int i=0;i<1000;i++){
    sem_wait(&lighter);
    sem_wait(&tobak);
    printf("%ld ryger cigaret %d\n", (long)arg,i);
    sem_post(&tobak_penge);
    sem_post(&lighter_penge);
  }
  printf("%ld ryger død\n", (long)arg);
}

void * ryger_med_lighter(void *arg){
  for(int i=0;i<1000;i++){
    sem_wait(&tobak);
    sem_wait(&papir);
    printf("%ld ryger cigaret %d \n", (long)arg,i);
    sem_post(&papir_penge);
    sem_post(&tobak_penge);
  }
  printf("%ld ryger død\n", (long)arg);
}

int main(int argc,char argv[]){
 sem_init(&tobak, 0, 0);
 sem_init(&papir, 0, 0);
 sem_init(&lighter, 0, 0);
 sem_init(&tobak_penge, 0, 0);
 sem_init(&papir_penge, 0, 0);
 sem_init(&lighter_penge, 0, 0);

 pthread_t tp, lp,pp, rl,rt,rp;
 Pthread_create(&tp,NULL,tobak_pusher,(void*)0);
 Pthread_create(&lp,NULL,lighter_pusher,(void*)1);
 Pthread_create(&pp,NULL,papir_pusher,(void*)2);
 Pthread_create(&rl,NULL,ryger_med_lighter,(void*)3);
 Pthread_create(&rt,NULL,ryger_med_tobak,(void*)4);
 Pthread_create(&rp,NULL,ryger_med_papir,(void*)5);

 Pthread_join(tp,NULL);  Pthread_join(lp,NULL);
 Pthread_join(pp,NULL); Pthread_join(rl,NULL);
 Pthread_join(rt,NULL); Pthread_join(rp,NULL);
 printf("All Dead\n");
 return 0;
}

```

Programmet har en indbygget potentiel deadlock, fordi ressourcerne (tobak, papir, lighter) og de tilhørende betalinger (tobak_penge, papir_penge, lighter_penge) håndteres på en måde, der kan føre til en situation, hvor ingen tråde kan fortsætte deres udførelse.

Deadlock opstår i dette tilfælde, fordi hver ryger venter på to ressourcer for at kunne ryge en cigaret. Når en ryger venter på ressourcerne, frigiver han ikke de semaforer, der kræves for at andre tråde kan fortsætte (fx betalingerne med `sem_post`). Hvis ressourcerne bliver fanget af en ryger, der ikke kan fuldføre, vil de andre tråde også sidde fast og vente på, at ressourcerne bliver frigivet. Det skaber en deadlock, hvor ingen af trådene kan fuldføre deres arbejde.

Programmet er forkert, da det indeholder en deadlock

![image.png](Computer%20Architecture%20and%20Operating%20Systems%20e232dc6177884d63ab7e6e2fffb66542/image%2089.png)

```
#include<stdio.h>
#include<stdlib.h>
#include<pthread.h>
#include"common_threads.h"

sem_t tobak;
sem_t papir;
sem_t lighter;
sem_t tobak_penge;
sem_t papir_penge;
sem_t lighter_penge;

void * tobak_pusher(void *arg){
  for(int i=0;i<2000;i++){
    sem_post(&tobak);
    sem_wait(&tobak_penge);
  }
}
void * papir_pusher(void *arg){
  for(int i=0;i<2000;i++){
    sem_post(&papir);
    sem_wait(&papir_penge);
  }
}
void * lighter_pusher(void *arg){
  for(int i=0;i<2000;i++){
    sem_post(&lighter);
    sem_wait(&lighter_penge);
  }
}

void * ryger_med_tobak(void *arg){
  for(int i=0;i<1000;i++){
    sem_wait(&papir);
    sem_wait(&lighter);
    printf("%ld ryger cigaret %d \n", (long)arg, i);
    sem_post(&papir_penge);
     sem_post(&lighter_penge);
  }
  printf("%ld ryger død\n", (long)arg);
}
void * ryger_med_papir(void *arg){
  for(int i=0;i<1000;i++){
    sem_wait(&lighter);
    sem_wait(&tobak);
    printf("%ld ryger cigaret %d\n", (long)arg,i);
    [sem_post(&tobak_penge);]
    sem_post(&lighter_penge);
  }
  printf("%ld ryger død\n", (long)arg);
}

void * ryger_med_lighter(void *arg){
  for(int i=0;i<1000;i++){
    [sem_wait(&papir);]
    [sem_wait(&tobak);]
    printf("%ld ryger cigaret %d \n", (long)arg,i);
    sem_post(&papir_penge);
    [sem_post(&tobak_penge);]
  }
  printf("%ld ryger død\n", (long)arg);
}

int main(int argc,char argv[]){
 sem_init(&tobak, 0, 0);
 sem_init(&papir, 0, 0);
 sem_init(&lighter, 0, 0);
 sem_init(&tobak_penge, 0, 0);
 sem_init(&papir_penge, 0, 0);
 sem_init(&lighter_penge, 0, 0);

 pthread_t tp, lp,pp, rl,rt,rp;
 Pthread_create(&tp,NULL,tobak_pusher,(void*)0);
 Pthread_create(&lp,NULL,lighter_pusher,(void*)1);
 Pthread_create(&pp,NULL,papir_pusher,(void*)2);
 Pthread_create(&rl,NULL,ryger_med_lighter,(void*)3);
 Pthread_create(&rt,NULL,ryger_med_tobak,(void*)4);
 Pthread_create(&rp,NULL,ryger_med_papir,(void*)5);

 Pthread_join(tp,NULL);  Pthread_join(lp,NULL);
 Pthread_join(pp,NULL); Pthread_join(rl,NULL);
 Pthread_join(rt,NULL); Pthread_join(rp,NULL);
 printf("All Dead\n");
 return 0;
}

```

Opstil de nødvendige erklæringer og initialisering af mutex og condition variable, samt eventuelle globale delte variable

![image.png](Computer%20Architecture%20and%20Operating%20Systems%20e232dc6177884d63ab7e6e2fffb66542/image%2090.png)

Opstil koden til synkronisering, som kan indsættes omkring linie 22.

![image.png](Computer%20Architecture%20and%20Operating%20Systems%20e232dc6177884d63ab7e6e2fffb66542/image%2091.png)

Beskriv kort virkemåden af din løsning, eller løsningsidé.

![image.png](Computer%20Architecture%20and%20Operating%20Systems%20e232dc6177884d63ab7e6e2fffb66542/image%2092.png)
