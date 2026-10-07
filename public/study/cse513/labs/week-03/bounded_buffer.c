/* One producer, one consumer. Finite FIFO with close-and-drain.
 * No cancellation/crash recovery; fatal pthread errors terminate the process.
 * Every queue field is protected by q.mutex. Results are read only after join. */
#include <pthread.h>
#include <stdio.h>
#include <stdlib.h>
#include <string.h>

#ifndef CAPACITY
#define CAPACITY 4
#endif
#if CAPACITY < 1
#error CAPACITY must be positive
#endif
#define ITEMS 10000

struct queue {
    int data[CAPACITY];
    size_t in, out, count;
    int closed;
    pthread_mutex_t mutex;
    pthread_cond_t not_empty, not_full;
};
static struct queue q;
struct result { size_t consumed; long long sum; };
static struct result result;

static void checked(int rc, const char *operation) {
    if (rc != 0) {
        fprintf(stderr, "%s: %s\n", operation, strerror(rc));
        exit(EXIT_FAILURE);
    }
}
static void invariant(void) { /* caller holds q.mutex */
    if (q.count > CAPACITY || q.in >= CAPACITY || q.out >= CAPACITY) {
        fputs("queue invariant violated\n", stderr);
        exit(EXIT_FAILURE);
    }
}
static void *produce(void *unused) {
    (void)unused;
    for (int value = 1; value <= ITEMS; ++value) {
        checked(pthread_mutex_lock(&q.mutex), "producer lock");
        while (q.count == CAPACITY)
            checked(pthread_cond_wait(&q.not_full, &q.mutex), "wait not_full");
        q.data[q.in] = value;
        q.in = (q.in + 1) % CAPACITY;
        ++q.count;
        invariant();
        checked(pthread_cond_signal(&q.not_empty), "signal not_empty");
        checked(pthread_mutex_unlock(&q.mutex), "producer unlock");
    }
    checked(pthread_mutex_lock(&q.mutex), "close lock");
    q.closed = 1; /* after publishing all items */
    checked(pthread_cond_broadcast(&q.not_empty), "broadcast closure");
    checked(pthread_mutex_unlock(&q.mutex), "close unlock");
    return NULL;
}
static void *consume(void *unused) {
    (void)unused;
    int expected = 1;
    for (;;) {
        checked(pthread_mutex_lock(&q.mutex), "consumer lock");
        while (q.count == 0 && !q.closed)
            checked(pthread_cond_wait(&q.not_empty, &q.mutex), "wait not_empty");
        if (q.count == 0 && q.closed) {
            checked(pthread_mutex_unlock(&q.mutex), "finished unlock");
            break;
        }
        int value = q.data[q.out];
        q.out = (q.out + 1) % CAPACITY;
        --q.count;
        invariant();
        checked(pthread_cond_signal(&q.not_full), "signal not_full");
        checked(pthread_mutex_unlock(&q.mutex), "consumer unlock");
        /* Private processing outside the queue lock. */
        if (value != expected) {
            fprintf(stderr, "FIFO violation: expected %d, received %d\n", expected, value);
            exit(EXIT_FAILURE);
        }
        ++expected;
        ++result.consumed;
        result.sum += value;
    }
    return NULL;
}
int main(void) {
    pthread_t producer, consumer;
    checked(pthread_mutex_init(&q.mutex, NULL), "mutex init");
    checked(pthread_cond_init(&q.not_empty, NULL), "not_empty init");
    checked(pthread_cond_init(&q.not_full, NULL), "not_full init");
    checked(pthread_create(&consumer, NULL, consume, NULL), "consumer create");
    checked(pthread_create(&producer, NULL, produce, NULL), "producer create");
    checked(pthread_join(producer, NULL), "producer join");
    checked(pthread_join(consumer, NULL), "consumer join");
    const long long expected_sum = (long long)ITEMS * (ITEMS + 1) / 2;
    if (result.consumed != ITEMS || result.sum != expected_sum || q.count != 0 || !q.closed) {
        fputs("final verification failed\n", stderr);
        return EXIT_FAILURE;
    }
    printf("capacity=%d consumed=%zu sum=%lld FIFO=OK closed=1 drained=1\n",
           CAPACITY, result.consumed, result.sum);
    checked(pthread_cond_destroy(&q.not_full), "not_full destroy");
    checked(pthread_cond_destroy(&q.not_empty), "not_empty destroy");
    checked(pthread_mutex_destroy(&q.mutex), "mutex destroy");
    return EXIT_SUCCESS;
}
