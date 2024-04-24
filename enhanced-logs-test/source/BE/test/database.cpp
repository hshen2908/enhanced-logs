#include <stdio.h>

// Function prototypes
double add(double a, double b);
double subtract(double a, double b);
double multiply(double a, double b);
double divide(double a, double b);

int main() {
    double x, y;
    char operator;

    printf("Enter an expression (e.g., 1 + 1): ");
    scanf("%lf %c %lf", &x, &operator, &y);

    switch (operator) {
        case '+':
            printf("Result: %.2lf\n", add(x, y));
            break;
        case '-':
            printf("Result: %.2lf\n", subtract(x, y));
            break;
        case '*':
            printf("Result: %.2lf\n", multiply(x, y));
            break;
        case '/':
            if (y != 0) {
                printf("Result: %.2lf\n", divide(x, y));
            } else {
                printf("Error: Division by zero\n");
            }
            break;
        default:
            printf("Error: Invalid operator\n");
    }

    return 0;
}

double add(double a, double b) {
    return a + b;
}

double subtract(double a, double b) {
    return a - b;
}

double multiply(double a, double b) {
    return a * b;
}

double divide(double a, double b) {
    if (b == 0) {
        return 0; // Handle division by zero with error handling in main
    }
    return a / b;
}
