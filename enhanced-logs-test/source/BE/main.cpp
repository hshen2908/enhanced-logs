#include <stdio.h>
#include <stdlib.h>

// Define the structure for the BST nodes
typedef struct Node {
    int data;
    struct Node *left;
    struct Node *right;
} Node;

// Function prototypes
Node* createNode(int data);
Node* insertNode(Node* node, int data);
Node* searchNode(Node* node, int data);
void inorderTraversal(Node* node);
void freeBST(Node* node);

// Main function
int main() {
    Node *root = NULL; // Start with an empty tree

    // Inserting elements into the BST
    root = insertNode(root, 8);
    root = insertNode(root, 3);
    root = insertNode(root, 10);
    root = insertNode(root, 1);
    root = insertNode(root, 6);
    root = insertNode(root, 14);
    root = insertNode(root, 4);
    root = insertNode(root, 7);
    root = insertNode(root, 13);

    // Printing the BST in-order
    printf("In-order traversal of the binary search tree:\n");
    inorderTraversal(root);
    printf("\n");

    // Searching for some values
    int values[] = {7, 14, 5};
    for (int i = 0; i < 3; i++) {
        Node *found = searchNode(root, values[i]);
        if (found != NULL) {
            printf("Value %d found in BST\n", values[i]);
        } else {
            printf("Value %d not found in BST\n", values[i]);
        }
    }

    // Free memory used by the BST
    freeBST(root);

    return 0;
}

// Function to create a new BST node
Node* createNode(int data) {
    Node *newNode = (Node*) malloc(sizeof(Node));
    if (newNode == NULL) {
        fprintf(stderr, "Out of memory\n");
        exit(1);
    }
    newNode->data = data;
    newNode->left = NULL;
    newNode->right = NULL;
    return newNode;
}

// Function to insert a node in the BST
Node* insertNode(Node* node, int data) {
    if (node == NULL) {
        return createNode(data);
    }
    if (data < node->data) {
        node->left = insertNode(node->left, data);
    } else if (data > node->data) {
        node->right = insertNode(node->right, data);
    }
    return node;
}

// Function to search for a node in the BST
Node* searchNode(Node* node, int data) {
    if (node == NULL || node->data == data) {
        return node;
    }
    if (data < node->data) {
        return searchNode(node->left, data);
    } else {
        return searchNode(node->right, data);
    }
}

// Function to perform in-order traversal of the BST
void inorderTraversal(Node* node) {
    if (node != NULL) {
        inorderTraversal(node->left);
        printf("%d ", node->data);
        inorderTraversal(node->right);
    }
}

// Function to free the memory of BST
void freeBST(Node* node) {
    if (node != NULL) {
        freeBST(node->left);
        freeBST(node->right);
        free(node);
    }
}