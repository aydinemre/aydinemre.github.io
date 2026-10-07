#define _POSIX_C_SOURCE 200809L
#include <errno.h>
#include <fcntl.h>
#include <stdio.h>
#include <stdlib.h>
#include <unistd.h>

int main(void)
{
    int ends[2];
    if (pipe(ends) == -1) { perror("pipe"); return EXIT_FAILURE; }
    int flags = fcntl(ends[0], F_GETFL);
    if (flags == -1 || fcntl(ends[0], F_SETFL, flags | O_NONBLOCK) == -1) {
        perror("fcntl"); close(ends[0]); close(ends[1]); return EXIT_FAILURE;
    }
    char byte;
    ssize_t count;
    do { count = read(ends[0], &byte, 1); } while (count == -1 && errno == EINTR);
    if (!(count == -1 && (errno == EAGAIN || errno == EWOULDBLOCK))) {
        fprintf(stderr, "beklenen EAGAIN/EWOULDBLOCK alınmadı\n");
        close(ends[0]); close(ends[1]); return EXIT_FAILURE;
    }
    puts("empty pipe + writer open: EAGAIN (EOF değil)");
    /* This process holds the only write reference; close it before probing again. */
    if (close(ends[1]) == -1) { perror("close writer"); close(ends[0]); return EXIT_FAILURE; }
    do { count = read(ends[0], &byte, 1); } while (count == -1 && errno == EINTR);
    if (count != 0) {
        fprintf(stderr, "beklenen EOF alınmadı\n"); close(ends[0]); return EXIT_FAILURE;
    }
    puts("empty pipe + all writers closed: EOF (read = 0)");
    if (close(ends[0]) == -1) { perror("close reader"); return EXIT_FAILURE; }
    if (fflush(stdout) == EOF) { perror("stdout"); return EXIT_FAILURE; }
    return EXIT_SUCCESS;
}
