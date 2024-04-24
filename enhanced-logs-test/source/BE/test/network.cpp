#include <stdio.h>
#include <stdlib.h>

// Function prototypes
int* createArray(int initialSize);
int* resizeArray(int* array, int currentSize, int newSize);
void printArray(int* array, int size);
void freeArray(int* array);

int main() {
    int* myArray;
    int currentSize = 5;
    myArray = createArray(currentSize);

    // Initialize array elements
    for (int i = 0; i < currentSize; i++) {
        myArray[i] = i * i;
    }

    printArray(myArray, currentSize);

    // Increase the size of the array
    int newSize = 10;
    myArray = resizeArray(myArray, currentSize, newSize);
    for (int i = currentSize; i < newSize; i++) {
        myArray[i] = i * i;
    }

    printArray(myArray, newSize);

    freeArray(myArray);
    return 0;
}

int* createArray(int initialSize) {
    int* array = (int*) malloc(initialSize * sizeof(int));
    if (array == NULL) {
        perror("Memory allocation failed");
        exit(EXIT_FAILURE);
    }
    return array;
}

int* resizeArray(int* array, int currentSize, int newSize) {
    int* newArray = (int*) realloc(array, newSize * sizeof(int));
    if (newArray == NULL) {
        perror("Memory allocation failed");
        exit(EXIT_FAILURE);
    }
    return newArray;
}

void printArray(int* array, int size) {
    printf("Array contents: ");
    for (int i = 0; i < size; i++) {
        printf("%d ", array[i]);
    }
    printf("\n");
}

void freeArray(int* array) {
    free(array);
}
