#define _POSIX_C_SOURCE 200809L
#include <errno.h>
#include <stdio.h>
#include <stdlib.h>
#include <sys/types.h>
#include <sys/wait.h>
#include <unistd.h>

/* Single-threaded fork/exec demo. Optional argv[1] selects the executable. */
int main(int argc, char **argv)
{
    if (argc > 2) { fprintf(stderr, "usage: %s [executable-path]\n", argv[0]); return EXIT_FAILURE; }
    const char *path = argc == 2 ? argv[1] : "/bin/echo";
    pid_t child = fork();
    if (child == -1) { perror("fork"); return EXIT_FAILURE; }
    if (child == 0) {
        execl(path, "echo", "child", (char *)NULL);
        perror("execl");
        _exit(127);
    }
    int status;
    pid_t result;
    do { result = waitpid(child, &status, 0); } while (result == -1 && errno == EINTR);
    if (result == -1) { perror("waitpid"); return EXIT_FAILURE; }
    if (WIFEXITED(status)) {
        int code = WEXITSTATUS(status);
        if (printf("parent: child exit status = %d\n", code) < 0 || fflush(stdout) == EOF) {
            perror("stdout"); return EXIT_FAILURE;
        }
        return code == 0 ? EXIT_SUCCESS : EXIT_FAILURE;
    }
    if (WIFSIGNALED(status)) fprintf(stderr, "parent: child signal = %d\n", WTERMSIG(status));
    else fprintf(stderr, "parent: beklenmeyen child durumu\n");
    return EXIT_FAILURE;
}
