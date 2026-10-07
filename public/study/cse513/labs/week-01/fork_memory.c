#define _POSIX_C_SOURCE 200809L
#include <errno.h>
#include <stdio.h>
#include <stdlib.h>
#include <sys/types.h>
#include <sys/wait.h>
#include <unistd.h>

int main(void)
{
    int x = 10;
    pid_t child = fork();
    if (child == -1) { perror("fork"); return EXIT_FAILURE; }
    if (child == 0) {
        x = 20;
        if (dprintf(STDOUT_FILENO, "child: x = %d\n", x) < 0) _exit(1);
        _exit(0);
    }
    int status;
    pid_t result;
    do { result = waitpid(child, &status, 0); } while (result == -1 && errno == EINTR);
    if (result == -1) { perror("waitpid"); return EXIT_FAILURE; }
    if (!WIFEXITED(status) || WEXITSTATUS(status) != 0) {
        fprintf(stderr, "child normal ve başarılı sonlanmadı\n");
        return EXIT_FAILURE;
    }
    if (printf("parent: x = %d\n", x) < 0 || fflush(stdout) == EOF) {
        perror("stdout"); return EXIT_FAILURE;
    }
    return EXIT_SUCCESS;
}
