/**
 * File: queue.c
 * Description: Implementation of a Queue using a circular array. 
 *              Provides functionalities to enqueue, dequeue, and 
 *              check if the queue is empty or full.
 *
 * Author: Your Name
 * Created on: Date of Creation
 *
 * Changes/Updates:
 * - Initial creation with basic queue operations. [Date]
 * - Added error handling for overflow and underflow conditions. [Date]
 * - Improved modularity and comments for better readability. [Date]
 */

#include <stdio.h>
#include <stdlib.h>
#include <stdbool.h>

#define QUEUE_SIZE 10

// Queue structure definition
typedef struct {
    int items[QUEUE_SIZE];
    int front;
    int rear;
    int count;
} Queue;

// Function prototypes
void initializeQueue(Queue *q);
bool isFull(Queue *q);
bool isEmpty(Queue *q);
void enqueue(Queue *q, int element);
int dequeue(Queue *q);
void displayQueue(Queue *q);

// Main function
int main() {
    Queue q;

    // Initialize the queue
    initializeQueue(&q);

    // Enqueue elements
    enqueue(&q, 1);
    enqueue(&q, 2);
    enqueue(&q, 3);
    enqueue(&q, 4);
    enqueue(&q, 5);

    // Display queue
    printf("Queue after enqueues: ");
    displayQueue(&q);

    // Dequeue elements
    dequeue(&q);
    dequeue(&q);
    printf("Queue after two dequeues: ");
    displayQueue(&q);

    // Re-enqueue to test wrap around
    enqueue(&q, 6);
    enqueue(&q, 7);
    printf("Queue after adding more elements: ");
    displayQueue(&q);

    return 0;
}

// Initialize queue
void initializeQueue(Queue *q) {
    q->front = 0;
    q->rear = -1;
    q->count = 0;
}

// Check if the queue is full
bool isFull(Queue *q) {
    return q->count == QUEUE_SIZE;
}

// Check if the queue is empty
bool isEmpty(Queue *q) {
    return q->count == 0;
}

// Add an element to the queue
void enqueue(Queue *q, int element) {
    if (isFull(q)) {
        printf("Queue is full!\n");
        return;
    }
    q->rear = (q->rear + 1) % QUEUE_SIZE;
    q->items[q->rear] = element;
    q->count++;
    printf("Enqueued: %d\n", element);
}

// Remove an element from the queue
int dequeue(Queue *q) {
    if (isEmpty(q)) {
        printf("Queue is empty!\n");
        return -1;
    }
    int item = q->items[q->front];
    q->front = (q->front + 1) % QUEUE_SIZE;
    q->count--;
    printf("Dequeued: %d\n", item);
    return item;
}

// Display the queue contents
void displayQueue(Queue *q) {
    if (isEmpty(q)) {
        printf("Queue is empty\n");
        return;
    }
    printf("Queue contents: ");
    for (int i = 0, idx = q->front; i < q->count; i++) {
        printf("%d ", q->items[idx]);
        idx = (idx + 1) % QUEUE_SIZE;
    }
    printf("\n");
}
