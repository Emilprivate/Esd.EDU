#include <stdio.h>
#include <stdlib.h>

//Input variables and the small/large variables
int a, b, small, large, result;

void GCD(void);
int FCD(int, int);

int main(void){
    GCD();
    return 0;
}

//Greatest Common Divisor
void GCD(){
    printf("Enter two non-negative integers> ");
    scanf("%d,%d", &a, &b);

    if (a <= 0 && b <= 0 || a < 0 || b < 0){
        printf("Wrong input!\n");
        exit(EXIT_FAILURE);
    }

    small = a <= b ? a : b;
    large = a <= b ? b : a;

    if (small == 0 || (small == large)){
        printf("GCD must be %d\n\n", large);
        GCD();
    }else{
        printf("\nGCD of %d and %d is %d\n\n", a, b, FCD(small, large));
        GCD();
    }
}

//Find Common Divisor
int FCD(int s, int l){
    for (int i = 0; i <= s; i++){
        if (s % i == 0 && l % i == 0){
            result = i;
        }
    }
    return result;
}