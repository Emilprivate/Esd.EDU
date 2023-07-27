#include <stdio.h>

int main(void)
{
    int input, seconds, minutes, hours, days, weeks;

    printf("Convert seconds into weeks, days, hours, minutes, seconds> ");
    scanf("%d", &input);

    weeks   = input / (7 * 24 * 3600);
    input   = input % (7 * 24 * 3600);

    days    = input / (24 * 3600);
    input   = input % (24 * 3600);

    hours   = input / 3600;
    input   = input % 3600;

    minutes = input / 60;
    input   = input % 60;

    seconds = input;

    printf("%d weeks, %d days, %d hours, %d minutes, %d seconds", weeks, days, hours, minutes, seconds);

    return 0;
}