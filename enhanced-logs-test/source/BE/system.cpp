#include <stdio.h>
#include <stdlib.h>

int main() {
    FILE *fp;
    char data[100];

    // Create and open a file for writing
    fp = fopen("example.txt", "w");
    if (fp == NULL) {
        perror("Error opening file");
        return -1;
    }
    printf("Enter some text: ");
    gets(data); // Read text from user
    fprintf(fp, "%s", data); // Write data to file
    fclose(fp); // Close the file

    // Open the file for reading
    fp = fopen("example.txt", "r");
    if (fp == NULL) {
        perror("Error opening file");
        return -1;
    }
    printf("Reading from the file: ");
    fgets(data, 100, fp); // Read data from file
    printf("%s\n", data);
    fclose(fp); // Close the file

    return 0;
}
