#include <stdio.h>
#include <stdlib.h>
#include <math.h>

//Type definitions
typedef enum e_function_flags {g_function, h_function} function_flag;
typedef double (*binary_f)(double, function_flag);

//Prototypes
double trap(double, double, int, binary_f, function_flag);
double f(double, function_flag);
double sum(double, double, int, binary_f, function_flag);

int main(void)
{
    int n_arr[] = {2,4,8,16,32,64,128};

    for (int i = 0; i < sizeof(n_arr)/sizeof(n_arr[0]); i++){
        printf("Area of g(x) = x^2 sin(x) with refinement value: %d = %lf\n", n_arr[i],
               trap(0.0, 3.14159, n_arr[i], f, g_function));
    }

    printf("-----------------------------------------------------------------\n");

    for (int i = 0; i < sizeof(n_arr)/sizeof(n_arr[0]); i++){
        printf("Area of h(x) = sqrt(4 - x^2) with refinement value: %d = %lf\n", n_arr[i],
               trap(-1, 2, n_arr[i], f, h_function));
    }
}

double trap(double a, double b, int n, binary_f f, function_flag flag)
{
    //h = (b-a)/n
    double h = (b-a)/n, area;

    //Function pointer to the sum function
    double (*sum_ptr)(double, double, int, binary_f, function_flag) = &sum;

    //Invoking the function pointer and assigning its result to a variable
    double sum = (*sum_ptr)(a, h, n, f, flag);

    //T=(h/2)*(f(a) + f(b) + 2 * (sum [i=1 ... n] f(x_i) )
    area = (h/2) * (f(a, flag) + f(b, flag) + 2 * sum);

    return area;
}

double f(double x, function_flag flag)
{
    //Switch statement with all the functions we want to test on
    switch (flag) {
        case g_function:
            //g(x) = x^2 sin(x)
            return pow(x, 2) * sin(x);
        case h_function:
            //h(x) = sqrt(4 - x^2)
            return sqrt(4 - pow(x,2));
        default:
            exit(EXIT_FAILURE);
    }
}

double sum(double x, double h, int n, binary_f f, function_flag flag)
{
    double sum = 0;

    //(sum [i=1 ... n] f(x_i)
    for (int i = 1; i < n; i++){
        sum += f(x+i*h, flag);
    }

    return sum;
}