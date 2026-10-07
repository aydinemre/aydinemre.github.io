#define _POSIX_C_SOURCE 200809L
#include <pthread.h>
#include <stdio.h>
#include <stdlib.h>
#include <string.h>

struct job { int input; int result; };

static void *worker(void *opaque)
{
    struct job *arg = opaque;
    arg->result = arg->input * arg->input;
    return NULL;
}

int main(void)
{
    /* Main keeps this object alive until join; input is the fixed value 7. */
    struct job arg = { .input = 7, .result = 0 };
    pthread_t thread;
    int error = pthread_create(&thread, NULL, worker, &arg);
    if (error != 0) {
        fprintf(stderr, "pthread_create: %s\n", strerror(error));
        return EXIT_FAILURE;
    }
    error = pthread_join(thread, NULL);
    if (error != 0) {
        fprintf(stderr, "pthread_join: %s\n", strerror(error));
        /* Terminate the process without unwinding arg while worker may use it. */
        exit(EXIT_FAILURE);
    }
    if (printf("result = %d\n", arg.result) < 0 || fflush(stdout) == EOF) {
        perror("stdout"); return EXIT_FAILURE;
    }
    return EXIT_SUCCESS;
}
