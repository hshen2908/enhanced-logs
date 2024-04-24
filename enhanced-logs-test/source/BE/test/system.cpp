#include <stdio.h>
#include <stdlib.h>

#define MAX_SIZE 100 // Defining the maximum size of the stack

// Stack structure definition
typedef struct {
    int items[MAX_SIZE];
    int top;
} Stack;

// Function prototypes
void initializeStack(Stack *s);
int isFull(Stack *s);
int isEmpty(Stack *s);
void push(Stack *s, int item);
int pop(Stack *s);
void displayStack(Stack *s);

// Main function
int main() {
    Stack s; // Declare a stack variable
    initializeStack(&s); // Initialize the stack

    // Push elements onto the stack
    push(&s, 10);
    push(&s, 20);
    push(&s, 30);
    push(&s, 40);
    push(&s, 50);

    // Display the stack contents
    printf("Stack after pushing 5 elements: ");
    displayStack(&s);

    // Pop two elements from the stack
    pop(&s);
    pop(&s);

    // Display the stack contents
    printf("Stack after popping 2 elements: ");
    displayStack(&s);

    // Clean exit
    return 0;
}

// Initialize the stack
void initializeStack(Stack *s) {
    s->top = -1; // Set the top index to -1 indicating the stack is empty
}

// Check if the stack is full
int isFull(Stack *s) {
    return s->top == MAX_SIZE - 1;
}

// Check if the stack is empty
int isEmpty(Stack *s) {
    return s->top == -1;
}

// Push an item onto the stack
void push(Stack *s, int item) {
    if (isFull(s)) {
        printf("Error: Stack is full\n");
        return;
    }
    s->items[++s->top] = item; // Place the item on the stack
    printf("Pushed %d to the stack\n", item);
}

// Pop an item from the stack
int pop(Stack *s) {
    if (isEmpty(s)) {
        printf("Error: Stack is empty\n");
        return -1; // Return an invalid value
    }
    int item = s->items[s->top--]; // Remove the item from the stack
    printf("Popped %d from the stack\n", item);
    return item;
}

// Display the contents of the stack
void displayStack(Stack *s) {
    if (isEmpty(s)) {
        printf("Stack is empty\n");
        return;
    }
    printf("Stack contents: ");
    for (int i = 0; i <= s->top; i++) {
        printf("%d ", s->items[i]);
    }
    printf("\n");
}