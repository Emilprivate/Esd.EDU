#include <stdbool.h>
#include <string.h>
#include <printf.h>
#include <math.h>

#define MAX 100

static const char binary_operators[5] = {'+', '-', '*', '/', '^'};
static const char unary_operators[4] = {'#', '%', '!', 'q'};

bool runtime_status = true;

double add(double operand_input, double *accumulator_variable){
    return *accumulator_variable += operand_input;
}

double subtract(double operand_input, double *accumulator_variable){
    return *accumulator_variable -= operand_input;
}

double multiply(double operand_input, double *accumulator_variable){
    return *accumulator_variable *= operand_input;
}

double divide(double operand_input, double *accumulator_variable){
    return *accumulator_variable /= operand_input;
}

double exponent(double operand_input, double *accumulator_variable){
    return (*accumulator_variable = pow(*accumulator_variable, operand_input));
}

double custom_sqrt(double *accumulator_variable){
    return (*accumulator_variable = sqrt(*accumulator_variable));
}

double inverse_prefix(double *accumulator_variable){
    return (*accumulator_variable = -(*accumulator_variable));
}

double divide_one_with_accumulator(double *accumulator_variable){
    return (*accumulator_variable = 1 / (*accumulator_variable));
}

void quit(bool *status){
    *status = false;
}

bool confirm_binary_operator(char operator) {
    for (int i = 0; i < strlen(binary_operators); i++) {
        if (binary_operators[i] == operator) {
            return true;
        }
    }
    return false;
}

bool confirm_unary_operator(char operator) {
    for (int i = 0; i < strlen(unary_operators); i++) {
        if (unary_operators[i] == operator) {
            return true;
        }
    }
    return false;
}

void split_string_by_space(char *string, char *operator_output, double *operand_output) {
    char new_string[MAX][MAX] = {0};
    sscanf(string, "%s %lf", new_string[0], operand_output);
    *operator_output = *new_string[0];
}

static void scan_data(char *user_input, char *operator_output, double *operand_output, double accumulator_input) {
    char temp_operator;
    double temp_operand = 0.0;
    bool valid_operation = true;

    split_string_by_space(user_input, &temp_operator, &temp_operand);

    switch(temp_operator){
        case '/':
            if (temp_operand == 0)
                valid_operation = false;
            break;
        case '#':
            if (accumulator_input < 0)
                valid_operation = false;
            break;
        case '!':
            if (accumulator_input == 0)
                valid_operation = false;
            break;
        default:
            break;
    }

    if (((confirm_binary_operator(temp_operator) && temp_operand != 0)
         || confirm_unary_operator(temp_operator)) && valid_operation) {
        *operator_output = temp_operator;
        *operand_output = temp_operand;
        return;
    }
}

static double do_next_op(char operator_input, double operand_input, double *accumulator_variable) {
    switch (operator_input) {
        case '+':
            add(operand_input, accumulator_variable);
            break;
        case '-':
            subtract(operand_input, accumulator_variable);
            break;
        case '*':
            multiply(operand_input, accumulator_variable);
            break;
        case '/':
            divide(operand_input, accumulator_variable);
            break;
        case '^':
            exponent(operand_input, accumulator_variable);
            break;
        case '#':
            custom_sqrt(accumulator_variable);
            break;
        case '%':
            inverse_prefix(accumulator_variable);
            break;
        case '!':
            divide_one_with_accumulator(accumulator_variable);
            break;
        case 'q':
            quit(&runtime_status);
            break;
        default:
            break;
    }
    return *accumulator_variable;
}

static double run_calculator(const bool *runtime, char user_operator_input, double user_operand_input) {
    double accumulator = 0.0;

    while (*runtime) {

        char temp_input[MAX] = {0};
        user_operator_input = '\n';
        user_operand_input = 0.0;

        //Jeg benytter fgets fremfor scanf fordi det er bedre til at håndter vilkårlig input..
        printf("Enter operator, and an optional operand> ");
        fgets(temp_input, sizeof temp_input, stdin);

        if (temp_input[0] != '\n'){
            scan_data(temp_input, &user_operator_input, &user_operand_input, accumulator);
            do_next_op(user_operator_input, user_operand_input, &accumulator);
        }

        if (*runtime)
            printf("Result so far is %lf\n", accumulator);
    }
    return accumulator;
}

int main(void) {
    printf("Final result is: %lf", run_calculator(&runtime_status, 0, 0));
    return 0;
}